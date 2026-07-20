const MUSICLIST_JSON_PATH = "./data/musiclist.json";
const FUZZY_SEARCH_PRESETS_JSON_PATH = "./data/fuzzy-search-presets.json";
const PERFORMANCE_PREVIEW_JSON_PATH = "./data/performance_preview.json";
const HOME_RECOMMEND_COUNT = 5;
const HOME_MOOD_RESULT_COUNT = 3;
const FUZZY_RESULT_INITIAL_COUNT = 5;
const FUZZY_RESULT_STEP = 5;
const FUZZY_RESULT_MAX_COUNT = 30;
const FUZZY_MAX_TIER = 3;
const SEARCH_RESULT_INITIAL_COUNT = 30;
const SEARCH_RESULT_STEP = 30;
const SEARCH_SUGGESTION_MAX_COUNT = 3;
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
  searchSuggestions: document.getElementById("searchSuggestions"),
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
  searchModeTabs: document.querySelectorAll("[data-search-mode]"),
  normalSearchControls: document.getElementById("normalSearchControls"),
  searchModeDescription: document.getElementById("searchModeDescription"),
  easySearchPanel: document.getElementById("easySearchPanel"),
  easyCategoryList: document.getElementById("easyCategoryList"),
  easyReset: document.getElementById("easyReset"),
  playableFilter: document.getElementById("playableFilter"),
  stats: document.getElementById("stats"),
  activeSearchFilters: document.getElementById("activeSearchFilters"),
  activeSearchFilterList: document.getElementById("activeSearchFilterList"),
  songs: document.getElementById("songs"),
  searchMore: document.getElementById("searchMore"),
  empty: document.getElementById("empty"),
  searchAlternatives: document.getElementById("searchAlternatives"),
  zeroResultRecommendations: document.getElementById("zeroResultRecommendations"),
  zeroResultRecommendationSongs: document.getElementById("zeroResultRecommendationSongs"),
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
  siteNavbar: document.getElementById("siteNavbar"),
  backToTop: document.getElementById("backToTop"),
  floatingMenu: document.getElementById("floatingMenu"),
  floatingMenuPanel: document.getElementById("floatingMenuPanel"),
  floatingMenuItems: document.querySelectorAll("[data-floating-menu-item]"),
  menuButton: document.getElementById("menuButton"),
  appPanel: document.getElementById("appPanel"),
  themeModes: document.querySelectorAll("[name='themeMode']"),
  panelFontSizes: document.querySelectorAll("[name='panelFontSize']"),
  accentColors: document.querySelectorAll("[name='accentColor']"),
  informationModal: document.getElementById("informationModal"),
  settingsModal: document.getElementById("settingsModal"),
  songDetailModal: document.getElementById("songDetailModal"),
  songDetailBody: document.getElementById("songDetailBody"),
};

