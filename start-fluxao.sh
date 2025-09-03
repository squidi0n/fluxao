#!/bin/bash
# FluxAO Auto-Start Script

echo "🚀 FluxAO wird gestartet..."

# Kill existing processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "auto-backup" 2>/dev/null || true

# Navigate to project directory
cd /mnt/h/flux

# Start development server with auto-backup
echo "🔄 Auto-Backup + Development Server starten..."
nohup npm run dev:backup > fluxao.log 2>&1 &

# Get process ID for later reference
echo $! > fluxao.pid

echo "✅ FluxAO läuft im Hintergrund"
echo "📝 Logs: tail -f /mnt/h/flux/fluxao.log"
echo "🛑 Stoppen: pkill -f 'npm run dev' oder kill $(cat fluxao.pid)"
echo "🌐 URL: http://localhost:3000"

# Show initial logs
sleep 3
echo "📋 Aktuelle Logs:"
tail -n 10 fluxao.log