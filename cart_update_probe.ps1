$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:8080'
$outFile = 'C:\Users\esken\Desktop\my_version__1_\evaluation_artifacts\cart_final_update_probe.csv'
New-Item -ItemType Directory -Force -Path (Split-Path $outFile -Parent) | Out-Null

function Invoke-ApiRaw {
    param([string]$Method,[string]$Url,[hashtable]$Headers,$Body)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $p = @{ Uri=$Url; Method=$Method; TimeoutSec=40; SkipHttpErrorCheck=$true }
    if ($Headers) { $p.Headers = $Headers }
    if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 20); $p.ContentType='application/json' }
    $resp = Invoke-WebRequest @p
    $sw.Stop()
    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace([string]$resp.Content)) {
        try { $parsed = $resp.Content | ConvertFrom-Json -Depth 100 } catch { $parsed = $null }
    }
    [PSCustomObject]@{ status=[int]$resp.StatusCode; latency_ms=[int][math]::Round($sw.Elapsed.TotalMilliseconds); success=([int]$resp.StatusCode -ge 200 -and [int]$resp.StatusCode -lt 300); parsed=$parsed; content=[string]$resp.Content }
}

$stamp = Get-Date -Format 'yyyyMMddHHmmssfff'
$email = "cart.update.probe.$stamp@example.com"
$password = 'Passw0rd!123'
$name = 'Cart Update Probe'

$register = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/register" -Headers $null -Body @{email=$email;password=$password;name=$name}
if (-not $register.success) { throw "Register failed: HTTP $($register.status)" }
$login = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/login" -Headers $null -Body @{email=$email;password=$password}
if (-not $login.success) { throw "Login failed: HTTP $($login.status)" }
$token = $login.parsed.accessToken; if (-not $token) { $token = $login.parsed.access_token }
if (-not $token) { throw 'Token missing from login response.' }
$authHeaders = @{ Authorization = "Bearer $token" }

$stores = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores" -Headers $null -Body $null
if (-not $stores.success) { throw "Stores fetch failed: HTTP $($stores.status)" }
$storeId = if ($stores.parsed -is [System.Array] -and $stores.parsed.Count -gt 0) { $stores.parsed[0].id } else { $null }
if (-not $storeId) { throw 'No storeId found.' }

$storeProducts = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores/$storeId/products" -Headers $null -Body $null
if (-not $storeProducts.success) { throw "Store products fetch failed: HTTP $($storeProducts.status)" }
$productId = @($storeProducts.parsed | Where-Object { $_.quantity -ge 2 } | Select-Object -First 1 -ExpandProperty productId)
if (-not $productId) { $productId = @($storeProducts.parsed | Select-Object -First 1 -ExpandProperty productId) }
if (-not $productId) { throw 'No productId found for store.' }

$rows = New-Object System.Collections.Generic.List[object]
for ($i=1; $i -le 10; $i++) {
    $totalMs = 0; $addStatus = 0; $updateStatus = 0; $getStatus = 0; $observedQty = $null; $ok = $false
    $notes = New-Object System.Collections.Generic.List[string]

    try {
        $clear = Invoke-ApiRaw -Method 'DELETE' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
        $totalMs += $clear.latency_ms
        if (-not $clear.success) { $notes.Add("clear_$($clear.status)") }
    } catch { $notes.Add('clear_exception') }

    try {
        $add = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $authHeaders -Body @{productId=$productId;quantity=1}
        $totalMs += $add.latency_ms
        $addStatus = $add.status

        $itemId = $null
        if ($add.parsed -and $add.parsed.items) {
            $match = @($add.parsed.items | Where-Object { $_.productId -eq $productId })
            if ($match.Count -gt 0) { $itemId = $match[0].id }
        }

        if (-not $itemId) {
            $notes.Add('item_id_missing_in_add_response')
            $afterAdd = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
            $totalMs += $afterAdd.latency_ms
            if ($afterAdd.success -and $afterAdd.parsed -and $afterAdd.parsed.items) {
                $m2 = @($afterAdd.parsed.items | Where-Object { $_.productId -eq $productId })
                if ($m2.Count -gt 0) { $itemId = $m2[0].id; $notes.Add('item_id_from_get_after_add') }
            }
        }

        if ($itemId) {
            $upd = Invoke-ApiRaw -Method 'PUT' -Url "$baseUrl/api/cart/items/$itemId?storeId=$storeId" -Headers $authHeaders -Body @{quantity=2}
            $totalMs += $upd.latency_ms
            $updateStatus = $upd.status
            if (-not $upd.success) { $notes.Add('update_failed') }
        } else {
            $notes.Add('item_id_unavailable')
        }

        $get = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
        $totalMs += $get.latency_ms
        $getStatus = $get.status
        if ($get.parsed -and $get.parsed.items) {
            $target = @($get.parsed.items | Where-Object { $_.productId -eq $productId })
            if ($target.Count -gt 0) { $observedQty = $target[0].quantity }
        }

        $ok = ($addStatus -ge 200 -and $addStatus -lt 300 -and $updateStatus -ge 200 -and $updateStatus -lt 300 -and $getStatus -ge 200 -and $getStatus -lt 300 -and $null -ne $observedQty -and [int]$observedQty -eq 2)
        if (-not $ok -and $null -eq $observedQty) { $notes.Add('product_not_found_after_update') }
        if (-not $ok -and $null -ne $observedQty -and [int]$observedQty -ne 2) { $notes.Add("qty_$observedQty") }
    } catch {
        $notes.Add(('exception:' + $_.Exception.Message.Replace(',',';')))
    }

    $rows.Add([PSCustomObject]@{ iteration=$i; add_status=$addStatus; update_status=$updateStatus; get_status=$getStatus; observed_qty=$observedQty; success=[bool]$ok; notes=(($notes|Select-Object -Unique)-join ';'); latency_ms_total=[int]$totalMs })
}

$rows | Export-Csv -Path $outFile -NoTypeInformation -Encoding UTF8
$successCount = @($rows | Where-Object success).Count
$predAdd = (($rows | Group-Object add_status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name)
$predUpd = (($rows | Group-Object update_status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name)
$predGet = (($rows | Group-Object get_status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name)

Write-Host "Probe complete. CSV: $outFile"
Write-Host "success_count=$successCount/10"
Write-Host "predominant_statuses add=$predAdd update=$predUpd get=$predGet"
Write-Host "email=$email storeId=$storeId productId=$productId"
