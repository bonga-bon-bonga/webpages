const MUSICLIST_JSON_PATH = "./data/musiclist.json";
const FUZZY_SEARCH_PRESETS_JSON_PATH = "./data/fuzzy-search-presets.json";
const PERFORMANCE_PREVIEW_JSON_PATH = "./data/performance_preview.json";
const HOME_RECOMMEND_COUNT = 5;
const HOME_MOOD_RESULT_COUNT = 3;
const FUZZY_RESULT_INITIAL_COUNT = 5;
const FUZZY_RESULT_STEP = 5;
const FUZZY_RESULT_MAX_COUNT = 30;
const FUZZY_MAX_TIER = 3;
const EASY_OPTION_INITIAL_COUNT = 8;
const EASY_OPTION_STEP = 8;
const EASY_CATEGORIES = [
  { key: "genre", label: "ジャンル" },
  { key: "artist", label: "アーティスト" },
  { key: "mood", label: "曲の雰囲気" },
];
const EASY_GENRE_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "J-POP", label: "J-POP" },
  { value: "アニメ", label: "アニメ" },
  { value: "ボカロ", label: "ボカロ" },
  { value: "ジブリ", label: "ジブリ" },
  { value: "ディズニー", label: "ディズニー" },
  { value: "映画", label: "映画" },
  { value: "ドラマ", label: "ドラマ" },
  { value: "ゲーム", label: "ゲーム" },
  { value: "ロック", label: "ロック" },
];
const EASY_MOOD_OPTIONS = [
  { value: "かわいい", label: "かわいい", tags: ["かわいい"] },
  { value: "かっこいい", label: "かっこいい", tags: ["かっこいい"] },
  { value: "しっとり", label: "しっとり", tags: ["穏やか", "優しい", "癒し"] },
  { value: "元気", label: "元気", tags: ["元気", "明るい"] },
  { value: "切ない", label: "切ない", tags: ["切ない", "泣ける", "儚い"] },
  { value: "楽しい", label: "楽しい", tags: ["楽しい"] },
  { value: "爽やか", label: "爽やか", tags: ["爽やか"] },
  { value: "疾走感", label: "疾走感", tags: ["疾走感"] },
  { value: "ミステリアス", label: "ミステリアス", tags: ["ミステリアス"] },
  { value: "ダーク", label: "ダーク", tags: ["ダーク", "不穏"] },
];
const THEME_KEY = "nemupipiano:theme";
const APP_PANEL_FONT_SIZE_KEY = "nemupipiano:appPanelFontSize";
const ACTIVE_TAB_KEY = "nemupipiano:activeTab";
const SEARCH_SCOPE_KEY = "nemupipiano:searchScope";
const DISPLAY_COLUMNS_KEY = "nemupipiano:displayColumns";
const PLAYABLE_ONLY_KEY = "nemupipiano:playableOnly";
const SORT_ORDER_KEY = "nemupipiano:sortOrder";
const ANIME_DRAMA_KEY = "nemupipiano:animeDrama";
const HOME_RANDOM_SOURCE_KEY = "nemupipiano:homeRandomSource";
const FAVORITES_KEY = "nemupipiano:favorites";
const FAVORITES_ONLY_KEY = "nemupipiano:favoritesOnly";
const COPY_COUNTS_KEY = "nemupipiano:copyCounts";
const COPY_HISTORY_KEY = "nemupipiano:copyHistory";
const ACCENT_COLOR_KEY = "nemupipiano:accentColor";
const LONG_PRESS_MS = 1000;
const COPY_HISTORY_LIMIT = 500;

const els = {
  search: document.getElementById("search"),
  searchScopes: document.querySelectorAll("[name='searchScope']"),
  displayColumns: document.querySelectorAll("[name='displayColumns']"),
  genre: document.getElementById("genre"),
  sortOrder: document.getElementById("sortOrder"),
  subgenre: document.getElementById("subgenre"),
  sourceCategory: document.getElementById("sourceCategory"),
  animeDrama: document.getElementById("animeDrama"),
  vocalType: document.getElementById("vocalType"),
  releaseDecade: document.getElementById("releaseDecade"),
  clearFavorites: document.getElementById("clearFavorites"),
  favoriteFilter: document.getElementById("favoriteFilter"),
  searchDetailToggle: document.getElementById("searchDetailToggle"),
  searchDetails: document.getElementById("searchDetails"),
  searchGuideToggle: document.getElementById("searchGuideToggle"),
  searchGuide: document.getElementById("searchGuide"),
  fuzzySearchModeToggle: document.getElementById("fuzzySearchModeToggle"),
  normalSearchPanel: document.getElementById("normalSearchPanel"),
  fuzzySearchPanel: document.getElementById("fuzzySearchPanel"),
  fuzzyCategoryScroll: document.getElementById("fuzzyCategoryScroll"),
  fuzzyCategoryScrollPrev: document.getElementById("fuzzyCategoryScrollPrev"),
  fuzzyCategoryScrollNext: document.getElementById("fuzzyCategoryScrollNext"),
  fuzzyCategoryTabs: document.getElementById("fuzzyCategoryTabs"),
  fuzzyCategoryContent: document.getElementById("fuzzyCategoryContent"),
  fuzzyResultSummary: document.getElementById("fuzzyResultSummary"),
  fuzzySongs: document.getElementById("fuzzySongs"),
  fuzzyEmpty: document.getElementById("fuzzyEmpty"),
  fuzzyMore: document.getElementById("fuzzyMore"),
  easyModeToggle: document.getElementById("easyModeToggle"),
  searchModeDescription: document.getElementById("searchModeDescription"),
  easySearchPanel: document.getElementById("easySearchPanel"),
  easySelectedConditions: document.getElementById("easySelectedConditions"),
  easyRefresh: document.getElementById("easyRefresh"),
  easyRefreshStatus: document.getElementById("easyRefreshStatus"),
  easyCategoryList: document.getElementById("easyCategoryList"),
  easyReset: document.getElementById("easyReset"),
  playableFilter: document.getElementById("playableFilter"),
  stats: document.getElementById("stats"),
  songs: document.getElementById("songs"),
  empty: document.getElementById("empty"),
  homeRandomOptions: document.querySelectorAll("[data-home-random-source]"),
  homeRecommendations: document.getElementById("homeRecommendations"),
  homeRecommendEmpty: document.getElementById("homeRecommendEmpty"),
  homeMoodOptions: document.getElementById("homeMoodOptions"),
  homeMoodSongs: document.getElementById("homeMoodSongs"),
  homeMoodEmpty: document.getElementById("homeMoodEmpty"),
  homeFuzzyLink: document.getElementById("homeFuzzyLink"),
  copyHistorySongs: document.getElementById("copyHistorySongs"),
  copyHistoryEmpty: document.getElementById("copyHistoryEmpty"),
  tabs: document.querySelectorAll("[data-tab]"),
  panels: document.querySelectorAll(".tab-panel"),
  copyToast: document.getElementById("copyToast"),
  siteFooter: document.querySelector(".site-footer"),
  backToTop: document.getElementById("backToTop"),
  settingsButton: document.getElementById("settingsButton"),
  appPanel: document.getElementById("appPanel"),
  themeModes: document.querySelectorAll("[name='themeMode']"),
  panelFontSizes: document.querySelectorAll("[name='panelFontSize']"),
  accentColors: document.querySelectorAll("[name='accentColor']"),
  informationModal: document.getElementById("informationModal"),
  songDetailModal: document.getElementById("songDetailModal"),
  songDetailBody: document.getElementById("songDetailBody"),
};

const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const easyAccordionQuery = window.matchMedia("(max-width: 575.98px)");
let songs = [];
let homeRecommendedSongs = [];
let homeMoodSuggestions = [];
let activeHomeMoodIndex = null;
let playableOnly = false;
let homeRandomSource = "all";
let favoriteOnly = false;
let favoriteKeys = new Set();
let displayColumnCount = "3";
let accentColorEnabled = true;
let activeDetailSongKey = "";
let longPressTimer = null;
let longPressHandled = false;
let longPressSuppressTimer = null;
let longPressStartX = 0;
let longPressStartY = 0;
let lastSearchGuideHasKeyword = null;
let searchGuideAutoInitialized = false;
let footerScrollTimer = null;
let fuzzySearchPresets = [];
let performancePreviews = {};
let fuzzySearchMode = false;
let activeFuzzyCategoryIndex = 0;
let activeFuzzyItemIndex = null;
let fuzzyResultLimit = FUZZY_RESULT_INITIAL_COUNT;
let fuzzyVisibleTier = 1;
let pendingAnimeDramaValue = "";
let easySearchMode = false;
let easySelections = {
  genre: new Set(),
  artist: new Set(),
  mood: new Set(),
};
let easyVisibleCounts = {
  genre: EASY_OPTION_INITIAL_COUNT,
  artist: EASY_OPTION_INITIAL_COUNT,
  mood: EASY_OPTION_INITIAL_COUNT,
};
let easyOptionStale = {
  genre: false,
  artist: false,
  mood: false,
};
let easyOptionSnapshots = {
  genre: null,
  artist: null,
  mood: null,
};
let easyCategoryOpen = {
  genre: true,
  artist: true,
  mood: true,
};

// HTMLエスケープを行う関数。& < > " ' をそれぞれ対応するHTMLエンティティに置換する。nullやundefinedも空文字に変換する。
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];

  return values
    .map(value => normalizeCellText(value))
    .filter(Boolean);
}

function normalizeTieUps(values) {
  if (!Array.isArray(values)) return [];

  return values
    .filter(value => value && typeof value === "object" && !Array.isArray(value))
    .map(value => ({
      series: normalizeCellText(value.series),
      workTitle: normalizeCellText(value.workTitle),
      role: normalizeCellText(value.role),
    }))
    .filter(value => value.series || value.workTitle || value.role);
}

function normalizeMusiclistItems(data) {
  if (Array.isArray(data)) {
    return data.map(normalizeMusiclistSong).filter(song => song.title || song.artist);
  }

  if (Array.isArray(data?.items)) {
    return data.items.map(normalizeMusiclistSong).filter(song => song.title || song.artist);
  }

  const items = data?.items || {};
  return Object.entries(items).map(([key, value]) => {
    const [title = "", artist = ""] = normalizeCellText(key).split("|");
    return normalizeMusiclistSong({
      ...(value || {}),
      displayTitle: title,
      displayArtist: artist,
      sourceTitle: title,
      sourceArtist: artist,
      songKey: createSongKey(title, artist),
    });
  }).filter(song => song.title || song.artist);
}

