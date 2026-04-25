$ErrorActionPreference = 'Stop'

$baseUrl = 'http://localhost:8080'
$outDir = 'C:\Users\esken\Desktop\my_version__1_\evaluation_artifacts'
$prefix = 'cart_final_'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Get-BodyType {
    param([string]$Content)
    if ([string]::IsNullOrWhiteSpace($Content)) { return 'empty' }
    try {
        $obj = $Content | ConvertFrom-Json -Depth 100
        if ($obj -is [System.Array]) { return 'json_array' }
        if ($obj -is [System.Collections.IList]) { return 'json_array' }
        return 'json_object'
    } catch {
        return 'non_json'
    }
}

function Get-BodySample {
    param([string]$Content)
    if ($null -eq $Content) { return '' }
    $s = ($Content -replace "`r",' ' -replace "`n",' ' -replace '\s+',' ').Trim()
    if ($s.Length -gt 180) { return $s.Substring(0,180) }
    return $s
}

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
        TimeoutSec = 40
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
    $bodyType = Get-BodyType -Content $content
    $parsed = $null
    if ($bodyType -ne 'non_json' -and $bodyType -ne 'empty') {
        try { $parsed = $content | ConvertFrom-Json -Depth 100 } catch { $parsed = $null }
    }

    [PSCustomObject]@{
        status = [int]$resp.StatusCode
        latency_ms = [int][math]::Round($sw.Elapsed.TotalMilliseconds)
        success = ([int]$resp.StatusCode -ge 200 -and [int]$resp.StatusCode -lt 300)
        body_type = $bodyType
        body_sample = Get-BodySample -Content $content
        content = $content
        parsed = $parsed
    }
}

