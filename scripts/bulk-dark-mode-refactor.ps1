# PowerShell script for bulk dark mode refactoring
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts/bulk-dark-mode-refactor.ps1

Write-Host "🌓 Starting bulk dark mode refactoring..." -ForegroundColor Cyan

$files = @(
  "components/coach/ProductList.tsx",
  "components/coach/RevenueDashboard.tsx",
  "components/coach/CoachAppointmentList.tsx",
  "components/coach/AddPriceModal.tsx",
  "components/coach/CreateProductModal.tsx",
  "components/coach/CreateContentModal.tsx",
  "components/coach/ContentList.tsx",
  "components/admin/UserSearch.tsx",
  "components/admin/GrantEntitlementModal.tsx",
  "components/settings/SettingsForm.tsx",
  "app/admin/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/stripe-events/page.tsx",
  "app/settings/page.tsx"
)

$replacements = @{
  # Backgrounds
  'bg-white' = 'bg-card'
  'bg-gray-50' = 'bg-background'
  'bg-gray-100' = 'bg-muted'
  
  # Text
  'text-gray-900' = 'text-foreground'
  'text-gray-800' = 'text-foreground'
  'text-gray-700' = 'text-muted-foreground'
  'text-gray-600' = 'text-muted-foreground'
  'text-gray-500' = 'text-muted-foreground'
  'text-gray-400' = 'text-muted-foreground'
  
  # Borders
  'border-gray-200' = 'border-border'
  'border-gray-300' = 'border-input'
  
  # Primary (blue)
  'bg-blue-600' = 'bg-primary'
  'text-blue-600' = 'text-primary'
  'bg-blue-50' = 'bg-primary/10'
  'text-blue-900' = 'text-primary'
  'text-blue-800' = 'text-muted-foreground'
  'text-blue-700' = 'text-muted-foreground'
  'border-blue-300' = 'border-primary'
  'border-blue-200' = 'border-primary'
  'hover:bg-blue-700' = 'hover:bg-primary/90'
  'hover:bg-blue-100' = 'hover:bg-primary/20'
  'hover:text-blue-500' = 'hover:text-primary/90'
  'hover:border-blue-500' = 'hover:border-primary'
  
  # Secondary (purple)
  'bg-purple-100' = 'bg-secondary'
  'text-purple-800' = 'text-secondary-foreground'
  'border-purple-300' = 'border-secondary'
  'bg-purple-50' = 'bg-secondary/10'
  
  # Accent (green)
  'bg-green-100' = 'bg-accent'
  'text-green-800' = 'text-accent-foreground'
  'bg-green-50' = 'bg-accent'
  'border-green-200' = 'border-accent'
  
  # Destructive (red)
  'bg-red-50' = 'bg-destructive/10'
  'text-red-800' = 'text-destructive'
  'text-red-600' = 'text-destructive'
  'border-red-200' = 'border-destructive'
  'bg-red-600' = 'bg-destructive'
  
  # Yellow/warning
  'bg-yellow-50' = 'bg-accent'
  'text-yellow-800' = 'text-accent-foreground'
  'border-yellow-200' = 'border-accent'
  
  # Placeholders
  'placeholder-gray-500' = 'placeholder:text-muted-foreground'
  
  # Hover states
  'hover:bg-gray-50' = 'hover:bg-accent'
  'hover:bg-gray-100' = 'hover:bg-accent'
  'hover:text-gray-900' = 'hover:text-foreground'
  
  # Focus
  'focus:ring-blue-500' = 'focus:ring-ring'
  'focus:border-blue-500' = 'focus:border-ring'
}

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "Refactoring $file..." -ForegroundColor Yellow
    $content = Get-Content $file -Raw
    
    foreach ($old in $replacements.Keys) {
      $new = $replacements[$old]
      $content = $content -replace [regex]::Escape($old), $new
    }
    
    Set-Content $file -Value $content -NoNewline
    Write-Host "  ✓ Done" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠️  File not found: $file" -ForegroundColor Red
  }
}

Write-Host "`n✅ Bulk refactoring complete!" -ForegroundColor Green
Write-Host "📝 Please review changes and test in both light and dark modes" -ForegroundColor Cyan

