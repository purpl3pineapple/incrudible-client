import { expect, test } from "./setup.js";
import { mountSchema } from "./helpers/index.js";
import { stubGoogleDocs } from "./mocks/index.js";

const articleSchema = [
  {
    type: "select",
    id: "resource",
    name: "resource",
    label: "Resource",
    options: [
      { label: "Choose", value: "" },
      { label: "Doc", value: "doc" },
      { label: "Form", value: "form" },
      { label: "Pdf", value: "pdf" },
      { label: "Unsupported", value: "unsupported" },
    ],
  },
];

const articleRules = {
  resource: [
    {
      test: "Doc",
      article: {
        header: "Handling *guide*",
        resource: { type: "doc", id: "doc-123" },
      },
    },
    {
      test: "Form",
      article: { resource: { type: "form", id: "form-123" } },
    },
    {
      test: "Pdf",
      article: { resource: { type: "pdf", id: " pdf-123 " } },
    },
    {
      test: "Unsupported",
      article: { resource: { type: "slides", id: "slides-123" } },
    },
  ],
};

test("shows the matching article for each supported resource type", async ({
  page,
  app,
}) => {
  await stubGoogleDocs(page);
  await mountSchema(page, { schema: articleSchema, rules: { articleRules } });

  const article = page.locator("#workflow-article");
  const frame = page.locator("#workflow-article-frame");
  await expect(article).toBeHidden();

  await page.locator("#resource").selectOption("doc");
  await expect(article).toBeVisible();
  await expect(frame).toHaveAttribute(
    "src",
    "https://docs.google.com/document/d/doc-123/preview",
  );
  // The header is inline markdown, and the frame borrows its plain text.
  await expect(page.locator("#workflow-article-header")).toContainText(
    "Handling guide",
  );
  await expect(page.locator("#workflow-article-header em")).toHaveText("guide");
  await expect(frame).toHaveAttribute("title", "Handling guide");

  await page.locator("#resource").selectOption("form");
  await expect(frame).toHaveAttribute(
    "src",
    "https://docs.google.com/forms/d/e/form-123/viewform?embedded=true",
  );
  // A header-less article falls back to the default title.
  await expect(page.locator("#workflow-article-header")).toHaveText(
    "Additional workflow",
  );

  await page.locator("#resource").selectOption("pdf");
  // Surrounding whitespace in the resource id is trimmed out of the URL.
  await expect(frame).toHaveAttribute(
    "src",
    "https://drive.google.com/file/d/pdf-123/preview",
  );
});

test("hides the article when no rule matches or the type is unsupported", async ({
  page,
  app,
}) => {
  await stubGoogleDocs(page);
  await mountSchema(page, { schema: articleSchema, rules: { articleRules } });

  await page.locator("#resource").selectOption("doc");
  await expect(page.locator("#workflow-article")).toBeVisible();

  // An unrecognized resource type is treated as no article at all.
  await page.locator("#resource").selectOption("unsupported");
  await expect(page.locator("#workflow-article")).toBeHidden();
  await expect(page.locator("#workflow-article-frame")).not.toHaveAttribute(
    "src",
  );

  await page.locator("#resource").selectOption("doc");
  await expect(page.locator("#workflow-article")).toBeVisible();

  await page.locator("#resource").selectOption("");
  await expect(page.locator("#workflow-article")).toBeHidden();
});

test("rejects articles without a usable resource id", async ({ page, app }) => {
  await stubGoogleDocs(page);
  const outcomes = await page.evaluate(() => [
    APP._internals.showArticle(),
    APP._internals.showArticle({ resource: { type: "doc" } }),
    APP._internals.showArticle({ resource: { type: "doc", id: "   " } }),
    APP._internals.showArticle({ resource: { type: "doc", id: 42 } }),
    APP._internals.showArticle({ resource: { type: "doc", id: "ok" } }),
  ]);

  expect(outcomes).toEqual([false, false, false, false, true]);
});

test("keeps the frame source stable across repeated syncs", async ({
  page,
  app,
}) => {
  await stubGoogleDocs(page);
  await mountSchema(page, { schema: articleSchema, rules: { articleRules } });
  await page.locator("#resource").selectOption("doc");

  const frame = page.locator("#workflow-article-frame");
  await expect(frame).toHaveAttribute(
    "src",
    "https://docs.google.com/document/d/doc-123/preview",
  );

  // Re-syncing with the same match must not reassign src and reload the
  // iframe; track it by watching for a second load event.
  const reloads = await page.evaluate(async () => {
    let loads = 0;
    APP.workflowArticleFrame.addEventListener("load", () => (loads += 1));

    for (let i = 0; i < 3; i++) {
      APP.formHelpers.syncArticles();
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    return loads;
  });

  expect(reloads).toBe(0);
  await expect(frame).toHaveAttribute(
    "src",
    "https://docs.google.com/document/d/doc-123/preview",
  );
});

test("reports failure when the article surface is missing", async ({
  page,
  app,
}) => {
  await stubGoogleDocs(page);
  const shown = await page.evaluate(() => {
    const article = document.getElementById("workflow-article");
    article.remove();

    const result = APP._internals.showArticle({
      resource: { type: "doc", id: "doc-123" },
    });

    document.body.append(article);
    return result;
  });

  expect(shown).toBe(false);
});

test("matches article rules keyed by control name and gated by dependencies", async ({
  page,
  app,
}) => {
  await stubGoogleDocs(page);
  await mountSchema(page, {
    schema: [
      { type: "checkbox", id: "escalated", name: "escalated", label: "Escalated" },
      ...["first", "second"].map((value) => ({
        type: "radio",
        id: `${value}-code`,
        name: "code",
        label: `${value} code`,
        value,
      })),
    ],
    rules: {
      articleRules: {
        // One key, two controls sharing the name — values are collected
        // across every match before the test runs.
        code: [
          {
            test: "second",
            when: [["escalated", true]],
            article: { resource: { type: "doc", id: "escalation" } },
          },
        ],
      },
    },
  });

  await page.locator("#second-code").check();
  await expect(page.locator("#workflow-article")).toBeHidden();

  await page.locator("#escalated").check();
  await expect(page.locator("#workflow-article")).toBeVisible();
  await expect(page.locator("#workflow-article-frame")).toHaveAttribute(
    "src",
    "https://docs.google.com/document/d/escalation/preview",
  );

  await page.locator("#first-code").check();
  await expect(page.locator("#workflow-article")).toBeHidden();
});
