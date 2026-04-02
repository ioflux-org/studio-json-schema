---
"json-schema-studio": minor
---

Responsive vertical layout for mobile with the editor panel stacking below the visualization. Toggle button uses vertical chevrons centered on the resize handle, with a 48px touch target meeting WCAG, Apple HIG, and Android Material guidelines. A full-height expand button overlay appears when the editor is collapsed. Fixed the validation status bar expanding to fill half the editor height. Replaced h-screen with 100dvh to fit within mobile browser dynamic toolbars. Added role="status" and aria-live="polite" to the validation bar, a visually hidden label for the format select, and viewport-fit=cover for iOS safe area support
