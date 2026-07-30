const { randomUUID } = require("node:crypto");
const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { expect, test: base } = require("@playwright/test");

const coverageEnabled = process.env.COVERAGE === "true";
const coverageBundle = path.resolve(
  __dirname,
  "../.coverage-build/incrudible-client.js",
);
const coverageOutput = path.resolve(__dirname, "../.nyc_output");

const test = base.extend({
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

module.exports = { expect, test };