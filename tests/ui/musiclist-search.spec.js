const { test, expect } = require("@playwright/test");

const APP_PATH = "/nemupipiano-musiclist-search/";
const EASY_DESCRIPTION = "ボタンを組み合わせて、リクエスト候補をかんたんに絞り込めます。気になる条件を選んで、少しずつ曲を探してみてください。";
const NORMAL_DESCRIPTION = "曲名やアーティスト名から、リクエストしたい曲を探せます。";

async function openApp(page) {
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
  await expect(page.locator('[data-home-random-source="playable"]')).toHaveText("リクエスト可");
  await expect(page.locator("#normalSearchControls .playable-filter-label"))
    .toHaveText("リクエスト可");
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
  await expect(page.locator("#empty")).toBeHidden();
  await expect(page.locator("#zeroResultRecommendations")).toBeVisible();
  await expect(page.locator("#songs .song-card")).toHaveCount(0);

  await search.fill("Singer");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
  await expect(page.locator("#songs .song-card .song-artist")).toHaveText("Singer");
  await expect(page.locator("#songs .badge-playable")).toHaveText("○ リクエスト可");
});

test("空白を含む検索語をひとつの語として扱い作品名は検索しない", async ({ page }) => {
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
  await search.fill("Blue Night");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
  await expect(page.locator("#songs .song-title")).toContainText("Blue Night");
  await expect(page.locator("#songs .song-artist")).toContainText("Singer A");
  await expect(page.locator("#songs mark.search-match")).toHaveCount(0);

  await search.fill("Night Singer");
  await expect(page.locator("#songs .song-card")).toHaveCount(0);

  await search.fill("星空物語");
  await expect(page.locator("#songs .song-card")).toHaveCount(0);
  await expect(page.locator('label[for="searchScopeWork"]')).toHaveCount(0);
});

test("入力候補をキーボードで選択し表記揺れ候補から再検索できる", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: [
      makeSearchSong(1, {
        displayTitle: "Blue Night",
        displayArtist: "GReeeeN",
        artistSearchWords: ["ぐりーん"],
      }),
      makeSearchSong(2, { displayTitle: "Blue Day", displayArtist: "Singer A" }),
      makeSearchSong(3, { displayTitle: "Blue Moon", displayArtist: "Singer B" }),
      makeSearchSong(4, { displayTitle: "Blue Sky", displayArtist: "Singer C" }),
    ],
  }));
  await page.reload();
  await openTab(page, "search");

  const search = page.locator("#search");
  await search.fill("Blue");
  await expect(page.locator("#searchSuggestions [role=option]")).toHaveCount(3);

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
  await expect(page.locator("#empty")).toBeHidden();
  await expect(page.locator("#zeroResultRecommendations")).toBeVisible();
  await expect(page.locator("#zeroResultRecommendationsTitle")).toHaveText(
    "一致する曲は見つかりませんでしたが、こんな曲はいかがですか？"
  );
  await expect(page.locator("#zeroResultRecommendations")).toContainText("条件には完全一致しませんが、近い曲です。");
  await expect(page.locator("#zeroResultRecommendationSongs .song-card")).toHaveCount(3);
  await page.locator("#searchAlternatives").getByRole("button", { name: /Blue Night/ }).click();
  await expect(search).toHaveValue("Blue Night");
  await expect(page.locator("#songs .song-card")).toHaveCount(1);
  await expect(page.locator("#zeroResultRecommendations")).toBeHidden();
});

test("検索条件をチップ表示し個別に解除できる", async ({ page }) => {
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
  expect(new URL(page.url()).search).toBe("");
  await expect(page.locator("#copySearchUrl")).toHaveCount(0);

  await page.getByRole("button", { name: "ジャンル：J-POPを解除" }).click();
  await expect(page.locator("#genre")).toHaveValue("");
  await expect(page.locator("#activeSearchFilterList")).not.toContainText("ジャンル：J-POP");
});

