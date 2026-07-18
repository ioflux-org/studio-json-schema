import { Page } from "@playwright/test";
import path from "path";

export class EditorControls {
    constructor(private page: Page) { }

    private get inputFileElement() {
        return this.page.locator('input[type="file"]');
    }

    async uploadFile(relativeFilePath: string) {
        const absolutePath = path.resolve(import.meta.dirname, relativeFilePath);

        await this.inputFileElement.setInputFiles(absolutePath);
    }
}
