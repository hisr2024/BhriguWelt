#!/bin/bash
# Script to fix React hook dependency warnings in prediction pages

echo "🔧 Fixing React hook dependencies in prediction pages..."

# Array of files with the loadProfile pattern
FILES=(
  "app/bhrigu-predictions/past-lives/page.tsx"
  "app/bhrigu-predictions/karmic-journey/page.tsx"
  "app/bhrigu-predictions/karmic-remedies/page.tsx"
  "app/bhrigu-predictions/life-events/page.tsx"
  "app/bhrigu-predictions/predictions/page.tsx"
  "app/bhrigu-predictions/present-life/page.tsx"
  "app/bhrigu-predictions/relationships/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Check if file already has useCallback import
    if ! grep -q "useCallback" "$file"; then
      # Add useCallback to imports
      sed -i "s/import { useState, useEffect }/import { useState, useEffect, useCallback }/" "$file"
    fi

    # Create a temp file for the transformation
    awk '
    /useEffect\(\(\) => \{/ {
      in_useeffect = 1
      useeffect_start = NR
    }
    /const loadProfile = async \(\) => \{/ {
      in_loadprofile = 1
      loadprofile_start = NR
      print "  const loadProfile = useCallback(async () => {"
      next
    }
    in_loadprofile && /^  \};$/ {
      print "  }, [getAllProfiles]);"
      print ""
      in_loadprofile = 0
      next
    }
    in_useeffect && /^  \}, \[\]\);$/ {
      print "  }, [loadProfile]);"
      in_useeffect = 0
      next
    }
    !in_loadprofile || (in_loadprofile && NR > loadprofile_start) { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"

    echo "✅ Fixed: $file"
  fi
done

echo "✅ All prediction pages fixed!"
