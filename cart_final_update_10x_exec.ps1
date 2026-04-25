$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:8080'
$outDir = 'C:\Users\esken\Desktop\my_version__1_\evaluation_artifacts'
$outCsv = Join-Path $outDir 'cart_final_update_10x.csv'
$summaryCsv = Join-Path $outDir 'cart_final_update_10x_summary.csv'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Invoke-ApiRaw {
    param([string]$Method,[string]$Url,[hashtable]$Headers,$Body)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $p = @{ Uri=$Url; Method=$Method; TimeoutSec=40; SkipHttpErrorCheck=$true }
    if ($Headers) { $p.Headers = $Headers }
    if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 20); $p.ContentType = 'application/json' }
    $resp = Invoke-WebRequest @p
    $sw.Stop()
    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace([string]$resp.Content)) {
        try { $parsed = $resp.Content | ConvertFrom-Json -Depth 100 } catch { $parsed = $null }
    }
    [PSCustomObject]@{ status=[int]$resp.StatusCode; latency_ms=[int][math]::Round($sw.Elapsed.TotalMilliseconds); parsed=$parsed; content=[string]$resp.Content }
}

function Get-FirstFromPayload {
    param($Payload)
    if ($null -eq $Payload) { return $null }
    if ($Payload -is [System.Array]) { if ($Payload.Count -gt 0) { return $Payload[0] } else { return $null } }
    if ($Payload.PSObject.Properties.Name -contains 'content') {
        $content = $Payload.content
        if ($content -is [System.Array] -and $content.Count -gt 0) { return $content[0] }
    }
    return $null
}

$stamp = Get-Date -Format 'yyyyMMddHHmmssfff'
$email = "cart.final10.$stamp@example.com"
$password = 'Passw0rd!123'
$name = 'Cart Final 10x'

$reg = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/register" -Headers $null -Body @{ email=$email; password=$password; name=$name }
if ($reg.status -ne 200) { throw "Register failed: HTTP $($reg.status)" }

$login = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/login" -Headers $null -Body @{ email=$email; password=$password }
if ($login.status -ne 200) { throw "Login failed: HTTP $($login.status)" }
$token = $login.parsed.accessToken
if (-not $token) { $token = $login.parsed.access_token }
if (-not $token) { throw 'Token missing from login response.' }
$authHeaders = @{ Authorization = "Bearer $token" }

$stores = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores" -Headers $null -Body $null
if ($stores.status -ne 200) { throw "Stores fetch failed: HTTP $($stores.status)" }
$firstStore = Get-FirstFromPayload -Payload $stores.parsed
$storeId = if ($firstStore) { $firstStore.id } else { $null }
if (-not $storeId) { throw 'No storeId found.' }

$products = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores/$storeId/products?active=true&size=1" -Headers $null -Body $null
if ($products.status -ne 200) {
    $products = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores/$storeId/products" -Headers $null -Body $null
}
if ($products.status -ne 200) { throw "Products fetch failed: HTTP $($products.status)" }
$firstProduct = Get-FirstFromPayload -Payload $products.parsed
$productId = $null
if ($firstProduct) {
    if ($firstProduct.PSObject.Properties.Name -contains 'productId') { $productId = $firstProduct.productId }
    elseif ($firstProduct.PSObject.Properties.Name -contains 'id') { $productId = $firstProduct.id }
}
if (-not $productId) { throw 'No productId found (product list empty or unknown schema).' }

$rows = New-Object System.Collections.Generic.List[object]
for ($i = 1; $i -le 10; $i++) {
    $iterSw = [System.Diagnostics.Stopwatch]::StartNew()
    $addStatus = 0; $updateStatus = 0; $getStatus = 0; $observedQty = $null
    $notes = New-Object System.Collections.Generic.List[string]

    try {
        $clear = Invoke-ApiRaw -Method 'DELETE' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
        if ($clear.status -lt 200 -or $clear.status -ge 300) { $notes.Add("clear_$($clear.status)") }
    } catch {
        $notes.Add('clear_exception')
    }

    $add = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $authHeaders -Body @{ productId=$productId; quantity=1 }
    $addStatus = $add.status

    $itemId = $null
    if ($add.parsed -and $add.parsed.items) {
        $match = @($add.parsed.items | Where-Object { $_.productId -eq $productId -or $_.id -eq $productId })
        if ($match.Count -gt 0) {
            if ($match[0].PSObject.Properties.Name -contains 'id') { $itemId = $match[0].id }
            elseif ($match[0].PSObject.Properties.Name -contains 'itemId') { $itemId = $match[0].itemId }
        }
    }

    if (-not $itemId) {
        $afterAdd = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
        if ($afterAdd.status -eq 200 -and $afterAdd.parsed -and $afterAdd.parsed.items) {
            $m2 = @($afterAdd.parsed.items | Where-Object { $_.productId -eq $productId -or $_.id -eq $productId })
            if ($m2.Count -gt 0) {
                if ($m2[0].PSObject.Properties.Name -contains 'id') { $itemId = $m2[0].id }
                elseif ($m2[0].PSObject.Properties.Name -contains 'itemId') { $itemId = $m2[0].itemId }
                $notes.Add('item_id_from_get_after_add')
            }
        }
    }

    if ($itemId) {
        $upd = Invoke-ApiRaw -Method 'PUT' -Url "$baseUrl/api/cart/items/$itemId?storeId=$storeId" -Headers $authHeaders -Body @{ quantity=2 }
        $updateStatus = $upd.status
    } else {
        $updateStatus = 0
        $notes.Add('item_id_missing')
    }

    $get = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
    $getStatus = $get.status
    if ($get.status -eq 200 -and $get.parsed -and $get.parsed.items) {
        $target = @($get.parsed.items | Where-Object { $_.productId -eq $productId -or $_.id -eq $productId })
        if ($target.Count -gt 0) { $observedQty = $target[0].quantity }
    }

    if ($null -eq $observedQty) { $notes.Add('product_missing_in_get') }
    $iterSw.Stop()
    $ok = ($addStatus -eq 200 -and $updateStatus -eq 200 -and $getStatus -eq 200 -and $null -ne $observedQty -and [int]$observedQty -eq 2)

    $rows.Add([PSCustomObject]@{
        iteration = $i
        add_status = $addStatus
        update_status = $updateStatus
        get_status = $getStatus
        observed_qty = $observedQty
        success = [bool]$ok
        notes = (($notes | Select-Object -Unique) -join ';')
        latency_ms = [int][math]::Round($iterSw.Elapsed.TotalMilliseconds)
    })
}

$rows | Export-Csv -Path $outCsv -NoTypeInformation -Encoding UTF8

$N = $rows.Count
$successCount = @($rows | Where-Object { $_.success -eq $true }).Count
$successRate = if ($N -gt 0) { [math]::Round(($successCount * 100.0) / $N, 2) } else { 0 }
$predAdd = ($rows | Group-Object add_status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name
$predUpd = ($rows | Group-Object update_status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name
$predGet = ($rows | Group-Object get_status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name

[PSCustomObject]@{
    N = $N
    success_rate_pct = $successRate
    predominant_add_status = $predAdd
    predominant_update_status = $predUpd
    predominant_get_status = $predGet
} | Export-Csv -Path $summaryCsv -NoTypeInformation -Encoding UTF8

Write-Host "Done: N=$N success=$successCount/$N (${successRate}%) add=$predAdd update=$predUpd get=$predGet"
Write-Host "CSV: $outCsv"
Write-Host "Summary: $summaryCsv"
$rows | Select-Object -First 3 | Format-Table -AutoSize

