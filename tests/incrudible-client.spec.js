const { expect, test } = require("@playwright/test");

const openFixture = async (page) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");

  return { consoleErrors, pageErrors };
};

const expectCleanPage = ({ consoleErrors, pageErrors }) => {
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
};

test("loads and initializes the production bundle", async ({ page }) => {
  const errors = await openFixture(page);

  const exports = await page.evaluate(() => ({
    hasApp: typeof window.APP?.init === "function",
    hasDays: typeof window.DAYS?.daysElapsed === "function",
  }));

  expect(exports).toEqual({ hasApp: true, hasDays: true });
  expectCleanPage(errors);
});

test("handles date policies and image upload validation", async ({ page }) => {
  const errors = await openFixture(page);

  const result = await page.evaluate(async () => {
    const holiday = (date) => date === "2026-07-20";
    const dates = {
      forward: DAYS.daysElapsed("2026-07-17", "2026-07-20"),
      reverse: DAYS.daysElapsed("2026-07-20", "2026-07-17"),
      business: DAYS.daysElapsed("2026-07-17", "2026-07-20", {
        businessDays: true,
      }),
      holiday: DAYS.daysElapsed("2026-07-17", "2026-07-20", {
        businessDays: true,
        isHoliday: holiday,
      }),
      leap: DAYS.daysElapsed("2024-02-28", "2024-03-01"),
      invalid: Number.isNaN(DAYS.daysElapsed("2026-02-30", "2026-03-01")),
    };

    const upload = await APP.imageToUpload(
      new File(["hello"], "proof.png", { type: "image/png" }),
    );

    let nonImageError;
    try {
      await APP.imageToUpload(
        new File(["hello"], "proof.txt", { type: "text/plain" }),
      );
    } catch (error) {
      nonImageError = error.message;
    }

    const OriginalFileReader = window.FileReader;
    window.FileReader = class {
      constructor() {
        throw new Error("FileReader should not start");
      }
    };

    let oversizedError;
    try {
      await APP.imageToUpload(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      );
    } catch (error) {
      oversizedError = error.message;
    } finally {
      window.FileReader = OriginalFileReader;
    }

    return { dates, nonImageError, oversizedError, upload };
  });

  expect(result).toEqual({
    dates: {
      forward: 3,
      reverse: -3,
      business: 1,
      holiday: 0,
      leap: 2,
      invalid: true,
    },
    nonImageError: "Select an image file.",
    oversizedError: "Select an image no larger than 10 MiB.",
    upload: {
      name: "proof.png",
      mimeType: "image/png",
      base64: "aGVsbG8=",
    },
  });
  expectCleanPage(errors);
});

