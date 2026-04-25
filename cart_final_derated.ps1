$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:8080'
$outDir = 'C:\Users\esken\Desktop\my_version__1_\evaluation_artifacts'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Invoke-ApiRaw {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        $Body
    )
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $params = @{
        Uri = $Url
        Method = $Method
        TimeoutSec = 45
        SkipHttpErrorCheck = $true
    }
    if ($Headers) { $params.Headers = $Headers }
    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 20)
        $params.ContentType = 'application/json'
    }

    $resp = Invoke-WebRequest @params
    $sw.Stop()

    $content = [string]$resp.Content
    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($content)) {
        try { $parsed = $content | ConvertFrom-Json -Depth 100 } catch { $parsed = $null }
    }

    [PSCustomObject]@{
        status = [int]$resp.StatusCode
        success = ([int]$resp.StatusCode -ge 200 -and [int]$resp.StatusCode -lt 300)
        latency_ms = [int][math]::Round($sw.Elapsed.TotalMilliseconds)
        parsed = $parsed
        content = $content
    }
}

function Get-CartCount {
    param($cartObj)
    if ($null -eq $cartObj) { return 0 }
    if ($null -eq $cartObj.items) { return 0 }
    return @($cartObj.items).Count
}

function Get-PredominantStatus {
    param($rows)
    if (-not $rows -or $rows.Count -eq 0) { return '' }
    return (($rows | Group-Object status | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name)
}

# Reachability
$ping = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/categories" -Headers $null -Body $null
if (-not $ping.success) {
    throw "Backend not reachable at $baseUrl/api/categories (HTTP $($ping.status))"
}

# Fresh customer + single login token
$stamp = Get-Date -Format 'yyyyMMddHHmmssfff'
$email = "cart.derated.$stamp@example.com"
$password = 'Passw0rd!123'
$name = 'Cart Derated Validator'

$register = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/register" -Headers $null -Body @{ email=$email; password=$password; name=$name }
if (-not $register.success) {
    throw "Register failed HTTP $($register.status)"
}

$login = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/login" -Headers $null -Body @{ email=$email; password=$password }
if (-not $login.success) {
    throw "Login failed HTTP $($login.status)"
}

$token = $null
if ($login.parsed) {
    $token = $login.parsed.accessToken
    if (-not $token) { $token = $login.parsed.access_token }
}
if (-not $token) {
    throw 'Token missing in login response'
}
$authHeaders = @{ Authorization = "Bearer $token" }

# Discover storeId and active productId
$stores = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores" -Headers $null -Body $null
if (-not $stores.success) { throw "Stores fetch failed HTTP $($stores.status)" }
$storeId = $null
if ($stores.parsed -is [System.Array] -and $stores.parsed.Count -gt 0) {
    $storeId = $stores.parsed[0].id
} elseif ($stores.parsed -and $stores.parsed.content -and @($stores.parsed.content).Count -gt 0) {
    $storeId = @($stores.parsed.content)[0].id
}
if (-not $storeId) { throw 'No storeId discovered' }

$products = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/products?active=true&size=1" -Headers $null -Body $null
if (-not $products.success) { throw "Products fetch failed HTTP $($products.status)" }
$productId = $null
if ($products.parsed -and $products.parsed.content -and @($products.parsed.content).Count -gt 0) {
    $productId = @($products.parsed.content)[0].id
} elseif ($products.parsed -is [System.Array] -and $products.parsed.Count -gt 0) {
    $productId = $products.parsed[0].id
}
if (-not $productId) { throw 'No active productId discovered' }

$scenarioRows = New-Object System.Collections.Generic.List[object]
$stateRows = New-Object System.Collections.Generic.List[object]

function Add-ScenarioRow {
    param([string]$Scenario,[int]$Iteration,[int]$Status,[bool]$Success,[int]$Latency,[string]$Notes)
    $scenarioRows.Add([PSCustomObject]@{
        scenario = $Scenario
        iteration = $Iteration
        status = $Status
        success = $Success
        latency_ms_total = $Latency
        notes = $Notes
    }) | Out-Null
}

# Run scenarios S1-S4, 10 iterations each, same token
$scenarios = @('S1_get_cart_valid_store','S2_add_then_get','S3_add_update_get','S4_add_checkout_orders')
foreach ($sc in $scenarios) {
    foreach ($i in 1..10) {
        $notes = New-Object System.Collections.Generic.List[string]
        $totalMs = 0
        $finalStatus = 0
        $ok = $true

        # optional clean cart at iteration start for determinism
        $clear = Invoke-ApiRaw -Method 'DELETE' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
        $totalMs += $clear.latency_ms
        if (-not $clear.success) { $notes.Add("clear_$($clear.status)") | Out-Null }

        $beforeCart = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
        $totalMs += $beforeCart.latency_ms
        $beforeCount = if ($beforeCart.success) { Get-CartCount $beforeCart.parsed } else { -1 }
        $beforeEmptyFlag = $false
        if ($beforeCart.success -and $beforeCart.parsed) {
            $totalVal = $beforeCart.parsed.total
            $beforeEmptyFlag = ($beforeCount -eq 0 -and $null -ne $totalVal -and [decimal]$totalVal -eq 0)
        }

        $afterAddCount = $null
        $afterUpdateCount = $null
        $afterCheckoutCount = $null
        $changedAdd = $null
        $changedUpdate = $null
        $changedCheckout = $null
        $emptyAfterCheckout = $null

        switch ($sc) {
            'S1_get_cart_valid_store' {
                $g = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
                $totalMs += $g.latency_ms
                $finalStatus = $g.status
                if (-not $g.success) { $ok = $false; $notes.Add('get_cart_failed') | Out-Null }
                $afterAddCount = if ($g.success) { Get-CartCount $g.parsed } else { $null }
                $changedAdd = if ($null -ne $afterAddCount -and $beforeCount -ge 0) { ($afterAddCount -ne $beforeCount) } else { $null }
            }
            'S2_add_then_get' {
                $a = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $authHeaders -Body @{ productId=$productId; quantity=1 }
                $totalMs += $a.latency_ms
                if (-not $a.success) { $ok = $false; $notes.Add('add_failed') | Out-Null }

                $g = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
                $totalMs += $g.latency_ms
                $finalStatus = $g.status
                if (-not $g.success) { $ok = $false; $notes.Add('get_after_add_failed') | Out-Null }

                $afterAddCount = if ($g.success) { Get-CartCount $g.parsed } else { $null }
                $changedAdd = if ($null -ne $afterAddCount -and $beforeCount -ge 0) { ($afterAddCount -gt $beforeCount) } else { $null }
            }
            'S3_add_update_get' {
                $a = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $authHeaders -Body @{ productId=$productId; quantity=1 }
                $totalMs += $a.latency_ms
                if (-not $a.success) { $ok = $false; $notes.Add('add_failed') | Out-Null }

                $afterAdd = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
                $totalMs += $afterAdd.latency_ms
                if (-not $afterAdd.success) { $ok = $false; $notes.Add('get_after_add_failed') | Out-Null }
                $afterAddCount = if ($afterAdd.success) { Get-CartCount $afterAdd.parsed } else { $null }
                $changedAdd = if ($null -ne $afterAddCount -and $beforeCount -ge 0) { ($afterAddCount -gt $beforeCount) } else { $null }

                $itemId = $null
                $nextQty = 2
                if ($afterAdd.success -and $afterAdd.parsed -and $afterAdd.parsed.items -and @($afterAdd.parsed.items).Count -gt 0) {
                    $firstItem = @($afterAdd.parsed.items)[0]
                    $itemId = $firstItem.id
                    if ($firstItem.quantity) { $nextQty = [int]$firstItem.quantity + 1 }
                }
                if (-not $itemId) {
                    $ok = $false
                    $notes.Add('no_item_for_update') | Out-Null
                } else {
                    $u = Invoke-ApiRaw -Method 'PUT' -Url "$baseUrl/api/cart/items/$itemId?storeId=$storeId" -Headers $authHeaders -Body @{ quantity=$nextQty }
                    $totalMs += $u.latency_ms
                    if (-not $u.success) { $ok = $false; $notes.Add('update_failed') | Out-Null }
                }

                $g = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
                $totalMs += $g.latency_ms
                $finalStatus = $g.status
                if (-not $g.success) { $ok = $false; $notes.Add('get_after_update_failed') | Out-Null }
                $afterUpdateCount = if ($g.success) { Get-CartCount $g.parsed } else { $null }
                $changedUpdate = if ($null -ne $afterUpdateCount -and $null -ne $afterAddCount) { ($afterUpdateCount -eq $afterAddCount) -or ($afterUpdateCount -ge 1) } else { $null }
            }
            'S4_add_checkout_orders' {
                $beforeOrders = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/orders/my" -Headers $authHeaders -Body $null
                $totalMs += $beforeOrders.latency_ms
                $beforeOrdersCount = if ($beforeOrders.success -and $beforeOrders.parsed) { @($beforeOrders.parsed).Count } else { -1 }

                $a = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $authHeaders -Body @{ productId=$productId; quantity=1 }
                $totalMs += $a.latency_ms
                if (-not $a.success) { $ok = $false; $notes.Add('add_failed') | Out-Null }

                $afterAdd = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
                $totalMs += $afterAdd.latency_ms
                $afterAddCount = if ($afterAdd.success) { Get-CartCount $afterAdd.parsed } else { $null }
                $changedAdd = if ($null -ne $afterAddCount -and $beforeCount -ge 0) { ($afterAddCount -gt $beforeCount) } else { $null }

                $co = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/orders/checkout" -Headers $authHeaders -Body @{ storeId=$storeId; paymentMethod='CASH' }
                $totalMs += $co.latency_ms
                if (-not $co.success) { $ok = $false; $notes.Add('checkout_failed') | Out-Null }

                $afterCheckoutCart = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $authHeaders -Body $null
                $totalMs += $afterCheckoutCart.latency_ms
                $afterCheckoutCount = if ($afterCheckoutCart.success) { Get-CartCount $afterCheckoutCart.parsed } else { $null }
                $changedCheckout = if ($null -ne $afterCheckoutCount -and $null -ne $afterAddCount) { ($afterCheckoutCount -le $afterAddCount) } else { $null }
                if ($afterCheckoutCart.success -and $afterCheckoutCart.parsed) {
                    $tv = $afterCheckoutCart.parsed.total
                    $emptyAfterCheckout = ($afterCheckoutCount -eq 0 -and $null -ne $tv -and [decimal]$tv -eq 0)
                }

                $my = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/orders/my" -Headers $authHeaders -Body $null
                $totalMs += $my.latency_ms
                $finalStatus = $my.status
                if (-not $my.success) {
                    $ok = $false
                    $notes.Add('orders_my_failed') | Out-Null
                } else {
                    $afterOrdersCount = @($my.parsed).Count
                    $orderPresent = ($beforeOrdersCount -ge 0 -and $afterOrdersCount -gt $beforeOrdersCount)
                    if (-not $orderPresent) {
                        $ok = $false
                        $notes.Add('order_not_observed') | Out-Null
                    }
                }
            }
        }

        Add-ScenarioRow -Scenario $sc -Iteration $i -Status $finalStatus -Success $ok -Latency $totalMs -Notes (($notes | Select-Object -Unique) -join ';')

        $stateRows.Add([PSCustomObject]@{
            scenario = $sc
            iteration = $i
            before_count = $beforeCount
            after_add_count = $afterAddCount
            after_update_count = $afterUpdateCount
            after_checkout_count = $afterCheckoutCount
            state_changed_after_add = $changedAdd
            state_changed_after_update = $changedUpdate
            state_changed_after_checkout = $changedCheckout
            empty_cart_repr_before = $beforeEmptyFlag
            empty_cart_repr_after_checkout = $emptyAfterCheckout
        }) | Out-Null

        Start-Sleep -Milliseconds 1200
    }
}

$rawPath = Join-Path $outDir 'cart_final_derated_scenarios_raw.csv'
$scenarioRows | Export-Csv -Path $rawPath -NoTypeInformation -Encoding UTF8

$summaryRows = foreach ($g in ($scenarioRows | Group-Object scenario)) {
    $rows = @($g.Group)
    $n = $rows.Count
    $succ = @($rows | Where-Object { $_.success -eq $true }).Count
    $lat = @($rows | Select-Object -ExpandProperty latency_ms_total | Sort-Object)
    $p50 = if ($lat.Count -gt 0) { $lat[[int][math]::Floor(($lat.Count-1)/2)] } else { 0 }

    [PSCustomObject]@{
        scenario = $g.Name
        N = $n
        success_rate_pct = [math]::Round((100.0 * $succ / [math]::Max($n,1)),2)
        predominant_status = Get-PredominantStatus -rows $rows
        avg_total_ms = [math]::Round((($rows | Measure-Object latency_ms_total -Average).Average),2)
        p50_ms = $p50
    }
}

$summaryPath = Join-Path $outDir 'cart_final_derated_scenarios_summary.csv'
$summaryRows | Export-Csv -Path $summaryPath -NoTypeInformation -Encoding UTF8

$statePath = Join-Path $outDir 'cart_final_derated_state.csv'
$stateRows | Export-Csv -Path $statePath -NoTypeInformation -Encoding UTF8

$non2xx = @($scenarioRows | Where-Object { $_.status -lt 200 -or $_.status -ge 300 }).Count
foreach ($r in $summaryRows) {
    Write-Host ("derated_summary: {0} success_rate={1}% predominant_status={2} avg_total_ms={3}" -f $r.scenario,$r.success_rate_pct,$r.predominant_status,$r.avg_total_ms)
}
Write-Host "derated_summary: non_2xx_status_count=$non2xx"
Write-Host "derated_summary: created_files=$rawPath;$summaryPath;$statePath"
