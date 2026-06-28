# json-schema-studio

## 0.9.0

### Minor Changes

- 0e25aed: Implement `dependentSchemas` keyword handler in graph visualization

  Properties with `dependentSchemas` now render as connected child nodes in the graph, making schema dependencies visually explorable.

- 8842bfa: feat: add ability to export schema visualization graph as an image
- 7a12315: Add F key shortcut to toggle fullscreen mode
- 107f64d: feat: add file upload and global drag-and-drop support for JSON/YAML schemas
- 3171fc3: Adding e2e test cases

### Patch Changes

- c50dde7: Fix graph node alignment issue when modifying schema in real time
- 37d06bb: Fix the yaml selected node higlighter in the monaco editor

## 0.8.0

### Minor Changes

- c9b96a2: Responsive vertical layout for mobile with the editor panel stacking below the visualization. Toggle button uses vertical chevrons centered on the resize handle, with a 48px touch target meeting WCAG, Apple HIG, and Android Material guidelines. A full-height expand button overlay appears when the editor is collapsed. Fixed the validation status bar expanding to fill half the editor height. Replaced h-screen with 100dvh to fit within mobile browser dynamic toolbars. Added role="status" and aria-live="polite" to the validation bar, a visually hidden label for the format select, and viewport-fit=cover for iOS safe area support
- 6c83e7e: feat(ci): link deploy-preview workflow status to corresponding PR
- 5bade0a: update the index file
- a173afb: Add unified search bar that highlights matching graph nodes and corresponding editor code

### Patch Changes

- 9d80d54: chore: add static configuration for CodeRabbit AI
- 05ca649: feat: group minor and patch Dependabot updates to reduce PR noise

## 0.7.0

### Minor Changes

- 1f46606: Added changeset bot

### Patch Changes

- 6207986: fix: prevent keyboard auto-opening on node selection in mobile
- 0e8a67a: Fix incorrect Dark Mode Tooltip Behavior
- 900e962: Fix incorrect header label on $ref target nodes in the graph view
- 2253d53: Update CI workflows for better version handling
- 24e6b85: Fix graph zoom reset when editor panel is resized
