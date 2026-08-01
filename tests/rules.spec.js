import { expect, test } from "./setup.js";
import { mountSchema } from "./helpers/index.js";

test("fails closed on a dependency naming no control at all", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [{ type: "text", id: "present", name: "present", label: "Present" }],
    rules: { criteriaRules: { present: [["missing-control", true]] } },
  });

  // An unresolvable dependency hides the field rather than defaulting to
  // visible, and says nothing about it either way.
  await expect(page.locator("#present")).toBeHidden();
  expect(app.consoleWarnings).toEqual([]);
});

test("resolves a chain of dependent rules in a single sync", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    // Authored leaf-first, so the chain only settles in one pass if rules
    // are applied in dependency order rather than the order written.
    schema: [
      { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
      { type: "text", id: "middle", name: "middle", label: "Middle" },
      { type: "text", id: "leaf", name: "leaf", label: "Leaf" },
    ],
    rules: {
      criteriaRules: {
        leaf: [["middle", "yes"]],
        middle: [["gate", true]],
      },
    },
  });

  // "middle" is rendered and real — just disabled by its own rule, which is
  // an ordinary link in a chain. Resolution fails closed on it regardless.
  await expect(page.locator("#middle")).toBeHidden();
  await expect(page.locator("#leaf")).toBeHidden();

  await page.locator("#gate").check();
  await expect(page.locator("#middle")).toBeVisible();

  await page.locator("#middle").fill("yes");
  await page.locator("#middle").blur();
  await expect(page.locator("#leaf")).toBeVisible();

  // Collapsing the root takes the whole chain with it in the same sync.
  await page.locator("#gate").uncheck();
  await expect(page.locator("#middle")).toBeHidden();
  await expect(page.locator("#leaf")).toBeHidden();

  expect(app.consoleWarnings).toEqual([]);
});

test("resolves rules keyed by a list fieldset's submission name", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [
      { type: "checkbox", id: "show-tags", name: "showTags", label: "Show tags" },
      // The id and the name differ, so "tags" matches neither an element id
      // nor a control name — only the fieldset's data-name.
      { type: "list", id: "tag-list", name: "tags", label: "Tags" },
    ],
    rules: {
      criteriaRules: { tags: [["show-tags", true]] },
      requisitionRules: { tags: [["show-tags", true]] },
    },
  });

  const list = page.locator("#tag-list");
  await expect(list).toBeHidden();
  await expect(list).toHaveAttribute("disabled", "");

  await page.locator("#show-tags").check();
  await expect(list).toBeVisible();
  await expect(list).not.toHaveAttribute("disabled", "");

  await page.locator("#show-tags").uncheck();
  await expect(list).toBeHidden();
});

test("ignores autofill and requisition rules for ineligible targets", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [
      { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
      { type: "checkbox", id: "flag", name: "flag", label: "Flag" },
      { type: "image", id: "proof", name: "proof", label: "Proof" },
      {
        type: "listbox",
        id: "regions",
        name: "regions",
        label: "Regions",
        options: [{ label: "North", value: "north" }],
      },
      {
        type: "text",
        id: "off",
        name: "off",
        label: "Disabled target",
        disabled: true,
      },
      { type: "list", id: "codes", name: "codes", label: "Codes" },
    ],
    rules: {
      autofillRules: {
        // None of these targets accept a scalar autofill value.
        flag: [{ value: "true", when: [["gate", true]] }],
        proof: [{ value: "ignored", when: [["gate", true]] }],
        regions: [{ value: "north", when: [["gate", true]] }],
        off: [{ value: "ignored", when: [["gate", true]] }],
        codes: [{ value: "ignored", when: [["gate", true]] }],
      },
      // A fieldset is not a settable requisition target either.
      requisitionRules: { codes: [["gate", true]] },
    },
  });

  await page.locator("#gate").check();

  await expect(page.locator("#flag")).not.toBeChecked();
  await expect(page.locator("#proof")).toHaveValue("");
  await expect(page.locator("#regions")).toHaveValue("");
  await expect(page.locator("#off")).toHaveValue("");
  await expect(page.locator("#codes-0")).toHaveValue("");
  await expect(page.locator("#codes")).not.toHaveAttribute("required", "");
});

