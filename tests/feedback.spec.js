import { expect, test } from "./setup.js";
import { installAppsScript } from "./mocks/index.js";
import { feedbackWorkflow } from "./fixtures/index.js";

const withFeedback = { feedback: feedbackWorkflow };

test.describe("without feedback configured", () => {
  test("init without feedback leaves the feedback form empty", async ({
    page,
    app,
  }) => {
    await expect(page.locator("#feedback-form-controls")).toBeEmpty();
    expect(
      await page.evaluate(() => APP.rules.feedbackWizardRules),
    ).toEqual({});
  });

  test("skips record syncing when no feedback form is configured", async ({
    page,
    app,
  }) => {
    await installAppsScript(page, {
      type: "success",
      response: { success: true, data: [] },
    });
    await page.evaluate(() => {
      // The getter is what syncRecords guards on; drop it for this call.
      Object.defineProperty(APP, "feedbackForm", {
        configurable: true,
        get: () => null,
      });
      APP.syncFeedbackRecords();
    });

    expect(await page.evaluate(() => window.serverCall)).toBeNull();
  });

  test("ignores message-modal clicks outside the copy button", async ({
    page,
    app,
  }) => {
    await page.evaluate(() => APP.notify("Nothing to copy here."));
    await page.locator("#message-modal-message").click();

    expect(await page.evaluate(() => window.clipboardWrites)).toEqual([]);
  });

  test("caps a region at two alerts, newest first", async ({ page, app }) => {
    await page.evaluate(() => {
      for (const message of ["First", "Second", "Third"]) {
        APP.alert("app", { variant: "note", message });
      }
    });

    const alerts = page.locator("#app-alerts .markdown-alert");
    await expect(alerts).toHaveCount(2);
    await expect(alerts.nth(0)).toContainText("Third");
    await expect(alerts.nth(1)).toContainText("Second");
  });
});

