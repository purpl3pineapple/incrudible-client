import { expect, test } from "./setup.js";

test("moves tab selection with the arrow, home, and end keys", async ({
  page,
  app,
}) => {
  const formTab = page.getByRole("tab", { name: "New Submission" });
  const recordsTab = page.getByRole("tab", { name: "My Submissions" });

  await formTab.focus();
  await formTab.press("ArrowRight");
  await expect(recordsTab).toBeFocused();
  await expect(recordsTab).toHaveAttribute("aria-selected", "true");
  // The records panel is empty, so assert the hidden attribute rather than
  // geometric visibility.
  await expect(page.locator("#panel-records")).not.toHaveAttribute("hidden", "");

  // Both directions wrap around the ends of the list.
  await recordsTab.press("ArrowRight");
  await expect(formTab).toBeFocused();
  await formTab.press("ArrowLeft");
  await expect(recordsTab).toBeFocused();
  await recordsTab.press("ArrowLeft");
  await expect(formTab).toBeFocused();

  await formTab.press("End");
  await expect(recordsTab).toBeFocused();
  await recordsTab.press("Home");
  await expect(formTab).toBeFocused();
  await expect(page.locator("#panel-form")).toBeVisible();
  await expect(page.locator("#panel-records")).toHaveAttribute("hidden", "");

  // Roving tabindex follows the selection.
  expect(
    await page
      .getByRole("tab")
      .evaluateAll((tabs) => tabs.map((tab) => tab.tabIndex)),
  ).toEqual([0, -1]);
});

test("reselecting the active tab changes nothing", async ({ page, app }) => {
  const recordsTab = page.getByRole("tab", { name: "My Submissions" });

  await recordsTab.click();
  await expect(recordsTab).toHaveAttribute("aria-selected", "true");

  // The store short-circuits an unchanged selection, so the second click
  // leaves the tab and its panel exactly as they were.
  await recordsTab.click();
  await expect(recordsTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#panel-records")).not.toHaveAttribute(
    "hidden",
    "",
  );
  await expect(page.locator("#panel-form")).toHaveAttribute("hidden", "");
});

test("ignores keys the tablist does not handle", async ({ page, app }) => {
  const formTab = page.getByRole("tab", { name: "New Submission" });
  await formTab.focus();
  await formTab.press("ArrowDown");
  await formTab.press("a");

  await expect(formTab).toBeFocused();
  await expect(formTab).toHaveAttribute("aria-selected", "true");
});

test("toggles dropdowns and closes them on outside click or Escape", async ({
  page,
  app,
}) => {
  const dropdowns = page.locator(".nav-dropdown");
  const first = dropdowns.nth(0);
  const second = dropdowns.nth(1);

  await first.locator(".dropdown-button").click();
  await expect(first).toHaveClass(/open/);
  await expect(first.locator(".dropdown-button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  // Opening the second closes the first, since the click lands outside it.
  await second.locator(".dropdown-button").click();
  await expect(second).toHaveClass(/open/);
  await expect(first).not.toHaveClass(/open/);
  await expect(first.locator(".dropdown-button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await page.locator("#open-notepad").click();
  await expect(second).not.toHaveClass(/open/);

  await second.locator(".dropdown-button").click();
  await expect(second).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(second).not.toHaveClass(/open/);
});

test("forces dropdown state through the explicit toggle argument", async ({
  page,
  app,
}) => {
  expect(
    await page.evaluate(() => {
      const [dropdown] = APP.dropdowns;

      return {
        forcedOpen: APP.toggleDropdown(dropdown, true),
        stillOpen: APP.toggleDropdown(dropdown, true),
        forcedClosed: APP.toggleDropdown(dropdown, false),
        expanded: dropdown
          .querySelector(".dropdown-button")
          .getAttribute("aria-expanded"),
      };
    }),
  ).toEqual({
    forcedOpen: true,
    stillOpen: true,
    forcedClosed: false,
    expanded: "false",
  });
});

test("suppresses navigation for javascript: links", async ({ page, app }) => {
  const url = page.url();
  await page.locator("#sidenav .nav-dropdown").first().locator("a").click();

  expect(page.url()).toBe(url);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});

test("opens the side navigation from every registered controller", async ({
  page,
  app,
}) => {
  const sidenav = page.locator("#sidenav");
  await expect(sidenav).not.toHaveClass(/open/);

  await page.locator("#open-sidenav").click();
  await expect(sidenav).toHaveClass(/open/);

  await page.locator("#close-sidenav").click();
  await expect(sidenav).not.toHaveClass(/open/);

  // Any element pointing at the drawer by id is wired up too.
  await page.locator('[data-drawer-target="sidenav"]').click();
  await expect(sidenav).toHaveClass(/open/);

  await page.locator("#close-sidenav").click();
  await expect(sidenav).not.toHaveClass(/open/);

  expect(
    await page.evaluate(() => APP.sideNavControllers.length),
  ).toBe(2);
  expect(
    await page.evaluate(() => APP.activeFlowLink?.dataset.path),
  ).toBe("/review");
});

test("expands and collapses the top navigation", async ({ page, app }) => {
  const topnav = page.locator("#topnav");
  await expect(topnav).not.toHaveClass(/expanded/);

  await page.locator("#topnav-collapse-toggle").click();
  await expect(topnav).toHaveClass(/expanded/);

  await page.locator("#topnav-collapse-toggle").click();
  await expect(topnav).not.toHaveClass(/expanded/);
});

test("opens and closes the notepad", async ({ page, app }) => {
  const notepad = page.locator("#notepad");
  await expect(notepad).toHaveClass(/closed/);

  await page.locator("#open-notepad").click();
  await expect(notepad).not.toHaveClass(/closed/);

  await page.locator("#close-notepad").click();
  await expect(notepad).toHaveClass(/closed/);
});

test("drags the notepad by its handle", async ({ page, app }) => {
  await page.locator("#open-notepad").click();

  const handle = page.locator("#notepad-handle");
  const box = await handle.boundingBox();

  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + 205, box.y + 105);
  await page.mouse.move(box.x + 305, box.y + 155);
  await page.mouse.up();

  const placement = await page.evaluate(() => ({
    left: APP.notepad.style.left,
    top: APP.notepad.style.top,
    right: APP.notepad.style.right,
    bottom: APP.notepad.style.bottom,
  }));

  expect(placement.right).toBe("auto");
  expect(placement.bottom).toBe("auto");
  expect(Number.parseFloat(placement.left)).toBeCloseTo(box.x + 300, 0);
  expect(Number.parseFloat(placement.top)).toBeCloseTo(box.y + 150, 0);

  // Pointer listeners are torn down, so a later move must not drag it.
  await page.mouse.move(box.x + 500, box.y + 500);
  expect(await page.evaluate(() => APP.notepad.style.left)).toBe(
    placement.left,
  );
});

test("does not start a drag from the notepad close button", async ({
  page,
  app,
}) => {
  await page.locator("#open-notepad").click();
  await page.locator("#close-notepad").click();

  await expect(page.locator("#notepad")).toHaveClass(/closed/);
  expect(await page.evaluate(() => APP.notepad.style.left)).toBe("");
});

test("ignores non-primary pointer buttons on the notepad handle", async ({
  page,
  app,
}) => {
  await page.locator("#open-notepad").click();
  const box = await page.locator("#notepad-handle").boundingBox();

  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(box.x + 105, box.y + 105);
  await page.mouse.up({ button: "right" });

  expect(await page.evaluate(() => APP.notepad.style.left)).toBe("");
});