function normalizeMusiclistSong(item) {
  const displayTitle = normalizeCellText(item?.displayTitle ?? item?.title ?? "");
  const displayArtist = normalizeCellText(item?.displayArtist ?? item?.artist ?? "");
  const sourceTitle = normalizeCellText(item?.sourceTitle ?? displayTitle);
  const sourceArtist = normalizeCellText(item?.sourceArtist ?? displayArtist);
  const tags = Array.isArray(item?.tags) ? normalizeStringArray(item.tags) : [];
  const metadataTags = item?.tags && !Array.isArray(item.tags) ? item.tags : {};
  const classification = item?.classification && typeof item.classification === "object"
    ? item.classification
    : {};
  const classificationGenres = normalizeStringArray(classification.genres);
  const genre = classificationGenres[0] || normalizeCellText(item?.genre) || tags[0] || "";

  return {
    no: normalizeCellText(item?.no),
    title: displayTitle,
    artist: displayArtist,
    displayTitle,
    displayArtist,
    sourceTitle,
    sourceArtist,
    songKey: normalizeCellText(item?.songKey) || createSongKey(displayTitle, displayArtist),
    titleSearchWords: normalizeStringArray(item?.titleSearchWords ?? item?.searchWords),
    artistSearchWords: normalizeStringArray(item?.artistSearchWords ?? item?.artistAliases),
    tags,
    metadataTags,
    classification,
    tieUps: normalizeTieUps(item?.tieUps),
    releaseDecade: normalizeCellText(item?.releaseDecade),
    playable: normalizeCellText(item?.playable),
    genre,
    note: normalizeCellText(item?.note),
    raw: item,
  };
}

async function loadMusiclist() {
  const response = await fetch(MUSICLIST_JSON_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("musiclist.jsonの読み込みに失敗しました。");
  }

  return normalizeMusiclistItems(await response.json());
}

async function loadFuzzySearchPresets() {
  const response = await fetch(FUZZY_SEARCH_PRESETS_JSON_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("fuzzy-search-presets.jsonの読み込みに失敗しました。");
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data.filter(preset => (
    normalizeCellText(preset?.title) && Array.isArray(preset?.items)
  ));
}

async function loadPerformancePreviews() {
  try {
    const response = await fetch(PERFORMANCE_PREVIEW_JSON_PATH, { cache: "no-store" });
    if (!response.ok) return {};

    const data = await response.json();
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    console.warn("performance_preview.jsonの読み込みをスキップしました。", error);
    return {};
  }
}

function createSongKey(title, artist) {
  return `${createSearchKey(title)}|${createSearchKey(artist)}`;
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`localStorageの読み込みに失敗しました: ${key}`, error);
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function favoriteKeyForSong(song) {
  return normalizeCellText(song.songKey) || createSongKey(song.title, song.artist);
}

function legacyKeysForSong(song) {
  return [
    `${normalizeCellText(song.title)}|${normalizeCellText(song.artist)}`,
    `${normalizeCellText(song.displayTitle)}|${normalizeCellText(song.displayArtist)}`,
    `${normalizeCellText(song.sourceTitle)}|${normalizeCellText(song.sourceArtist)}`,
  ].filter(key => key && key !== "|");
}

function songLookupKeys(song) {
  return [favoriteKeyForSong(song), ...legacyKeysForSong(song)];
}

function findSongByStoredKey(key) {
  const normalizedKey = normalizeCellText(key);
  return songs.find(song => songLookupKeys(song).includes(normalizedKey));
}

function migrateFavoriteKeys() {
  const migrated = new Set();
  let changed = false;

  favoriteKeys.forEach(key => {
    const song = findSongByStoredKey(key);
    if (song) {
      const newKey = favoriteKeyForSong(song);
      migrated.add(newKey);
      changed = changed || newKey !== key;
    } else {
      migrated.add(key);
    }
  });

  if (changed || migrated.size !== favoriteKeys.size) {
    favoriteKeys = migrated;
    saveFavoriteKeys();
  }
}

function loadFavoriteKeys() {
  const saved = readJsonStorage(FAVORITES_KEY, []);
  favoriteKeys = new Set(Array.isArray(saved) ? saved : []);
}

function saveFavoriteKeys() {
  writeJsonStorage(FAVORITES_KEY, [...favoriteKeys]);
}

function isFavorite(song) {
  return favoriteKeys.has(favoriteKeyForSong(song));
}

function updateFavoriteFilterButton() {
  els.favoriteFilter.classList.toggle("active", favoriteOnly);
  els.favoriteFilter.setAttribute("aria-pressed", String(favoriteOnly));
  els.favoriteFilter.setAttribute("aria-label", favoriteOnly ? "お気に入りのみ表示中" : "お気に入りのみ表示");
  els.favoriteFilter.textContent = favoriteOnly ? "★お気に入りのみ" : "☆お気に入りのみ";
}

function clearAllFavorites() {
  if (favoriteKeys.size === 0) {
    showCopyToast("お気に入りは登録されていません");
    return;
  }

  if (!window.confirm("登録したお気に入りをすべて解除します。よろしいですか？")) return;

  favoriteKeys.clear();
  saveFavoriteKeys();
  favoriteOnly = false;
  localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
  render();
  pickHomeRecommendations();
  renderHome();
  if (fuzzySearchMode) renderFuzzySearch();
  showCopyToast("お気に入りをすべて解除しました");
}

// musiclist.jsonを読み込み、画面表示用の曲データを更新する。
async function loadSheet() {
  try {
    const [loadedSongs, loadedFuzzySearchPresets, loadedPerformancePreviews] = await Promise.all([
      loadMusiclist(),
      loadFuzzySearchPresets(),
      loadPerformancePreviews(),
    ]);
    songs = loadedSongs.map((song, index) => ({ ...song, originalIndex: index }));
    fuzzySearchPresets = loadedFuzzySearchPresets;
    performancePreviews = loadedPerformancePreviews;
    migrateFavoriteKeys();
    setupSearchDetailOptions(songs);
    pickHomeRecommendations();
    pickHomeMoodSuggestions();
    render({ syncSearchGuide: true, forceSearchGuideSync: true });
    renderHome();
    renderFuzzySearch();
  } catch (error) {
    console.error(error);
  }
}

// セルの値を正規化して返す（nullやundefinedを空文字に、複数スペースを単一スペースに置換、前後のスペースを削除）
function normalizeCellText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function setupSelectOptions(select, values, emptyLabel) {
  const current = select.value;
  const options = [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>` +
    options.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if (options.includes(current)) select.value = current;
}

function animeDramaValue(category, series) {
  return `${category}|${series}`;
}

function specialAnimeDramaValue(kind) {
  return `special|${kind}`;
}

function parseAnimeDramaValue(value) {
  const [category = "", ...seriesParts] = String(value || "").split("|");
  return {
    category,
    series: seriesParts.join("|"),
  };
}

function animeDramaOptions(items) {
  const optionMap = new Map();

  items.forEach(item => {
    const sourceCategories = sourceCategoriesFor(item);
    const categories = ["アニメ", "ドラマ"].filter(category => sourceCategories.includes(category));
    if (categories.length === 0) return;

    (item.tieUps || []).forEach(tieUp => {
      const series = normalizeCellText(tieUp.series);
      if (!series) return;

      categories.forEach(category => {
        const value = animeDramaValue(category, series);
        const option = optionMap.get(value) || {
          category,
          series,
          value,
          label: `[${category}] ${series}`,
          count: 0,
          priority: category === "アニメ" ? 10 : 20,
        };
        option.count += 1;
        optionMap.set(value, option);
      });
    });
  });

  const specialOptions = [
    {
      value: specialAnimeDramaValue("ghibli"),
      label: "ジブリの楽曲",
      count: items.filter(item => String(item.no || "").toLowerCase().startsWith("ghibli#")).length,
      priority: 0,
    },
    {
      value: specialAnimeDramaValue("disney"),
      label: "ディズニーの楽曲",
      count: items.filter(item => String(item.no || "").toLowerCase().startsWith("disney#")).length,
      priority: 1,
    },
  ].filter(option => option.count > 0);

  return [...specialOptions, ...optionMap.values()].sort((left, right) => {
    return left.priority - right.priority
      || right.count - left.count
      || left.series.localeCompare(right.series, "ja");
  });
}

function setupAnimeDramaOptions(items) {
  const current = els.animeDrama.value || pendingAnimeDramaValue;
  const options = animeDramaOptions(items);
  els.animeDrama.innerHTML = '<option value="">すべて</option>' +
    options.map(option => (
      `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
    )).join("");
  if (options.some(option => option.value === current)) {
    els.animeDrama.value = current;
  }
  pendingAnimeDramaValue = "";
}

// 曲データから詳細検索の選択肢を生成
function setupSearchDetailOptions(items) {
  setupSelectOptions(
    els.genre,
    items.map(item => item.genre),
    "すべてのジャンル"
  );
  setupSelectOptions(
    els.subgenre,
    items.flatMap(item => normalizeStringArray(item.classification?.subgenres)),
    "すべてのサブジャンル"
  );
  setupSelectOptions(
    els.sourceCategory,
    items.flatMap(item => normalizeStringArray(item.classification?.sourceCategories)),
    "すべての出典カテゴリ"
  );
  setupAnimeDramaOptions(items);
  setupSelectOptions(
    els.vocalType,
    items.flatMap(item => normalizeStringArray(item.classification?.vocalTypes)),
    "すべてのボーカルタイプ"
  );
  setupSelectOptions(
    els.releaseDecade,
    items.map(item => item.releaseDecade),
    "すべての年代"
  );
}

// テキストを正規化して検索キーを作成する。全角半角を統一し、小文字に変換。
function normalizeText(text) {
  const romanMap = {
    "ⅰ": "1", "ⅱ": "2", "ⅲ": "3", "ⅳ": "4", "ⅴ": "5", "ⅵ": "6", "ⅶ": "7", "ⅷ": "8", "ⅸ": "9", "ⅹ": "10",
    "Ⅰ": "1", "Ⅱ": "2", "Ⅲ": "3", "Ⅳ": "4", "Ⅴ": "5", "Ⅵ": "6", "Ⅶ": "7", "Ⅷ": "8", "Ⅸ": "9", "Ⅹ": "10",
  };

  return String(text ?? "")
    .replace(
      /[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹ]/g,
      m => romanMap[m]
    )
    .normalize("NFKC")
    .toLowerCase();
}