const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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
let searchResultLimit = SEARCH_RESULT_INITIAL_COUNT;
let searchSuggestionOptions = [];
let activeSearchSuggestionIndex = -1;
let footerScrollTimer = null;
let headerScrollAnchor = window.scrollY;
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
let easyOptionSnapshots = {
  genre: null,
  artist: null,
  mood: null,
};
let easyCategoryOpen = {
  genre: true,
  artist: false,
  mood: false,
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
    includeSourceArtistInSearch: item?.includeSourceArtistInSearch !== false,
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
    buildSearchSuggestionOptions(songs);
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

function searchKeywords(value = els.search.value) {
  const keyword = createSearchKey(value);
  return keyword ? [keyword] : [];
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

function searchTargetsByType(song) {
  return {
    title: [
    song.title,
    song.sourceTitle,
    ...normalizeStringArray(song.titleSearchWords),
    ],
    artist: [
    song.artist,
    ...(song.includeSourceArtistInSearch ? [song.sourceArtist] : []),
    ...normalizeStringArray(song.artistSearchWords),
    ],
  };
}

function searchTargetsForScope(song, scope) {
  const targets = searchTargetsByType(song);

  if (scope === "title") return targets.title;
  if (scope === "artist") return targets.artist;
  return [...targets.title, ...targets.artist];
}

function matchesSearchKeyword(song, keywords, scope) {
  if (!Array.isArray(keywords) || keywords.length === 0) return true;

  const searchTargets = searchTargetsForScope(song, scope).map(createSearchKey).filter(Boolean);

  return keywords.every(keyword => searchTargets.some(target => target.includes(keyword)));
}

function buildSearchSuggestionOptions(items) {
  const optionMap = new Map();
  const addOption = (type, value, aliases = []) => {
    const label = normalizeCellText(value);
    const key = createSearchKey(label);
    if (!key) return;
    const mapKey = `${type}|${key}`;
    const keys = [label, ...aliases].map(createSearchKey).filter(Boolean);
    const existing = optionMap.get(mapKey);
    if (existing) {
      existing.keys = [...new Set([...existing.keys, ...keys])];
    } else {
      optionMap.set(mapKey, { type, value: label, key, keys: [...new Set(keys)] });
    }
  };

  items.forEach(song => {
    addOption("title", song.title, [song.sourceTitle, ...normalizeStringArray(song.titleSearchWords)]);
    addOption("artist", song.artist, [
      ...(song.includeSourceArtistInSearch ? [song.sourceArtist] : []),
      ...normalizeStringArray(song.artistSearchWords),
    ]);
  });

  const typeOrder = { title: 0, artist: 1 };
  searchSuggestionOptions = [...optionMap.values()].sort((left, right) => {
    return typeOrder[left.type] - typeOrder[right.type]
      || left.value.localeCompare(right.value, "ja");
  });
}

function searchSuggestionTypeLabel(type) {
  return { title: "曲名", artist: "アーティスト" }[type] || "候補";
}

function matchingSearchSuggestions() {
  const keyword = createSearchKey(els.search.value);
  if (!keyword) return [];
  const scope = getSearchScope();

  return searchSuggestionOptions
    .filter(option => (scope === "all" || option.type === scope) && option.keys.some(key => key.includes(keyword)))
    .slice(0, SEARCH_SUGGESTION_MAX_COUNT);
}

function hideSearchSuggestions() {
  activeSearchSuggestionIndex = -1;
  els.searchSuggestions.hidden = true;
  els.searchSuggestions.innerHTML = "";
  els.search.setAttribute("aria-expanded", "false");
  els.search.removeAttribute("aria-activedescendant");
}

function renderSearchSuggestions() {
  if (easySearchMode || document.activeElement !== els.search) {
    hideSearchSuggestions();
    return;
  }

  const options = matchingSearchSuggestions();
  if (options.length === 0) {
    hideSearchSuggestions();
    return;
  }

  if (activeSearchSuggestionIndex >= options.length) activeSearchSuggestionIndex = -1;
  els.searchSuggestions.innerHTML = options.map((option, index) => `
    <button class="search-suggestion-option" id="search-suggestion-${index}" type="button" role="option" data-search-suggestion="${escapeHtml(option.value)}" aria-selected="${index === activeSearchSuggestionIndex}">
      <span>${escapeHtml(option.value)}</span>
      <small>${escapeHtml(searchSuggestionTypeLabel(option.type))}</small>
    </button>
  `).join("");
  els.searchSuggestions.hidden = false;
  els.search.setAttribute("aria-expanded", "true");
  if (activeSearchSuggestionIndex >= 0) {
    els.search.setAttribute("aria-activedescendant", `search-suggestion-${activeSearchSuggestionIndex}`);
  } else {
    els.search.removeAttribute("aria-activedescendant");
  }
}

function selectSearchSuggestion(value) {
  els.search.value = normalizeCellText(value);
  hideSearchSuggestions();
  searchResultLimit = SEARCH_RESULT_INITIAL_COUNT;
  render({ syncSearchGuide: true });
}

function selectedOptionLabel(select) {
  return select.selectedOptions?.[0]?.textContent?.trim() || select.value;
}

function activeSearchConditions() {
  if (easySearchMode) return [];
  const conditions = [];
  const hasPrimaryCondition = hasSearchKeyword() || hasSearchDetailFilter() || playableOnly || favoriteOnly;
  const scopeLabels = { title: "曲名", artist: "アーティスト" };

  if (hasSearchKeyword()) conditions.push({ key: "query", label: `キーワード：${normalizeCellText(els.search.value)}` });
  if (hasSearchKeyword() && getSearchScope() !== "all") {
    conditions.push({ key: "scope", label: `検索対象：${scopeLabels[getSearchScope()] || getSearchScope()}` });
  }
  [
    ["genre", "ジャンル", els.genre],
    ["subgenre", "サブジャンル", els.subgenre],
    ["source", "出典", els.sourceCategory],
    ["work", "アニメ・ドラマ", els.animeDrama],
    ["vocal", "ボーカル", els.vocalType],
    ["decade", "年代", els.releaseDecade],
  ].forEach(([key, label, select]) => {
    if (select.value) conditions.push({ key, label: `${label}：${selectedOptionLabel(select)}` });
  });
  if (playableOnly) conditions.push({ key: "playable", label: "弾ける曲のみ" });
  if (favoriteOnly) conditions.push({ key: "favorites", label: "お気に入りのみ" });
  if (hasPrimaryCondition && els.sortOrder.value !== "playable") {
    conditions.push({ key: "sort", label: `並び順：${selectedOptionLabel(els.sortOrder)}` });
  }
  return conditions;
}

function renderActiveSearchFilters() {
  const conditions = activeSearchConditions();
  els.activeSearchFilters.hidden = conditions.length === 0;
  els.activeSearchFilterList.innerHTML = conditions.map(condition => `
    <button class="active-search-filter" type="button" data-clear-search-filter="${escapeHtml(condition.key)}" aria-label="${escapeHtml(condition.label)}を解除">
      <span>${escapeHtml(condition.label)}</span><span aria-hidden="true">×</span>
    </button>
  `).join("");
}

function resetSearchResultLimit() {
  searchResultLimit = SEARCH_RESULT_INITIAL_COUNT;
}

function clearSearchCondition(key) {
  if (key === "query") els.search.value = "";
  if (key === "scope") updateSearchPlaceholder(applyRadioValue(els.searchScopes, "all", "all"));
  if (key === "genre") els.genre.value = "";
  if (key === "subgenre") els.subgenre.value = "";
  if (key === "source") els.sourceCategory.value = "";
  if (key === "work") els.animeDrama.value = "";
  if (key === "vocal") els.vocalType.value = "";
  if (key === "decade") els.releaseDecade.value = "";
  if (key === "playable") playableOnly = false;
  if (key === "favorites") favoriteOnly = false;
  if (key === "sort") els.sortOrder.value = "playable";

  localStorage.setItem(SEARCH_SCOPE_KEY, getSearchScope());
  localStorage.setItem(PLAYABLE_ONLY_KEY, String(playableOnly));
  localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
  localStorage.setItem(SORT_ORDER_KEY, els.sortOrder.value || "playable");
  localStorage.setItem(ANIME_DRAMA_KEY, els.animeDrama.value || "");
  hideSearchSuggestions();
  resetSearchResultLimit();
  render({ syncSearchGuide: true });
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function similarSearchSuggestions(resultItems) {
  const keywords = searchKeywords();
  const query = createSearchKey(els.search.value);
  if (easySearchMode || resultItems.length !== 0 || keywords.length === 0 || query.length < 2) return [];
  const scope = getSearchScope();
  if (songs.some(song => matchesSearchKeyword(song, keywords, scope))) return [];
  const threshold = Math.max(1, Math.floor(query.length * .3));

  return searchSuggestionOptions
    .filter(option => scope === "all" || option.type === scope)
    .map(option => ({
      ...option,
      distance: Math.min(...option.keys
        .filter(key => Math.abs(key.length - query.length) <= threshold)
        .map(key => levenshteinDistance(query, key))),
    }))
    .filter(option => option.distance > 0 && option.distance <= threshold)
    .sort((left, right) => left.distance - right.distance || left.value.localeCompare(right.value, "ja"))
    .slice(0, 3);
}

function renderSearchAlternatives(resultItems) {
  const alternatives = similarSearchSuggestions(resultItems);
  els.searchAlternatives.hidden = alternatives.length === 0;
  els.searchAlternatives.innerHTML = alternatives.length === 0 ? "" : `
    <span class="search-alternatives-label">もしかして：</span>
    <div class="search-alternatives-list">
      ${alternatives.map(option => `
        <button class="btn search-alternative-button" type="button" data-search-alternative="${escapeHtml(option.value)}">
          ${escapeHtml(option.value)} <small>${escapeHtml(searchSuggestionTypeLabel(option.type))}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function normalizedSearchSimilarity(query, target) {
  if (!query || !target) return 0;
  if (target.includes(query) || query.includes(target)) return 1;
  const maxLength = Math.max(query.length, target.length);
  return maxLength === 0 ? 0 : Math.max(0, 1 - levenshteinDistance(query, target) / maxLength);
}

function keywordSimilarityForSong(song) {
  const query = createSearchKey(els.search.value);
  if (!query) return 0;
  const targets = searchTargetsForScope(song, getSearchScope()).map(createSearchKey).filter(Boolean);
  return targets.reduce((best, target) => Math.max(best, normalizedSearchSimilarity(query, target)), 0);
}

function zeroRecommendationScore(song) {
  const scores = [];

  if (easySearchMode) {
    EASY_CATEGORIES.forEach(category => {
      if (selectedEasyValues(category.key).length > 0) {
        scores.push(Number(easyMatchesCategory(song, category.key)));
      }
    });
  } else {
    if (hasSearchKeyword()) scores.push(keywordSimilarityForSong(song));
    if (els.genre.value) scores.push(Number(song.genre === els.genre.value));
    if (els.subgenre.value) scores.push(Number(normalizeStringArray(song.classification?.subgenres).includes(els.subgenre.value)));
    if (els.sourceCategory.value) scores.push(Number(sourceCategoriesFor(song).includes(els.sourceCategory.value)));
    if (els.animeDrama.value) scores.push(Number(matchesAnimeDramaFilter(song, els.animeDrama.value)));
    if (els.vocalType.value) scores.push(Number(normalizeStringArray(song.classification?.vocalTypes).includes(els.vocalType.value)));
    if (els.releaseDecade.value) scores.push(Number(song.releaseDecade === els.releaseDecade.value));
  }

  if (playableOnly) scores.push(Number(isPlayable(song)));
  if (favoriteOnly) scores.push(Number(isFavorite(song)));
  return scores.reduce((total, score) => total + score, 0);
}

function zeroResultRecommendationSongs(resultItems) {
  const hasActiveCondition = easySearchMode ? hasEasyActiveFilters() : !isSearchGuideDefaultState();
  if (!hasActiveCondition || resultItems.length !== 0 || songs.length === 0) return [];
  const conditionKey = easySearchMode
    ? EASY_CATEGORIES.map(category => selectedEasyValues(category.key).join(",")).join("|")
    : activeSearchConditions().map(condition => condition.label).join("|");
  const dateKey = localDateSeedKey();

  return songs
    .map(song => ({
      song,
      score: zeroRecommendationScore(song),
      tieBreak: stableStringHash(`${dateKey}|${conditionKey}|${favoriteKeyForSong(song)}`),
    }))
    .sort((left, right) => right.score - left.score
      || playablePriority(left.song, right.song)
      || left.tieBreak - right.tieBreak)
    .slice(0, 3)
    .map(item => item.song);
}

function renderZeroResultRecommendations(resultItems) {
  const recommendations = zeroResultRecommendationSongs(resultItems);
  els.zeroResultRecommendations.hidden = recommendations.length === 0;
  els.zeroResultRecommendationSongs.innerHTML = renderSongCards(recommendations);
}

function hasSearchKeyword() {
  return searchKeywords().length !== 0;
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
  next[categoryKey] = new Set([optionValue]);
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
    .filter(option => option.value === "all" || option.count > 0 || easySelections.genre.has(option.value));
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

  easySelections.artist.forEach(artist => {
    if (!counts.has(artist)) counts.set(artist, 0);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: `${value} (${count})`, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, "ja"));
}

function easyMoodOptions() {
  return EASY_MOOD_OPTIONS
    .map(option => ({ ...option, count: easyOptionCount("mood", option.value) }))
    .filter(option => option.count > 0 || easySelections.mood.has(option.value));
}

function computeEasyOptionsForCategory(categoryKey) {
  if (categoryKey === "genre") return easyGenreOptions();
  if (categoryKey === "artist") return easyArtistOptions();
  if (categoryKey === "mood") return easyMoodOptions();
  return [];
}

function easyOptionsForCategory(categoryKey) {
  if (!easyOptionSnapshots[categoryKey]) {
    easyOptionSnapshots[categoryKey] = computeEasyOptionsForCategory(categoryKey);
  }
  return easyOptionSnapshots[categoryKey];
}

function invalidateEasyOptions({ resetVisibleCounts = false } = {}) {
  EASY_CATEGORIES.forEach(category => {
    easyOptionSnapshots[category.key] = null;
    if (resetVisibleCounts) {
      easyVisibleCounts[category.key] = EASY_OPTION_INITIAL_COUNT;
    }
  });
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

  invalidateEasyOptions();
}

function resetEasySearch() {
  resetSearchResultLimit();
  EASY_CATEGORIES.forEach(category => {
    easySelections[category.key].clear();
    easyVisibleCounts[category.key] = EASY_OPTION_INITIAL_COUNT;
    easyOptionSnapshots[category.key] = null;
  });
  render();
}

function renderEasyCategory(category) {
  const options = easyOptionsForCategory(category.key);
  const visibleCount = easyVisibleCounts[category.key];
  const initiallyVisibleOptions = options.slice(0, visibleCount);
  const visibleValues = new Set(initiallyVisibleOptions.map(option => option.value));
  const selectedOptions = options.filter(option => (
    easySelections[category.key].has(option.value) && !visibleValues.has(option.value)
  ));
  const visibleOptions = [...initiallyVisibleOptions, ...selectedOptions];
  const hasMore = options.length > visibleOptions.length;
  const open = easyCategoryOpen[category.key] !== false;
  const selectedLabels = selectedEasyValues(category.key)
    .map(value => easyOptionLabel(category.key, value));
  const selectedSummary = !open && selectedLabels.length > 0
    ? `<span class="easy-category-selected">${escapeHtml(selectedLabels.join("、"))}</span>`
    : "";

  return `
    <section class="easy-category-card ${open ? "is-open" : ""}">
      <div class="easy-category-header">
        <button class="btn easy-category-toggle" type="button" data-easy-toggle="${escapeHtml(category.key)}" aria-expanded="${open}" aria-controls="easy-category-${escapeHtml(category.key)}">
          <span class="easy-category-heading">
            <span class="easy-category-title">${escapeHtml(category.label)}</span>
            ${selectedSummary}
          </span>
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
  els.easyCategoryList.innerHTML = EASY_CATEGORIES.map(renderEasyCategory).join("");
}

function resetEasyCategoryOpen() {
  EASY_CATEGORIES.forEach((category, index) => {
    easyCategoryOpen[category.key] = index === 0;
  });
  if (easySearchMode) renderEasySearch();
}

function setEasySearchMode(active) {
  easySearchMode = Boolean(active);
  resetSearchResultLimit();
  hideSearchSuggestions();
  els.normalSearchPanel.classList.toggle("easy-mode", easySearchMode);
  els.normalSearchControls.hidden = easySearchMode;
  els.easySearchPanel.hidden = !easySearchMode;
  els.searchModeTabs.forEach(tab => {
    const selected = (tab.dataset.searchMode === "easy") === easySearchMode;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  els.searchModeDescription.textContent = easySearchMode
    ? "ボタンを組み合わせて、リクエスト候補をかんたんに絞り込めます。気になる条件を選んで、少しずつ曲を探してみてください。"
    : "曲名やアーティスト名から、リクエストしたい曲を探せます。";
  if (easySearchMode) {
    setSearchGuideOpen(false);
  }
  render({ syncSearchGuide: true, forceSearchGuideSync: true });
}

function filteredSongs() {
  if (easySearchMode) return easyFilteredSongs();

  const keywords = searchKeywords();
  const searchScope = getSearchScope();
  const genre = els.genre.value;
  const subgenre = els.subgenre.value;
  const sourceCategory = els.sourceCategory.value;
  const animeDrama = els.animeDrama.value;
  const vocalType = els.vocalType.value;
  const releaseDecade = els.releaseDecade.value;

  if (keywords.length === 0 && !favoriteOnly && !hasSearchDetailFilter()) return [];

  const filtered = songs.filter(song => {
    const keywordOk = matchesSearchKeyword(song, keywords, searchScope);
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
  if (homeRandomSource === "recent") return longAgoCopiedSongs();
  return songs;
}

function pickHomeRecommendations() {
  const source = [...getHomeRecommendSource()];
  if (homeRandomSource === "recent") {
    homeRecommendedSongs = source.slice(0, HOME_RECOMMEND_COUNT);
    return;
  }
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

  [els.homeRecommendations, els.homeMoodSongs, els.copyHistorySongs, els.songs, els.zeroResultRecommendationSongs, els.fuzzySongs].forEach(grid => {
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
  if (group === "subgenres") {
    return normalizeStringArray(song.classification?.subgenres);
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

function detailIconHtml() {
  return `
    <span class="theme-icon song-card-menu-icon" aria-hidden="true">
      <img class="theme-icon-light" src="../lib/icon/white/detail.svg" alt="">
      <img class="theme-icon-dark" src="../lib/icon/black/detail.svg" alt="">
    </span>
  `;
}

function renderSongCards(items) {
  return items.map(song => {
    return `
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
          ${detailIconHtml()}
        </button>
      </article>
    </div>
  `;
  }).join("");
}

function renderEasyStats(items, visibleItems = items) {
  return `
    <span class="badge rounded-pill stat-badge px-3 py-2">検索結果：<strong>${items.length}</strong>件</span>
    <span class="playable-filter easy-stat-filter" aria-label="弾ける曲フィルター">
      <span class="playable-filter-label">弾ける曲</span>
      <button class="badge rounded-pill stat-badge stat-filter-button px-3 py-2 ${playableOnly ? "active" : ""}" type="button" data-easy-playable-filter aria-pressed="${playableOnly}">${playableOnly ? "ON" : "OFF"}</button>
    </span>
    <button class="badge rounded-pill stat-badge stat-filter-button px-3 py-2 ${favoriteOnly ? "active" : ""}" type="button" data-easy-favorite-filter aria-pressed="${favoriteOnly}" aria-label="${favoriteOnly ? "お気に入りのみ表示中" : "お気に入りのみ表示"}">${favoriteOnly ? "★お気に入りのみ" : "☆お気に入りのみ"}</button>
  `;
}

function render({ syncSearchGuide = false, forceSearchGuideSync = false } = {}) {
  const items = filteredSongs();
  const visibleItems = items.slice(0, searchResultLimit);
  const isDefaultSearchState = isSearchGuideDefaultState();

  if (easySearchMode) renderEasySearch();
  els.stats.innerHTML = `
    <span class="badge rounded-pill stat-badge px-3 py-2">全曲数：<strong>${songs.length}</strong> 検索結果：<strong>${items.length}</strong>件</span>
  `;
  if (easySearchMode) {
    els.stats.innerHTML = renderEasyStats(items, visibleItems);
  }
  renderActiveSearchFilters();
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
  els.searchMore.hidden = visibleItems.length >= items.length;
  els.searchMore.textContent = `さらに${Math.min(SEARCH_RESULT_STEP, items.length - visibleItems.length)}件表示 ⇒`;
  els.songs.innerHTML = renderSongCards(visibleItems);
  renderSearchAlternatives(items);
  renderZeroResultRecommendations(items);
}

function renderHome() {
  updateHomeRandomSourceButtons();
  els.homeRecommendEmpty.hidden = homeRecommendedSongs.length !== 0;
  els.homeRecommendEmpty.textContent = homeRandomSource === "recent"
    ? "コピー履歴がたまると、久しぶりの曲を表示できます。"
    : "おすすめできる曲がまだありません。";
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
  if (suppressed) setFloatingMenuOpen(false);
  document.body.classList.toggle("floating-actions-suppressed", suppressed);
}

function longAgoCopiedSongs() {
  const savedHistory = readJsonStorage(COPY_HISTORY_KEY, []);
  const history = Array.isArray(savedHistory) ? savedHistory : [];
  const latestByKey = new Map();

  history.forEach(entry => {
    const key = normalizeCellText(entry?.key || favoriteKeyForSong(entry || {}));
    if (!key || latestByKey.has(key)) return;
    const copiedAt = Date.parse(entry?.copiedAt || entry?.timestamp || "");
    latestByKey.set(key, Number.isFinite(copiedAt) ? copiedAt : 0);
  });

  return [...latestByKey.entries()]
    .map(([key, copiedAt]) => ({ song: findSongByStoredKey(key), copiedAt }))
    .filter(item => item.song)
    .sort((left, right) => left.copiedAt - right.copiedAt || compareSongNo(left.song, right.song))
    .map(item => item.song);
}

function setFloatingMenuOpen(open, { restoreFocus = false } = {}) {
  if (!els.floatingMenuPanel || !els.menuButton) return;
  els.floatingMenuPanel.hidden = !open;
  els.menuButton.setAttribute("aria-expanded", String(open));
  els.floatingMenu.classList.toggle("is-open", open);
  if (open) {
    els.floatingMenuItems[0]?.focus();
  } else if (restoreFocus) {
    els.menuButton.focus();
  }
}

function updateResponsiveHeaderVisibility() {
  if (!els.siteNavbar) return;
  const currentScrollY = Math.max(window.scrollY, 0);
  const responsiveWidth = window.matchMedia("(max-width: 991.98px)").matches;
  if (!responsiveWidth || currentScrollY <= 16) {
    els.siteNavbar.classList.remove("is-hidden");
    headerScrollAnchor = currentScrollY;
    return;
  }

  const scrollDelta = currentScrollY - headerScrollAnchor;
  if (Math.abs(scrollDelta) < 8) return;
  els.siteNavbar.classList.toggle("is-hidden", scrollDelta > 0);
  headerScrollAnchor = currentScrollY;
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
  updateResponsiveHeaderVisibility();
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

els.search.addEventListener("input", () => {
  resetSearchResultLimit();
  activeSearchSuggestionIndex = -1;
  renderSearchSuggestions();
  render({ syncSearchGuide: true });
});
els.search.addEventListener("focus", renderSearchSuggestions);
els.search.addEventListener("keydown", event => {
  const suggestions = matchingSearchSuggestions();
  if (event.key === "Escape") {
    const wasOpen = !els.searchSuggestions.hidden;
    hideSearchSuggestions();
    if (wasOpen) event.preventDefault();
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
  if (event.key === "Enter") {
    if (activeSearchSuggestionIndex < 0 || activeSearchSuggestionIndex >= suggestions.length) return;
    event.preventDefault();
    selectSearchSuggestion(suggestions[activeSearchSuggestionIndex].value);
    return;
  }
  if (suggestions.length === 0) return;

  event.preventDefault();
  if (event.key === "ArrowDown") {
    activeSearchSuggestionIndex = (activeSearchSuggestionIndex + 1) % suggestions.length;
  } else {
    activeSearchSuggestionIndex = activeSearchSuggestionIndex <= 0
      ? suggestions.length - 1
      : activeSearchSuggestionIndex - 1;
  }
  renderSearchSuggestions();
});
els.searchSuggestions.addEventListener("pointerdown", event => event.preventDefault());
els.searchSuggestions.addEventListener("click", event => {
  const option = event.target.closest("[data-search-suggestion]");
  if (option) selectSearchSuggestion(option.dataset.searchSuggestion);
});
els.activeSearchFilterList.addEventListener("click", event => {
  const filter = event.target.closest("[data-clear-search-filter]");
  if (filter) clearSearchCondition(filter.dataset.clearSearchFilter);
});
els.searchAlternatives.addEventListener("click", event => {
  const alternative = event.target.closest("[data-search-alternative]");
  if (alternative) selectSearchSuggestion(alternative.dataset.searchAlternative);
});
els.searchMore.addEventListener("click", () => {
  searchResultLimit += SEARCH_RESULT_STEP;
  render();
});
els.searchModeTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    setEasySearchMode(tab.dataset.searchMode === "easy");
  });
  tab.addEventListener("keydown", event => {
    const lastIndex = els.searchModeTabs.length - 1;
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = els.searchModeTabs[nextIndex];
    setEasySearchMode(nextTab.dataset.searchMode === "easy");
    nextTab.focus();
  });
});
els.easyCategoryList.addEventListener("click", event => {
  const toggleButton = event.target.closest("[data-easy-toggle]");
  if (toggleButton) {
    const categoryKey = toggleButton.dataset.easyToggle;
    const willOpen = easyCategoryOpen[categoryKey] === false;
    EASY_CATEGORIES.forEach(category => {
      easyCategoryOpen[category.key] = false;
    });
    easyCategoryOpen[categoryKey] = willOpen;
    renderEasySearch();
    return;
  }

  const optionButton = event.target.closest("[data-easy-option]");
  if (optionButton) {
    resetSearchResultLimit();
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
  resetSearchResultLimit();
  localStorage.setItem(SEARCH_SCOPE_KEY, scope.value);
  updateSearchPlaceholder(scope.value);
  renderSearchSuggestions();
  render();
}));
els.displayColumns.forEach(column => {
  column.addEventListener("change", () => {
    displayColumnCount = column.value;
    localStorage.setItem(DISPLAY_COLUMNS_KEY, displayColumnCount);
    applyColumnLayout();
  });
});
els.genre.addEventListener("change", () => {
  resetSearchResultLimit();
  render();
});
els.sortOrder.addEventListener("change", () => {
  resetSearchResultLimit();
  localStorage.setItem(SORT_ORDER_KEY, els.sortOrder.value || "playable");
  render();
});
els.animeDrama.addEventListener("change", () => {
  resetSearchResultLimit();
  localStorage.setItem(ANIME_DRAMA_KEY, els.animeDrama.value || "");
  render();
});
[els.subgenre, els.sourceCategory, els.vocalType, els.releaseDecade].forEach(select => {
  select.addEventListener("change", () => {
    resetSearchResultLimit();
    render();
  });
});
els.stats.addEventListener("click", event => {
  if (event.target.closest("[data-easy-playable-filter]")) {
    resetSearchResultLimit();
    playableOnly = !playableOnly;
    localStorage.setItem(PLAYABLE_ONLY_KEY, String(playableOnly));
    invalidateEasyOptions({ resetVisibleCounts: true });
    render();
    return;
  }

  if (event.target.closest("[data-easy-favorite-filter]")) {
    resetSearchResultLimit();
    favoriteOnly = !favoriteOnly;
    localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
    invalidateEasyOptions({ resetVisibleCounts: true });
    render({ syncSearchGuide: true, forceSearchGuideSync: true });
  }
});
els.playableFilter.addEventListener("click", () => {
  resetSearchResultLimit();
  playableOnly = !playableOnly;
  localStorage.setItem(PLAYABLE_ONLY_KEY, String(playableOnly));
  render();
});
els.favoriteFilter.addEventListener("click", () => {
  resetSearchResultLimit();
  favoriteOnly = !favoriteOnly;
  localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
  render({ syncSearchGuide: true, forceSearchGuideSync: true });
});
els.clearFavorites.addEventListener("click", clearAllFavorites);
els.homeRandomOptions.forEach(button => {
  button.addEventListener("click", () => {
    homeRandomSource = ["all", "playable", "favorite", "recent"].includes(button.dataset.homeRandomSource)
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
els.menuButton.addEventListener("click", () => {
  setFloatingMenuOpen(els.floatingMenuPanel.hidden);
});
els.floatingMenuItems.forEach(item => {
  item.addEventListener("click", () => setFloatingMenuOpen(false));
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
window.addEventListener("resize", () => {
  refreshFuzzyCategoryScrollControls();
  updateResponsiveHeaderVisibility();
}, { passive: true });
window.addEventListener("scroll", handlePageScroll, { passive: true });

document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".search-input-wrapper")) hideSearchSuggestions();
  if (!els.floatingMenuPanel.hidden && !event.target.closest("#floatingMenu")) {
    setFloatingMenuOpen(false);
  }
});

document.addEventListener("keydown", event => {
  if (els.floatingMenuPanel.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    setFloatingMenuOpen(false, { restoreFocus: true });
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

  event.preventDefault();
  const menuItems = [...els.floatingMenuItems];
  const currentIndex = menuItems.indexOf(document.activeElement);
  let nextIndex;
  if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = menuItems.length - 1;
  else if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % menuItems.length;
  else nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
  menuItems[nextIndex]?.focus();
});

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

if (els.settingsModal) {
  els.settingsModal.addEventListener("show.bs.modal", () => setFloatingActionsSuppressed(true));
  els.settingsModal.addEventListener("hidden.bs.modal", () => setFloatingActionsSuppressed(false));
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
homeRandomSource = ["all", "playable", "favorite", "recent"].includes(localStorage.getItem(HOME_RANDOM_SOURCE_KEY))
  ? localStorage.getItem(HOME_RANDOM_SOURCE_KEY)
  : "all";
favoriteOnly = loadSavedBoolean(FAVORITES_ONLY_KEY, false);
loadFavoriteKeys();
resetEasyCategoryOpen();
setSearchDetailsOpen(false);
setFuzzySearchMode(false);
applyColumnLayout();
switchTab(localStorage.getItem(ACTIVE_TAB_KEY));
updateBackToTopVisibility();
loadSheet();