function Get-PredominantValue {
    param($Rows, [string]$Property)
    if (-not $Rows -or $Rows.Count -eq 0) { return '' }
    return ($Rows | Group-Object -Property $Property | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name
}

# 1) Reachability check
$categoriesCheck = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/categories" -Headers $null -Body $null
if (-not $categoriesCheck.success) {
    throw "Backend not reachable at /api/categories. HTTP $($categoriesCheck.status). Body: $($categoriesCheck.body_sample)"
}

# 2) Fresh user register + login
$runStamp = Get-Date -Format 'yyyyMMddHHmmssfff'
$email = "cart.final.$runStamp@example.com"
$password = 'Passw0rd!123'
$name = 'Cart Final Validator'

$register = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/register" -Headers $null -Body @{ email=$email; password=$password; name=$name }
if (-not $register.success) {
    throw "Register failed. HTTP $($register.status). Body: $($register.body_sample)"
}

$login = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/login" -Headers $null -Body @{ email=$email; password=$password }
if (-not $login.success) {
    throw "Login failed. HTTP $($login.status). Body: $($login.body_sample)"
}

$token = $null
if ($login.parsed) {
    $token = $login.parsed.accessToken
    if (-not $token) { $token = $login.parsed.access_token }
}
if (-not $token) {
    throw "Login succeeded but bearer token missing in response. Body: $($login.body_sample)"
}
$authHeaders = @{ Authorization = "Bearer $token" }

# 3) storeId + active productId
$stores = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/stores" -Headers $null -Body $null
if (-not $stores.success) { throw "Fetching stores failed. HTTP $($stores.status)." }
$storeId = $null
if ($stores.parsed -is [System.Array] -and $stores.parsed.Count -gt 0) { $storeId = $stores.parsed[0].id }
if (-not $storeId) { throw 'No storeId found in /api/stores response.' }

$products = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/products?active=true&size=1" -Headers $null -Body $null
if (-not $products.success) { throw "Fetching active products failed. HTTP $($products.status)." }
$productId = $null
if ($products.parsed -and $products.parsed.content -and $products.parsed.content.Count -gt 0) { $productId = $products.parsed.content[0].id }
if (-not $productId) { throw 'No active productId found in /api/products?active=true&size=1 response.' }

# 4) Request mode validation
$requestModeRows = New-Object System.Collections.Generic.List[object]
$modes = @(
    @{ mode='no_auth_no_store';    url="$baseUrl/api/cart";                    headers=$null },
    @{ mode='no_auth_with_store';  url="$baseUrl/api/cart?storeId=$storeId";   headers=$null },
    @{ mode='auth_no_store';       url="$baseUrl/api/cart";                    headers=$authHeaders },
    @{ mode='auth_with_store';     url="$baseUrl/api/cart?storeId=$storeId";   headers=$authHeaders }
)

foreach ($m in $modes) {
    foreach ($i in 1..10) {
        $r = Invoke-ApiRaw -Method 'GET' -Url $m.url -Headers $m.headers -Body $null
        $requestModeRows.Add([PSCustomObject]@{
            mode = $m.mode
            iteration = $i
            status = $r.status
            latency_ms = $r.latency_ms
            success = [bool]$r.success
            body_type = $r.body_type
            body_sample = $r.body_sample
        })
    }
}

$reqRawPath = Join-Path $outDir ($prefix + 'request_modes_raw.csv')
$requestModeRows | Export-Csv -Path $reqRawPath -NoTypeInformation -Encoding UTF8

$reqSummary = foreach ($g in ($requestModeRows | Group-Object mode)) {
    $rows = @($g.Group)
    $n = $rows.Count
    $succ = @($rows | Where-Object success).Count
    $statuses = @($rows | Select-Object -ExpandProperty status | Sort-Object -Unique)
    [PSCustomObject]@{
        mode = $g.Name
        N = $n
        success_rate_pct = [math]::Round((100.0 * $succ / [math]::Max($n,1)),2)
        predominant_status = Get-PredominantValue -Rows $rows -Property 'status'
        deterministic_status = ($statuses.Count -eq 1)
        unique_statuses = ($statuses -join '|')
        predominant_body_type = Get-PredominantValue -Rows $rows -Property 'body_type'
    }
}
$reqSummaryPath = Join-Path $outDir ($prefix + 'request_modes_summary.csv')
$reqSummary | Export-Csv -Path $reqSummaryPath -NoTypeInformation -Encoding UTF8

# Scenario helpers
function Do-Login {
    param([string]$Email,[string]$Password)
    $l = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/auth/login" -Headers $null -Body @{ email=$Email; password=$Password }
    $t = $null
    if ($l.parsed) { $t = $l.parsed.accessToken; if (-not $t) { $t = $l.parsed.access_token } }
    return [PSCustomObject]@{ resp=$l; token=$t }
}

function Get-CartItemCount {
    param($CartParsed)
    if ($null -eq $CartParsed -or $null -eq $CartParsed.items) { return 0 }
    return @($CartParsed.items).Count
}

# 5) Scenario validation
$scenarioRows = New-Object System.Collections.Generic.List[object]
$scenarioNames = 'A_login_get_cart','B_login_add_get_cart','C_login_add_update_get_cart','D_login_add_checkout'

foreach ($sc in $scenarioNames) {
    foreach ($i in 1..10) {
        $totalMs = 0
        $status = 0
        $ok = $true
        $notes = @()

        $lg = Do-Login -Email $email -Password $password
        $totalMs += $lg.resp.latency_ms
        $status = $lg.resp.status
        if (-not $lg.resp.success -or -not $lg.token) {
            $ok = $false
            $notes += 'login_failed'
        }

        if ($ok) {
            $h = @{ Authorization = "Bearer $($lg.token)" }
            $clear = Invoke-ApiRaw -Method 'DELETE' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null
            $totalMs += $clear.latency_ms
            if (-not $clear.success) { $notes += "clear_cart_$($clear.status)" }

            switch ($sc) {
                'A_login_get_cart' {
                    $g = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null
                    $totalMs += $g.latency_ms; $status = $g.status
                    if (-not $g.success) { $ok = $false; $notes += 'get_cart_failed' }
                }
                'B_login_add_get_cart' {
                    $a = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $h -Body @{ productId=$productId; quantity=1 }
                    $totalMs += $a.latency_ms; $status = $a.status
                    if (-not $a.success) { $ok = $false; $notes += 'add_failed' }
                    $g = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null
                    $totalMs += $g.latency_ms; $status = $g.status
                    if (-not $g.success) { $ok = $false; $notes += 'get_after_add_failed' }
                }
                'C_login_add_update_get_cart' {
                    $a = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $h -Body @{ productId=$productId; quantity=1 }
                    $totalMs += $a.latency_ms; $status = $a.status
                    if (-not $a.success) { $ok = $false; $notes += 'add_failed' }

                    $itemId = $null
                    $nextQty = 2
                    if ($a.parsed -and $a.parsed.items -and @($a.parsed.items).Count -gt 0) {
                        $item = @($a.parsed.items)[0]
                        $itemId = $item.id
                        if ($item.quantity) { $nextQty = [int]$item.quantity + 1 }
                    }

                    if (-not $itemId) {
                        $ok = $false
                        $notes += 'no_item_for_update'
                    } else {
                        $u = Invoke-ApiRaw -Method 'PUT' -Url "$baseUrl/api/cart/items/$itemId?storeId=$storeId" -Headers $h -Body @{ quantity=$nextQty }
                        $totalMs += $u.latency_ms; $status = $u.status
                        if (-not $u.success) { $ok = $false; $notes += 'update_failed' }
                    }

                    $g = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null
                    $totalMs += $g.latency_ms; $status = $g.status
                    if (-not $g.success) { $ok = $false; $notes += 'get_after_update_failed' }
                }
                'D_login_add_checkout' {
                    $a = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $h -Body @{ productId=$productId; quantity=1 }
                    $totalMs += $a.latency_ms; $status = $a.status
                    if (-not $a.success) { $ok = $false; $notes += 'add_failed' }

                    $co = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/orders/checkout" -Headers $h -Body @{ storeId=$storeId; paymentMethod='CASH' }
                    $totalMs += $co.latency_ms; $status = $co.status
                    if (-not $co.success) { $ok = $false; $notes += 'checkout_failed' }

                    $my = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/orders/my" -Headers $h -Body $null
                    $totalMs += $my.latency_ms
                    if (-not $my.success) { $notes += "orders_my_$($my.status)" }
                }
            }
        }

        $scenarioRows.Add([PSCustomObject]@{
            scenario = $sc
            iteration = $i
            status = $status
            success = [bool]$ok
            latency_ms_total = [int]$totalMs
            notes = (($notes | Select-Object -Unique) -join ';')
        })
    }
}

$scRawPath = Join-Path $outDir ($prefix + 'scenarios_raw.csv')
$scenarioRows | Export-Csv -Path $scRawPath -NoTypeInformation -Encoding UTF8

$scSummary = foreach ($g in ($scenarioRows | Group-Object scenario)) {
    $rows = @($g.Group)
    $n = $rows.Count
    $succ = @($rows | Where-Object success).Count
    $statuses = @($rows | Select-Object -ExpandProperty status)
    $lat = @($rows | Select-Object -ExpandProperty latency_ms_total | Sort-Object)
    $p50 = if ($lat.Count -gt 0) { $lat[[int][math]::Floor(($lat.Count-1)/2)] } else { 0 }

    [PSCustomObject]@{
        scenario = $g.Name
        N = $n
        success_rate_pct = [math]::Round((100.0 * $succ / [math]::Max($n,1)),2)
        predominant_status = (($statuses | Group-Object | Sort-Object -Property @{Expression='Count';Descending=$true}, @{Expression='Name';Descending=$false} | Select-Object -First 1).Name)
        avg_total_ms = [math]::Round((($rows | Measure-Object latency_ms_total -Average).Average),2)
        p50_ms = $p50
    }
}
$scSummaryPath = Join-Path $outDir ($prefix + 'scenarios_summary.csv')
$scSummary | Export-Csv -Path $scSummaryPath -NoTypeInformation -Encoding UTF8

# 6) State dependence probe
$stateRows = New-Object System.Collections.Generic.List[object]
for ($i=1; $i -le 10; $i++) {
    $lg = Do-Login -Email $email -Password $password
    $okToken = ($lg.resp.success -and $lg.token)
    $notes = @()
    if (-not $okToken) { $notes += 'login_failed' }

    $beforeStatus = 0; $beforeCount = -1; $afterStatus = 0; $afterCount = -1
    $emptyRepresentation = $false

    if ($okToken) {
        $h = @{ Authorization = "Bearer $($lg.token)" }
        $null = Invoke-ApiRaw -Method 'DELETE' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null

        $before = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null
        $beforeStatus = $before.status
        if ($before.parsed) {
            $beforeCount = Get-CartItemCount -CartParsed $before.parsed
            $totalVal = $before.parsed.total
            $isZeroTotal = ($null -ne $totalVal -and [decimal]$totalVal -eq 0)
            $emptyRepresentation = ($before.status -eq 200 -and $beforeCount -eq 0 -and $isZeroTotal)
        }

        $add = Invoke-ApiRaw -Method 'POST' -Url "$baseUrl/api/cart/items?storeId=$storeId" -Headers $h -Body @{ productId=$productId; quantity=1 }
        if (-not $add.success) { $notes += 'add_failed' }

        $after = Invoke-ApiRaw -Method 'GET' -Url "$baseUrl/api/cart?storeId=$storeId" -Headers $h -Body $null
        $afterStatus = $after.status
        if ($after.parsed) { $afterCount = Get-CartItemCount -CartParsed $after.parsed }
    }

    $stateRows.Add([PSCustomObject]@{
        iteration = $i
        before_status = $beforeStatus
        before_count = $beforeCount
        after_status = $afterStatus
        after_count = $afterCount
        state_changed = ($afterCount -gt $beforeCount -and $beforeCount -ge 0)
        empty_cart_repr_200_items0_total0 = [bool]$emptyRepresentation
        notes = (($notes | Select-Object -Unique) -join ';')
    })
}

$statePath = Join-Path $outDir ($prefix + 'state_dependence.csv')
$stateRows | Export-Csv -Path $statePath -NoTypeInformation -Encoding UTF8

# 7) Context snapshot
$context = [PSCustomObject]@{
    generated_email = $email
    storeId = $storeId
    productId = $productId
    started_at_utc = (Get-Date).ToUniversalTime().AddMinutes(-5).ToString('o')
    finished_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    categories_check_status = $categoriesCheck.status
    register_status = $register.status
    login_status = $login.status
}
$contextPath = Join-Path $outDir ($prefix + 'context.json')
$context | ConvertTo-Json -Depth 10 | Set-Content -Path $contextPath -Encoding UTF8

# 8) Brief terminal summary lines
$authWithStore = $reqSummary | Where-Object mode -eq 'auth_with_store'
$bestScenario = $scSummary | Sort-Object success_rate_pct -Descending | Select-Object -First 1
$emptyHits = @($stateRows | Where-Object empty_cart_repr_200_items0_total0).Count

Write-Host "cart_final: categories reachable status=$($categoriesCheck.status)"
Write-Host "cart_final: user=$email storeId=$storeId productId=$productId"
Write-Host "cart_final: request_mode auth_with_store success_rate=$($authWithStore.success_rate_pct)% statuses=$($authWithStore.unique_statuses)"
Write-Host "cart_final: top_scenario=$($bestScenario.scenario) success_rate=$($bestScenario.success_rate_pct)%"
Write-Host "cart_final: empty_cart_repr_hits=$emptyHits/10"
Write-Host "cart_final: artifacts at $outDir"

# Show created files
Get-ChildItem $outDir -Filter "$prefix*" | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