test.describe("with feedback configured", () => {
  test.use({ appInit: withFeedback });

  test("renders the feedback schema from init options", async ({ page, app }) => {
    await expect(page.locator("select#feedback-kind")).toHaveCount(1);
    await expect(page.locator('#feedback-blocking[type="checkbox"]')).toHaveCount(
      1,
    );
    await expect(page.locator("textarea#feedback-detail")).toHaveCount(1);
    await expect(page.locator("#feedback-repro")).toHaveCount(1);
    await expect(
      page.locator("#feedback-form .control-alerts"),
    ).toHaveAttribute("data-control-id", "feedback-blocking");

    // Every rendered control belongs to the feedback form, not the app form.
    expect(
      await page.evaluate(() =>
        Array.from(APP.feedbackForm.elements)
          .filter((control) => control.id)
          .map((control) => control.id),
      ),
    ).toContain("feedback-kind");
    expect(await page.evaluate(() => APP.formControls.childElementCount)).toBe(0);
  });

  test("applies wizard, criteria, requisition, and autofill rules to the feedback form", async ({
    page,
    app,
  }) => {
    const repro = page.locator("#feedback-repro");
    const severity = page.locator("#feedback-severity");
    const detail = page.locator("#feedback-detail");

    await expect(repro).toBeHidden();
    await expect(severity).toBeHidden();
    await expect(detail).not.toHaveAttribute("required", "");

    await page.locator("#feedback-kind").selectOption("bug");
    await expect(repro).toBeVisible();
    await expect(repro).toBeEnabled();

    await page.locator("#feedback-kind").selectOption("idea");
    await expect(repro).toBeHidden();
    await expect(repro).toBeDisabled();

    // The blocking checkbox drives criteria, requisitions, and autofills at
    // once — all three run off the same feedback-form sync.
    await page.locator("#feedback-blocking").check();
    await expect(severity).toBeVisible();
    await expect(severity).toHaveValue("critical");
    await expect(detail).toHaveAttribute("required", "");

    // The same checkbox owns a modal rule; dismiss it before interacting again.
    await page.locator("#message-modal-dismiss-button").click();
    await page.locator("#feedback-blocking").uncheck();
    await expect(severity).toBeHidden();
    await expect(detail).not.toHaveAttribute("required", "");
  });

  test("renders feedback alerts and modals from feedback-scoped rules", async ({
    page,
    app,
  }) => {
    await expect(page.locator("#feedback-form .control-alerts")).toBeEmpty();

    await page.locator("#feedback-blocking").check();
    await expect(page.locator("#feedback-form .control-alerts")).toContainText(
      "Blocking reports page the on-call engineer.",
    );
    await expect(page.locator("#message-modal")).toHaveAttribute("open", "");
    await expect(page.locator("#message-modal-header")).toHaveText(
      "Thanks for flagging",
    );

    await page.locator("#message-modal-dismiss-button").click();
    await page.locator("#feedback-blocking").uncheck();
    await expect(page.locator("#feedback-form .control-alerts")).toBeEmpty();
  });

  test("opens the feedback drawer and resets the form on close", async ({
    page,
    app,
  }) => {
    const drawer = page.locator("#feedback-drawer");
    await expect(drawer).not.toHaveClass(/open/);

    await page.locator("#open-feedback-drawer").click();
    await expect(drawer).toHaveClass(/open/);

    await page.locator("#feedback-kind").selectOption("bug");
    await page.locator("#feedback-detail").fill("Something broke");
    await expect(page.locator("#feedback-repro")).toBeVisible();

    await page.locator("#close-feedback-drawer").click();
    await expect(drawer).not.toHaveClass(/open/);
    await expect(page.locator("#feedback-detail")).toHaveValue("");

    // The reset listener re-syncs, so the wizard collapses again.
    await expect(page.locator("#feedback-repro")).toBeHidden();
  });

  test("loads feedback records through the server envelope", async ({ page, app }) => {
    const records = [{ id: "fb-1", message: "First" }];
    await installAppsScript(page, {
      type: "success",
      response: { success: true, data: records },
    });

    await page.evaluate(() => APP.syncFeedbackRecords());
    await expect
      .poll(() => page.evaluate(() => APP._internals.feedback.records))
      .toEqual(records);
    expect(await page.evaluate(() => window.serverCall)).toEqual({
      method: "getFeedback",
      args: [],
    });

    // loading:false means the sync must never raise the overlay.
    await expect(page.locator("#app-overlay")).not.toHaveClass(/active/);
  });

  test("reports a feedback record load failure without the overlay", async ({
    page,
    app,
  }) => {
    await installAppsScript(page, { type: "transport", message: "Offline" });
    await page.evaluate(() => APP.syncFeedbackRecords());

    await expect(page.getByRole("status").last()).toHaveText(
      "Couldn't load feedback records: Offline",
    );
    await expect(page.locator("#app-overlay")).not.toHaveClass(/active/);
  });

  test("prepends a submitted record and offers its id for copying", async ({
    page,
    app,
  }) => {
    // prependFeedbackRecord is a no-op until records have been loaded once.
    await page.evaluate(() =>
      APP.publish("feedback:submitted", { id: "fb-ignored" }),
    );
    expect(
      await page.evaluate(() => APP._internals.feedback.records),
    ).toBeUndefined();
    await page.locator("#message-modal-dismiss-button").click();

    await page.evaluate(() => {
      APP._internals.feedback.records = [{ id: "fb-1" }];
      APP.feedbackForm.querySelector("#feedback-detail").value = "Draft";
      APP.publish("feedback:submitted", { id: "fb-2" });
    });

    expect(await page.evaluate(() => APP._internals.feedback.records)).toEqual([
      { id: "fb-2" },
      { id: "fb-1" },
    ]);
    await expect(page.locator("#message-modal")).toHaveAttribute("open", "");
    await expect(page.locator("#message-modal-header")).toHaveText(
      "Feedback submitted",
    );
    await expect(page.locator("#feedback-detail")).toHaveValue("");

    await page.locator("#message-modal .copy-button").click();
    expect(await page.evaluate(() => window.clipboardWrites)).toEqual(["fb-2"]);
    await expect(page.getByRole("status").last()).toHaveText(
      "Copied to clipboard.",
    );
  });

  test("routes alerts to the app, form, and feedback regions", async ({
    page,
    app,
  }) => {
    await page.evaluate(() => {
      APP.alert("app", { variant: "note", message: "App scoped" });
      APP.alert("form", { variant: "tip", message: "Form scoped" });
      APP.alert("feedback", { variant: "warning", message: "Feedback scoped" });
    });

    await expect(page.locator("#app-alerts")).toContainText("App scoped");
    await expect(page.locator("#form-alerts")).toContainText("Form scoped");
    await expect(page.locator("#feedback-alerts")).toContainText(
      "Feedback scoped",
    );

    // Any unrecognized key falls back to the form region.
    await page.evaluate(() =>
      APP.alert("unknown", { variant: "note", message: "Fallback scoped" }),
    );
    await expect(page.locator("#form-alerts")).toContainText("Fallback scoped");
  });
});