test("検索結果を30件ずつ段階表示する", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: Array.from({ length: 65 }, (_, index) => makeSearchSong(index + 1)),
  }));
  await page.reload();
  await openTab(page, "search");
  await page.locator("#search").fill("Song");

  await expect(page.locator("#songs .song-card")).toHaveCount(30);
  await expect(page.locator("#stats")).toContainText("検索結果：65件");
  await expect(page.locator("#stats")).not.toContainText("表示中");
  await expect(page.locator("#searchMore")).toHaveText("さらに30件表示 ⇒");
  const initialResultPositions = await page.evaluate(() => ({
    lastCardBottom: document.querySelector("#songs .song-card:last-child")?.getBoundingClientRect().bottom ?? 0,
    moreButtonTop: document.querySelector("#searchMore")?.getBoundingClientRect().top ?? 0,
  }));
  expect(initialResultPositions.moreButtonTop).toBeGreaterThan(initialResultPositions.lastCardBottom);
  await page.locator("#searchMore").click();
  await expect(page.locator("#songs .song-card")).toHaveCount(60);
  await expect(page.locator("#searchMore")).toHaveText("さらに5件表示 ⇒");
  await page.locator("#searchMore").click();
  await expect(page.locator("#songs .song-card")).toHaveCount(65);
  await expect(page.locator("#searchMore")).toBeHidden();
});

test("番号スライドは曲リストだけを開始・終了番号で絞り込む", async ({ page }) => {
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: [
      ...Array.from({ length: 65 }, (_, index) => makeSearchSong(index + 1)),
      makeSearchSong(66, { no: "disney#2", displayTitle: "Special Disney" }),
      makeSearchSong(67, { no: "ghibli#3", displayTitle: "Special Ghibli" }),
      makeSearchSong(68, { no: "disney#90", displayTitle: "Special Disney 90" }),
    ],
  }));
  await page.reload();
  await openTab(page, "search");
  const toggle = page.getByRole("button", { name: "番号スライド" });
  const range = page.getByRole("group", { name: "曲の番号範囲" });
  const start = range.getByRole("slider", { name: "開始番号" });
  const end = range.getByRole("slider", { name: "終了番号" });
  const search = page.locator("#search");
  const titles = page.locator("#songs .song-title");

  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(range).toBeHidden();
  await expect(titles).toHaveCount(0);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(range).toHaveText("No：1-65");
  await expect(page.locator("#stats")).toContainText("検索結果：65件");
  await expect(titles).toHaveCount(30);
  await expect(page.locator("#searchGuide")).toBeHidden();

  const track = range.locator(".song-number-track");
  await expect(track).toHaveCount(1);
  await expect(range).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await track.scrollIntoViewIfNeeded();
  const bounds = await track.boundingBox();
  const trackX = value => bounds.x + (value - 1) / 64 * bounds.width;
  const trackY = bounds.y + bounds.height / 2;
  const dragThumb = async (from, to) => {
    await page.mouse.move(trackX(from), trackY);
    await page.mouse.down();
    await page.mouse.move(trackX(to), trackY, { steps: 4 });
    await page.mouse.up();
  };
  await dragThumb(1, 10);
  await dragThumb(65, 10);
  await expect(range).toContainText("10-10");
  await dragThumb(10, 1);
  await expect(range).toContainText("1-10");
  await dragThumb(10, 65);
  await expect(range).toContainText("1-65");

  await start.press("ArrowRight");
  await end.press("Home");
  await expect(end).toHaveValue("2");
  await end.press("ArrowRight");
  await expect(range).toHaveText("No：2-3");
  await expect(titles).toHaveText(["Song 002", "Song 003"]);

  await search.fill("Song 003");
  await expect(titles).toHaveText(["Song 003"]);
  await search.fill("Special");
  await search.press("Escape");
  await expect(page.locator("#stats")).toContainText("検索結果：0件");
  await expect(page.locator("#zeroResultRecommendationSongs .song-title")).toHaveCount(2);
  await expect(page.locator("#zeroResultRecommendationSongs")).not.toContainText("Special");

  await page.getByRole("tab", { name: "かんたんモード" }).click();
  await expect(range).toBeHidden();
  await page.getByRole("tab", { name: "通常検索" }).click();
  await expect(range).toContainText("2-3");
  await page.getByRole("button", { name: "番号：2-3を解除" }).click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(range).toBeHidden();
  await expect(titles).toHaveCount(3);
  await expect(titles).toContainText(["Special Disney", "Special Disney 90", "Special Ghibli"]);
});

