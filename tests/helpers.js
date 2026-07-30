const { expect } = require("@playwright/test");

// Every spec opens the same consumer fixture and asserts it stayed clean.
// Collect page/console errors from the first navigation so a listener is
// never attached after the failure it was meant to catch.
const openFixture = async (page, { init } = {}) => {
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

  if (init) {
    await page.addInitScript((options) => {
      window.__INIT__ = options;
    }, init);
  }

  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");

  return { consoleErrors, consoleWarnings, pageErrors };
};

const expectCleanPage = ({ consoleErrors, pageErrors }) => {
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
};

// Renders a schema into #form-controls and wires the same input/change
// listeners a consumer app installs, so rule syncing and preview rendering
// react to real user interaction rather than explicit re-sync calls.
const mountSchema = async (page, { schema, rules = {}, preview = true }) =>
  page.evaluate(
    ({ schema, rules, preview }) => {
      for (const [name, value] of Object.entries(rules)) {
        APP.rules[name] = value;
      }

      APP.formControls.replaceChildren(APP.renderEntries(schema));

      APP.formHelpers.formControls.forEach((control) => {
        control.addEventListener("input", (event) => {
          APP.formHelpers.syncWizards(event);

          if (preview) {
            APP.formHelpers.renderPreview();
          }
        });
        control.addEventListener("change", (event) => {
          APP.formHelpers.syncWizards(event);
          APP.formHelpers.syncModals(event);
          APP.formHelpers.syncAlerts();
          APP.formHelpers.syncArticles();

          if (preview) {
            APP.formHelpers.renderPreview();
          }
        });
      });

      APP.formHelpers.syncWizards();
      APP.formHelpers.syncAlerts();

      if (preview) {
        APP.formHelpers.renderPreview();
      }
    },
    { schema, rules, preview },
  );

// Stands in for google.script.run. `outcome` picks which handler fires:
// a transport failure, or a success handler receiving `response`.
const installAppsScript = (page, outcome) =>
  page.evaluate((value) => {
    window.serverCall = null;
    let successHandler;
    let failureHandler;
    const chain = new Proxy(
      {
        withSuccessHandler(handler) {
          successHandler = handler;
          return chain;
        },
        withFailureHandler(handler) {
          failureHandler = handler;
          return chain;
        },
      },
      {
        get(target, property) {
          if (property in target) {
            return target[property];
          }

          return (...args) => {
            window.serverCall = { method: property, args };
            queueMicrotask(() => {
              if (value.type === "transport") {
                failureHandler(new Error(value.message));
              } else {
                successHandler(value.response);
              }
            });
          };
        },
      },
    );

    window.google = { script: { run: chain } };
  }, outcome);

// Records clipboard writes and can be told to reject, covering both the
// success toast and the failure toast in copyToClipboard.
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

module.exports = {
  expectCleanPage,
  installAppsScript,
  mountSchema,
  openFixture,
  stubClipboard,
};
