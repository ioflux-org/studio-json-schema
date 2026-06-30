---
"json-schema-studio": patch
---

Fix: Handle multi-type schemas in node type inference

Multi-type schemas (like `["string", "null"]`) were previously failing type inference and falling back to a default "others" node style. The type inference logic has been updated to pick the first non-null type from the array to determine the node's visual style.