test("skips autofill rules whose dependencies never pass", async ({ page, app }) => {
  await mountSchema(page, {
    schema: [
      { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
      { type: "text", id: "target", name: "target", label: "Target" },
    ],
    rules: {
      autofillRules: {
        target: [{ value: "filled", when: [["gate", false]] }],
      },
    },
    // This case is specifically about the rule reapplying mid-edit, which
    // only happens in an app that syncs on every keystroke.
    syncOnInput: true,
  });

  // gate is unchecked, so the false-test rule matches and fills.
  await expect(page.locator("#target")).toHaveValue("filled");

  // While a rule still matches it is reapplied on every sync, so an edit
  // made under that condition is overwritten.
  await page.locator("#target").fill("manual");
  await expect(page.locator("#target")).toHaveValue("filled");

  // Once no rule matches, the target is left alone entirely — the previous
  // autofill is not cleared, and later edits stick.
  await page.locator("#gate").check();
  await expect(page.locator("#target")).toHaveValue("filled");
  await page.locator("#target").fill("manual");
  await expect(page.locator("#target")).toHaveValue("manual");
});

test("clears an autofill target when the rule resolves to nothing", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [
      { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
      { type: "text", id: "target", name: "target", label: "Target" },
    ],
    rules: {
      autofillRules: {
        target: [{ value: undefined, when: [["gate", true]] }],
      },
    },
  });

  await page.locator("#target").fill("manual");
  await page.locator("#gate").check();

  // A rule with no value stringifies to empty rather than "undefined".
  await expect(page.locator("#target")).toHaveValue("");
});

test("requires every dependency across controls sharing a name", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [
      ...["alpha", "beta"].map((value) => ({
        type: "checkbox",
        id: `${value}-flag`,
        name: "flags",
        label: `${value} flag`,
        value,
      })),
      { type: "text", id: "detail", name: "detail", label: "Detail" },
    ],
    rules: { criteriaRules: { detail: [["flags", "beta"]] } },
  });

  const detail = page.locator("#detail");
  await expect(detail).toBeHidden();

  // Values are pooled across every control with the name, so checking the
  // matching one is enough.
  await page.locator("#alpha-flag").check();
  await expect(detail).toBeHidden();

  await page.locator("#beta-flag").check();
  await expect(detail).toBeVisible();

  await page.locator("#beta-flag").uncheck();
  await expect(detail).toBeHidden();
});

test("ignores disabled controls when resolving dependencies", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [
      { type: "checkbox", id: "outer", name: "outer", label: "Outer" },
      { type: "checkbox", id: "inner", name: "inner", label: "Inner" },
      { type: "text", id: "detail", name: "detail", label: "Detail" },
    ],
    rules: {
      criteriaRules: {
        inner: [["outer", true]],
        detail: [["inner", true]],
      },
    },
  });

  await page.locator("#outer").check();
  await page.locator("#inner").check();
  await expect(page.locator("#detail")).toBeVisible();

  // Hiding `inner` disables it, which removes it from dependency
  // resolution and collapses everything that depended on it.
  await page.locator("#outer").uncheck();
  await expect(page.locator("#inner")).toBeDisabled();
  await expect(page.locator("#detail")).toBeHidden();
});

