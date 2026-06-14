import { test } from "@playwright/test";
import { Editor } from "../components/Editor";
import { validSchema } from "../data/schemas/sample.schema";
import fs from "fs/promises";
import path from "path";


test.describe("Editor", () => {
    let editor: Editor;

    test.beforeEach(async ({ page }) => {
        editor = new Editor(page);
        await editor.open();
    });

    test("user can paste a schema in editor", async ({ }) => {
        await editor.pasteSchema(JSON.stringify(validSchema));
        await editor.verifyUpload(new RegExp("\\S+"));
    });

    test("user can upload a schema in editor using upload button", async ({ }) => {
        const absoluteFilePath = path.resolve(import.meta.dirname, "../data/schemas/sample.schema.json");

        await editor.uploadSchemaFile(absoluteFilePath);

        const expectedContent = await fs.readFile(absoluteFilePath, 'utf-8');
        await editor.verifyUpload(expectedContent);
    });
});