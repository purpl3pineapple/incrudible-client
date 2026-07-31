import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test as base } from "@playwright/test";
import { stubClipboard } from "./mocks/index.js";

const coverageEnabled = process.env.COVERAGE === "true";
const coverageBundle = path.resolve(
  import.meta.dirname,
  "../.coverage-build/incrudible-client.js",
);
const coverageOutput = path.resolve(import.meta.dirname, "../.nyc_output");

const test = base.extend({
  // Options passed to APP.init on the fixture page. Set per file or per
  // describe block with test.use({ appInit: … }); it has to be in place
  // before navigation, which is why it is an option rather than an
  // argument to the `app` fixture.
  appInit: [undefined, { option: true }],

  // Local-storage entries seeded before the page loads, for tests that
  // exercise what the client reads back on boot.
  appStorage: [undefined, { option: true }],

  // Opens the consumer fixture and holds everything the page reported
  // while the test ran. Page errors and console errors are asserted empty
  // on teardown, so a test cannot forget to check — and a test that
  // expects output opts in through the collections below.
  //
  // Depends on `coverage` purely for ordering: this fixture navigates
  // during setup, and the instrumented bundle has to be routed in before
  // that happens or the run records nothing.
  app: async ({ page, appInit, appStorage, coverage }, use) => {
    const pageErrors = [];
    const consoleErrors = [];
    const consoleWarnings = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }

      if (message.type() === "warning") {
        consoleWarnings.push(message.text());
      }
    });

    // The real clipboard is permission-gated, so every run gets the stub.
    // Writes collect in window.clipboardWrites, and a test drives the
    // failure path by setting window.clipboardShouldFail.
    await stubClipboard(page);

    if (appStorage) {
      await page.addInitScript((entries) => {
        for (const [key, value] of Object.entries(entries)) {
          localStorage.setItem(key, value);
        }
      }, appStorage);
    }

    if (appInit) {
      await page.addInitScript((options) => {
        window.__INIT__ = options;
      }, appInit);
    }

    await page.goto("/tests/fixture.html");
    await expect(page.locator("html")).toHaveAttribute("data-ready", "true");

    await use({ consoleErrors, consoleWarnings, pageErrors });

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  },

  coverage: [
    async ({ page }, use) => {
      if (coverageEnabled) {
        await page.route("**/dist/incrudible-client.min.js", (route) =>
          route.fulfill({
            path: coverageBundle,
            contentType: "text/javascript",
          }),
        );
      }

      await use();

      if (!coverageEnabled) {
        return;
      }

      const coverage = await page.evaluate(() => globalThis.__coverage__);

      if (!coverage) {
        return;
      }

      await mkdir(coverageOutput, { recursive: true });
      await writeFile(
        path.join(coverageOutput, `${randomUUID()}.json`),
        JSON.stringify(coverage),
      );
    },
    { auto: true },
  ],
});

export { expect, test };
