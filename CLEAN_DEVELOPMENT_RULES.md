# 🧹 CLEAN DEVELOPMENT RULES

## 🚫 NIEMALS MACHEN:

1. **KEINE Mock-Daten erstellen** - Echte Daten oder gar nichts
2. **KEINE Test-User** - Nur echte Accounts (adam.freundt@gmail.com)
3. **KEINE Seed-Scripts ausführen** - Datenbank clean halten
4. **KEINE mehreren Auth-Systeme** - Nur NextAuth
5. **KEINE experimentellen Features** - Nur bewährte Lösungen

## ✅ IMMER MACHEN:

### Vor jeder Änderung:
```bash
# Backup erstellen
cd /mnt/h && tar -czf "flux_backup/flux_BEFORE_[FEATURE]_$(date +%Y%m%d_%H%M%S).tar.gz" --exclude='node_modules' --exclude='.next' --exclude='.turbo' flux
```

### Nach jeder Änderung:
```bash
# Cache leeren
rm -rf .next .turbo node_modules/.cache

# Neustart
npm run dev
```

### Bei Problemen:
```bash
# 1. STOP - Backup wiederherstellen statt reparieren
# 2. Letztes funktionierendes Backup verwenden
# 3. Änderung sauber neu implementieren
```

## 📁 SAUBERE STRUKTUR:

### Working Directory: `/mnt/h/flux/`
- Haupt-Entwicklungsordner
- Immer sauber halten
- Alle Änderungen hier

### Backup Directory: `/mnt/h/flux_backup/`
- Automatische Backups vor Änderungen
- Naming: `flux_[PURPOSE]_YYYYMMDD_HHMMSS.tar.gz`
- Nur funktionierende Stände

## 🔄 WORKFLOW:

1. **Feature planen** → Backup erstellen
2. **Feature implementieren** → Testen  
3. **Funktioniert?** → Backup erstellen
4. **Funktioniert nicht?** → Backup wiederherstellen

## 🎯 CORE PRINCIPLES:

- **Ein Admin** - Nur adam.freundt@gmail.com
- **Ein Auth-System** - Nur NextAuth/Google OAuth
- **Eine Datenbank** - SQLite, keine Seeds
- **Ein Port** - Was das Script automatisch findet
- **Ein Arbeitsverzeichnis** - H:\flux\

## 🚨 BEI PROBLEMEN:

**NICHT** stundenlang debuggen!
**SOFORT** letztes Backup wiederherstellen:

```bash
cd /mnt/h
rm -rf flux
tar -xzf flux_backup/[LETZTES_BACKUP].tar.gz
cd flux && npm install && npm run dev
```

**ZEIT ist wichtiger als perfekte Fixes!**