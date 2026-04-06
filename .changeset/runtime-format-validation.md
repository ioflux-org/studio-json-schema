---
"json-schema-studio": patch
---

Add runtime validation for saved editor format value. The app now validates that sessionStorage format is either "json" or "yaml", auto-resets to "json" if invalid, and shows a one-time warning banner to inform the user.
