#!/usr/bin/env bash
# One-time fix: the frontend has several files with a hardcoded
# `http://localhost:8000` API URL, which breaks once the app is
# behind nginx on a VPS. This swaps them to read from the
# VITE_API_URL build-time env var (falling back to localhost:8000
# for local `npm run dev`), matching the docker-compose/Dockerfile
# setup which passes VITE_API_URL="" so calls go through nginx.
#
# Run once from the project root: bash scripts/fix-api-urls.sh
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=(
  src/services/contactApi.ts
  src/components/Marquee.tsx
  src/pages/ProductCart.tsx
  src/pages/Admin/AdminPhotos.tsx
  src/pages/Admin/AdminDashboard.tsx
  src/pages/Admin/AdminContact.tsx
  src/pages/Admin/AdminLayout.tsx
  src/pages/Admin/AdminUsers.tsx
  src/pages/Admin/AdminProducts.tsx
  src/pages/UserRegister.tsx
  src/pages/Contact.tsx
  src/pages/Products.tsx
)

for f in "${FILES[@]}"; do
  sed -i -E "s#const API_BASE_URL =  ?'http://localhost:8000';#const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';#" "$f"
done

sed -i -E "s#apiBaseUrl = 'http://localhost:8000',#apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000',#" src/components/OurBrands.tsx

echo "Done. Remaining raw 'localhost:8000' matches should only be the fallback default:"
grep -rn "localhost:8000" src/
