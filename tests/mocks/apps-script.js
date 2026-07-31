/**
 * Stands in for google.script.run, which only exists inside a deployed
 * Apps Script host. The proxy accepts any method name, records the call,
 * and then settles through whichever handler `outcome` selects.
 *
 * @param {import("@playwright/test").Page} page - The page to install into.
 * @param {{
 *   type: "success" | "response" | "transport",
 *   response?: unknown,
 *   message?: string,
 * }} outcome - `transport` fails the call itself; anything else hands `response` to the success handler, including a malformed one.
 * @returns {Promise<void>} Resolves once the stub is installed.
 */
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

export { installAppsScript };
