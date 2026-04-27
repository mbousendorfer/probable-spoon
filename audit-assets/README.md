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

## Régénérer en SVG (fallback si MCP Figma write indisponible)

```bash
npx -y @mermaid-js/mermaid-cli -i 01-global-navigation.mmd -o 01-global-navigation.svg
```

## Code couleur

- 🟢 vert : `✓ ok`
- 🔴 rouge : `⚠ broken` / `✗ no handler`
- 🟡 jaune : `🚧 placeholder`
- ⚪ gris dashed : `orphan`
- 🟣 magenta : `deadend`
