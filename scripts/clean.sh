#!/bin/bash

# Clean Development Environment Script
# Usage: ./scripts/clean.sh

echo "🧹 Cleaning development environment..."

# Clear all caches
echo "🗑️ Clearing Next.js cache..."
rm -rf .next

echo "🗑️ Clearing Turbo cache..."
rm -rf .turbo

echo "🗑️ Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "🗑️ Clearing Webpack cache..."
rm -rf .swc

echo "🗑️ Clearing temporary files..."
rm -rf *.log
rm -rf *.tmp

echo "🗑️ Clearing Prisma generated files..."
rm -rf node_modules/.prisma
rm -rf prisma/generated

echo "🔄 Regenerating Prisma client..."
npx prisma generate

echo "✅ Clean complete! Ready for fresh start."
echo "🚀 Run: npm run dev"