import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	workers: 1,
	use: {
		baseURL: "http://127.0.0.1:4173",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
	webServer: {
		command: "npx http-server . --port 4173 --silent",
		url: "http://127.0.0.1:4173/tests/fixture.html",
		reuseExistingServer: true,
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
});