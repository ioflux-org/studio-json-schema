---
"json-schema-studio": patch
---

Improve error message readability in validation panel with better contrast, text wrapping, and VS Code-style scrolling

- Enhance error text color contrast (dark mode: red-300, light mode: red-600)
- Add proper text wrapping with break-words class for long error messages
- Implement VS Code-style custom scrollbar with webkit and Firefox support
- Add scrollable validation panel with min-height (60px) and max-height (200px)
- Increase padding and line-height for better readability
- Add visual resize handle indicator on hover
- Include smooth transitions for better UX

Fixes #291
