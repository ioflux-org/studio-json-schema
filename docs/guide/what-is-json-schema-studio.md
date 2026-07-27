# What is JSON Schema Studio?

JSON Schema Studio is a browser-based tool that converts JSON Schema into an interactive node graph. It helps developers understand deeply nested schemas, `$ref` chains, reusable `$defs`, and circular references without manually tracing large JSON Schema files.

## Features

- Interactive graph-based visualization of JSON Schema
- `$ref` resolution (local & external)
- Circular reference handling
- Clear node & edge representation for schema entities
- Light & dark theme support
- Runs fully in your browser — all data stays on your device

## Example JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/user-profile",
  "description": "A JSON Schema describing a person",
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 2, "maxLength": 50 },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "address": { "$ref": "#/$defs/address" },
    "hobbies": { "type": "array", "minItems": 0, "maxItems": 5 },
    "maritalStatus": { "oneOf": [{ "const": "single" }, { "const": "married" }] },
    "isEmployed": { "type": "boolean" }
  },
  "additionalProperties": true,
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "zip": { "description": "six digit zip code", "type": "number" }
      },
      "additionalProperties": false,
      "required": ["city", "zip"]
    }
  }
}
```

See [Understanding the Visualization](/guide/visualization) for how this schema is rendered as a graph.