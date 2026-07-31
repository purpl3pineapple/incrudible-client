/**
 * Serves the Google-hosted documents the article frame embeds. Without
 * this the frame reaches the network, which makes the run slow, flaky, and
 * dependent on connectivity — and a failed load reports as a console
 * error, which the clean-page assertion would then catch.
 *
 * @param {import("@playwright/test").Page} page - The page to install into.
 * @returns {Promise<void[]>} Resolves once both hosts are routed.
 */
const stubGoogleDocs = (page) =>
  Promise.all(
    ["https://docs.google.com/**", "https://drive.google.com/**"].map((url) =>
      page.route(url, (route) =>
        route.fulfill({ contentType: "text/html", body: "<!doctype html>" }),
      ),
    ),
  );

export { stubGoogleDocs };