// テキストを正規化して検索キーを作成する。
function createSearchKey(text) {
  return normalizeText(text)
    // 空白除去
    .replace(/\s+/g, "")
    // ダッシュ類統一
    .replace(/[‐–—―]/g, "-")
    // 波ダッシュ統一
    .replace(/[～〜]/g, "~")
    // 括弧削除
    .replace(/[\(\)\[\]\{\}<>〈〉《》「」『』【】〔〕〖〗〘〙〚〛]/g, "")
    // 記号削除
    .replace(/[!?*"#$%&',.:：;；･・…‥、。|]/g, "");
}

function getSearchScope() {
  return document.querySelector("[name='searchScope']:checked")?.value || "all";
}

function updateSearchPlaceholder(scope = getSearchScope()) {
  const placeholders = {
    all: "曲名・アーティストで検索",
    title: "曲名で検索",
    artist: "アーティストで検索",
  };
  els.search.placeholder = placeholders[scope] || placeholders.all;
}

function searchTargetsForScope(song, scope) {
  const titleTargets = [
    song.title,
    song.sourceTitle,
    ...normalizeStringArray(song.titleSearchWords),
  ];
  const artistTargets = [
    song.artist,
    song.sourceArtist,
    ...normalizeStringArray(song.artistSearchWords),
  ];

  if (scope === "title") return titleTargets;
  if (scope === "artist") return artistTargets;
  return [...titleTargets, ...artistTargets];
}

function matchesSearchKeyword(song, keyword, scope) {
  if (!keyword) return true;

  const searchTargets = searchTargetsForScope(song, scope);

  return searchTargets.some(target => createSearchKey(target).includes(keyword));
}

function hasSearchKeyword() {
  return createSearchKey(els.search.value) !== "";
}

function hasSearchDetailFilter() {
  return Boolean(
    els.genre.value
    || els.subgenre.value
    || els.sourceCategory.value
    || els.animeDrama.value
    || els.vocalType.value
    || els.releaseDecade.value
  );
}

function isSearchGuideDefaultState() {
  return !hasSearchKeyword() && !favoriteOnly && !hasSearchDetailFilter();
}

function syncSearchGuideOnSearchStateChange({ force = false } = {}) {
  if (easySearchMode) {
    setSearchGuideOpen(false);
    return;
  }

  const currentHasKeyword = hasSearchKeyword();

  if (!searchGuideAutoInitialized) {
    searchGuideAutoInitialized = true;
    lastSearchGuideHasKeyword = currentHasKeyword;
    setSearchGuideOpen(
      !currentHasKeyword && !favoriteOnly && !hasSearchDetailFilter()
    );
    return;
  }

  if (!force && lastSearchGuideHasKeyword === currentHasKeyword) return;

  lastSearchGuideHasKeyword = currentHasKeyword;
  if (currentHasKeyword || favoriteOnly || hasSearchDetailFilter()) {
    setSearchGuideOpen(false);
  }
}

function sourceCategoriesFor(song) {
  return normalizeStringArray(song.classification?.sourceCategories);
}

function tieUpCategoryLabel(song) {
  const sourceCategories = sourceCategoriesFor(song);
  const priorityCategories = ["アニメ", "ドラマ", "映画", "ゲーム", "ボカロ"];
  return priorityCategories.find(category => (
    sourceCategories.some(sourceCategory => sourceCategory.includes(category))
  )) || "";
}

function songGenreLabel(song) {
  const genre = normalizeCellText(song.genre);
  const tieUpCategory = tieUpCategoryLabel(song);
  if (!genre) return tieUpCategory;
  if (!tieUpCategory || genre === tieUpCategory || genre.includes(tieUpCategory)) return genre;
  return `${genre}/${tieUpCategory}`;
}

function matchesAnimeDramaFilter(song, filter) {
  if (!filter) return true;
  const { category, series } = parseAnimeDramaValue(filter);
  if (category === "special") {
    const no = String(song.no || "").toLowerCase();
    return series === "disney"
      ? no.startsWith("disney#")
      : series === "ghibli"
        ? no.startsWith("ghibli#")
        : true;
  }

  if (category && series) {
    return sourceCategoriesFor(song).includes(category)
      && (song.tieUps || []).some(tieUp => normalizeCellText(tieUp.series) === series);
  }

  const sourceCategories = sourceCategoriesFor(song);
  if (filter === "animeOrDrama") {
    return sourceCategories.includes("アニメ") || sourceCategories.includes("ドラマ");
  }
  return sourceCategories.includes(filter);
}

function numericSongNumber(song) {
  const value = String(song.no || "");
  const match = value.match(/#?(\d+(?:\.\d+)?)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function sourceOrder(song) {
  const value = String(song.no || "").toLowerCase();
  if (value.startsWith("list#")) return 0;
  if (value.startsWith("disney#")) return 1;
  if (value.startsWith("ghibli#")) return 2;
  return 3;
}

function compareSongNo(left, right) {
  return sourceOrder(left) - sourceOrder(right)
    || numericSongNumber(left) - numericSongNumber(right)
    || (left.originalIndex ?? 0) - (right.originalIndex ?? 0);
}

function compareSongText(leftValue, rightValue) {
  return normalizeCellText(leftValue).localeCompare(normalizeCellText(rightValue), "ja");
}

function copyCountForSong(song, counts) {
  return Number(counts?.[favoriteKeyForSong(song)] || 0);
}

function playablePriority(left, right) {
  return Number(isPlayable(right)) - Number(isPlayable(left));
}

function favoritePriority(left, right) {
  return Number(isFavorite(right)) - Number(isFavorite(left));
}

function sortPlayableFirst(items) {
  return items
    .map((song, index) => ({ song, index }))
    .sort((left, right) => playablePriority(left.song, right.song) || left.index - right.index)
    .map(item => item.song);
}

function sortedSearchSongs(items) {
  const sortOrder = els.sortOrder.value || "playable";
  const copyCounts = sortOrder === "copyCount" ? readJsonStorage(COPY_COUNTS_KEY, {}) : {};
  const sortable = [...items];

  if (sortOrder === "random") {
    for (let i = sortable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sortable[i], sortable[j]] = [sortable[j], sortable[i]];
    }
    return sortable;
  }

  return sortable.sort((left, right) => {
    if (sortOrder === "no") return compareSongNo(left, right);
    if (sortOrder === "title") {
      return compareSongText(left.title, right.title)
        || compareSongText(left.artist, right.artist)
        || compareSongNo(left, right);
    }
    if (sortOrder === "artist") {
      return compareSongText(left.artist, right.artist)
        || compareSongText(left.title, right.title)
        || compareSongNo(left, right);
    }
    if (sortOrder === "favorite") {
      return favoritePriority(left, right)
        || playablePriority(left, right)
        || compareSongNo(left, right);
    }
    if (sortOrder === "copyCount") {
      return copyCountForSong(right, copyCounts) - copyCountForSong(left, copyCounts)
        || playablePriority(left, right)
        || compareSongNo(left, right);
    }
    return playablePriority(left, right) || compareSongNo(left, right);
  });
}

// 検索キーワードとジャンルで曲をフィルタリングする。キーワードは曲名、アーティスト名、補助検索語に対して部分一致で検索する。
function selectedEasyValues(categoryKey, selections = easySelections) {
  return Array.from(selections[categoryKey] || []);
}

function hasEasySelections(selections = easySelections) {
  return EASY_CATEGORIES.some(category => selectedEasyValues(category.key, selections).length > 0);
}

function cloneEasySelections() {
  return Object.fromEntries(
    EASY_CATEGORIES.map(category => [category.key, new Set(selectedEasyValues(category.key))])
  );
}

function easyMoodTagsFor(song) {
  return normalizeStringArray(song.metadataTags?.moodTags);
}

function easyGenreValuesFor(song) {
  const values = new Set();
  const genre = normalizeCellText(song.genre);
  if (genre) values.add(genre);
  normalizeStringArray(song.classification?.genres).forEach(value => values.add(value));
  sourceCategoriesFor(song).forEach(value => values.add(value));
  songGenreLabel(song).split("/").map(normalizeCellText).filter(Boolean).forEach(value => values.add(value));
  const sourceType = songSourceType(song);
  if (sourceType === "disney") values.add("ディズニー");
  if (sourceType === "ghibli") values.add("ジブリ");
  return values;
}

function easyMoodOptionByValue(value) {
  return EASY_MOOD_OPTIONS.find(option => option.value === value);
}

function easyMatchesCategory(song, categoryKey, selections = easySelections) {
  const selected = selectedEasyValues(categoryKey, selections);
  if (selected.length === 0) return true;

  if (categoryKey === "genre") {
    if (selected.includes("all")) return true;
    const values = easyGenreValuesFor(song);
    return selected.some(value => values.has(value));
  }

  if (categoryKey === "artist") {
    return selected.includes(song.artist);
  }

  if (categoryKey === "mood") {
    const moodTags = easyMoodTagsFor(song);
    return selected.some(value => {
      const option = easyMoodOptionByValue(value);
      return option && option.tags.some(tag => moodTags.includes(tag));
    });
  }

  return true;
}

function easyMatchesAllCategories(song, selections = easySelections) {
  return EASY_CATEGORIES.every(category => easyMatchesCategory(song, category.key, selections));
}

function hasEasyActiveFilters(selections = easySelections) {
  return hasEasySelections(selections) || playableOnly || favoriteOnly;
}

function easyFilteredSongsForSelections(selections = easySelections) {
  if (!hasEasyActiveFilters(selections)) return [];
  return songs.filter(song =>
    easyMatchesAllCategories(song, selections)
    && (!playableOnly || isPlayable(song))
    && (!favoriteOnly || isFavorite(song))
  );
}

function easyFilteredSongs() {
  return sortedSearchSongs(easyFilteredSongsForSelections());
}

function easySelectionsForOptionCount(categoryKey, optionValue) {
  const next = cloneEasySelections();
  if (categoryKey === "genre" && optionValue === "all") {
    next.genre = new Set(["all"]);
    return next;
  }

  if (categoryKey === "genre" && next.genre.has("all")) {
    next.genre.delete("all");
  }

  next[categoryKey].add(optionValue);
  return next;
}

function easyOptionCount(categoryKey, optionValue) {
  return easyFilteredSongsForSelections(
    easySelectionsForOptionCount(categoryKey, optionValue)
  ).length;
}

function easyGenreOptions() {
  return EASY_GENRE_OPTIONS
    .map(option => ({
      ...option,
      count: option.value === "all" ? easyFilteredSongsForSelections({ ...easySelections, genre: new Set(["all"]) }).length : easyOptionCount("genre", option.value),
    }))
    .filter(option => option.value === "all" || option.count > 0);
}

function easyArtistOptions() {
  const counts = new Map();
  songs.forEach(song => {
    if (!easyMatchesCategory(song, "genre") || !easyMatchesCategory(song, "mood")) return;
    if (playableOnly && !isPlayable(song)) return;
    if (favoriteOnly && !isFavorite(song)) return;
    const artist = normalizeCellText(song.artist);
    if (!artist) return;
    counts.set(artist, (counts.get(artist) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: `${value} (${count})`, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, "ja"));
}

function easyMoodOptions() {
  return EASY_MOOD_OPTIONS
    .map(option => ({ ...option, count: easyOptionCount("mood", option.value) }))
    .filter(option => option.count > 0);
}

function computeEasyOptionsForCategory(categoryKey) {
  if (categoryKey === "genre") return easyGenreOptions();
  if (categoryKey === "artist") return easyArtistOptions();
  if (categoryKey === "mood") return easyMoodOptions();
  return [];
}

function easyOptionsForCategory(categoryKey, { refresh = false } = {}) {
  if (refresh || !easyOptionSnapshots[categoryKey]) {
    easyOptionSnapshots[categoryKey] = computeEasyOptionsForCategory(categoryKey);
  }
  return easyOptionSnapshots[categoryKey];
}

function isEasyOptionStale() {
  return EASY_CATEGORIES.some(category => easyOptionStale[category.key]);
}

function refreshEasyOptions() {
  EASY_CATEGORIES.forEach(category => {
    easyOptionStale[category.key] = false;
    easyVisibleCounts[category.key] = EASY_OPTION_INITIAL_COUNT;
    easyOptionsForCategory(category.key, { refresh: true });
  });
  renderEasySearch();
}

function easyOptionLabel(categoryKey, value) {
  if (categoryKey === "genre") {
    return EASY_GENRE_OPTIONS.find(option => option.value === value)?.label || value;
  }
  if (categoryKey === "mood") {
    return easyMoodOptionByValue(value)?.label || value;
  }
  return value;
}

function toggleEasyOption(categoryKey, value) {
  const selected = easySelections[categoryKey];
  if (!selected) return;

  if (categoryKey === "genre" && value === "all") {
    selected.clear();
    selected.add("all");
  } else if (selected.has(value)) {
    selected.delete(value);
  } else {
    if (categoryKey === "genre") selected.delete("all");
    selected.add(value);
  }

  EASY_CATEGORIES.forEach(category => {
    if (category.key !== categoryKey) easyOptionStale[category.key] = true;
  });
}

function resetEasySearch() {
  EASY_CATEGORIES.forEach(category => {
    easySelections[category.key].clear();
    easyVisibleCounts[category.key] = EASY_OPTION_INITIAL_COUNT;
    easyOptionStale[category.key] = false;
    easyOptionSnapshots[category.key] = null;
  });
  render();
}

function renderEasySelectedConditions() {
  if (!hasEasySelections()) {
    els.easySelectedConditions.innerHTML = `<span class="easy-selected-empty">条件はまだ選択されていません。</span>`;
    return;
  }

  els.easySelectedConditions.innerHTML = EASY_CATEGORIES
    .map(category => {
      const values = selectedEasyValues(category.key);
      if (values.length === 0) return "";
      return `
      <span class="easy-selected-chip">
        <span class="easy-selected-category">${escapeHtml(category.label)}</span>
        ${escapeHtml(values.map(value => easyOptionLabel(category.key, value)).join("、"))}
      </span>
    `;
    })
    .join("");
}

function renderEasyCategory(category) {
  const options = easyOptionsForCategory(category.key);
  const visibleCount = easyVisibleCounts[category.key];
  const visibleOptions = options.slice(0, visibleCount);
  const hasMore = options.length > visibleCount;
  const open = easyCategoryOpen[category.key] !== false;

  return `
    <section class="easy-category-card">
      <div class="easy-category-header">
        <button class="btn easy-category-toggle" type="button" data-easy-toggle="${escapeHtml(category.key)}" aria-expanded="${open}" aria-controls="easy-category-${escapeHtml(category.key)}">
          <span class="easy-category-title">${escapeHtml(category.label)}</span>
          <span class="easy-category-icon" aria-hidden="true">${open ? "▲" : "▼"}</span>
        </button>
      </div>
      <div class="easy-category-body" id="easy-category-${escapeHtml(category.key)}" ${open ? "" : "hidden"}>
        <div class="easy-option-list">
        ${visibleOptions.map(option => {
          const active = easySelections[category.key].has(option.value);
          return `
            <button class="btn easy-option-button ${active ? "active" : ""}" type="button" data-easy-category="${escapeHtml(category.key)}" data-easy-option="${escapeHtml(option.value)}" aria-pressed="${active}">
              ${escapeHtml(option.label)}
            </button>
          `;
        }).join("")}
        ${visibleOptions.length === 0 ? `<span class="easy-selected-empty">表示できる候補がありません。</span>` : ""}
        </div>
        ${hasMore ? `
          <button class="btn fuzzy-more-button easy-more-button" type="button" data-easy-more="${escapeHtml(category.key)}">もっと見る ⇒</button>
        ` : ""}
      </div>
    </section>
  `;
}

function renderEasySearch() {
  if (!els.easySearchPanel) return;
  renderEasySelectedConditions();
  const stale = isEasyOptionStale();
  els.easyRefresh.disabled = !stale;
  els.easyRefresh.classList.toggle("is-stale", stale);
  els.easyRefreshStatus.hidden = stale;
  els.easyCategoryList.innerHTML = EASY_CATEGORIES.map(renderEasyCategory).join("");
}

function resetEasyCategoryOpenForViewport() {
  EASY_CATEGORIES.forEach((category, index) => {
    easyCategoryOpen[category.key] = easyAccordionQuery.matches ? index === 0 : true;
  });
  if (easySearchMode) renderEasySearch();
}

function setEasySearchMode(active) {
  easySearchMode = Boolean(active);
  els.normalSearchPanel.classList.toggle("easy-mode", easySearchMode);
  els.easySearchPanel.hidden = !easySearchMode;
  els.easyModeToggle.textContent = easySearchMode ? "通常検索に戻る" : "かんたんモードにする";
  els.easyModeToggle.setAttribute("aria-pressed", String(easySearchMode));
  els.searchModeDescription.textContent = easySearchMode
    ? "ボタンを組み合わせて、リクエスト候補をかんたんに絞り込めます。気になる条件を選んで、少しずつ曲を探してみてください。"
    : "曲名やアーティスト名から、リクエストしたい曲を探せます。";
  if (easySearchMode) setSearchGuideOpen(false);
  render({ syncSearchGuide: true, forceSearchGuideSync: true });
}

function filteredSongs() {
  if (easySearchMode) return easyFilteredSongs();

  const keyword = createSearchKey(els.search.value);
  const searchScope = getSearchScope();
  const genre = els.genre.value;
  const subgenre = els.subgenre.value;
  const sourceCategory = els.sourceCategory.value;
  const animeDrama = els.animeDrama.value;
  const vocalType = els.vocalType.value;
  const releaseDecade = els.releaseDecade.value;

  if (!keyword && !favoriteOnly && !hasSearchDetailFilter()) return [];

  const filtered = songs.filter(song => {
    const keywordOk = matchesSearchKeyword(song, keyword, searchScope);
    const genreOk = !genre || song.genre === genre;
    const subgenreOk = !subgenre
      || normalizeStringArray(song.classification?.subgenres).includes(subgenre);
    const sourceCategoryOk = !sourceCategory
      || sourceCategoriesFor(song).includes(sourceCategory);
    const animeDramaOk = matchesAnimeDramaFilter(song, animeDrama);
    const vocalTypeOk = !vocalType
      || normalizeStringArray(song.classification?.vocalTypes).includes(vocalType);
    const releaseDecadeOk = !releaseDecade || song.releaseDecade === releaseDecade;
    const playableOk = !playableOnly || isPlayable(song);
    const favoriteOk = !favoriteOnly || isFavorite(song);
    return keywordOk
      && genreOk
      && subgenreOk
      && sourceCategoryOk
      && animeDramaOk
      && vocalTypeOk
      && releaseDecadeOk
      && playableOk
      && favoriteOk;
  });

  return sortedSearchSongs(filtered);
}

// 曲が「弾ける曲」かどうかを判定する。セルの値に「〇」や「○」、または「yes」（大文字小文字問わず）が含まれていれば弾ける曲とみなす。
function isPlayable(song) {
  const raw = String(song.playable ?? "");
  const normalized = raw.trim().toLowerCase();
  return raw.includes("〇") || raw.includes("○") || /\byes\b/.test(normalized);
}

function getHomeRecommendSource() {
  if (homeRandomSource === "playable") return songs.filter(isPlayable);
  if (homeRandomSource === "favorite") return songs.filter(isFavorite);
  return songs;
}

function pickHomeRecommendations() {
  const source = [...getHomeRecommendSource()];
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }
  homeRecommendedSongs = source.slice(0, HOME_RECOMMEND_COUNT);
}

function fuzzyPresetByTitle(title) {
  return fuzzySearchPresets.find(preset => preset?.title === title);
}

function randomItem(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function daysFromToday(month, day, date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const currentYearEvent = new Date(date.getFullYear(), month - 1, day);
  const nextYearEvent = new Date(date.getFullYear() + 1, month - 1, day);
  const currentDiff = Math.round((currentYearEvent - today) / 86400000);
  const nextDiff = Math.round((nextYearEvent - today) / 86400000);
  return Math.abs(currentDiff) <= Math.abs(nextDiff) ? currentDiff : nextDiff;
}

function nearSeasonEventTags(date = new Date()) {
  const eventDates = [
    { tag: "正月", month: 1, day: 1 },
    { tag: "バレンタインデー", month: 2, day: 14 },
    { tag: "ホワイトデー", month: 3, day: 14 },
    { tag: "卒業", month: 3, day: 20 },
    { tag: "入学", month: 4, day: 7 },
    { tag: "七夕", month: 7, day: 7 },
    { tag: "夏休み", month: 7, day: 20 },
    { tag: "夏祭り", month: 8, day: 10 },
    { tag: "ハロウィン", month: 10, day: 31 },
    { tag: "クリスマス", month: 12, day: 25 },
  ];

  return eventDates
    .map(item => ({ ...item, distance: daysFromToday(item.month, item.day, date) }))
    .filter(item => item.distance >= -3 && item.distance <= 21)
    .sort((left, right) => Math.abs(left.distance) - Math.abs(right.distance))
    .map(item => item.tag);
}

function presetItemEventTags(item) {
  return normalizeStringArray(item?.match?.eventTags);
}

function pickHomeMoodSuggestions() {
  const titles = ["きもち", "雰囲気", "情景"];
  const suggestions = titles
    .map(title => {
      const preset = fuzzyPresetByTitle(title);
      const item = randomItem(preset?.items);
      return preset && item ? { preset, item } : null;
    })
    .filter(Boolean);

  const eventPreset = fuzzyPresetByTitle("イベント");
  const nearTags = nearSeasonEventTags();
  const eventItems = eventPreset?.items?.filter(item => {
    const eventTags = presetItemEventTags(item);
    return eventTags.some(tag => nearTags.includes(tag));
  }) || [];
  const eventItem = randomItem(eventItems);
  if (eventPreset && eventItem) {
    suggestions.push({ preset: eventPreset, item: eventItem });
  }

  homeMoodSuggestions = suggestions;
  activeHomeMoodIndex = null;
}

function homeMoodMatchedSongs(index) {
  const suggestion = homeMoodSuggestions[index];
  if (!suggestion) return [];
  const matched = songs.filter(song => matchesFuzzyPreset(song, suggestion.item.match));
  return sortPlayableFirst(dailyFuzzyOrder(matched, suggestion.preset, suggestion.item))
    .slice(0, HOME_MOOD_RESULT_COUNT);
}

function gridClassesForColumns(columns) {
  if (columns === "1") return "row row-cols-1 g-3 mt-1 song-grid";
  if (columns === "2") return "row row-cols-1 row-cols-md-2 g-3 mt-1 song-grid";
  return "row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mt-1 song-grid";
}

function applyColumnLayout() {
  const gridClassName = gridClassesForColumns(displayColumnCount);

  [els.homeRecommendations, els.homeMoodSongs, els.copyHistorySongs, els.songs, els.fuzzySongs].forEach(grid => {
    if (!grid) return;
    grid.className = gridClassName;
    grid.dataset.columns = displayColumnCount;
  });
}

function fuzzyPresetIcon(icon) {
  const name = ["music", "landscape", "season", "mood", "calendar"].includes(icon) ? icon : "music";
  return `
    <span class="theme-icon section-heading-icon" aria-hidden="true">
      <img class="theme-icon-light" src="../lib/icon/white/${name}.svg" alt="">
      <img class="theme-icon-dark" src="../lib/icon/black/${name}.svg" alt="">
    </span>
  `;
}

function fuzzySearchValues(song, group) {
  if (group === "sourceCategories") {
    return normalizeStringArray(song.classification?.sourceCategories);
  }
  if (group === "releaseDecade") {
    return normalizeStringArray([song.releaseDecade]);
  }
  return normalizeStringArray(song.metadataTags?.[group]);
}

function matchesFuzzyPreset(song, match) {
  if (!match || typeof match !== "object" || Array.isArray(match)) return false;
  const conditions = Object.entries(match);
  if (conditions.length === 0) return false;

  return conditions.every(([group, expectedValues]) => {
    const expected = normalizeStringArray(expectedValues);
    const actual = fuzzySearchValues(song, group);
    return expected.length > 0 && expected.some(value => actual.includes(value));
  });
}

function localDateSeedKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function stableStringHash(value) {
  let hash = 2166136261;
  for (const character of String(value ?? "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dailyFuzzyOrder(items, preset, item, date = new Date()) {
  const dateSeed = stableStringHash(localDateSeedKey(date));
  const presetKey = `${preset?.title || ""}|${item?.label || ""}`;

  return [...items].sort((left, right) => {
    const leftKey = favoriteKeyForSong(left);
    const rightKey = favoriteKeyForSong(right);
    const leftScore = stableStringHash(`${dateSeed}|${presetKey}|${leftKey}`);
    const rightScore = stableStringHash(`${dateSeed}|${presetKey}|${rightKey}`);
    return leftScore - rightScore || leftKey.localeCompare(rightKey, "ja");
  });
}

function fuzzyMatchedSongs() {
  const preset = fuzzySearchPresets[activeFuzzyCategoryIndex];
  const item = preset?.items?.[activeFuzzyItemIndex];
  if (!item) return [];
  const matched = songs.filter(song => matchesFuzzyPreset(song, item.match));
  return sortPlayableFirst(dailyFuzzyOrder(matched, preset, item));
}

function fuzzyItemTier(item) {
  const tier = Number(item?.tier);
  if (!Number.isFinite(tier)) return 1;
  return Math.min(Math.max(Math.trunc(tier), 1), FUZZY_MAX_TIER);
}

function maxFuzzyItemTier(preset) {
  if (!Array.isArray(preset?.items) || preset.items.length === 0) return 1;
  return Math.max(...preset.items.map(fuzzyItemTier));
}

function visibleFuzzyItems(preset) {
  if (!Array.isArray(preset?.items)) return [];
  return preset.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => fuzzyItemTier(item) <= fuzzyVisibleTier);
}

function updateFuzzyCategoryScrollButtons() {
  const maxScrollLeft = Math.max(
    els.fuzzyCategoryTabs.scrollWidth - els.fuzzyCategoryTabs.clientWidth,
    0
  );
  els.fuzzyCategoryScrollPrev.disabled = els.fuzzyCategoryTabs.scrollLeft <= 1;
  els.fuzzyCategoryScrollNext.disabled = els.fuzzyCategoryTabs.scrollLeft >= maxScrollLeft - 1;
}

function refreshFuzzyCategoryScrollControls() {
  els.fuzzyCategoryScroll.classList.remove("has-overflow");
  requestAnimationFrame(() => {
    const hasOverflow = els.fuzzyCategoryTabs.scrollWidth > els.fuzzyCategoryTabs.clientWidth + 1;
    els.fuzzyCategoryScroll.classList.toggle("has-overflow", hasOverflow);
    requestAnimationFrame(updateFuzzyCategoryScrollButtons);
  });
}

function scrollFuzzyCategories(direction) {
  els.fuzzyCategoryTabs.scrollBy({
    left: direction * Math.max(els.fuzzyCategoryTabs.clientWidth * 0.7, 140),
    behavior: reducedMotionQuery.matches ? "auto" : "smooth",
  });
}

function renderFuzzySearch() {
  const preset = fuzzySearchPresets[activeFuzzyCategoryIndex];
  els.fuzzyCategoryTabs.innerHTML = fuzzySearchPresets.map((item, index) => `
    <button class="btn fuzzy-category-tab ${index === activeFuzzyCategoryIndex ? "active" : ""}" id="fuzzy-category-tab-${index}" type="button" role="tab" data-fuzzy-category="${index}" aria-controls="fuzzyCategoryContent" aria-selected="${index === activeFuzzyCategoryIndex}">${escapeHtml(item.title)}</button>
  `).join("");
  els.fuzzyCategoryContent.setAttribute(
    "aria-labelledby",
    `fuzzy-category-tab-${activeFuzzyCategoryIndex}`
  );
  refreshFuzzyCategoryScrollControls();

  if (!preset) {
    els.fuzzyCategoryContent.innerHTML = "";
    els.fuzzyResultSummary.innerHTML = "";
    els.fuzzySongs.innerHTML = "";
    els.fuzzyEmpty.hidden = false;
    els.fuzzyEmpty.textContent = "ふわっと検索の条件を読み込めませんでした。";
    els.fuzzyMore.hidden = true;
    return;
  }

  const visibleItems = visibleFuzzyItems(preset);
  const hasMoreTiers = maxFuzzyItemTier(preset) > fuzzyVisibleTier;
  els.fuzzyCategoryContent.innerHTML = `
    <h2 class="h5 fw-bold mb-1 section-heading-with-icon">
      ${fuzzyPresetIcon(preset.icon)}
      ${escapeHtml(preset.category || preset.title)}
    </h2>
    <p class="fuzzy-category-description mb-3">${escapeHtml(preset.description)}</p>
    <div class="fuzzy-preset-options">
      ${visibleItems.map(({ item, index }) => `
        <button class="btn fuzzy-preset-button ${index === activeFuzzyItemIndex ? "active" : ""}" type="button" data-fuzzy-item="${index}" aria-pressed="${index === activeFuzzyItemIndex}">${escapeHtml(item.label)}</button>
      `).join("")}
    </div>
    ${hasMoreTiers ? `
      <div class="text-end mt-3">
        <button class="btn fuzzy-more-button" type="button" data-fuzzy-tier-more>もっと探す ⇒</button>
      </div>
    ` : ""}
  `;

  const selectedItem = preset.items[activeFuzzyItemIndex];
  const matched = fuzzyMatchedSongs();
  const visible = matched.slice(0, fuzzyResultLimit);
  els.fuzzyResultSummary.innerHTML = selectedItem
    ? `
      <strong>${escapeHtml(selectedItem.label)}</strong>：${matched.length}曲
      ${selectedItem.description ? `<p class="mb-0 mt-1">${escapeHtml(selectedItem.description)}</p>` : ""}
    `
    : "";
  els.fuzzySongs.innerHTML = renderSongCards(visible);
  els.fuzzyEmpty.hidden = Boolean(selectedItem) && matched.length > 0;
  els.fuzzyEmpty.textContent = selectedItem
    ? "条件に合う曲が見つかりませんでした。"
    : "気になる条件を選んでみてください。";
  els.fuzzyMore.hidden = !selectedItem
    || matched.length <= fuzzyResultLimit
    || fuzzyResultLimit >= FUZZY_RESULT_MAX_COUNT;
}

function setFuzzySearchMode(active) {
  fuzzySearchMode = Boolean(active);
  els.normalSearchPanel.hidden = fuzzySearchMode;
  els.fuzzySearchPanel.hidden = !fuzzySearchMode;
  if (fuzzySearchMode) renderFuzzySearch();
}

function songSourceType(song) {
  const no = String(song?.no || "").toLowerCase();
  if (no.startsWith("disney#")) return "disney";
  if (no.startsWith("ghibli#")) return "ghibli";
  if (no.startsWith("list#")) return "list";
  return "other";
}

function songSourceLabel(song) {
  const labels = {
    list: "曲リスト",
    disney: "ディズニー",
    ghibli: "ジブリ",
    other: "その他",
  };
  return labels[songSourceType(song)] || labels.other;
}

function songNumberValue(no) {
  const value = normalizeCellText(no);
  const match = value.match(/^[^#]+#(.+)$/);
  return match ? match[1] : value.replace(/^#/, "");
}

function songAccentType(song) {
  const sourceType = songSourceType(song);
  if (sourceType === "disney" || sourceType === "ghibli") return "studio";

  const sourceCategories = sourceCategoriesFor(song);
  const subgenres = normalizeStringArray(song.classification?.subgenres);
  const genres = normalizeStringArray(song.classification?.genres);
  const allClassifications = [...sourceCategories, ...subgenres, ...genres];

  if (allClassifications.some(value => /ボカロ|VOCALOID/i.test(value))) return "vocaloid";
  if (sourceCategories.includes("ゲーム")) return "game";
  if (sourceCategories.includes("アニメ") || allClassifications.some(value => value.includes("アニメ映画"))) return "anime";
  if (sourceCategories.includes("映画") || sourceCategories.includes("ドラマ")) return "screen";
  return "other";
}

function songAccentLabel(song) {
  const labels = {
    anime: "アニメ",
    game: "ゲーム",
    vocaloid: "ボカロ",
    screen: "映画・ドラマ",
    studio: songSourceType(song) === "disney" ? "ディズニー" : "ジブリ",
    other: "その他",
  };
  return labels[songAccentType(song)] || labels.other;
}

function songAccentClass(song) {
  return accentColorEnabled ? `has-accent accent-${songAccentType(song)}` : "";
}

function menuIconHtml() {
  return `
    <span class="theme-icon song-card-menu-icon" aria-hidden="true">
      <img class="theme-icon-light" src="../lib/icon/white/menu.svg" alt="">
      <img class="theme-icon-dark" src="../lib/icon/black/menu.svg" alt="">
    </span>
  `;
}

function renderSongCards(items) {
  return items.map(song => `
    <div class="col">
      <article class="card song-card h-100 ${isFavorite(song) ? "is-favorite" : ""} ${songAccentClass(song)}" data-favorite-key="${escapeHtml(favoriteKeyForSong(song))}">
        <div class="card-body song-card-body d-flex flex-column gap-2 p-3 p-md-4">
          <div class="song-card-header d-flex justify-content-between gap-3 align-items-start">
            <div class="song-card-text min-w-0">
              <h2 class="song-title h5 fw-bold mb-1">${escapeHtml(song.title)}</h2>
              <p class="song-artist mb-0">${escapeHtml(song.artist || "アーティスト未設定")}</p>
            </div>
            ${accentColorEnabled ? `<span class="song-accent-label">${escapeHtml(songAccentLabel(song))}</span>` : ""}
          </div>
          <div class="song-card-meta d-flex">
            ${song.playable ? `<span class="badge rounded-pill badge-playable">${escapeHtml(song.playable)} 弾ける</span>` : ""}
            ${songGenreLabel(song) ? `<span class="badge rounded-pill text-bg-light border">${escapeHtml(songGenreLabel(song))}</span>` : ""}
          </div>
        </div>
        <button class="song-card-copy" type="button" data-copy-song="${escapeHtml(song.title)}" data-copy-artist="${escapeHtml(song.artist)}" data-copy-no="${escapeHtml(song.no)}" data-song-key="${escapeHtml(favoriteKeyForSong(song))}" aria-label="${escapeHtml(song.title)}をリクエスト形式でコピー"></button>
        <button class="song-card-menu" type="button" data-card-menu data-song-key="${escapeHtml(favoriteKeyForSong(song))}" aria-label="${escapeHtml(song.title)}の詳細を開く">
          ${menuIconHtml()}
        </button>
      </article>
    </div>
  `).join("");
}

function renderEasyStats(items) {
  return `
    <span class="badge rounded-pill stat-badge px-3 py-2">一致する曲：<strong>${items.length}</strong></span>
    <span class="playable-filter easy-stat-filter" aria-label="弾ける曲フィルター">
      <span class="playable-filter-label">弾ける曲</span>
      <button class="badge rounded-pill stat-badge stat-filter-button px-3 py-2 ${playableOnly ? "active" : ""}" type="button" data-easy-playable-filter aria-pressed="${playableOnly}">${playableOnly ? "ON" : "OFF"}</button>
    </span>
    <button class="badge rounded-pill stat-badge stat-filter-button px-3 py-2 ${favoriteOnly ? "active" : ""}" type="button" data-easy-favorite-filter aria-pressed="${favoriteOnly}" aria-label="${favoriteOnly ? "お気に入りのみ表示中" : "お気に入りのみ表示"}">${favoriteOnly ? "★お気に入りのみ" : "☆お気に入りのみ"}</button>
  `;
}

function render({ syncSearchGuide = false, forceSearchGuideSync = false } = {}) {
  const items = filteredSongs();
  const isDefaultSearchState = isSearchGuideDefaultState();

  if (easySearchMode) renderEasySearch();
  els.stats.innerHTML = `
    <span class="badge rounded-pill stat-badge px-3 py-2">全曲数：<strong>${songs.length}</strong> 表示中：<strong>${items.length}</strong></span>
  `;
  if (easySearchMode) {
    els.stats.innerHTML = renderEasyStats(items);
  }
  els.playableFilter.classList.toggle("active", playableOnly);
  els.playableFilter.setAttribute("aria-pressed", String(playableOnly));
  els.playableFilter.textContent = playableOnly ? "ON" : "OFF";
  updateFavoriteFilterButton();
  if (syncSearchGuide) {
    syncSearchGuideOnSearchStateChange({ force: forceSearchGuideSync });
  }

  els.empty.hidden = isDefaultSearchState || items.length !== 0;
  if (easySearchMode) {
    els.empty.textContent = hasEasyActiveFilters()
      ? "条件に合う曲が見つかりませんでした。条件を少し減らしてみてください。"
      : "条件を選んでみてください。";
    els.empty.hidden = items.length !== 0;
  }
  els.songs.innerHTML = renderSongCards(items);
}

function renderHome() {
  updateHomeRandomSourceButtons();
  els.homeRecommendEmpty.hidden = homeRecommendedSongs.length !== 0;
  els.homeRecommendations.innerHTML = renderSongCards(homeRecommendedSongs);
  renderHomeMood();
  renderCopyHistory();
}

function updateHomeRandomSourceButtons() {
  els.homeRandomOptions.forEach(button => {
    const active = button.dataset.homeRandomSource === homeRandomSource;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderHomeMood() {
  els.homeMoodOptions.innerHTML = homeMoodSuggestions.map((suggestion, index) => `
    <button class="btn fuzzy-preset-button ${index === activeHomeMoodIndex ? "active" : ""}" type="button" data-home-mood="${index}" aria-pressed="${index === activeHomeMoodIndex}">
      ${escapeHtml(suggestion.item.label)}
    </button>
  `).join("");

  const items = activeHomeMoodIndex === null ? [] : homeMoodMatchedSongs(activeHomeMoodIndex);
  els.homeMoodSongs.innerHTML = renderSongCards(items);
  els.homeMoodEmpty.hidden = homeMoodSuggestions.length !== 0 && activeHomeMoodIndex !== null && items.length !== 0;
  els.homeMoodEmpty.textContent = homeMoodSuggestions.length === 0
    ? "ふわっと検索の候補を読み込めませんでした。"
    : activeHomeMoodIndex === null
      ? "気になる項目を選んでみてください。"
      : "条件に合う曲が見つかりませんでした。";
}

function getCopyHistorySongs() {
  const savedHistory = readJsonStorage(COPY_HISTORY_KEY, []);
  const history = Array.isArray(savedHistory) ? savedHistory : [];
  const seen = new Set();
  const items = [];

  for (const entry of history) {
    const key = String(entry?.key || favoriteKeyForSong(entry || {}));
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const matchedSong = findSongByStoredKey(key);
    items.push(matchedSong || {
      no: entry?.no || "",
      title: entry?.title || "",
      artist: entry?.artist || "",
      songKey: key,
      playable: "",
      genre: "",
    });

    if (items.length >= HOME_RECOMMEND_COUNT) break;
  }

  return items.filter(song => song.title || song.artist);
}

function renderCopyHistory() {
  const items = getCopyHistorySongs();
  els.copyHistoryEmpty.hidden = items.length !== 0;
  els.copyHistorySongs.innerHTML = renderSongCards(items);
}

function requestText(song) {
  const no = String(song.no || "").trim();
  const title = String(song.title || "").trim();
  const artist = String(song.artist || "").trim();
  const listNumberMatch = no.match(/^list#(.+)$/i);
  const copyNumber = listNumberMatch
    ? listNumberMatch[1]
    : /^(?:disney|ghibli)#/i.test(no)
      ? ""
      : no;
  const noPrefix = copyNumber ? `${copyNumber}.` : "";
  return `【ぴぴりく】${noPrefix}${title}／${artist || "アーティスト未設定"}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const succeeded = document.execCommand("copy");
  textarea.remove();

  if (!succeeded) {
    throw new Error("クリップボードへのコピーに失敗しました。");
  }
}

function showCopyToast(message = "クリップボードにコピーしました！", copiedText = "") {
  const messageEl = document.getElementById("copyToastMessage");
  const textEl = document.getElementById("copyToastText");

  if (messageEl) messageEl.textContent = message;
  if (textEl) {
    textEl.textContent = copiedText;
    textEl.hidden = copiedText.length === 0;
  }

  if (window.bootstrap && els.copyToast) {
    const toast = bootstrap.Toast.getOrCreateInstance(els.copyToast, { delay: 2000 });
    toast.show();
  }
}

async function handleCardCopy(card) {
  const song = findSongByStoredKey(card.dataset.songKey) || {
    no: card.dataset.copyNo || "",
    title: card.dataset.copySong || "",
    artist: card.dataset.copyArtist || "",
    songKey: card.dataset.songKey || "",
  };
  await copySongRequest(song);
}

async function copySongRequest(song) {
  const no = song.no || "";
  const title = song.title || "";
  const artist = song.artist || "";
  const songKey = favoriteKeyForSong(song);
  const text = requestText({ no, title, artist });

  try {
    await copyToClipboard(text);
    recordCopyHistory({ key: songKey, no, title, artist, text });
    showCopyToast("クリップボードにコピーしました！", text);
  } catch (error) {
    console.error(error);
    showCopyToast("コピーに失敗しました");
  }
}

function detailBadge(text, className = "text-bg-light border") {
  if (!normalizeCellText(text)) return "";
  return `<span class="badge rounded-pill ${className}">${escapeHtml(text)}</span>`;
}

function tieUpLabels(song) {
  return (song.tieUps || []).map(tieUp => {
    const parts = [
      normalizeCellText(tieUp.series),
      normalizeCellText(tieUp.workTitle),
      normalizeCellText(tieUp.role),
    ].filter(Boolean);
    return [...new Set(parts)].join(" / ");
  }).filter(Boolean);
}

function comparableTagSet(song) {
  const tagGroups = ["themeTags", "moodTags", "motifTags", "eventTags"];
  const values = tagGroups.flatMap(group => normalizeStringArray(song.metadataTags?.[group]));
  values.push(...sourceCategoriesFor(song));
  values.push(...normalizeStringArray(song.classification?.subgenres));
  if (song.releaseDecade) values.push(song.releaseDecade);
  return new Set(values.filter(Boolean));
}

function similarSongsFor(song) {
  const currentKey = favoriteKeyForSong(song);
  const currentTags = comparableTagSet(song);
  if (currentTags.size === 0) return [];

  return songs
    .filter(candidate => favoriteKeyForSong(candidate) !== currentKey)
    .map(candidate => {
      const candidateTags = comparableTagSet(candidate);
      const score = [...currentTags].filter(tag => candidateTags.has(tag)).length;
      return { song: candidate, score };
    })
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || playablePriority(left.song, right.song) || compareSongNo(left.song, right.song))
    .slice(0, 2)
    .map(item => item.song);
}

function sameArtistSongsFor(song) {
  const currentKey = favoriteKeyForSong(song);
  const artistKey = createSearchKey(song.artist);
  if (!artistKey) return [];

  return songs
    .filter(candidate => favoriteKeyForSong(candidate) !== currentKey && createSearchKey(candidate.artist) === artistKey)
    .sort(compareSongNo)
    .slice(0, 2);
}

function uniqueRelatedSongs(items, excludedKeys = new Set()) {
  const seen = new Set(excludedKeys);
  const unique = [];
  items.forEach(item => {
    const key = favoriteKeyForSong(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });
  return unique;
}

function relatedSongList(items) {
  if (items.length === 0) return "";
  return `
    <div class="detail-related-list">
      ${items.map(item => `
        <button class="detail-related-item" type="button" data-detail-related-key="${escapeHtml(favoriteKeyForSong(item))}">
          <span class="detail-related-title">${escapeHtml(item.title)}</span>
          <span class="detail-related-artist">${escapeHtml(item.artist || "アーティスト未設定")}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function performancePreviewFor(song) {
  const keys = songLookupKeys(song);
  for (const key of keys) {
    if (performancePreviews?.[key]) return performancePreviews[key];
  }
  return null;
}

function youtubeVideoId(value) {
  const text = normalizeCellText(value);
  if (!text) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;

  try {
    const url = new URL(text);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\/+/, "").split("/")[0] || "";
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/")[2] || "";
      }
      return url.searchParams.get("v") || "";
    }
  } catch (error) {
    return "";
  }

  return "";
}

function performancePreviewEmbedUrl(preview) {
  const embedUrl = normalizeCellText(preview?.embedUrl);
  if (embedUrl) return embedUrl;

  const videoId = youtubeVideoId(preview?.streamUrl);
  const start = Number(preview?.start);
  if (!videoId || !Number.isFinite(start)) return "";

  const params = [
    `start=${Math.max(0, Math.floor(start))}`,
    "controls=1",
    "playsinline=1",
    "rel=0",
  ];
  const end = Number(preview?.end);
  if (Number.isFinite(end) && end > start) {
    params.splice(1, 0, `end=${Math.floor(end)}`);
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.join("&")}`;
}

function performancePreviewWatchUrl(preview) {
  const videoId = youtubeVideoId(preview?.streamUrl);
  if (!videoId) return "";

  const start = Number(preview?.start);
  const params = new URLSearchParams({ v: videoId });
  if (Number.isFinite(start)) params.set("t", `${Math.max(0, Math.floor(start))}s`);
  return `https://www.youtube.com/watch?${params.toString()}`;
}

function performancePreviewRoundLabel(preview) {
  const no = normalizeCellText(preview?.no);
  return no ? `ピックアップ回：No. ${no}` : "";
}

function renderPerformancePreview(song) {
  const record = performancePreviewFor(song);
  const preview = record?.preview;
  const embedUrl = performancePreviewEmbedUrl(preview);
  const watchUrl = performancePreviewWatchUrl(preview);
  const roundLabel = performancePreviewRoundLabel(preview);

  return `
    <div class="song-detail-field song-detail-preview-field">
      <div class="performance-preview-heading">
        <span class="detail-label">過去の演奏プレビュー</span>
        ${watchUrl ? `
          <span class="performance-preview-separator">：</span>
          <a class="performance-preview-open-link" href="${escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer">
            YouTubeでプレビューを開く
          </a>
        ` : ""}
      </div>
      ${embedUrl ? `
        <div class="performance-preview-frame-wrap">
          <iframe
            class="performance-preview-frame"
            src="${escapeHtml(embedUrl)}"
            title="${escapeHtml(`${song.title} の過去の演奏プレビュー`)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen></iframe>
        </div>
        ${roundLabel ? `<div class="performance-preview-round-label">${escapeHtml(roundLabel)}</div>` : ""}
      ` : `<div class="performance-preview-empty">準備中</div>`}
    </div>
  `;
}

function originalYoutubeSearchUrl(song) {
  const query = [song.title, song.artist, "公式"]
    .map(normalizeCellText)
    .filter(Boolean)
    .join(" ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function renderOriginalYoutubeSearch(song) {
  return `
    <div class="song-detail-field song-detail-youtube-search-field">
      <a class="btn btn-dark detail-youtube-search-button" href="${escapeHtml(originalYoutubeSearchUrl(song))}" target="_blank" rel="noopener noreferrer">
        youtubeで原曲を探す
      </a>
    </div>
  `;
}

function renderSongDetail(song) {
  const genreBadge = detailBadge(songGenreLabel(song));
  const playableBadge = song.playable
    ? detailBadge(`${song.playable} 弾ける`, "badge-playable")
    : "";
  const number = songNumberValue(song.no);
  const tieUps = tieUpLabels(song);
  const sameArtistSongs = uniqueRelatedSongs(sameArtistSongsFor(song));
  const similarSongs = uniqueRelatedSongs(similarSongsFor(song), new Set(sameArtistSongs.map(favoriteKeyForSong)));
  const favoriteButtonText = isFavorite(song) ? "お気に入り解除" : "お気に入り登録";
  const favoriteButtonClass = isFavorite(song) ? "btn btn-warning detail-favorite-button active" : "btn btn-warning detail-favorite-button";

  return `
    <div class="song-detail">
      <div class="song-detail-actions">
        <button class="btn btn-dark" type="button" data-detail-copy>
          <span class="detail-copy-label-full">クリップボードコピー</span>
          <span class="detail-copy-label-short">コピー</span>
        </button>
        <button class="${favoriteButtonClass}" type="button" data-detail-favorite>${favoriteButtonText}</button>
      </div>
      <div class="song-detail-meta-row">
        <div class="song-detail-source">
          <span class="detail-label">分類</span>
          ${detailBadge(songSourceLabel(song))}
          ${number ? `<span class="detail-number">No. ${escapeHtml(number)}</span>` : ""}
        </div>
        <div class="song-detail-badges">
          ${genreBadge}
          ${playableBadge}
        </div>
      </div>
      <div class="song-detail-field">
        <span class="detail-label">曲名：</span>
        <div class="song-detail-title">${escapeHtml(song.title)}</div>
      </div>
      <div class="song-detail-field">
        <span class="detail-label">アーティスト：</span>
        <div class="song-detail-artist">${escapeHtml(song.artist || "アーティスト未設定")}</div>
      </div>
      ${song.releaseDecade ? `
        <div class="song-detail-field">
          <span class="detail-label">年代：</span>
          <div class="detail-chip-row">${detailBadge(song.releaseDecade)}</div>
        </div>
      ` : ""}
      ${tieUps.length > 0 ? `
        <div class="song-detail-field">
          <span class="detail-label">タイアップ：</span>
          <div class="detail-chip-row">${tieUps.map(label => detailBadge(label)).join("")}</div>
        </div>
      ` : ""}
      ${renderPerformancePreview(song)}
      ${renderOriginalYoutubeSearch(song)}
      ${similarSongs.length > 0 ? `
        <div class="song-detail-field song-detail-related-field">
          <span class="detail-label">似た雰囲気の曲を探す</span>
          ${relatedSongList(similarSongs)}
        </div>
      ` : ""}
      ${sameArtistSongs.length > 0 ? `
        <div class="song-detail-field song-detail-related-field">
          <span class="detail-label">同じアーティストの曲を探す</span>
          ${relatedSongList(sameArtistSongs)}
        </div>
      ` : ""}
    </div>
  `;
}

function stopPerformancePreviewPlayback() {
  els.songDetailBody.querySelectorAll(".performance-preview-frame").forEach(frame => {
    frame.src = "about:blank";
  });
}

function clearSongDetail() {
  stopPerformancePreviewPlayback();
  activeDetailSongKey = "";
  els.songDetailBody.innerHTML = "";
}

function setFloatingActionsSuppressed(suppressed) {
  document.body.classList.toggle("floating-actions-suppressed", suppressed);
}

function openSongDetail(song) {
  activeDetailSongKey = favoriteKeyForSong(song);
  els.songDetailBody.innerHTML = renderSongDetail(song);
  if (window.bootstrap && els.songDetailModal) {
    bootstrap.Modal.getOrCreateInstance(els.songDetailModal).show();
  }
}

function recordCopyHistory({ key, no, title, artist, text }) {
  key = normalizeCellText(key) || createSongKey(title, artist);
  const savedCounts = readJsonStorage(COPY_COUNTS_KEY, {});
  const counts = savedCounts && !Array.isArray(savedCounts) && typeof savedCounts === "object" ? savedCounts : {};
  counts[key] = (Number(counts[key]) || 0) + 1;
  writeJsonStorage(COPY_COUNTS_KEY, counts);

  const savedHistory = readJsonStorage(COPY_HISTORY_KEY, []);
  const history = Array.isArray(savedHistory) ? savedHistory : [];
  const timestamp = new Date().toISOString();
  history.unshift({
    key,
    no,
    title,
    artist,
    text,
    copiedAt: timestamp,
    timestamp,
    count: counts[key],
  });
  writeJsonStorage(COPY_HISTORY_KEY, history.slice(0, COPY_HISTORY_LIMIT));
  renderCopyHistory();
}

function toggleFavoriteFromCard(card) {
  const song = findSongByStoredKey(card.dataset.songKey) || {
    title: card.dataset.copySong || "",
    artist: card.dataset.copyArtist || "",
    songKey: card.dataset.songKey || "",
  };
  toggleFavoriteForSong(song);
}

function toggleFavoriteForSong(song) {
  const title = song.title || "";
  const key = favoriteKeyForSong(song);
  const willFavorite = !favoriteKeys.has(key);

  if (willFavorite) {
    favoriteKeys.add(key);
  } else {
    favoriteKeys.delete(key);
  }

  saveFavoriteKeys();
  if (favoriteOnly) {
    render();
  } else {
    updateFavoriteCards(key, willFavorite);
  }
  if (homeRandomSource === "favorite") {
    pickHomeRecommendations();
  }
  renderHome();
  if (fuzzySearchMode) renderFuzzySearch();
  if (activeDetailSongKey === key) {
    els.songDetailBody.innerHTML = renderSongDetail(song);
  }
  showCopyToast(
    willFavorite ? `${title}をお気に入りにしました！` : `${title}をお気に入りから解除しました`
  );
}

function updateFavoriteCards(key, isFavorited) {
  document.querySelectorAll("[data-favorite-key]").forEach(card => {
    if (card.dataset.favoriteKey === key) {
      card.classList.toggle("is-favorite", isFavorited);
    }
  });
}

function clearLongPressTimer() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function switchTab(tabName) {
  const normalized = ["home", "search", "fuzzy"].includes(tabName) ? tabName : "home";
  els.tabs.forEach(tab => {
    const active = tab.dataset.tab === normalized;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  const activePanelId = `panel-${normalized}`;
  els.panels.forEach(panel => {
    const active = panel.id === activePanelId;
    panel.hidden = !active;
  });
  setFuzzySearchMode(normalized === "fuzzy");
  localStorage.setItem(ACTIVE_TAB_KEY, normalized);
}

function updateBackToTopVisibility() {
  els.backToTop.hidden = window.scrollY < 320;
}

function handlePageScroll() {
  updateBackToTopVisibility();
  if (!els.siteFooter) return;

  els.siteFooter.classList.add("is-scrolling");
  clearTimeout(footerScrollTimer);
  footerScrollTimer = setTimeout(() => {
    els.siteFooter.classList.remove("is-scrolling");
  }, 180);
}

function resolveTheme(theme) {
  if (theme === "light" || theme === "dark") return theme;
  return systemThemeQuery.matches ? "dark" : "light";
}

function applyTheme(theme) {
  const normalized = ["light", "dark", "system"].includes(theme) ? theme : "system";
  document.documentElement.dataset.themePreference = normalized;
  document.documentElement.dataset.theme = resolveTheme(normalized);
  els.themeModes.forEach(option => {
    option.checked = option.value === normalized;
  });
  localStorage.setItem(THEME_KEY, normalized);
}

function applyAppPanelFontSize(size) {
  const normalized = ["small", "medium", "large"].includes(size) ? size : "medium";
  els.appPanel.classList.remove("font-size-small", "font-size-medium", "font-size-large");
  els.appPanel.classList.add(`font-size-${normalized}`);
  els.panelFontSizes.forEach(option => {
    option.checked = option.value === normalized;
  });
  localStorage.setItem(APP_PANEL_FONT_SIZE_KEY, normalized);
}

function applyAccentColorSetting(value, { rerender = false } = {}) {
  const normalized = value === "off" ? "off" : "on";
  accentColorEnabled = normalized === "on";
  els.accentColors.forEach(option => {
    option.checked = option.value === normalized;
  });
  localStorage.setItem(ACCENT_COLOR_KEY, normalized);
  if (!rerender) return;

  render();
  renderHome();
  if (fuzzySearchMode) renderFuzzySearch();
}

function applyRadioValue(options, value, fallback) {
  const values = [...options].map(option => option.value);
  const normalized = values.includes(value) ? value : fallback;
  options.forEach(option => {
    option.checked = option.value === normalized;
  });
  return normalized;
}

function loadSavedBoolean(key, fallback) {
  const saved = localStorage.getItem(key);
  if (saved === "true") return true;
  if (saved === "false") return false;
  return fallback;
}

function setSearchDetailsOpen(open) {
  els.searchDetails.hidden = !open;
  els.searchDetailToggle.setAttribute("aria-expanded", String(open));
  els.searchDetailToggle.textContent = open ? "▲詳細" : "▼詳細";
}

function setSearchGuideOpen(open) {
  els.searchGuide.hidden = !open;
  els.searchGuideToggle.setAttribute("aria-expanded", String(open));
  els.searchGuideToggle.textContent = open ? "▲検索ガイド" : "▼検索ガイド";
}

els.search.addEventListener("input", () => render({ syncSearchGuide: true }));
els.easyModeToggle.addEventListener("click", () => {
  setEasySearchMode(!easySearchMode);
});
els.easyRefresh.addEventListener("click", refreshEasyOptions);
els.easyCategoryList.addEventListener("click", event => {
  const toggleButton = event.target.closest("[data-easy-toggle]");
  if (toggleButton) {
    const categoryKey = toggleButton.dataset.easyToggle;
    if (easyAccordionQuery.matches) {
      const willOpen = easyCategoryOpen[categoryKey] === false;
      EASY_CATEGORIES.forEach(category => {
        easyCategoryOpen[category.key] = false;
      });
      easyCategoryOpen[categoryKey] = willOpen;
    } else {
      easyCategoryOpen[categoryKey] = easyCategoryOpen[categoryKey] === false;
    }
    renderEasySearch();
    return;
  }

  const optionButton = event.target.closest("[data-easy-option]");
  if (optionButton) {
    toggleEasyOption(optionButton.dataset.easyCategory, optionButton.dataset.easyOption);
    render();
    return;
  }

  const moreButton = event.target.closest("[data-easy-more]");
  if (moreButton) {
    const categoryKey = moreButton.dataset.easyMore;
    easyVisibleCounts[categoryKey] += EASY_OPTION_STEP;
    renderEasySearch();
    return;
  }
});
els.easyReset.addEventListener("click", resetEasySearch);
els.fuzzyCategoryTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-fuzzy-category]");
  if (!button) return;
  activeFuzzyCategoryIndex = Number(button.dataset.fuzzyCategory) || 0;
  activeFuzzyItemIndex = null;
  fuzzyResultLimit = FUZZY_RESULT_INITIAL_COUNT;
  fuzzyVisibleTier = 1;
  renderFuzzySearch();
});
els.fuzzyCategoryTabs.addEventListener("scroll", updateFuzzyCategoryScrollButtons, { passive: true });
els.fuzzyCategoryScrollPrev.addEventListener("click", () => scrollFuzzyCategories(-1));
els.fuzzyCategoryScrollNext.addEventListener("click", () => scrollFuzzyCategories(1));
els.fuzzyCategoryContent.addEventListener("click", event => {
  const tierMoreButton = event.target.closest("[data-fuzzy-tier-more]");
  if (tierMoreButton) {
    fuzzyVisibleTier = Math.min(fuzzyVisibleTier + 1, FUZZY_MAX_TIER);
    renderFuzzySearch();
    return;
  }

  const button = event.target.closest("[data-fuzzy-item]");
  if (!button) return;
  activeFuzzyItemIndex = Number(button.dataset.fuzzyItem);
  fuzzyResultLimit = FUZZY_RESULT_INITIAL_COUNT;
  renderFuzzySearch();
});
els.fuzzyMore.addEventListener("click", () => {
  fuzzyResultLimit = Math.min(
    fuzzyResultLimit + FUZZY_RESULT_STEP,
    FUZZY_RESULT_MAX_COUNT
  );
  renderFuzzySearch();
});
els.searchScopes.forEach(scope => scope.addEventListener("change", () => {
  localStorage.setItem(SEARCH_SCOPE_KEY, scope.value);
  updateSearchPlaceholder(scope.value);
  render();
}));
els.displayColumns.forEach(column => {
  column.addEventListener("change", () => {
    displayColumnCount = column.value;
    localStorage.setItem(DISPLAY_COLUMNS_KEY, displayColumnCount);
    applyColumnLayout();
  });
});
els.genre.addEventListener("change", render);
els.sortOrder.addEventListener("change", () => {
  localStorage.setItem(SORT_ORDER_KEY, els.sortOrder.value || "playable");
  render();
});
els.animeDrama.addEventListener("change", () => {
  localStorage.setItem(ANIME_DRAMA_KEY, els.animeDrama.value || "");
  render();
});
[els.subgenre, els.sourceCategory, els.vocalType, els.releaseDecade].forEach(select => {
  select.addEventListener("change", render);
});
els.stats.addEventListener("click", event => {
  if (event.target.closest("[data-easy-playable-filter]")) {
    playableOnly = !playableOnly;
    localStorage.setItem(PLAYABLE_ONLY_KEY, String(playableOnly));
    refreshEasyOptions();
    render();
    return;
  }

  if (event.target.closest("[data-easy-favorite-filter]")) {
    favoriteOnly = !favoriteOnly;
    localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
    refreshEasyOptions();
    render({ syncSearchGuide: true, forceSearchGuideSync: true });
  }
});
els.playableFilter.addEventListener("click", () => {
  playableOnly = !playableOnly;
  localStorage.setItem(PLAYABLE_ONLY_KEY, String(playableOnly));
  render();
});
els.favoriteFilter.addEventListener("click", () => {
  favoriteOnly = !favoriteOnly;
  localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
  render({ syncSearchGuide: true, forceSearchGuideSync: true });
});
els.clearFavorites.addEventListener("click", clearAllFavorites);
els.homeRandomOptions.forEach(button => {
  button.addEventListener("click", () => {
    homeRandomSource = ["all", "playable", "favorite"].includes(button.dataset.homeRandomSource)
      ? button.dataset.homeRandomSource
      : "all";
    localStorage.setItem(HOME_RANDOM_SOURCE_KEY, homeRandomSource);
    pickHomeRecommendations();
    renderHome();
  });
});
els.homeMoodOptions.addEventListener("click", event => {
  const button = event.target.closest("[data-home-mood]");
  if (!button) return;
  activeHomeMoodIndex = Number(button.dataset.homeMood);
  renderHomeMood();
});
els.homeFuzzyLink.addEventListener("click", () => {
  switchTab("fuzzy");
  els.fuzzySearchModeToggle.focus();
});
els.searchDetailToggle.addEventListener("click", () => {
  setSearchDetailsOpen(els.searchDetails.hidden);
});
els.searchGuideToggle.addEventListener("click", () => {
  setSearchGuideOpen(els.searchGuide.hidden);
});
els.backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: reducedMotionQuery.matches ? "auto" : "smooth",
  });
});
els.panelFontSizes.forEach(option => {
  option.addEventListener("change", () => applyAppPanelFontSize(option.value));
});
els.accentColors.forEach(option => {
  option.addEventListener("change", () => applyAccentColorSetting(option.value, { rerender: true }));
});
els.themeModes.forEach(option => {
  option.addEventListener("change", () => applyTheme(option.value));
});
const handleSystemThemeChange = () => {
  if (localStorage.getItem(THEME_KEY) === "system") {
    applyTheme("system");
  }
};
if (systemThemeQuery.addEventListener) {
  systemThemeQuery.addEventListener("change", handleSystemThemeChange);
} else if (systemThemeQuery.addListener) {
  systemThemeQuery.addListener(handleSystemThemeChange);
}
const handleEasyAccordionBreakpointChange = () => resetEasyCategoryOpenForViewport();
if (easyAccordionQuery.addEventListener) {
  easyAccordionQuery.addEventListener("change", handleEasyAccordionBreakpointChange);
} else if (easyAccordionQuery.addListener) {
  easyAccordionQuery.addListener(handleEasyAccordionBreakpointChange);
}
window.addEventListener("resize", refreshFuzzyCategoryScrollControls, { passive: true });
window.addEventListener("scroll", handlePageScroll, { passive: true });

document.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-card-menu]")) return;
  const card = event.target.closest("[data-copy-song]");
  if (!card) return;

  clearLongPressTimer();
  longPressHandled = false;
  longPressStartX = event.clientX;
  longPressStartY = event.clientY;
  longPressTimer = setTimeout(() => {
    longPressHandled = true;
    clearTimeout(longPressSuppressTimer);
    longPressSuppressTimer = setTimeout(() => {
      longPressHandled = false;
    }, 800);
    toggleFavoriteFromCard(card);
  }, LONG_PRESS_MS);
});

document.addEventListener("pointermove", (event) => {
  if (!longPressTimer) return;
  const movedX = Math.abs(event.clientX - longPressStartX);
  const movedY = Math.abs(event.clientY - longPressStartY);
  if (movedX > 10 || movedY > 10) {
    clearLongPressTimer();
  }
});

["pointerup", "pointercancel", "pointerleave"].forEach(eventName => {
  document.addEventListener(eventName, clearLongPressTimer);
});

document.addEventListener("selectstart", (event) => {
  if (event.target.closest("[data-copy-song]")) {
    event.preventDefault();
  }
});

document.addEventListener("contextmenu", (event) => {
  if (event.target.closest("[data-copy-song]")) {
    event.preventDefault();
  }
});

document.addEventListener("click", (event) => {
  const menuButton = event.target.closest("[data-card-menu]");
  if (menuButton) {
    event.preventDefault();
    event.stopPropagation();
    const song = findSongByStoredKey(menuButton.dataset.songKey);
    if (song) openSongDetail(song);
    return;
  }

  const card = event.target.closest("[data-copy-song]");
  if (!card) return;
  if (longPressHandled) {
    event.preventDefault();
    clearTimeout(longPressSuppressTimer);
    longPressSuppressTimer = null;
    longPressHandled = false;
    return;
  }
  handleCardCopy(card);
});

els.songDetailBody.addEventListener("click", (event) => {
  const currentSong = findSongByStoredKey(activeDetailSongKey);
  if (!currentSong) return;

  if (event.target.closest("[data-detail-copy]")) {
    copySongRequest(currentSong);
    return;
  }

  if (event.target.closest("[data-detail-favorite]")) {
    toggleFavoriteForSong(currentSong);
    return;
  }

  const relatedButton = event.target.closest("[data-detail-related-key]");
  if (relatedButton) {
    const relatedSong = findSongByStoredKey(relatedButton.dataset.detailRelatedKey);
    if (relatedSong) openSongDetail(relatedSong);
  }
});

if (els.songDetailModal) {
  els.songDetailModal.addEventListener("show.bs.modal", () => setFloatingActionsSuppressed(true));
  els.songDetailModal.addEventListener("hide.bs.modal", stopPerformancePreviewPlayback);
  els.songDetailModal.addEventListener("hidden.bs.modal", () => {
    clearSongDetail();
    setFloatingActionsSuppressed(false);
  });
}

if (els.informationModal) {
  els.informationModal.addEventListener("show.bs.modal", () => setFloatingActionsSuppressed(true));
  els.informationModal.addEventListener("hidden.bs.modal", () => setFloatingActionsSuppressed(false));
}

els.tabs.forEach(tab => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

applyTheme(localStorage.getItem(THEME_KEY));
applyAppPanelFontSize(localStorage.getItem(APP_PANEL_FONT_SIZE_KEY));
applyAccentColorSetting(localStorage.getItem(ACCENT_COLOR_KEY));
updateSearchPlaceholder(applyRadioValue(els.searchScopes, localStorage.getItem(SEARCH_SCOPE_KEY), "all"));
displayColumnCount = applyRadioValue(els.displayColumns, localStorage.getItem(DISPLAY_COLUMNS_KEY), "3");
playableOnly = loadSavedBoolean(PLAYABLE_ONLY_KEY, false);
const savedSortOrder = localStorage.getItem(SORT_ORDER_KEY);
els.sortOrder.value = ["playable", "no", "title", "artist", "favorite", "copyCount", "random"].includes(savedSortOrder)
  ? savedSortOrder
  : "playable";
const savedAnimeDrama = localStorage.getItem(ANIME_DRAMA_KEY);
pendingAnimeDramaValue = savedAnimeDrama || "";
homeRandomSource = ["all", "playable", "favorite"].includes(localStorage.getItem(HOME_RANDOM_SOURCE_KEY))
  ? localStorage.getItem(HOME_RANDOM_SOURCE_KEY)
  : "all";
favoriteOnly = loadSavedBoolean(FAVORITES_ONLY_KEY, false);
loadFavoriteKeys();
resetEasyCategoryOpenForViewport();
setSearchDetailsOpen(false);
setFuzzySearchMode(false);
applyColumnLayout();
switchTab(localStorage.getItem(ACTIVE_TAB_KEY));
updateBackToTopVisibility();
loadSheet();
