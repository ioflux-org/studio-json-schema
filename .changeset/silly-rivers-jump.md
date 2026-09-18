---
"json-schema-studio": minor
---

Add an Instance tab to the Monaco editor with a step-through Trace player (Play/Pause, Prev/Next), driven entirely client-side via hyperjump's own evaluation plugin hooks. Each step highlights both the current line in the instance and the corresponding node in the schema graph, color-coded by push/pass/fail. Removes the earlier WASM-based Custom Debugger approach in favor of this, since it required no server endpoint and reuses the same schema URIs the graph already keys its nodes by.
