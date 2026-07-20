const { test, expect } = require("@playwright/test");

const APP_PATH = "/nemupipiano-musiclist-search/";
const EASY_DESCRIPTION = "ボタンを組み合わせて、リクエスト候補をかんたんに絞り込めます。気になる条件を選んで、少しずつ曲を探してみてください。";
const NORMAL_DESCRIPTION = "曲名やアーティスト名から、リクエストしたい曲を探せます。";

async function openApp(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(APP_PATH);
  await expect(page.locator("#homeRecommendations .song-card").first()).toBeVisible();
}

async function openTab(page, tabName) {
  await page.locator(`[data-tab="${tabName}"]`).click();
  await expect(page.locator(`#panel-${tabName}`)).toBeVisible();
}

function makeSearchSong(index, overrides = {}) {
  const title = overrides.displayTitle || `Song ${String(index).padStart(3, "0")}`;
  const artist = overrides.displayArtist || `Artist ${index}`;
  return {
    no: `list#${index}`,
    displayTitle: title,
    displayArtist: artist,
    songKey: `${title.toLowerCase()}|${artist.toLowerCase()}`,
    sourceTitle: title,
    sourceArtist: artist,
    titleSearchWords: [],
    artistSearchWords: [],
    classification: { genres: ["J-POP"], subgenres: [], sourceCategories: [], vocalTypes: [] },
    tieUps: [],
    playable: "○",
    genre: "J-POP",
    ...overrides,
  };
}

test.beforeEach(async ({ page }) => {
  await page.route("**/googletagmanager.com/**", route => route.abort());
  await openApp(page);
});

test("検索ガイドは初期表示後、入力を消しても自動で再展開しない", async ({ page }) => {
  await openTab(page, "search");

  const guideToggle = page.locator("#searchGuideToggle");
  const guide = page.locator("#searchGuide");
  const search = page.locator("#search");

  await expect(guideToggle).toHaveAttribute("aria-expanded", "true");
  await expect(guide).toBeVisible();

  await search.fill("夜");
  await expect(guideToggle).toHaveAttribute("aria-expanded", "false");
  await expect(guide).toBeHidden();

  await search.fill("");
  await expect(guideToggle).toHaveAttribute("aria-expanded", "false");
  await expect(guide).toBeHidden();
});

test("通常検索とかんたんモードをタブで切り替えられる", async ({ page }) => {
  await openTab(page, "search");

  const normalTab = page.getByRole("tab", { name: "通常検索" });
  const easyTab = page.getByRole("tab", { name: "かんたんモード" });
  const description = page.locator("#searchModeDescription");

  await expect(normalTab).toHaveAttribute("aria-selected", "true");
  await expect(easyTab).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#normalSearchControls")).toBeVisible();
  await expect(page.locator("#easySearchPanel")).toBeHidden();
  await expect(description).toHaveText(NORMAL_DESCRIPTION);

  await easyTab.click();
  await expect(normalTab).toHaveAttribute("aria-selected", "false");
  await expect(easyTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#normalSearchControls")).toBeHidden();
  await expect(page.locator("#easySearchPanel")).toBeVisible();
  await expect(description).toHaveText(EASY_DESCRIPTION);

  await easyTab.press("ArrowLeft");
  await expect(normalTab).toBeFocused();
  await expect(normalTab).toHaveAttribute("aria-selected", "true");
  await expect(description).toHaveText(NORMAL_DESCRIPTION);
});

test("曲単位補正で除外した元アーティストは検索対象にしない", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: [
      {
        no: "list#1",
        displayTitle: "Target Song",
        displayArtist: "Singer",
        songKey: "target song|singer",
        sourceTitle: "Target Song",
        sourceArtist: "Composer",
        includeSourceArtistInSearch: false,
        titleSearchWords: [],
        artistSearchWords: [],
        playable: "○",
        genre: "J-POP",
      },
    ],
  }));
  await page.reload();
  await openTab(page, "search");

  const search = page.locator("#search");
  await search.fill("Composer");
  await expect(page.locator("#empty")).toBeVisible();
  await expect(page.locator("#songs .song-card")).toHaveCount(0);

  await search.fill("Singer");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
  await expect(page.locator("#songs .song-card .song-artist")).toHaveText("Singer");
});

test("空白区切りのAND検索と作品名検索に対応する", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: [
      makeSearchSong(1, {
        displayTitle: "Blue Night",
        displayArtist: "Singer A",
        tieUps: [{ series: "星空アニメ", workTitle: "星空物語", role: "主題歌" }],
      }),
      makeSearchSong(2, { displayTitle: "Blue Day", displayArtist: "Singer B" }),
    ],
  }));
  await page.reload();
  await openTab(page, "search");

  const search = page.locator("#search");
  await search.fill("Night Singer");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
  await expect(page.locator("#songs .song-title")).toContainText("Blue Night");
  await expect(page.locator("#songs .song-title mark.search-match")).toHaveText(/night/i);
  await expect(page.locator("#songs .song-artist")).toContainText("Singer A");

  await page.locator('label[for="searchScopeWork"]').click();
  await search.fill("星空物語");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
  await expect(page.locator("#songs .song-search-context")).toContainText("作品：星空物語");
  await expect(page.locator("#songs .song-search-context mark.search-match")).toHaveText("星空物語");
});

