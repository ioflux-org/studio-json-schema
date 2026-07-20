# FAQ & Known Issues

## Does it support older JSON Schema drafts?

Currently, only the latest dialect (2020-12) is supported for visualization.

## Is search implemented?

The search feature is visible in the UI but not yet implemented for schema search. (The search box in this documentation site is a separate, working feature powered by VitePress.)

## Node handles look misaligned after editing

When editing a schema in real time, node handles may appear misaligned. **Workaround:** refresh the page after editing to restore correct handle positions.

## `$defs` referencing later `$defs`

If a `$defs` subschema references another `$defs` subschema defined later in the schema, the source/target handles will swap, and the title of the referencing node may be clipped.

---

Found something else? [Open an issue](https://github.com/ioflux-org/studio-json-schema/issues).