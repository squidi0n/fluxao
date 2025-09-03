# 🤖 Claude Entwickler-Guide für FluxAO

## 🧹 CLEAN DEVELOPMENT - WICHTIGSTE REGEL:
**BEVOR ICH IRGENDWAS MACHE:**
```bash
./scripts/backup.sh "BEFORE_[FEATURE_NAME]"
```

**BEI PROBLEMEN - SOFORT BACKUP WIEDERHERSTELLEN:**
```bash
cd /mnt/h && rm -rf flux && tar -xzf flux_backup/[LETZTES_BACKUP].tar.gz
```

**NIEMALS:**
- Mock-Daten erstellen
- Test-User anlegen  
- Seed-Scripts ausführen
- Experimentelle Features
- Mehrere Auth-Systeme

## 🎯 Schnellbefehle für dich:

Sag mir einfach diese Stichworte und ich weiß was zu tun ist:

- **"Status"** → Zeige mir den aktuellen Projektstatus
- **"Fehler"** → Analysiere und behebe alle Fehler
- **"Post erstellen"** → Hilf mir einen neuen Artikel zu schreiben
- **"Deploy"** → Bereite alles für Produktion vor
- **"Backup"** → Sichere die aktuelle Version
- **"Feature: [Name]"** → Implementiere ein neues Feature
- **"Fix: [Problem]"** → Behebe ein spezifisches Problem
- **"Test"** → Führe alle Tests aus
- **"Clean"** → Räume das Projekt auf

## 📁 Wichtige Dateien für Claude:

### Bei Fehlern prüfen:

1. `.env` - Umgebungsvariablen (besonders URLs)
2. `middleware.ts` - Authentifizierungs-Probleme
3. `lib/auth-config.ts` - Login-Probleme
4. `prisma/schema.prisma` - Datenbank-Probleme

### Bei neuen Features:

1. `app/` - Neue Seiten hier
2. `components/` - Wiederverwendbare Komponenten
3. `lib/` - Hilfsfunktionen
4. `api/` - Backend-Endpunkte

## 🔧 Häufige Probleme & Lösungen:

### Problem: "Internal Server Error"

```bash
# Lösung 1: Build-Cache löschen
rm -rf .next
pnpm dev

# Lösung 2: Datenbank neu initialisieren
npx prisma db push
npx prisma db seed
```

### Problem: "Port bereits belegt"

```bash
# Andere Ports verwenden
PORT=3002 pnpm dev
```

### Problem: "Module not found"

```bash
# Dependencies neu installieren
rm -rf node_modules
pnpm install
```

## 🚀 Optimaler Workflow:

### 1. Neues Feature anfragen:

```
"Feature: Dark Mode Toggle in Header"
```

Claude wird:

- ✅ TodoList erstellen
- ✅ Komponente implementieren
- ✅ Testen
- ✅ Commiten

### 2. Fehler beheben:

```
"Fehler: Login funktioniert nicht"
```

Claude wird:

- ✅ Fehler analysieren
- ✅ Logs prüfen
- ✅ Fix implementieren
- ✅ Testen

### 3. Content erstellen:

```
"Post: KI Revolution 2025"
```

Claude wird:

- ✅ SEO-optimierten Artikel erstellen
- ✅ Bilder vorschlagen
- ✅ Tags generieren
- ✅ In Datenbank speichern

## 💡 Pro-Tipps für die Zusammenarbeit:

1. **Sei spezifisch**: "Ändere die Headerfarbe zu Blau" statt "Mach den Header schöner"

2. **Nutze Kontext**: "Wie vorher besprochen..." hilft mir den Zusammenhang zu verstehen

3. **Batch-Requests**: Gib mir mehrere Aufgaben auf einmal:

   ```
   1. Fix den Login-Bug
   2. Füge Social Media Links hinzu
   3. Erstelle eine About-Seite
   ```

4. **Feedback**: Sag mir wenn etwas nicht funktioniert - ich lerne daraus!

## 🎨 UI/UX Präferenzen:

- **Stil**: Modern, clean, minimalistisch
- **Farben**: Primär: Indigo, Sekundär: Purple
- **Schrift**: System fonts (schnelle Ladezeit)
- **Animationen**: Subtle, nicht übertrieben
- **Dark Mode**: Immer unterstützt

## 📊 Performance-Ziele:

- Lighthouse Score: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle Size: < 200KB initial

## 🔐 Sicherheitsregeln:

1. NIEMALS Secrets in Code committen
2. Immer Input validieren
3. SQL Injection über Prisma verhindern
4. XSS durch React automatisch verhindert
5. CSRF-Token verwenden

## 📝 Commit-Nachrichten Format:

```
feat: Neue Feature-Beschreibung
fix: Behobenes Problem
style: UI/CSS Änderungen
docs: Dokumentations-Updates
refactor: Code-Verbesserungen
test: Test-Änderungen
chore: Maintenance
```

## 🎯 Aktuelle Prioritäten:

1. ✅ Basis-Funktionalität läuft
2. 🔄 Content-Erstellung verbessern
3. ⏳ SEO optimieren
4. ⏳ Performance tunen
5. ⏳ Mehr Automatisierung

## 🤝 Kommunikationsregeln:

- **Sprache**: Immer Deutsch
- **Ton**: Freundlich, direkt, lösungsorientiert
- **Updates**: Regelmäßig über Fortschritt informieren
- **Fragen**: Lieber nachfragen als raten

---

💬 **Quick-Chat Beispiele:**

- "Mach die Seite schneller" → Performance-Optimierung
- "Mehr Besucher" → SEO-Verbesserungen
- "Sieht langweilig aus" → UI-Refresh
- "Zu kompliziert" → UX-Vereinfachung

---

📌 **Dieser Guide wird automatisch von Claude gelesen und hilft mir, besser zu helfen!**