test("runs a rendered workflow with rules, validation, and preview", async ({
  page,
}) => {
  const errors = await openFixture(page);

  await page.evaluate(() => {
    const schema = [
      {
        type: "select",
        id: "outcome",
        name: "outcome",
        label: "Outcome",
        constraints: { required: true },
        options: [
          { label: "Choose", value: "" },
          {
            label: "Customer unavailable",
            value: "Customer unavailable on !{#review-date}",
          },
        ],
      },
      {
        type: "date",
        id: "review-date",
        label: "Review Date",
        constraints: { required: true },
      },
      {
        type: "checkbox",
        id: "urgent",
        name: "urgent",
        label: "Urgent",
        alerts: [
          {
            test: true,
            alert: { variant: "warning", message: "Escalate immediately." },
          },
        ],
        modals: [
          {
            test: true,
            modal: {
              type: "confirm",
              header: "Confirm escalation",
              message: "Continue with urgent handling?",
              variant: "warning",
            },
          },
        ],
        wizards: [
          {
            test: true,
            wizard: {
              type: "text",
              id: "reason",
              name: "reason",
              label: "Escalation Reason",
              constraints: { required: true },
            },
          },
        ],
      },
      {
        type: "text",
        id: "contact",
        name: "contact",
        label: "Escalation Contact",
        criteria: [["urgent", true]],
      },
    ];

    APP.workflowLabel = "Review";
    APP.rules.alertRules = { urgent: schema[2].alerts };
    APP.rules.modalRules = { urgent: schema[2].modals };
    APP.rules.wizardRules = { urgent: schema[2].wizards };
    APP.rules.criteriaRules = { contact: schema[3].criteria };
    APP.rules.footnoteRules = {
      outcome: [
        {
          test: "Customer unavailable on !{#review-date}",
          footnote: "reviewed !{#review-date}",
        },
      ],
    };
    APP.formControls.replaceChildren(APP.renderEntries(schema));

    APP.formHelpers.formControls.forEach((control) => {
      control.addEventListener("input", (event) => {
        APP.formHelpers.syncWizards(event);
        APP.formHelpers.renderPreview();
      });
      control.addEventListener("change", (event) => {
        APP.formHelpers.syncWizards(event);
        APP.formHelpers.syncModals(event);
        APP.formHelpers.syncAlerts();
        APP.formHelpers.renderPreview();
      });
    });

    APP.formHelpers.syncWizards();
    APP.formHelpers.syncAlerts();
    APP.formHelpers.renderPreview();
  });

  await expect(page.locator("#reason")).toBeDisabled();
  await expect(page.locator("#contact")).toBeDisabled();
  expect(
    await page.locator("#app-form").evaluate((form) => form.checkValidity()),
  ).toBe(false);

  await page.locator("#review-date").fill("2026-07-27");
  await page
    .locator("#outcome")
    .selectOption({ label: "Customer unavailable" });
  await expect(page.locator("#preview-list")).toContainText(
    "Customer unavailable on 2026-07-27 (reviewed 2026-07-27)",
  );
  expect(
    await page.locator("#app-form").evaluate((form) => form.checkValidity()),
  ).toBe(true);

  await page.locator("#urgent").check();
  await expect(page.locator("#confirm-modal")).toHaveAttribute("open", "");
  await expect(page.locator("#confirm-modal-header")).toHaveText(
    "Confirm escalation",
  );
  await expect(page.locator("#urgent").locator("xpath=..")).toContainText(
    "Escalate immediately.",
  );
  await page.locator("#confirm-modal-cancel-button").click();
  await expect(page.locator("#reason")).toBeEnabled();
  await expect(page.locator("#contact")).toBeEnabled();
  expect(
    await page.locator("#app-form").evaluate((form) => form.checkValidity()),
  ).toBe(false);

  await page.locator("#reason").fill("Customer blocked");
  await page.locator("#contact").fill("On-call manager");
  expect(
    await page.locator("#app-form").evaluate((form) => form.checkValidity()),
  ).toBe(true);

  await page.locator("#urgent").uncheck();
  await expect(page.locator("#reason")).toBeDisabled();
  await expect(page.locator("#contact")).toBeDisabled();
  const submittedNames = await page
    .locator("#app-form")
    .evaluate((form) => [...new FormData(form)].map(([name]) => name));
  expect(submittedNames).not.toContain("reason");
  expect(submittedNames).not.toContain("contact");
  expectCleanPage(errors);
});

test("toggles checkbox wizard containers on change", async ({ page }) => {
  const errors = await openFixture(page);

  await page.evaluate(() => {
    const schema = [
      {
        type: "checkbox",
        id: "include-details",
        name: "includeDetails",
        label: "Include details",
        width: 2,
        wizards: [
          {
            test: true,
            wizard: {
              type: "checkbox",
              id: "include-detail-notes",
              name: "includeDetailNotes",
              label: "Include detail notes",
              wizards: [
                {
                  test: true,
                  wizard: {
                    type: "text",
                    id: "details",
                    name: "details",
                    label: "Details",
                  },
                },
              ],
            },
          },
        ],
      },
    ];

    APP.rules.wizardRules = {
      includeDetails: schema[0].wizards,
      includeDetailNotes: schema[0].wizards[0].wizard.wizards,
    };
    APP.rules.criteriaRules = {};
    APP.formControls.replaceChildren(APP.renderEntries(schema));
  });

  const container = page.locator(
    'label.form-control[for="include-details"] + fieldset.wizard',
  );
  await expect(container).toHaveClass(/w-1/);
  await expect(container).toHaveAttribute("hidden", "");

  await page.locator("#include-details").check();
  await expect(container).not.toHaveAttribute("hidden", "");
  await expect(page.locator("#include-detail-notes")).toBeVisible();

  await page.locator("#include-details").uncheck();
  await expect(container).toHaveAttribute("hidden", "");
  await expect(page.locator("#include-detail-notes")).not.toBeVisible();
  expectCleanPage(errors);
});

