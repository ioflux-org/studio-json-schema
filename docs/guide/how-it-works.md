# How It Works

1. The input JSON Schema is parsed into an AST (Abstract Syntax Tree) using [Hyperjump JSON Schema](https://github.com/hyperjump-io/json-schema). This AST represents the full structure of the schema.
2. All `$ref` references, both local and external, are automatically resolved by Hyperjump, so the AST includes fully expanded schemas as part of its structure.
3. The resolved AST is transformed into graph nodes and edges, where each node represents a schema or subschema, and edges represent relationships between parent and child nodes.
4. These nodes and edges are rendered as an interactive graph using React Flow, allowing users to explore and understand the schema visually.