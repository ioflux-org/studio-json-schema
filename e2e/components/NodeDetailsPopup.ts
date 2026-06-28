import { Page, expect } from "@playwright/test";

export class NodeDetailsPopup {
    constructor(private page: Page) { }

    private get nodes() {
        return this.page.locator(".react-flow__node-customNode");
    }

    private get closePopupButton() {
        return this.page.getByRole("button", { name: "Close node details" });
    }

    private get nodeDetailsPopup() {
        return this.page.getByRole("dialog", { name: "Node Details" });
    }

    private get lastNode() {
        return this.nodes.last();
    }

    private async getLastNodePath() {
        const dataId = await this.lastNode.getAttribute("data-id");
    
        expect(dataId).not.toBeNull();
    
        return dataId!.split("#")[1] || "/";
    }

    async verifyPopupOpening() {

        await this.lastNode.click();
        await expect(this.nodeDetailsPopup).toBeVisible();
    }

    async verifyPopupClosing() {

        await this.lastNode.click();
        await expect(this.nodeDetailsPopup).toBeVisible();

        await this.closePopupButton.click();
        await expect(this.nodeDetailsPopup).not.toBeVisible();
    }

    async verifyPopupContent() {

        const expectedPath =  await this.getLastNodePath();
        await this.lastNode.click();

        await expect(this.nodeDetailsPopup).toBeVisible();
        await expect(this.nodeDetailsPopup).toContainText(expectedPath);
    }
}
