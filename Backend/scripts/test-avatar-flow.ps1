# Test Avatar Flow - Misiones Arrienda
# Smoke test: PUT avatar → GET avatar → verificar cache-busting

Write-Host "=== AVATAR FLOW TEST ===" -ForegroundColor Yellow
Write-Host "Testing avatar upload and cache-busting..." -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$testUserId = "6403f9d2-e846-4c70-87e0-e051127d9500"
$results = @()

# Function to test avatar endpoint
function Test-AvatarEndpoint {
    param(
        [string]$method = "GET",
        [string]$body = $null,
        [string]$description
    )
    
    try {
        $url = "$baseUrl/api/users/avatar"
        if ($method -eq "GET") {
            $url += "?userId=$testUserId"
        }
        
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        if ($method -ne "GET") {
            $headers['Authorization'] = "Bearer $testUserId"
        }
        
        if ($body) {
            $response = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -Body $body -UseBasicParsing
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -UseBasicParsing
        }
        
        $status = "✅ PASS"
        Write-Host "$status - $description" -ForegroundColor Green
        
        return @{
            Method = $method
            Response = $response
            Passed = $true
            Description = $description
            Timestamp = Get-Date -Format "HH:mm:ss"
        }
    }
    catch {
        $status = "❌ FAIL"
        Write-Host "$status - $description" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Method = $method
            Response = $null
            Passed = $false
            Description = $description
            Error = $_.Exception.Message
            Timestamp = Get-Date -Format "HH:mm:ss"
        }
    }
}

Write-Host "`n--- STEP 1: GET Avatar Initial State ---" -ForegroundColor Magenta

$initialState = Test-AvatarEndpoint -method "GET" -description "Get initial avatar state"

if ($initialState.Passed) {
    $initialV = $initialState.Response.v
    $initialUrl = $initialState.Response.url
    Write-Host "  Initial v: $initialV" -ForegroundColor Gray
    Write-Host "  Initial URL: $initialUrl" -ForegroundColor Gray
}

Write-Host "`n--- STEP 2: POST Avatar Update ---" -ForegroundColor Magenta

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testAvatarUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&t=$timestamp"

$updateBody = @{
    avatar_url = $testAvatarUrl
} | ConvertTo-Json

$updateState = Test-AvatarEndpoint -method "POST" -body $updateBody -description "Update avatar with new URL"

if ($updateState.Passed) {
    $newV = $updateState.Response.v
    $newUrl = $updateState.Response.url
    Write-Host "  New v: $newV" -ForegroundColor Gray
    Write-Host "  New URL: $newUrl" -ForegroundColor Gray
}

Write-Host "`n--- STEP 3: GET Avatar After Update ---" -ForegroundColor Magenta

Start-Sleep -Seconds 1  # Pequeña pausa para asegurar timestamp diferente

$finalState = Test-AvatarEndpoint -method "GET" -description "Get avatar after update"

if ($finalState.Passed) {
    $finalV = $finalState.Response.v
    $finalUrl = $finalState.Response.url
    Write-Host "  Final v: $finalV" -ForegroundColor Gray
    Write-Host "  Final URL: $finalUrl" -ForegroundColor Gray
}

Write-Host "`n--- STEP 4: Verify Cache-Busting ---" -ForegroundColor Magenta

$cacheBustingWorking = $false

if ($initialState.Passed -and $updateState.Passed -and $finalState.Passed) {
    $initialV = $initialState.Response.v
    $newV = $updateState.Response.v
    $finalV = $finalState.Response.v
    
    # Verificar que los timestamps cambiaron
    if ($newV -gt $initialV -and $finalV -eq $newV) {
        Write-Host "✅ PASS - Cache-busting working correctly" -ForegroundColor Green
        Write-Host "  Initial v: $initialV → Update v: $newV → Final v: $finalV" -ForegroundColor Gray
        $cacheBustingWorking = $true
    } else {
        Write-Host "❌ FAIL - Cache-busting not working" -ForegroundColor Red
        Write-Host "  Initial v: $initialV → Update v: $newV → Final v: $finalV" -ForegroundColor Red
    }
} else {
    Write-Host "❌ FAIL - Cannot verify cache-busting due to previous errors" -ForegroundColor Red
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Yellow

$allResults = @($initialState, $updateState, $finalState)
$passed = ($allResults | Where-Object { $_.Passed }).Count
$total = $allResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Cache-busting: $(if ($cacheBustingWorking) { 'WORKING' } else { 'FAILED' })" -ForegroundColor $(if ($cacheBustingWorking) { 'Green' } else { 'Red' })

if ($passed -eq $total -and $cacheBustingWorking) {
    Write-Host "`n🎉 ALL AVATAR TESTS PASSED!" -ForegroundColor Green
    $overallResult = "PASS"
} else {
    Write-Host "`n⚠️  SOME AVATAR TESTS FAILED!" -ForegroundColor Red
    $overallResult = "FAIL"
}

# Save results to file
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$report = @"
=== AVATAR FLOW TEST RESULTS ===
Timestamp: $timestamp
Overall Result: $overallResult
Total Tests: $total
Passed: $passed
Cache-busting: $(if ($cacheBustingWorking) { 'WORKING' } else { 'FAILED' })

DETAILED RESULTS:
$($allResults | ForEach-Object { 
    $status = if ($_.Passed) { "PASS" } else { "FAIL" }
    "$($_.Timestamp) - $status - $($_.Description)"
    if ($_.Response) {
        "  Response: v=$($_.Response.v), url=$($_.Response.url)"
    }
    if ($_.Error) {
        "  Error: $($_.Error)"
    }
    ""
} | Out-String)

CACHE-BUSTING VERIFICATION:
$(if ($cacheBustingWorking) {
    "✅ Cache-busting working correctly"
    "  Timestamps properly incremented after updates"
} else {
    "❌ Cache-busting failed"
    "  Timestamps not properly updated"
})
"@

$report | Out-File -FilePath "docs/evidencias/avatar-flow-test-results.txt" -Encoding UTF8

Write-Host "`nResults saved to: docs/evidencias/avatar-flow-test-results.txt" -ForegroundColor Cyan
Write-Host "Overall Result: $overallResult" -ForegroundColor $(if ($overallResult -eq "PASS") { "Green" } else { "Red" })

# Return exit code for CI/CD
if ($overallResult -eq "PASS") {
    exit 0
} else {
    exit 1
}
