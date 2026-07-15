const { defineConfig, devices } = require("@playwright/test");

const baseURL = "http://127.0.0.1:4173";
const serverCommand = process.env.UI_TEST_SERVER_COMMAND
  || (process.platform === "win32" ? "python -m http.server 4173" : "python3 -m http.server 4173");

module.exports = defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : "line",
  use: {
    baseURL,
    permissions: ["clipboard-read", "clipboard-write"],
    trace: "on-first-retry",
  },
  webServer: {
    command: serverCommand,
    url: `${baseURL}/nemupipiano-musiclist-search/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