test("入力候補をキーボードで選択し表記揺れ候補から再検索できる", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: [
      makeSearchSong(1, {
        displayTitle: "Blue Night",
        displayArtist: "GReeeeN",
        artistSearchWords: ["ぐりーん"],
      }),
    ],
  }));
  await page.reload();
  await openTab(page, "search");

  const search = page.locator("#search");
  await search.fill("ぐりー");
  await expect(search).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#searchSuggestions [role=option]")).toContainText(["GReeeeN"]);
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(search).toHaveValue("GReeeeN");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);

  await search.fill("Bluu Night");
  await expect(page.locator("#songs .song-card")).toHaveCount(0);
  await expect(page.locator("#searchAlternatives")).toBeVisible();
  await expect(page.locator("#searchAlternatives")).toContainText("Blue Night");
  await page.getByRole("button", { name: /Blue Night/ }).click();
  await expect(search).toHaveValue("Blue Night");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
});

test("検索条件をチップとURLへ同期しURLから復元する", async ({ page }) => {
  await openTab(page, "search");
  const search = page.locator("#search");
  await search.fill("夜");
  await search.press("Escape");
  await page.locator('label[for="searchScopeTitle"]').click();
  await page.locator("#searchDetailToggle").click();
  await page.locator("#genre").selectOption({ label: "J-POP" });

  await expect(page.locator("#activeSearchFilters")).toBeVisible();
  await expect(page.locator("#activeSearchFilterList")).toContainText("キーワード：夜");
  await expect(page.locator("#activeSearchFilterList")).toContainText("検索対象：曲名");
  await expect(page.locator("#activeSearchFilterList")).toContainText("ジャンル：J-POP");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("夜");
  expect(new URL(page.url()).searchParams.get("scope")).toBe("title");
  expect(new URL(page.url()).searchParams.get("genre")).toBe("J-POP");

  await page.reload();
  await expect(page.locator("#panel-search")).toBeVisible();
  await expect(search).toHaveValue("夜");
  await expect(page.locator("#searchScopeTitle")).toBeChecked();
  await expect(page.locator("#genre")).toHaveValue("J-POP");

  await page.getByRole("button", { name: "ジャンル：J-POPを解除" }).click();
  await expect(page.locator("#genre")).toHaveValue("");
  await expect.poll(() => new URL(page.url()).searchParams.has("genre")).toBe(false);
});

test("検索結果を30件ずつ段階表示する", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: Array.from({ length: 65 }, (_, index) => makeSearchSong(index + 1)),
  }));
  await page.reload();
  await openTab(page, "search");
  await page.locator("#search").fill("Song");

  await expect(page.locator("#songs .song-card")).toHaveCount(30);
  await expect(page.locator("#searchMore")).toHaveText("さらに30件表示 ⇒");
  await page.locator("#searchMore").click();
  await expect(page.locator("#songs .song-card")).toHaveCount(60);
  await expect(page.locator("#searchMore")).toHaveText("さらに5件表示 ⇒");
  await page.locator("#searchMore").click();
  await expect(page.locator("#songs .song-card")).toHaveCount(65);
  await expect(page.locator("#searchMore")).toBeHidden();
});

test("かんたんモードは1カテゴリずつ展開し候補を自動更新する", async ({ page }) => {
  await openTab(page, "search");
  await page.getByRole("tab", { name: "かんたんモード" }).click();

  const genre = page.locator('[data-easy-toggle="genre"]');
  const artist = page.locator('[data-easy-toggle="artist"]');
  const mood = page.locator('[data-easy-toggle="mood"]');
  await expect(genre).toHaveAttribute("aria-expanded", "true");
  await expect(artist).toHaveAttribute("aria-expanded", "false");
  await expect(mood).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#easyRefresh")).toHaveCount(0);

  const artistOptions = page.locator('#easy-category-artist [data-easy-option]');
  const artistsBeforeSelection = await artistOptions.allTextContents();
  await page.locator('[data-easy-category="genre"][data-easy-option="アニメ"]').click();
  await expect.poll(() => artistOptions.allTextContents()).not.toEqual(artistsBeforeSelection);
  await expect(genre.locator(".easy-category-selected")).toHaveCount(0);

  await artist.click();
  await expect(genre).toHaveAttribute("aria-expanded", "false");
  await expect(artist).toHaveAttribute("aria-expanded", "true");
  await expect(mood).toHaveAttribute("aria-expanded", "false");
  await expect(genre.locator(".easy-category-selected")).toHaveText("アニメ");
  await expect(page.locator("#easy-category-genre")).toBeHidden();
  await expect(page.locator("#easy-category-artist")).toBeVisible();

  const more = page.locator("#easy-category-artist .easy-more-button");
  if (await more.count()) {
    const [bodyBox, moreBox] = await Promise.all([
      page.locator("#easy-category-artist").boundingBox(),
      more.boundingBox(),
    ]);
    expect(Math.abs((bodyBox.x + bodyBox.width) - (moreBox.x + moreBox.width))).toBeLessThan(2);
  }
});

