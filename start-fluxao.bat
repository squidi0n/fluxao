@echo off
REM FluxAO Auto-Start für Windows

echo 🚀 FluxAO wird gestartet...

REM Navigate to project directory
cd /d H:\flux

REM Kill existing processes
taskkill /f /im node.exe 2>nul

REM Start FluxAO with auto-backup
echo 🔄 Auto-Backup + Development Server starten...
start "FluxAO" npm run dev:backup

echo ✅ FluxAO läuft im Hintergrund
echo 🌐 URL: http://localhost:3000
echo 🛑 Zum Stoppen: Strg+C im FluxAO-Fenster

pause