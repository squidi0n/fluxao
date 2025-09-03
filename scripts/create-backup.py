#!/usr/bin/env python3
"""
Backup Script für FluxAO
Erstellt einen Backup-ZIP der wichtigsten Projektdateien
"""

import os
import sys
import zipfile
from datetime import datetime
from pathlib import Path
import shutil

# UTF-8 für Windows Console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def create_backup():
    """Erstellt ein Backup des FluxAO Projekts"""
    
    # Basis-Pfade
    project_root = Path("F:/projekte/flux2/fluxao")
    backup_dir = project_root / "backups"
    
    # Erstelle Backup-Verzeichnis falls nicht vorhanden
    backup_dir.mkdir(exist_ok=True)
    
    # Generiere Backup-Dateiname mit Timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_filename = f"fluxao_{timestamp}.zip"
    backup_path = backup_dir / backup_filename
    
    # Zu sichernde Verzeichnisse und Dateien
    include_patterns = [
        "app/",
        "components/",
        "lib/",
        "prisma/",
        "public/",
        "contexts/",
        "hooks/",
        "providers/",
        "scripts/",
        "types/",
        "auth.ts",
        "auth.config.ts",
        "middleware.ts",
        "next.config.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
        "tailwind.config.ts",
        ".env.local",
        "CLAUDE.md"
    ]
    
    # Ausgeschlossene Muster
    exclude_patterns = [
        "__pycache__",
        ".next",
        "node_modules",
        ".git",
        "*.log",
        ".DS_Store",
        "Thumbs.db",
        "*.pyc",
        "*.pyo",
        "*.swp",
        "*.swo",
        "prisma/dev.db",
        "prisma/dev.db-journal"
    ]
    
    print(f"🔄 Erstelle Backup: {backup_filename}")
    print(f"📁 Backup-Verzeichnis: {backup_dir}")
    
    # Erstelle ZIP-Archiv
    with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        files_count = 0
        
        for pattern in include_patterns:
            source_path = project_root / pattern
            
            if source_path.is_file():
                # Einzelne Datei
                if not any(excl in str(source_path) for excl in exclude_patterns):
                    arcname = str(source_path.relative_to(project_root))
                    zipf.write(source_path, arcname)
                    files_count += 1
                    print(f"  ✓ {arcname}")
                    
            elif source_path.is_dir():
                # Verzeichnis
                for file_path in source_path.rglob("*"):
                    if file_path.is_file():
                        # Prüfe ob ausgeschlossen
                        if not any(excl in str(file_path) for excl in exclude_patterns):
                            arcname = str(file_path.relative_to(project_root))
                            zipf.write(file_path, arcname)
                            files_count += 1
                            if files_count % 50 == 0:
                                print(f"  ... {files_count} Dateien hinzugefügt")
    
    # Berechne Größe
    size_mb = backup_path.stat().st_size / (1024 * 1024)
    
    print(f"\n✅ Backup erfolgreich erstellt!")
    print(f"📊 Statistiken:")
    print(f"  - Dateiname: {backup_filename}")
    print(f"  - Dateien: {files_count}")
    print(f"  - Größe: {size_mb:.2f} MB")
    print(f"  - Pfad: {backup_path}")
    
    # Alte Backups aufräumen (behalte nur die letzten 10)
    backups = sorted(backup_dir.glob("fluxao_*.zip"))
    if len(backups) > 10:
        for old_backup in backups[:-10]:
            old_backup.unlink()
            print(f"  🗑️ Altes Backup gelöscht: {old_backup.name}")
    
    return backup_path

if __name__ == "__main__":
    try:
        backup_path = create_backup()
        print(f"\n🎉 Backup komplett: {backup_path.name}")
    except Exception as e:
        print(f"\n❌ Fehler beim Erstellen des Backups: {e}")
        exit(1)