test("toggles checkbox wizard callers and shells as one rule target", async ({
  page,
}) => {
  const errors = await openFixture(page);

  await page.evaluate(() => {
    const schema = [
      {
        type: "select",
        id: "choice",
        name: "choice",
        label: "Choice",
        options: [
          { label: "Choose", value: "" },
          { label: "Show", value: "show" },
        ],
        wizards: [
          {
            test: "show",
            wizard: {
              type: "checkbox",
              id: "follow-up",
              name: "followUp",
              label: "Follow up",
            },
          },
        ],
      },
    ];

    APP.rules.wizardRules = { choice: schema[0].wizards };
    APP.rules.criteriaRules = {};
    APP.formControls.replaceChildren(APP.renderEntries(schema));
    APP.formHelpers.syncWizards();
  });

  const caller = page.locator('label.form-control[for="follow-up"]');
  const shell = page.locator('fieldset.wizard[data-type="checkbox"]');
  await expect(caller).not.toHaveAttribute("hidden", "");
  await expect(shell).toHaveAttribute("hidden", "");

  await page.locator("#choice").selectOption("show");
  await page.evaluate(() => APP.formHelpers.syncWizards());
  await expect(caller).not.toHaveAttribute("hidden", "");
  await expect(shell).not.toHaveAttribute("hidden", "");

  await page.locator("#choice").selectOption("");
  await page.evaluate(() => APP.formHelpers.syncWizards());
  await expect(caller).not.toHaveAttribute("hidden", "");
  await expect(shell).toHaveAttribute("hidden", "");
  expectCleanPage(errors);
});

test("uses sidenav ownership in preview copy prefixes", async ({ page }) => {
  const errors = await openFixture(page);

  const prefixes = await page.evaluate(() => {
    APP.formControls.replaceChildren(
      APP.renderEntries([
        {
          type: "text",
          id: "case-number",
          name: "caseNumber",
          label: "Case Number",
        },
      ]),
    );
    document.querySelector("#case-number").value = "12345";

    APP.sidenav.innerHTML = `
			<div class="nav-dropdown">
				<button type="button" class="dropdown-button">Operations</button>
				<a class="active" data-path="operations/review">Review</a>
			</div>`;
    const direct = APP.formHelpers.copyText;

    APP.sidenav.innerHTML = `
			<div class="nav-dropdown">
				<button type="button" class="dropdown-button">Operations</button>
				<div class="nav-dropdown">
					<button type="button" class="dropdown-button">Review</button>
					<a class="active" data-path="operations/review/escalation">Escalation</a>
				</div>
			</div>`;
    const categorized = APP.formHelpers.copyText;

    return { direct, categorized };
  });

  expect(prefixes).toEqual({
    direct: "Operations | Review | Case Number: 12345",
    categorized:
      "Operations | Review | Category: Escalation | Case Number: 12345",
  });
  expectCleanPage(errors);
});

test("keeps dynamic lists correctly indexed and resets extra rows", async ({
  page,
}) => {
  const errors = await openFixture(page);

  await page.evaluate(() => {
    APP.formControls.replaceChildren(
      APP.renderEntries([
        {
          type: "list",
          id: "tags",
          name: "tags",
          label: "Tags",
          constraints: { required: true },
        },
      ]),
    );
  });

  await page.locator(".list-add").click();
  await page.locator(".list-add").click();
  await page.locator("#tags-0").fill("first");
  await page.locator("#tags-1").fill("middle");
  await page.locator("#tags-2").fill("last");
  await page.getByRole("button", { name: "Remove" }).first().click();

  const rows = await page.locator("#tags input").evaluateAll((inputs) =>
    inputs.map((input) => ({
      id: input.id,
      name: input.name,
      value: input.value,
    })),
  );
  expect(rows).toEqual([
    { id: "tags-0", name: "tags_0", value: "first" },
    { id: "tags-1", name: "tags_1", value: "last" },
  ]);

  await page.locator("#app-form").evaluate((form) => form.reset());
  await expect(page.locator("#tags input")).toHaveCount(1);
  expectCleanPage(errors);
});

test("synchronizes theme, loading, tabs, and current-day records", async ({
  page,
}) => {
  const errors = await openFixture(page);

  await page.locator("#theme-toggle").check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(() => localStorage.getItem(APP.THEME_STORAGE_KEY)),
  ).toBe("dark");

  await page.evaluate(() => {
    APP.loading = true;
  });
  await expect(page.locator("#app-overlay")).toHaveClass(/active/);
  await page.evaluate(() => {
    APP.loading = false;
  });
  await expect(page.locator("#app-overlay")).not.toHaveClass(/active/);

  const recordsTab = page.getByRole("tab", { name: "My Submissions" });
  await recordsTab.click();
  await expect(recordsTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#panel-records")).not.toHaveAttribute(
    "hidden",
    "",
  );
  await recordsTab.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "New Submission" })).toBeFocused();
  await expect(page.locator("#panel-form")).toBeVisible();

  const records = [{ record: { id: "one" }, entries: [["status", "open"]] }];
  await page.evaluate((value) => {
    localStorage.setItem(
      APP.RECORDS_STORAGE_KEY,
      JSON.stringify({ date: APP.today(), records: value }),
    );
  }, records);
  expect(await page.evaluate(() => APP.records)).toEqual(records);
  expectCleanPage(errors);
});