test("re-reveals a chained criteria target in the same sync", async ({
  page,
  app,
}) => {
  // Deliberately no extra listeners: APP.init installs a single `change`
  // handler on the app form, so each interaction triggers exactly one
  // sync pass. Wiring `input` as well would sync twice and mask an
  // ordering fault behind the second pass.
  await page.evaluate(() => {
    APP.rules.criteriaRules = {
      // `detail` depends on `gate`, which is itself criteria-gated. Rule
      // order puts the dependent first, which is what a consumer gets by
      // authoring rules in schema order.
      detail: [["gate", true]],
      gate: [["outer", true]],
    };
    APP.formControls.replaceChildren(
      APP.renderEntries([
        { type: "checkbox", id: "outer", name: "outer", label: "Outer" },
        { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
        { type: "text", id: "detail", name: "detail", label: "Detail" },
      ]),
    );
    APP.formHelpers.syncWizards();
  });

  const gate = page.locator("#gate");
  const detail = page.locator("#detail");

  await page.locator("#outer").check();
  await gate.check();
  await expect(detail).toBeVisible();

  // Collapsing the chain disables `gate`, which correctly hides `detail`.
  await page.locator("#outer").uncheck();
  await expect(gate).toBeDisabled();
  await expect(detail).toBeHidden();

  // Re-opening it must restore `detail` immediately: `gate` is enabled
  // again and still checked, so the dependency holds.
  await page.locator("#outer").check();
  await expect(gate).toBeEnabled();
  await expect(gate).toBeChecked();
  await expect(detail).toBeVisible();
});

test("re-reveals a wizard gated by a criteria-controlled dependency", async ({
  page,
  app,
}) => {
  // Single-pass wiring again: the library's own change handler only.
  await page.evaluate(() => {
    const wizards = [
      {
        test: true,
        when: [["gate", true]],
        wizard: {
          type: "text",
          id: "detail",
          name: "detail",
          label: "Detail",
        },
      },
    ];

    APP.rules.criteriaRules = { gate: [["outer", true]] };
    APP.rules.wizardRules = { trigger: wizards };
    APP.formControls.replaceChildren(
      APP.renderEntries([
        { type: "checkbox", id: "outer", name: "outer", label: "Outer" },
        { type: "checkbox", id: "gate", name: "gate", label: "Gate" },
        {
          type: "checkbox",
          id: "trigger",
          name: "trigger",
          label: "Trigger",
          wizards,
        },
      ]),
    );
    APP.formHelpers.syncWizards();
  });

  const gate = page.locator("#gate");
  const detail = page.locator("#detail");

  await page.locator("#outer").check();
  await gate.check();
  await page.locator("#trigger").check();
  await expect(detail).toBeVisible();

  // Disabling the wizard's dependency collapses it.
  await page.locator("#outer").uncheck();
  await expect(gate).toBeDisabled();
  await expect(detail).toBeHidden();

  // Restoring the dependency must bring the wizard back in this sync —
  // the wizard pass runs before criteria re-enables `gate`, so this only
  // holds if both are driven to a fixed point.
  await page.locator("#outer").check();
  await expect(gate).toBeEnabled();
  await expect(gate).toBeChecked();
  await expect(detail).toBeVisible();
});

test("starts a list hidden when a wizard owns it", async ({ page, app }) => {
  const wizards = [
    {
      test: true,
      wizard: { type: "list", id: "notes", name: "notes", label: "Notes" },
    },
  ];

  await mountSchema(page, {
    schema: [
      {
        type: "checkbox",
        id: "add-notes",
        name: "addNotes",
        label: "Add notes",
        wizards,
      },
    ],
    rules: { wizardRules: { "add-notes": wizards } },
    listeners: false,
  });

  // A list reached through a wizard renders hidden and disabled, so its
  // rows submit nothing until the controller reveals it.
  const list = page.locator("#notes");
  await expect(list).toBeHidden();
  await expect(list).toHaveAttribute("disabled", "");

  await page.locator("#add-notes").check();
  await expect(list).toBeVisible();
  await expect(page.locator("#notes-0")).toBeEnabled();

  await page.locator("#notes-0").fill("first");
  expect(
    await page
      .locator("#app-form")
      .evaluate((form) => new FormData(form).get("notes_0")),
  ).toBe("first");
});

test("routes each rule family through the store independently", async ({
  page,
  app,
}) => {
  expect(
    await page.evaluate(() => {
      const families = Object.keys(APP.rules);

      APP.rules.alertRules = { a: [] };
      // Only the known families have store-backed accessors; anything else
      // becomes an inert own property on the facade.
      APP.rules.notARule = { b: [] };

      return {
        families,
        alertRules: APP.rules.alertRules,
        untouchedFamily: APP.rules.wizardRules,
        unknownIsInert:
          Object.getOwnPropertyDescriptor(APP.rules, "notARule").get ===
          undefined,
      };
    }),
  ).toEqual({
    families: [
      "modalRules",
      "articleRules",
      "alertRules",
      "footnoteRules",
      "wizardRules",
      "criteriaRules",
      "requisitionRules",
      "autofillRules",
      "feedbackWizardRules",
      "feedbackCriteriaRules",
      "feedbackRequisitionRules",
      "feedbackAutofillRules",
      "feedbackAlertRules",
      "feedbackModalRules",
    ],
    alertRules: { a: [] },
    untouchedFamily: {},
    unknownIsInert: true,
  });
});

test("syncs modals only for controls that own a rule", async ({ page, app }) => {
  await mountSchema(page, {
    schema: [
      { type: "text", id: "anonymous", label: "Anonymous" },
      { type: "checkbox", id: "watched", name: "watched", label: "Watched" },
      { type: "checkbox", id: "unwatched", name: "unwatched", label: "Unwatched" },
    ],
    rules: {
      modalRules: {
        watched: [
          {
            test: true,
            modal: { type: "message", header: "Noted", message: "Recorded." },
          },
        ],
        // A rule whose test never passes must not open anything.
        unwatched: [
          {
            test: "never",
            modal: { type: "message", header: "Never", message: "Never." },
          },
        ],
      },
    },
  });

  // A control with neither id-keyed nor name-keyed rules is skipped, and a
  // synthetic event with no target returns early.
  await page.evaluate(() => APP.formHelpers.syncModals());
  await page.evaluate(() => APP.formHelpers.syncModals({ target: null }));
  await page.locator("#anonymous").fill("text");
  await page.locator("#unwatched").check();
  await expect(page.locator("#message-modal")).not.toHaveAttribute("open", "");

  await page.locator("#watched").check();
  await expect(page.locator("#message-modal")).toHaveAttribute("open", "");
  await expect(page.locator("#message-modal-header")).toHaveText("Noted");
});

test("re-renders control alerts on every change", async ({ page, app }) => {
  await mountSchema(page, {
    schema: [
      {
        type: "select",
        id: "status",
        name: "status",
        label: "Status",
        options: [
          { label: "Choose", value: "" },
          { label: "Open", value: "open" },
          { label: "Blocked", value: "blocked" },
        ],
        alerts: [{ test: "Blocked", alert: { variant: "warning", message: "x" } }],
      },
      // An alert container whose control carries no rules stays empty.
      {
        type: "text",
        id: "unruled",
        name: "unruled",
        label: "Unruled",
        alerts: [{ test: true, alert: { variant: "note", message: "unused" } }],
      },
    ],
    rules: {
      alertRules: {
        status: [
          {
            test: "Blocked",
            alert: { variant: "warning", message: "Escalate this case." },
          },
          {
            test: "Open",
            alert: { variant: "note", message: "Awaiting triage." },
          },
        ],
      },
    },
  });

  const alerts = page.locator('.control-alerts[data-control-id="status"]');
  await expect(alerts).toBeEmpty();

  await page.locator("#status").selectOption("blocked");
  await expect(alerts).toContainText("Escalate this case.");
  await expect(alerts).not.toContainText("Awaiting triage.");

  // Switching value replaces the previous alert rather than appending.
  await page.locator("#status").selectOption("open");
  await expect(alerts).toContainText("Awaiting triage.");
  await expect(alerts).not.toContainText("Escalate this case.");

  await page.locator("#status").selectOption("");
  await expect(alerts).toBeEmpty();
  await expect(
    page.locator('.control-alerts[data-control-id="unruled"]'),
  ).toBeEmpty();
});

test("leaves alert containers alone when their control is gone", async ({
  page,
  app,
}) => {
  await mountSchema(page, {
    schema: [
      {
        type: "text",
        id: "orphan",
        name: "orphan",
        label: "Orphan",
        alerts: [{ test: true, alert: { variant: "note", message: "n" } }],
      },
    ],
    rules: {
      alertRules: {
        orphan: [{ test: true, alert: { variant: "note", message: "Present." } }],
      },
    },
  });

  await page.locator("#orphan").fill("value");
  await expect(page.locator(".control-alerts")).toContainText("Present.");

  // Removing the control leaves the container orphaned; syncing must not
  // throw or clear what is already rendered.
  await page.evaluate(() => {
    document.getElementById("orphan").remove();
    APP.formHelpers.syncAlerts();
  });
  await expect(page.locator(".control-alerts")).toContainText("Present.");
});
