---
"json-schema-studio": patch
---

Fix Dagre graph singleton accumulating stale nodes across schema changes

The module-level Dagre graph instance was persisting nodes/edges from previous
schema compilations, causing layout corruption when switching between schemas with
different property counts.

- Move Dagre graph instantiation from module scope into getLayoutedElements function
- Create fresh graph instance for each layout calculation
- Prevent stale nodes from previous schemas affecting current layout
- Improves graph rendering stability when working with multiple schemas
