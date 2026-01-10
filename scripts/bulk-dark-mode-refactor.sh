#!/bin/bash
# Bulk dark mode refactoring script for remaining files
# Run from project root: bash scripts/bulk-dark-mode-refactor.sh

echo "🌓 Starting bulk dark mode refactoring..."

# Define file patterns to refactor
FILES=(
  "components/coach/ProductList.tsx"
  "components/coach/RevenueDashboard.tsx"
  "components/coach/CoachAppointmentList.tsx"
  "components/coach/AddPriceModal.tsx"
  "components/coach/CreateProductModal.tsx"
  "components/coach/CreateContentModal.tsx"
  "components/coach/ContentList.tsx"
  "components/admin/UserSearch.tsx"
  "components/admin/GrantEntitlementModal.tsx"
  "components/settings/SettingsForm.tsx"
  "app/admin/page.tsx"
  "app/admin/users/page.tsx"
  "app/admin/stripe-events/page.tsx"
  "app/settings/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Refactoring $file..."
    
    # Backgrounds
    sed -i 's/bg-white/bg-card/g' "$file"
    sed -i 's/bg-gray-50/bg-background/g' "$file"
    sed -i 's/bg-gray-100/bg-muted/g' "$file"
    
    # Text colors
    sed -i 's/text-gray-900/text-foreground/g' "$file"
    sed -i 's/text-gray-800/text-foreground/g' "$file"
    sed -i 's/text-gray-700/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-600/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-500/text-muted-foreground/g' "$file"
    sed -i 's/text-gray-400/text-muted-foreground/g' "$file"
    
    # Borders
    sed -i 's/border-gray-200/border-border/g' "$file"
    sed -i 's/border-gray-300/border-input/g' "$file"
    
    # Primary (blue) colors
    sed -i 's/bg-blue-600/bg-primary/g' "$file"
    sed -i 's/text-blue-600/text-primary/g' "$file"
    sed -i 's/bg-blue-50/bg-primary\/10/g' "$file"
    sed -i 's/text-blue-900/text-primary/g' "$file"
    sed -i 's/text-blue-800/text-muted-foreground/g' "$file"
    sed -i 's/text-blue-700/text-muted-foreground/g' "$file"
    sed -i 's/border-blue-300/border-primary/g' "$file"
    sed -i 's/border-blue-200/border-primary/g' "$file"
    sed -i 's/hover:bg-blue-700/hover:bg-primary\/90/g' "$file"
    sed -i 's/hover:bg-blue-100/hover:bg-primary\/20/g' "$file"
    sed -i 's/hover:text-blue-500/hover:text-primary\/90/g' "$file"
    sed -i 's/hover:border-blue-500/hover:border-primary/g' "$file"
    
    # Secondary/accent colors (purple, green)
    sed -i 's/bg-purple-100/bg-secondary/g' "$file"
    sed -i 's/text-purple-800/text-secondary-foreground/g' "$file"
    sed -i 's/bg-green-100/bg-accent/g' "$file"
    sed -i 's/text-green-800/text-accent-foreground/g' "$file"
    
    # Destructive (red) colors
    sed -i 's/bg-red-50/bg-destructive\/10/g' "$file"
    sed -i 's/text-red-800/text-destructive/g' "$file"
    sed -i 's/text-red-600/text-destructive/g' "$file"
    sed -i 's/border-red-200/border-destructive/g' "$file"
    sed -i 's/bg-red-600/bg-destructive/g' "$file"
    
    # Warning/yellow colors
    sed -i 's/bg-yellow-50/bg-accent/g' "$file"
    sed -i 's/text-yellow-800/text-accent-foreground/g' "$file"
    sed -i 's/border-yellow-200/border-accent/g' "$file"
    
    # Placeholders
    sed -i 's/placeholder-gray-500/placeholder:text-muted-foreground/g' "$file"
    
    # Hover states
    sed -i 's/hover:bg-gray-50/hover:bg-accent/g' "$file"
    sed -i 's/hover:bg-gray-100/hover:bg-accent/g' "$file"
    sed -i 's/hover:text-gray-900/hover:text-foreground/g' "$file"
    
    # Focus rings
    sed -i 's/focus:ring-blue-500/focus:ring-ring/g' "$file"
    sed -i 's/focus:border-blue-500/focus:border-ring/g' "$file"
    
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✅ Bulk refactoring complete!"
echo "📝 Please review changes and test in both light and dark modes"

