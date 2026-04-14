# bigbet-tests

Prototype interactif pour explorer et valider des redesigns de l'interface Agorapulse. Pas de build, pas de framework — juste des fichiers statiques servis localement.

## Stack

- HTML/CSS/JS vanilla (ES modules)
- Icones : sprite SVG inline (`#icons-sprite`) + convention `icon-[name]` du Design System Agorapulse
- Tokens : variables CSS alignées sur l'Agorapulse DS v2
- Composants React (library) : transpilés via Babel standalone, montés dans la page

## Lancer le projet

```bash
python3 -m http.server 8000
```

Puis ouvrir [http://localhost:8000](http://localhost:8000).

> Avec Claude Code, le serveur se lance automatiquement via la config `.claude/launch.json`.

## Structure

```
index.html             # App principale (markup, CSS, sprite SVG)
src/
  app.js               # Logique principale, rendu des vues
  store.js             # État global, sélecteurs
  mock-generators.js   # Données de démo
  components/          # Composants React (Library)
  styles/              # Tokens CSS supplémentaires
icons-sprite.svg       # Sprite SVG de référence (non injecté, source)
```

## Périmètre couvert

- **Library** — sources, idées extraites, filtres, tri
- **Posts** — drafts, revue, actions (éditer, planifier, dupliquer, supprimer)
- **Prévisualisations sociales** — LinkedIn, X/Twitter, Facebook, Instagram
- **Assistant** — fil de conversation, suggestions, pièces jointes
