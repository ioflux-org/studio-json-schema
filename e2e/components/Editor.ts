import { Page, expect } from "@playwright/test";
import { EditorControls } from "./EditorControls";

export class Editor {
    constructor(private page: Page) { }

    private get editorBox() {
        return this.page.locator(".monaco-editor");
    }

    private get divCollections() {
        return this.page.locator(".view-lines.monaco-mouse-cursor-text");
    }

    async open() {
        await this.page.goto("/");
        await expect(this.editorBox).toBeAttached({ timeout: 20000 })
    }

    async pasteSchema(schemaText: string) {
        await this.page.evaluate((text) => {
            if (!window.monaco || !window.monaco.editor) {
                throw new Error("Monaco editor is not initialized on the window object yet.");
            }

            const models = window.monaco.editor.getModels();
            if (!models || models.length === 0) {
                throw new Error("No active Monaco editor models found to set schema.");
            }

            models[0].setValue(text);
        }, schemaText);
    }

    async verifyUpload(text: string | RegExp) {
        await expect(this.divCollections).toHaveText(text);
    }

    async uploadSchemaFile(relativeFilePath: string) {
        const editorConstrols = new EditorControls(this.page);
        editorConstrols.uploadFile(relativeFilePath);
    }
}