# 📤 FluxAO zu GitHub hochladen

## Option 1: GitHub Website (Einfach)
1. Gehe zu https://github.com/squidi0n/fluxao
2. Klicke "uploading an existing file" 
3. Drag & Drop alle Ordner (app/, components/, lib/, etc.)
4. "Commit changes" klicken

## Option 2: Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)"
3. Repo permissions aktivieren
4. Token kopieren
5. `git remote set-url origin https://TOKEN@github.com/squidi0n/fluxao.git`
6. `git push -u origin main`

## Option 3: GitHub Desktop
1. GitHub Desktop installieren
2. Repository klonen  
3. Dateien kopieren
4. Commit & Push

## ✅ Nach Upload:
FluxAO ist auf GitHub → Weiter zu Vercel Deployment!