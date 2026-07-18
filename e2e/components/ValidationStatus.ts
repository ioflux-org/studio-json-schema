import { Page, expect } from "@playwright/test";

export class ValidationStatus {
    constructor(private page: Page) { }

    private get validationMessageElement() {
        return this.page.getByRole('status', { name: /Schema validation/ });
    }

    async verifySchema(textArr: string[]) {
        const escapedTerms = textArr.map(text => text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const orPattern = new RegExp(escapedTerms.join('|'));

        await expect(this.validationMessageElement).toContainText(orPattern);
    }
}