test("ホーム各項目を個別に開閉でき、再読み込み後も状態が復元される", async ({ page }) => {
  const toggles = page.locator("#panel-home .home-section-toggle");
  await expect(toggles).toHaveCount(5);
  for (const toggle of await toggles.all()) {
    const content = page.locator(`#${await toggle.getAttribute("aria-controls")}`);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(content).toBeHidden();
  }
  await toggles.first().focus();
  await page.keyboard.press("Enter");
  await page.reload();
  await expect(toggles.first()).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#homeWelcomeContent")).toBeVisible();
  for (const toggle of (await toggles.all()).slice(1)) {
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(`#${await toggle.getAttribute("aria-controls")}`)).toBeHidden();
  }
});

test("久しぶりの曲は選択期間内で最後のコピーが古い順に表示する", async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 8, 12));
  await page.route("**/data/musiclist.json", route => route.fulfill({
    json: Array.from({ length: 6 }, (_, index) => makeSearchSong(index + 1)),
  }));
  await page.reload();
  await page.evaluate(() => {
    localStorage.setItem("nemupipiano:copyHistory", JSON.stringify([
      { key: "song 006|artist 6", copiedAt: new Date(2026, 10, 9).toISOString() },
      { key: "song 004|artist 4", copiedAt: new Date(2026, 10, 1).toISOString() },
      { key: "song 003|artist 3", timestamp: new Date(2026, 9, 26).toISOString() },
      { key: "song 002|artist 2", copiedAt: new Date(2026, 9, 8).toISOString() },
      { key: "song 004|artist 4", copiedAt: new Date(2026, 8, 1).toISOString() },
      { key: "song 001|artist 1", copiedAt: new Date(2026, 7, 8).toISOString() },
      { key: "song 005|artist 5", copiedAt: new Date(2026, 7, 7, 23, 59).toISOString() },
    ]));
  });
  await page.locator('[data-home-random-source="all"]').click();

  const titles = page.locator("#longAgoCopiedSongs .song-title");
  await expect(page.getByRole("button", { name: "3ヵ月前まで" })).toHaveAttribute("aria-pressed", "true");
  await expect(titles).toHaveText(["Song 001", "Song 002", "Song 003", "Song 004"]);
  await page.getByRole("button", { name: "1ヵ月前まで" }).click();
  await expect(titles).toHaveText(["Song 002", "Song 003", "Song 004"]);
  await page.getByRole("button", { name: "先週まで" }).click();
  await expect(titles).toHaveText(["Song 003", "Song 004"]);
});

test("320px幅・大きい文字設定でも久しぶりの曲の期間選択が1行に収まる", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => localStorage.setItem("nemupipiano:appPanelFontSize", "large"));
  await page.reload();
  const options = page.getByRole("group", { name: "久しぶりの曲の表示期間" });
  await expect(options).toBeVisible();
  const { singleRow, labelsFit } = await options.getByRole("button").evaluateAll(buttons => ({
    singleRow: buttons.every(button => button.offsetTop === buttons[0].offsetTop),
    labelsFit: buttons.every(button => button.scrollWidth <= button.clientWidth),
  }));
  expect(singleRow).toBe(true);
  expect(labelsFit).toBe(true);
});

test("条件をクリアは詳細欄だけを初期化し、検索結果も更新する", async ({ page }) => {
  await openTab(page, "search");
  await page.locator('label[for="searchScopeTitle"]').click();
  await page.locator("#playableFilter").click();
  await page.locator("#search").fill("夜");
  await page.locator("#search").press("Escape");
  const resultsBefore = await page.locator("#stats").textContent();

  await page.locator("#searchDetailToggle").click();
  const filters = page.locator("#searchDetails select:not(#sortOrder)");
  await expect(filters).toHaveCount(6);
  for (const filter of await filters.all()) {
    await filter.selectOption({ index: 1 });
  }
  await page.locator("#sortOrder").selectOption("title");
  await page.getByRole("button", { name: "条件をクリア" }).click();
  for (const filter of await filters.all()) {
    await expect(filter).toHaveValue("");
  }
  await expect(page.locator("#sortOrder")).toHaveValue("playable");
  await expect(page.locator("#search")).toHaveValue("夜");
  await expect(page.locator("#searchScopeTitle")).toBeChecked();
  await expect(page.locator("#playableFilter")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#stats")).toHaveText(resultsBefore);
  await page.reload();
  await expect(page.locator("#animeDrama")).toHaveValue("");
  await expect(page.locator("#sortOrder")).toHaveValue("playable");
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