test("publishes dialog outcomes and dismisses messages", async ({ page }) => {
  const errors = await openFixture(page);

  await page.evaluate(() => {
    window.dialogEvents = [];
    APP.subscribe("confirm:accepted", (detail) =>
      dialogEvents.push(["accepted", detail]),
    );
    APP.subscribe("confirm:cancelled", (detail) =>
      dialogEvents.push(["cancelled", detail]),
    );
    APP.confirm("Proceed?", {
      header: "First decision",
      detail: { id: 1 },
      confirmText: "Continue",
    });
  });
  await page.locator("#confirm-modal-cancel-button").click();
  await expect
    .poll(() => page.evaluate(() => window.dialogEvents))
    .toEqual([["cancelled", { id: 1 }]]);

  await page.evaluate(() => {
    APP.confirm("Proceed again?", {
      header: "Second decision",
      detail: { id: 2 },
    });
  });
  await page.locator("#confirm-modal-confirm-button").click();

  await expect
    .poll(() => page.evaluate(() => window.dialogEvents))
    .toEqual([
      ["cancelled", { id: 1 }],
      ["accepted", { id: 2 }],
    ]);

  await page.evaluate(() => {
    APP.notify("Finished.", { header: "Complete", dismissText: "Done" });
  });
  await expect(page.locator("#message-modal")).toHaveAttribute("open", "");
  await expect(page.locator("#message-modal-dismiss-button")).toHaveText(
    "Done",
  );
  await page.locator("#message-modal-dismiss-button").click();
  await expect(page.locator("#message-modal")).not.toHaveAttribute("open", "");
  expectCleanPage(errors);
});

test("handles Apps Script success and both failure paths", async ({ page }) => {
  const errors = await openFixture(page);

  const installServer = (outcome) =>
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

  await installServer({
    type: "success",
    response: { success: true, data: { id: 7 } },
  });
  const success = await page.evaluate(
    () =>
      new Promise((resolve) => {
        APP.runServer("save", ["value"], { onData: resolve });
      }),
  );
  expect(success).toEqual({ id: 7 });
  expect(await page.evaluate(() => window.serverCall)).toEqual({
    method: "save",
    args: ["value"],
  });
  await expect(page.locator("#app-overlay")).not.toHaveClass(/active/);

  await installServer({
    type: "response",
    response: { success: false, error: { message: "Rejected" } },
  });
  await page.evaluate(() => {
    APP.runServer("save", [], { prefix: "Couldn't save: ", onData: () => {} });
  });
  await expect(page.getByRole("status").last()).toHaveText(
    "Couldn't save: Rejected",
  );
  await expect(page.locator("#app-overlay")).not.toHaveClass(/active/);

  await installServer({ type: "transport", message: "Offline" });
  await page.evaluate(() => {
    APP.runServer("save", [], { prefix: "Couldn't save: ", onData: () => {} });
  });
  await expect(page.getByRole("status").last()).toHaveText(
    "Couldn't save: Offline",
  );
  await expect(page.locator("#app-overlay")).not.toHaveClass(/active/);
  expectCleanPage(errors);
});

test("copies only valid preview content and reports clipboard failures", async ({
  page,
}) => {
  await page.addInitScript(() => {
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
  const errors = await openFixture(page);

  await page.evaluate(() => {
    APP.workflowLabel = "Review";
    APP.formControls.replaceChildren(
      APP.renderEntries([
        {
          type: "text",
          id: "case-number",
          name: "caseNumber",
          label: "Case Number",
          constraints: { required: true },
        },
        { type: "textarea", id: "notes", name: "notes", label: "Notes" },
      ]),
    );
    APP.formHelpers.formControls.forEach((control) => {
      control.addEventListener("input", () => APP.formHelpers.renderPreview());
    });
    APP.formHelpers.renderPreview();
  });

  await page.locator("#notes").fill("Context");
  await page.locator("#copy-preview").click();
  expect(await page.evaluate(() => window.clipboardWrites)).toEqual([]);
  await page.keyboard.press("Escape");

  await page.locator("#case-number").fill("12345");
  await page.locator("#copy-preview").click();
  expect(await page.evaluate(() => window.clipboardWrites)).toEqual([
    "Review | Case Number: 12345 | Notes: Context",
  ]);
  await expect(page.getByRole("status").last()).toHaveText(
    "Copied to clipboard.",
  );

  await page.evaluate(() => {
    window.clipboardShouldFail = true;
  });
  await page.locator("#copy-preview").click();
  await expect(page.getByRole("status").last()).toHaveText(
    "Couldn't copy to clipboard.",
  );
  expectCleanPage(errors);
});
