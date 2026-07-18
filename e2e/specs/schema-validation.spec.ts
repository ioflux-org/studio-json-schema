import { test } from "@playwright/test";
import { Editor } from "../components/Editor";
import { ValidationStatus } from "../components/ValidationStatus";
import { invalidSchema, validSchema, validSchemaWioutDialect } from "../data/schemas/sample.schema";

test.describe("Validation Status", () => {

    let editor: Editor;
    let validationStatus: ValidationStatus;

    test.beforeEach(async ({ page }) => {
        editor = new Editor(page);
        validationStatus = new ValidationStatus(page);
        await editor.open();
    });

    test("should display success message when schema is valid", async ({ }) => {
        await editor.pasteSchema(JSON.stringify(validSchema));

        await validationStatus.verifySchema(["✓ Valid JSON Schema"]);
    })

    test("should display error message when schema is invalid", async ({ }) => {
        await editor.pasteSchema(JSON.stringify(invalidSchema));

        await validationStatus.verifySchema(["✗ Invalid Schema"]);
    })

    test("should display warning message when schema is valid but doesn't contain a dialect", async ({ }) => {
        await editor.pasteSchema(JSON.stringify(validSchemaWioutDialect));

        await validationStatus.verifySchema(["⚠ Schema dialect not provided"]);
    })

    test("should display error message when the JSON is invalid", async ({ }) => {
        await editor.pasteSchema("invalid JSON");

        await validationStatus.verifySchema(["✗", "not valid JSON"]);
    })
});
