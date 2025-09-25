# Release Tag Script - Misiones Arrienda v1
# Creates release tag and generates change report

Write-Host "=== RELEASE TAG CREATION ===" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$tagName = "release/v1-$timestamp"

Write-Host "Creating release tag: $tagName" -ForegroundColor Cyan

try {
    # Create the tag
    git tag -a $tagName -m "Release v1 - $timestamp"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tag created successfully: $tagName" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create tag" -ForegroundColor Red
        exit 1
    }
    
    # Generate change report
    Write-Host "Generating change report..." -ForegroundColor Cyan
    
    # Get the previous release tag (if any)
    $prevTag = git describe --tags --abbrev=0 HEAD~1 2>$null
    if ($LASTEXITCODE -ne 0) {
        # If no previous tag, use initial commit
        $prevTag = git rev-list --max-parents=0 HEAD
    }
    
    # Get changes since previous tag/commit
    $addedFiles = @()
    $modifiedFiles = @()
    $removedFiles = @()
    $movedFiles = @()
    
    # Get diff stats
    $diffOutput = git diff --name-status $prevTag..HEAD
    
    foreach ($line in $diffOutput) {
        if ($line -match '^A\s+(.+)$') {
            $addedFiles += $matches[1]
        }
        elseif ($line -match '^M\s+(.+)$') {
            $modifiedFiles += $matches[1]
        }
        elseif ($line -match '^D\s+(.+)$') {
            $removedFiles += $matches[1]
        }
        elseif ($line -match '^R\d+\s+(.+)\s+(.+)$') {
            $movedFiles += @{
                from = $matches[1]
                to = $matches[2]
            }
        }
    }
    
    # Create change report
    $changeReport = @{
        tag = $tagName
        timestamp = $timestamp
        previous_tag = $prevTag
        summary = @{
            added = $addedFiles.Count
            modified = $modifiedFiles.Count
            removed = $removedFiles.Count
            moved = $movedFiles.Count
        }
        changes = @{
            added = $addedFiles
            modified = $modifiedFiles
            removed = $removedFiles
            moved = $movedFiles
        }
    }
    
    # Save to JSON file
    $reportFile = "scripts/change-report-v1.json"
    $changeReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile -Encoding UTF8
    
    Write-Host "✅ Change report generated: $reportFile" -ForegroundColor Green
    
    # Display summary
    Write-Host "`n=== CHANGE SUMMARY ===" -ForegroundColor Yellow
    Write-Host "Tag: $tagName" -ForegroundColor White
    Write-Host "Added files: $($addedFiles.Count)" -ForegroundColor Green
    Write-Host "Modified files: $($modifiedFiles.Count)" -ForegroundColor Yellow
    Write-Host "Removed files: $($removedFiles.Count)" -ForegroundColor Red
    Write-Host "Moved files: $($movedFiles.Count)" -ForegroundColor Cyan
    
    if ($removedFiles.Count -gt 0) {
        Write-Host "`n⚠️  WARNING: Files were removed!" -ForegroundColor Red
        Write-Host "Removed files:" -ForegroundColor Red
        foreach ($file in $removedFiles) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ Release tag creation completed successfully!" -ForegroundColor Green
    Write-Host "Tag: $tagName" -ForegroundColor Cyan
    Write-Host "Report: $reportFile" -ForegroundColor Cyan
    
    # Return the tag name for use in other scripts
    return $tagName
    
} catch {
    Write-Host "❌ Error creating release tag: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
