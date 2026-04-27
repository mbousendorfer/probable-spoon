# Audit assets

Sources Mermaid des diagrammes du `FLOW-AUDIT.md`. Versionnés pour permettre la régénération de la cartographie Figma (node `223-2046` du fichier Archie) après les fixes de phase 2 sans repartir de zéro.

| Fichier                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `01-global-navigation.mmd` | Vue d'ensemble : toutes les surfaces et leurs transitions       |
| `02-add-source-flow.mmd`   | Détail du flow Add source (3 paths : Upload / URL / Connectors) |
| `03-draft-post-flow.mmd`   | Draft post depuis idea card (avec et sans channel picker)       |
| `04-analyse-pipeline.mmd`  | Pipeline Hub → Voice → Brief → Brand → Summary, avec findings   |
| `05-stores-fanout.mmd`     | Stores producers/consumers + fan-out cross-store                |
| `06-connector-desync.mmd`  | Mini-diagramme du doublon FIND-01 (connector state)             |

## Statut Figma

Le MCP Figma write (`use_figma`) n'est pas disponible dans cet environnement (vérifié 3× via ToolSearch). **Fallback retenu** : les 6 diagrammes sont rendus en SVG ici (`01-…svg` à `06-…svg`). Drag-droppe-les manuellement dans le node `223-2046` du fichier Figma Archie.

## Régénérer après modifications

```bash
cd audit-assets
for f in 01-global-navigation 02-add-source-flow 03-draft-post-flow 04-analyse-pipeline 05-stores-fanout 06-connector-desync; do
  npx -y -p puppeteer -p @mermaid-js/mermaid-cli mmdc -i "$f.mmd" -o "$f.svg" -b transparent
done
```

(Le `-p puppeteer -p @mermaid-js/mermaid-cli` est nécessaire car mmdc dépend de puppeteer en peer dep — `npx -y @mermaid-js/mermaid-cli` seul échoue avec `ERR_MODULE_NOT_FOUND`.)

## Code couleur

- 🟢 vert : `✓ ok`
- 🔴 rouge : `⚠ broken` / `✗ no handler`
- 🟡 jaune : `🚧 placeholder`
- ⚪ gris dashed : `orphan`
- 🟣 magenta : `deadend`
