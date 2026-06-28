import { test, expect } from "@playwright/test";
import { NavigationBar } from "../components/NavigationBar";

test.describe("Navigation Bar", () => {
  let navigation: NavigationBar;

  test.beforeEach(async ({ page }) => {
    navigation = new NavigationBar(page);
    await page.goto("/");
  });

  test("should toggle between light and dark themes", async ({ page }) => {
    await navigation.verifyThemeToggleWorks();
  });

  test("should expose the GitHub repository link", async () => {
    await navigation.verifyGitHubLink();
  });

  test("should expose the documentation link", async () => {
    await navigation.verifyDocumentationLink();
  });

  test("search should highlight matching node", async () => {
    await navigation.verifySearchWorks("zip");
  });
});