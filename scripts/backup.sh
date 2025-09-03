#!/bin/bash

# Automatic Backup Script for FluxAO
# Usage: ./scripts/backup.sh [description]

DESCRIPTION=${1:-"AUTO"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="flux_${DESCRIPTION}_${TIMESTAMP}.tar.gz"
BACKUP_PATH="/mnt/h/flux_backup/${BACKUP_NAME}"

echo "🗄️ Creating backup: ${BACKUP_NAME}"

cd /mnt/h

tar -czf "${BACKUP_PATH}" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.turbo' \
  --exclude='*.log' \
  --exclude='.git' \
  flux

if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully!"
  echo "📁 Location: ${BACKUP_PATH}"
  
  # Show backup size
  SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
  echo "📊 Size: ${SIZE}"
  
  # List recent backups
  echo ""
  echo "📋 Recent backups:"
  ls -lt /mnt/h/flux_backup/*.tar.gz | head -5 | while read line; do
    echo "   $line"
  done
else
  echo "❌ Backup failed!"
  exit 1
fi