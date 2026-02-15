<p align="center">
  <img src="./public/logo-light.svg#gh-light-mode-only" alt="JSON Schema Studio logo">
  <img src="./public/logo-dark.svg#gh-dark-mode-only" alt="JSON Schema Studio logo">
</p>

# JSON Schema Studio

A visual, interactive, graph-based tool to explore, debug, and understand complex JSON Schemas.

**JSON Schema Studio** is a browser-based tool that converts JSON Schema into an interactive node graph. It helps developers understand deeply nested schemas, `$ref` chains, reusable `$defs`, and circular references
without manually tracing large JSON Schema files.

---

## Table of Contents

- [Why JSON Schema Studio?](#why-json-schema-studio)
- [Features](#features)
- [Demo](#demo)
  - [Example JSON Schema](#example-json-schema)
- [Understanding the Visualization](#understanding-the-visualization)
  - [Node colors & schema types](#node-colors--schema-types)
  - [Keywords](#keywords)
  - [Edges](#edges)
  - [reusable schemas (`$defs`)](#reusable-schemas-defs)
  - [Boolean schemas](#boolean-schemas)
  - [Controls](#controls)
- [How It Works](#how-it-works)
- [Current Limitations / Known Issues](#current-limitations--known-issues)
- [Run locally](#run-locally)
  - [Using Docker (recommended)](#using-docker-recommended)
  - [Running directly (without Docker)](#running-directly-without-docker)
- [Tech Stack](#tech-stack)
- [Future Enhancements / Roadmap](#future-enhancements--roadmap)
- [Contributing](#contributing)
  - [Getting started](#getting-started)
- [Additional Notes](#additional-notes)

---

## Why JSON Schema Studio?

JSON Schemas become difficult to reason about as they grow:

- Deeply nested objects
- Heavy usage of [`$ref`](https://www.learnjsonschema.com/2020-12/core/ref)
- Circular references
- Unclear relationships between subschemas

**JSON Schema Studio** converts schemas into an interactive graph so you can **see structure, references, and relationships** instantly, instead of mentally parsing large JSON Schema files.

---

## Features

- Interactive graph-based visualization of JSON Schema
- `$ref` resolution (local & external)
- Circular reference handling
- Clear node & edge representation for schema entities
- Light & dark theme support
- Runs fully in your browser -- all data stays on your device

---

## Demo

### Example JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/user-profile",
  "description": "A JSON Schema describing a person",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 50
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "address": {
      "$ref": "#/$defs/address"
    },
    "hobbies": {
      "type": "array",
      "minItems": 0,
      "maxItems": 5
    },
    "maritalStatus": {
      "oneOf": [{ "const": "single" }, { "const": "married" }]
    },
    "isEmployed": {
      "type": "boolean"
    }
  },
  "additionalProperties": true,
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "city": {
          "type": "string"
        },
        "zip": {
          "description": "six digit zip code",
          "type": "number"
        },
        "additionalProperties": false
      },
      "required": ["city", "zip"]
    }
  }
}
```

![Visualization for the above JSON Schema](./public/example-visualization.png)
_This diagram shows the structure of the "Example JSON Schema" above._

---

## Understanding the Visualization

> [!NOTE]
> The visualization is presented as a graph where **nodes** represent JSON Schemas or subschemas, and **edges** represent the relationships between them.

### Node colors & schema types

- Each schema/subschema that is rendered as a node is assigned a distinct color based on its `type`.
- If a schema/subschema explicitly defines a `type`, the node's color directly reflects that type.
- For schemas/subschemas without an explicit `type` keyword, the tool infers the type from related keywords. The node color is then assigned based on this inference.
  - In most cases, inference is correct.
  - If multiple instance types are defined (e.g., `type: ["string", "number"]`), there is currently no dedicated color. In such cases, the node color is determined based on **type inference**, following this priority order: `object > array > string > number`.
  - If inference fails entirely, a **soft gray** color is applied to the corresponding node as a fallback.
- Refer to the image below for node color references:  
  <img src="./public/node-colors.svg" alt="JSON Schema Studio logo">

### Keywords

- Keywords displayed inside a node represent how that schema defines the instance.
- If a keyword's value is itself a subschema, a new node is created.

### Edges

- Each child node is connected to its parent via a directed edge.
- Edges originate from the left side of the parent node, vertically aligned with the specific schema keyword they represent (for example: `properties`, `items`, `allOf`, etc.).
- On hover, the corresponding edge is highlighted and an animated flow is rendered:
  - the animation starts from the edge's source handle (keyword-aligned origin)
    and runs toward the connected child node, visually indicating direction.
- On click, the highlighted state is persisted:
  - the animation remains active even after hover ends.
- Multiple edges can be selected and highlighted simultaneously.

⚠️ There is a known issue with precise source-handle positioning (the exact point from which an edge originates) (see _Current Limitations / Known Issues_).

### Reusable schemas (`$defs`)

- If a schema contains `$defs`, a special "definitions" container node is created.
- This node:
  - Does not represent a schema itself
  - Groups all reusable subschemas
  - Connects to the parent schema from the bottom
- This design intentionally separates regular subschemas from **reusable definitions**.

### Boolean schemas

- Boolean schemas are visually distinct:
  - `true` --> green node
  - `false` --> red node
- Unlike _object schema_ nodes, _boolean schema_ colors are applied to the **entire node**, not just the title.
- Boolean nodes have more rounded borders to clearly differentiate them.

Design improvements are welcome :)

### Controls

- Zoom, fit-view, and other graph controls are available in the bottom-left corner of the visualization.

---

## How It Works

- The input JSON Schema is parsed into an **AST** (Abstract Syntax Tree) using [Hyperjump JSON Schema](https://github.com/hyperjump-io/json-schema). This AST represents the full structure of the schema.  
  _All `$ref` references, both local and external, are automatically resolved by Hyperjump, so the AST includes fully expanded schemas as part of its structure_
- The resolved AST is transformed into graph **nodes** and **edges**, where each node represents a schema or subschema, and edges represent relationships between parent and child nodes.
- These nodes and edges are rendered as an interactive graph using [React Flow](https://reactflow.dev), allowing users to explore and understand the schema visually.

---

## Current Limitations / Known Issues

- Currently, it only supports visualization for the latest dialect (2020-12).
- The **search** feature is visible in the UI but not yet implemented.
- When editing a schema in real time, the node handles may appear misaligned.  
  **Workaround**: Refresh the page after editing to restore correct handle positions.
- If a `$defs` subschema references another `$defs` subschema defined later in the schema, the source/target handles will swap, and the title of the referencing node will be clipped.

These issues will be addressed as time permits. If you encounter any other problems or have suggestions, please consider opening an issue to start a discussion.

---

### Getting started

- Fork the repository
 ```bash
    $ git clone https://github.com/ioflux-org/studio-json-schema.git
  ```  
- Create a new branch  
  `$ git checkout -b feature/my-feature`
- Make your changes
- Create a Pull Request
  - After making changes, don't forget to commit with the sign-off flag (-s)
  ```bash
   $ git commit -s -m “commit message”
  ``` 
  - Once all the changes have been commited, push the changes.
  ```bash
    $ git push origin <branch-name>
  ```
    

## Run locally

You can run the application locally either directly or using Docker (recommended for consistent environment).

### Using Docker (recommended)

- Build the Docker image using the `Dockerfile` at the root of the repository:
  ```bash
  docker build --no-cache -t json-schema-studio -f ./Dockerfile .
  ```
- Run the Docker container:
  ```bash
  docker run -p 8080:80 json-schema-studio
  ```
- To run the container in detached mode, use:
  ```
  docker run -d -p 8080:80 json-schema-studio
  ```
- Access the application in your browser at http://localhost:8080.

### Running directly (without Docker)

- Install dependencies:
  ```bash
  npm install
  ```
- Start the development server:
  ```
  npm run dev
  ```
- Open your browser at the URL shown in the terminal (http://localhost:5173).

> [!WARNING]
> Running directly is fine for development, but using Docker ensures a consistent environment across machines.

---

## Tech Stack

- React + Vite
- [Hyperjump JSON Schema](https://github.com/hyperjump-io/json-schema) -- validation & AST generation
- [React Flow](https://reactflow.dev/) -- graph visualization
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) -- in-browser schema editor
- UI inspiration from [JSONCrack](https://github.com/AykutSarac/jsoncrack.com)

---

## Future Enhancements / Roadmap

To make this tool more accessible, intuitive, and developer-friendly, we are planning several future enhancements aimed at helping users understand and build complex JSON Schemas effortlessly.

- [ ] Export the visualization as an image
- [ ] Upload JSON Schema files directly for visualization
- [ ] VS Code extension for in-editor JSON Schema visualization
- [ ] Inline graph editing with bidirectional updates between the graph and the schema
- [ ] No-code JSON Schema generator (longer-term goal)

We'd love to hear from you! If you have ideas, suggestions, or feedback, feel free to open an issue and help shape the future of this project.

---

## Contributing

Contributions are welcome and appreciated

Ways to contribute:

- Report bugs or request features via Issues
- Improve documentation
- Fix bugs or implement new features
- Suggest better visual or UX improvement

### Versioning Rules (Important)

We use the `version` field in `package.json` as the single source of truth for releases. Any PR that introduces **application-level changes** (changes that affect the behavior, UI, or functionality of the app) must bump the version appropriately.

We follow **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

Update the version in `package.json` based on the type of change:

| Change Type        | Version Bump | Example        |
|--------------------|--------------|----------------|
| Bug fix            | PATCH        | 1.2.3 → 1.2.4  |
| New feature        | MINOR        | 1.2.3 → 1.3.0  |
| Breaking change    | MAJOR        | 1.2.3 → 2.0.0  |
| Pre-release build  | Prerelease   | 1.2.3 → 1.2.4-beta |

### When you do NOT need to bump the version

Do **not** bump the version if your PR only changes:

- `.github/**`
- Markdown files (`*.md`)

These PRs are treated as non-release changes and will not trigger deployments or releases.

### Enforcement
>
> [!IMPORTANT]
> Our CI will block PRs if:
>
> - Application code is changed but `package.json` version is not bumped
> - The version format is invalid
> - The version already exists as a Git tag
>
> This ensures every release is clean, predictable, and traceable.



---

## Additional Notes

> [!TIP]
> The application supports both **light** and **dark** themes. For the best visual experience -- we recommend using the **dark theme**.

> [!IMPORTANT]
> All data processing occurs **locally on your device.** No data is sent to or processed on external servers.
