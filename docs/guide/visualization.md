# Understanding the Visualization

The visualization is presented as a graph where nodes represent JSON Schemas or subschemas, and edges represent the relationships between them.

## Node Colors & Schema Types

- Each schema/subschema rendered as a node is assigned a distinct color based on its type.
- If a schema/subschema explicitly defines a `type`, the node's color directly reflects that type.
- For schemas/subschemas without an explicit `type` keyword, the tool infers the type from related keywords, and the node color is assigned based on that inference. In most cases the inference is correct.
- If multiple instance types are defined (e.g. `type: ["string", "number"]`), there's currently no dedicated color — the node color falls back to this priority order: **object > array > string > number**.
- If inference fails entirely, a soft gray color is applied as a fallback.

## Keywords

- Keywords displayed inside a node represent how that schema defines the instance.
- If a keyword's value is itself a subschema, a new node is created.

## Edges

- Each child node is connected to its parent via a directed edge.
- Edges originate from the left side of the parent node, vertically aligned with the specific schema keyword they represent (e.g. `properties`, `items`, `allOf`).
- **On hover**, the corresponding edge is highlighted with an animated flow — the animation starts from the edge's source handle and runs toward the connected child node, indicating direction.
- **On click**, the highlighted state is persisted — the animation remains active even after hover ends, and multiple edges can be selected and highlighted simultaneously.

> ⚠️ There's a known issue with precise source-handle positioning — see [Known Issues](#known-issues) below.

## Reusable Schemas (`$defs`)

If a schema contains `$defs`, a special "definitions" container node is created. This node:

- Does not represent a schema itself
- Groups all reusable subschemas
- Connects to the parent schema from the bottom

This design intentionally separates regular subschemas from reusable definitions.

## Boolean Schemas

Boolean schemas are visually distinct:

- `true` → green node
- `false` → red node

Unlike object schema nodes, boolean schema colors are applied to the entire node, not just the title. Boolean nodes also have more rounded borders to differentiate them clearly.

## How It Works

1. The input JSON Schema is parsed into an AST using [Hyperjump JSON Schema](https://github.com/hyperjump-io/json-schema).
2. All `$ref` references — local and external — are automatically resolved by Hyperjump, so the AST includes fully expanded schemas.
3. The resolved AST is transformed into graph nodes and edges, where each node represents a schema/subschema and edges represent parent-child relationships.
4. Nodes and edges are rendered as an interactive graph using React Flow.

## Known Issues

- Currently, only the latest dialect (2020-12) is supported for visualization.
- The search feature is visible in the UI but not yet implemented.
- When editing a schema in real time, node handles may appear misaligned. **Workaround:** refresh the page after editing to restore correct handle positions.
- If a `$defs` subschema references another `$defs` subschema defined later in the schema, the source/target handles will swap and the referencing node's title may be clipped.

If you encounter other problems or have suggestions, please [open an issue](https://github.com/ioflux-org/studio-json-schema/issues).