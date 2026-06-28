import { expect, Locator, Page } from "@playwright/test";

export class NavigationBar {
    constructor(private page: Page) { }
    
    get selectedNodes(): Locator {
        return this.page.locator(".react-flow__node-customNode.selected");
    }

    get searchInput(): Locator {
        return this.page.getByRole("textbox", {
            name: "Search nodes",
        });
    }

    get toggleSearchButton(): Locator {
        return this.page.getByRole("button", {
            name: "Toggle search",
        });
    }

    get clearSearchButton(): Locator {
        return this.page.getByRole("button", {
            name: "Clear search",
        });
    }

    get themeToggleButton(): Locator {
        return this.page.getByRole("button", {
            name: "Toggle theme",
        });
    }

    get githubLink(): Locator {
        return this.page.getByRole("link", {
            name: "GitHub repository",
        });
    }

    get documentationLink(): Locator {
        return this.page.getByRole("link", {
            name: "Documentation",
        });
    }

    async search(text: string) {
        await this.searchInput.fill(text);
    }

    async clearSearch() {
        await this.clearSearchButton.click();
    }

    async toggleTheme() {
        await this.themeToggleButton.click();
    }

    async openMobileSearch() {
        await this.toggleSearchButton.click();
    }

    async verifyThemeToggleWorks() {
        const html = this.page.locator("html");

        const initialTheme = await html.getAttribute("data-theme");

        expect(initialTheme).toBeTruthy();

        await this.toggleTheme();

        const newTheme = await html.getAttribute("data-theme");

        expect(newTheme).not.toBe(initialTheme);
    }

    async verifySearchWorks(text: string) {

        
        await this.search(text);
        await this.page.waitForTimeout(500);
        await expect(this.searchInput).toHaveValue(text);
        
        const selectedNodes = this.selectedNodes;
        
        await expect(selectedNodes).toHaveCount(1);
        await expect(selectedNodes.first()).toContainText(text);

        await this.clearSearch();
        await expect(this.searchInput).toHaveValue("");
    }

    async verifyGitHubLink() {
        await expect(this.githubLink).toBeVisible();
        await expect(this.githubLink).toHaveAttribute(
            "href",
            "https://github.com/ioflux-org/studio-json-schema"
        );
    }

    async verifyDocumentationLink() {
        await expect(this.documentationLink).toBeVisible();
        await expect(this.documentationLink).toHaveAttribute(
            "href",
            "https://github.com/ioflux-org/studio-json-schema?tab=readme-ov-file#json-schema-visualizer"
        );
    }
}
