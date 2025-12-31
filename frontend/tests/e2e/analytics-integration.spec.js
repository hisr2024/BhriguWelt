const { test, expect } = require("@playwright/test");

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const mockHoroscope = {
  name: "Asha Iyer",
  karmic_epoch: "Bhrigu epoch: dharma-led service.",
  interpretation: "The folios describe steady mentorship with practical rituals.",
  interpretation_hi: "भृगु पांडुलिपियाँ स्थिर मार्गदर्शन और व्यावहारिक अनुष्ठान दर्शाती हैं।",
  weights: {
    intuitive_dreams: 0.92,
  },
  principles: [
    {
      id: "BR-12B",
      sutra_reference: "Bikaner folio 12b",
      description: "Guarding dharma through disciplined service.",
    },
  ],
  remedies: [
    {
      id: "REM-12B",
      sutra_reference: "Bikaner folio 12b",
      description: "Offer water at dawn to steady lunar rhythms.",
    },
  ],
  rashi_chart: SIGNS.map((sign, index) => ({
    index: index + 1,
    sign,
    occupants: index === 0 ? ["Asc"] : ["—"],
    bhrigu_notes: [],
  })),
  bhava_chart: SIGNS.map((sign, index) => ({
    index: index + 1,
    sign,
    occupants: index === 1 ? ["Moon"] : ["—"],
    bhrigu_notes: [],
  })),
  dashas: [
    { lord: "Ketu", start: "2000-01-01", end: "2007-12-30", anchor_rule: "Anchor rule 1" },
    { lord: "Venus", start: "2007-12-30", end: "2027-12-22", anchor_rule: "Anchor rule 2" },
  ],
};

test("analytics dashboard highlights the tool inventory", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "All 13 tools" })).toBeVisible();
  await expect(page.locator(".tool-card")).toHaveCount(13);
  await expect(page.getByText(/Operational/i)).toBeVisible();
});

test("birth chart surfaces folio citations from backend payloads", async ({ page }) => {
  await page.route("**/horoscope", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockHoroscope),
    });
  });

  await page.route("**/profiles", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: 118, user_id: "asha-user" }),
    });
  });

  await page.goto("/birth-chart");

  await page.getByLabel(/Full name/i).fill("Asha Iyer");
  await page.getByLabel(/Birth date/i).fill("1994-11-08");
  await page.getByLabel(/Birth time/i).fill("05:40");
  await page.getByLabel(/Birth place/i).fill("Chennai, Bharat");
  await page.getByRole("button", { name: /fetch insights/i }).click();

  const results = page.getByRole("status", { name: /results/i });
  await expect(results).toContainText("Guiding sutras");
  await expect(results).toContainText("Bikaner folio 12b");
});

test("invalid lunar tithi blocks submission with a focused error", async ({ page }) => {
  await page.goto("/birth-chart");

  await page.getByLabel(/Full name/i).fill("Asha Iyer");
  await page.getByLabel(/Birth date/i).fill("1994-11-08");
  await page.getByLabel(/Birth time/i).fill("05:40");
  await page.getByLabel(/Birth place/i).fill("Chennai, Bharat");
  await page.getByLabel(/Lunar tithi/i).fill("31");
  await page.getByRole("button", { name: /fetch insights/i }).click();

  await expect(page.getByRole("alert")).toContainText("Lunar tithi must be 1-30.");
});

test("offline mode shows the reconnection notice", async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto("/birth-chart");

  await page.getByLabel(/Full name/i).fill("Asha Iyer");
  await page.getByLabel(/Birth date/i).fill("1994-11-08");
  await page.getByLabel(/Birth time/i).fill("05:40");
  await page.getByLabel(/Birth place/i).fill("Chennai, Bharat");
  await page.getByRole("button", { name: /fetch insights/i }).click();

  await expect(page.getByRole("alert")).toContainText(
    "Offline detected. Reconnect or retry to refresh predictions.",
  );
  await context.setOffline(false);
});

test("language toggle switches to Hindi navigation copy", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel(/language/i).selectOption("hi");
  await expect(page.getByRole("link", { name: "स्टूडियो आज़माएँ" })).toBeVisible();
});
