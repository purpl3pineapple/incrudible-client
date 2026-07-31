/**
 * Replaces navigator.clipboard, which is permission-gated and would
 * otherwise reject unpredictably. Writes land in `window.clipboardWrites`;
 * setting `window.clipboardShouldFail` drives the failure path.
 *
 * Installed as an init script so it is in place before the page's own
 * scripts run.
 *
 * @param {import("@playwright/test").Page} page - The page to install into.
 * @returns {Promise<void>} Resolves once the stub is registered.
 */
const stubClipboard = (page) =>
  page.addInitScript(() => {
    window.clipboardWrites = [];
    window.clipboardShouldFail = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(text) {
          if (window.clipboardShouldFail) {
            return Promise.reject(new Error("Denied"));
          }

          window.clipboardWrites.push(text);
          return Promise.resolve();
        },
      },
    });
  });

export { stubClipboard };