test("ふわっと検索のタブと内容がアクセシブルに関連付く", async ({ page }) => {
  await openTab(page, "fuzzy");

  const activeCategory = page.locator("#fuzzyCategoryTabs [role=tab][aria-selected=true]");
  const content = page.locator("#fuzzyCategoryContent");
  await expect(activeCategory).toHaveCount(1);
  await expect(content).toHaveAttribute("aria-labelledby", await activeCategory.getAttribute("id"));
  await expect(page.locator("#fuzzyCategoryScrollPrev")).toHaveAttribute("aria-label", "前のカテゴリを表示");
  await expect(page.locator("#fuzzyCategoryScrollNext")).toHaveAttribute("aria-label", "次のカテゴリを表示");
});

test("スマホのふわっと検索は矢印からカテゴリを横移動できる", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "スマホ表示専用の挙動");
  await openTab(page, "fuzzy");

  const tabs = page.locator("#fuzzyCategoryTabs");
  const next = page.getByRole("button", { name: "次のカテゴリを表示" });
  await expect(page.locator("#fuzzyCategoryScroll")).toHaveClass(/has-overflow/);
  await expect(next).toBeVisible();
  await expect(next).toBeEnabled();

  await next.click();
  await expect.poll(() => tabs.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "前のカテゴリを表示" })).toBeEnabled();
});

test("曲カードは情報領域とコピー・詳細ボタンを分離している", async ({ page }) => {
  const card = page.locator("#homeRecommendations article.song-card").first();
  const copyButton = card.locator(":scope > button.song-card-copy");
  const detailButton = card.locator(":scope > button.song-card-menu");

  await expect(card).not.toHaveAttribute("role", "button");
  await expect(copyButton).toHaveCount(1);
  await expect(detailButton).toHaveCount(1);
  await expect(copyButton).toHaveAccessibleName(/をリクエスト形式でコピー$/);
  await expect(detailButton).toHaveAccessibleName(/の詳細を開く$/);
  await expect(detailButton.locator(".theme-icon-light")).toHaveAttribute("src", "../lib/icon/white/detail.svg");

  await copyButton.click();
  await expect(page.locator("#copyToastMessage")).toHaveText("クリップボードにコピーしました！");

  await detailButton.click();
  await expect(page.locator("#songDetailModal")).toBeVisible();
  await expect(page.locator("#songDetailModalLabel")).toHaveText("曲の詳細");
  await expect(page.locator("#songDetailModal .btn-close")).toHaveAccessibleName("閉じる");
});

test("ハンバーガーメニューから使い方と設定を開ける", async ({ page }) => {
  const menuButton = page.getByRole("button", { name: "メニュー", exact: true });
  const menu = page.getByRole("menu", { name: "サイトメニュー" });
  await expect(page.locator(".site-navbar").getByRole("button", { name: "使い方" })).toHaveCount(0);
  await expect(menuButton.locator("img")).toHaveAttribute("src", "../lib/icon/white/menu.svg");

  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "使い方" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "設定" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await page.getByRole("menuitem", { name: "設定" }).click();
  await expect(page.locator("#settingsModal")).toBeVisible();
  await expect(page.locator("#floatingMenu")).toBeHidden();
  await page.locator("#settingsModal .btn-close").click();

  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await page.getByRole("menuitem", { name: "使い方" }).click();
  await expect(page.locator("#informationModal")).toBeVisible();
});

test("ヘッダーはタブレットとスマホの下方向スクロール時だけ隠れる", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "表示幅ごとの挙動を1プロジェクトで検証");
  const navbar = page.locator("#siteNavbar");

  for (const width of [900, 390]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.setViewportSize({ width, height: 600 });
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(navbar).toHaveClass(/is-hidden/);
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(navbar).not.toHaveClass(/is-hidden/);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(navbar).not.toHaveClass(/is-hidden/);
});

test("スキップリンクで本文へキーボード移動できる", async ({ page }) => {
  const skipLink = page.getByRole("link", { name: "本文へスキップ" });
  const main = page.locator("#mainContent");

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
});
