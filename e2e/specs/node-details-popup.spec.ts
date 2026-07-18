import test from "playwright/test";
import { NodeDetailsPopup } from "../components/NodeDetailsPopup";

test.describe("Node Details Popup", () => {
    let nodeDetailsPopup: NodeDetailsPopup;

    test.beforeEach(async ({ page }) => {
        nodeDetailsPopup = new NodeDetailsPopup(page);
        await page.goto("/");
    });

    test("should open the node details popup when a node is clicked", async () => {
        await nodeDetailsPopup.verifyPopupOpening();
    });

    test("should close the node details popup when the close button is clicked", async () => {
        await nodeDetailsPopup.verifyPopupClosing();
    });

    test("should display correct content in the node details popup", async () => {
        await nodeDetailsPopup.verifyPopupContent();
    });
});
