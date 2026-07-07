const MUSICLIST_JSON_PATH = "./data/musiclist.json";
const FUZZY_SEARCH_PRESETS_JSON_PATH = "./data/fuzzy-search-presets.json";
const HOME_RECOMMEND_COUNT = 5;
const HOME_MOOD_RESULT_COUNT = 3;
const FUZZY_RESULT_INITIAL_COUNT = 5;
const FUZZY_RESULT_STEP = 5;
const FUZZY_RESULT_MAX_COUNT = 30;
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
const RELOAD_BUTTON_DEFAULT_TEXT = "曲リストを再読み込みする";
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
  reload: document.getElementById("reload"),
  clearFavorites: document.getElementById("clearFavorites"),
  favoriteFilter: document.getElementById("favoriteFilter"),
  searchDetailToggle: document.getElementById("searchDetailToggle"),
  searchDetails: document.getElementById("searchDetails"),
  searchGuideToggle: document.getElementById("searchGuideToggle"),
  searchGuide: document.getElementById("searchGuide"),
  fuzzySearchModeToggle: document.getElementById("fuzzySearchModeToggle"),
  normalSearchPanel: document.getElementById("normalSearchPanel"),
  fuzzySearchPanel: document.getElementById("fuzzySearchPanel"),
  fuzzyCategoryTabs: document.getElementById("fuzzyCategoryTabs"),
  fuzzyCategoryContent: document.getElementById("fuzzyCategoryContent"),
  fuzzyResultSummary: document.getElementById("fuzzyResultSummary"),
  fuzzySongs: document.getElementById("fuzzySongs"),
  fuzzyEmpty: document.getElementById("fuzzyEmpty"),
  fuzzyMore: document.getElementById("fuzzyMore"),
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
  backToTop: document.getElementById("backToTop"),
  appPanel: document.getElementById("appPanel"),
  themeModes: document.querySelectorAll("[name='themeMode']"),
  panelFontSizes: document.querySelectorAll("[name='panelFontSize']"),
};

const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let songs = [];
let homeRecommendedSongs = [];
let homeMoodSuggestions = [];
let activeHomeMoodIndex = null;
let playableOnly = false;
let homeRandomSource = "all";
let favoriteOnly = false;
let favoriteKeys = new Set();
let displayColumnCount = "3";
let reloadFeedbackTimer = null;
let longPressTimer = null;
let longPressHandled = false;
let longPressSuppressTimer = null;
let longPressStartX = 0;
let longPressStartY = 0;
let lastSearchGuideHasKeyword = null;
let fuzzySearchPresets = [];
let fuzzySearchMode = false;
let activeFuzzyCategoryIndex = 0;
let activeFuzzyItemIndex = null;
let fuzzyResultLimit = FUZZY_RESULT_INITIAL_COUNT;
let pendingAnimeDramaValue = "";

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
  const genre = normalizeCellText(item?.genre) || classificationGenres[0] || tags[0] || "";

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

function setReloadButtonState(state) {
  clearTimeout(reloadFeedbackTimer);
  reloadFeedbackTimer = null;

  if (state === "loading") {
    els.reload.disabled = true;
    els.reload.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span><span>読み込み中…</span>';
    return;
  }

  if (state === "complete") {
    els.reload.disabled = false;
    els.reload.textContent = "読み込み完了しました！";
    reloadFeedbackTimer = setTimeout(() => setReloadButtonState("default"), 2000);
    return;
  }

  if (state === "error") {
    els.reload.disabled = false;
    els.reload.textContent = "読み込みに失敗しました";
    reloadFeedbackTimer = setTimeout(() => setReloadButtonState("default"), 2000);
    return;
  }

  els.reload.disabled = false;
  els.reload.textContent = RELOAD_BUTTON_DEFAULT_TEXT;
}

// musiclist.jsonを読み込み、画面表示用の曲データを更新する。
async function loadSheet({ showReloadFeedback = false } = {}) {
  if (showReloadFeedback) {
    setReloadButtonState("loading");
  } else {
    els.reload.disabled = true;
  }

  try {
    const [loadedSongs, loadedFuzzySearchPresets] = await Promise.all([
      loadMusiclist(),
      loadFuzzySearchPresets(),
    ]);
    songs = loadedSongs.map((song, index) => ({ ...song, originalIndex: index }));
    fuzzySearchPresets = loadedFuzzySearchPresets;
    migrateFavoriteKeys();
    setupSearchDetailOptions(songs);
    pickHomeRecommendations();
    pickHomeMoodSuggestions();
    render({ syncSearchGuide: true, forceSearchGuideSync: true });
    renderHome();
    renderFuzzySearch();
    if (showReloadFeedback) {
      setReloadButtonState("complete");
    } else {
      els.reload.disabled = false;
    }
  } catch (error) {
    console.error(error);
    if (showReloadFeedback) {
      setReloadButtonState("error");
    } else {
      els.reload.disabled = false;
    }
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

function parseAnimeDramaValue(value) {
  const [category = "", ...seriesParts] = String(value || "").split("|");
  return {
    category,
    series: seriesParts.join("|"),
  };
}

function animeDramaOptions(items) {
  const options = [];
  const seen = new Set();

  items.forEach(item => {
    const sourceCategories = sourceCategoriesFor(item);
    const categories = ["アニメ", "ドラマ"].filter(category => sourceCategories.includes(category));
    if (categories.length === 0) return;

    (item.tieUps || []).forEach(tieUp => {
      const series = normalizeCellText(tieUp.series);
      if (!series) return;

      categories.forEach(category => {
        const value = animeDramaValue(category, series);
        if (seen.has(value)) return;
        seen.add(value);
        options.push({
          category,
          series,
          value,
          label: `[${category}] ${series}`,
        });
      });
    });
  });

  return options.sort((left, right) => {
    const categoryOrder = { "アニメ": 0, "ドラマ": 1 };
    return (categoryOrder[left.category] ?? 9) - (categoryOrder[right.category] ?? 9)
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
  const currentHasKeyword = hasSearchKeyword();
  if (!force && lastSearchGuideHasKeyword === currentHasKeyword) return;

  lastSearchGuideHasKeyword = currentHasKeyword;
  setSearchGuideOpen(!currentHasKeyword && !favoriteOnly);
}

function sourceCategoriesFor(song) {
  return normalizeStringArray(song.classification?.sourceCategories);
}

function matchesAnimeDramaFilter(song, filter) {
  if (!filter) return true;
  const { category, series } = parseAnimeDramaValue(filter);
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
function filteredSongs() {
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
      <img class="theme-icon-light" src="../lib/icon/${name}_white.svg" alt="">
      <img class="theme-icon-dark" src="../lib/icon/${name}_black.svg" alt="">
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

function renderFuzzySearch() {
  const preset = fuzzySearchPresets[activeFuzzyCategoryIndex];
  els.fuzzyCategoryTabs.innerHTML = fuzzySearchPresets.map((item, index) => `
    <button class="btn fuzzy-category-tab ${index === activeFuzzyCategoryIndex ? "active" : ""}" type="button" role="tab" data-fuzzy-category="${index}" aria-selected="${index === activeFuzzyCategoryIndex}">${escapeHtml(item.title)}</button>
  `).join("");

  if (!preset) {
    els.fuzzyCategoryContent.innerHTML = "";
    els.fuzzyResultSummary.innerHTML = "";
    els.fuzzySongs.innerHTML = "";
    els.fuzzyEmpty.hidden = false;
    els.fuzzyEmpty.textContent = "ふわっと検索の条件を読み込めませんでした。";
    els.fuzzyMore.hidden = true;
    return;
  }

  els.fuzzyCategoryContent.innerHTML = `
    <h2 class="h5 fw-bold mb-1 section-heading-with-icon">
      ${fuzzyPresetIcon(preset.icon)}
      ${escapeHtml(preset.category || preset.title)}
    </h2>
    <p class="fuzzy-category-description mb-3">${escapeHtml(preset.description)}</p>
    <div class="fuzzy-preset-options">
      ${preset.items.map((item, index) => `
        <button class="btn fuzzy-preset-button ${index === activeFuzzyItemIndex ? "active" : ""}" type="button" data-fuzzy-item="${index}" aria-pressed="${index === activeFuzzyItemIndex}">${escapeHtml(item.label)}</button>
      `).join("")}
    </div>
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
  els.fuzzySearchModeToggle.setAttribute("aria-pressed", String(fuzzySearchMode));
  els.fuzzySearchModeToggle.textContent = fuzzySearchMode
    ? "通常検索に戻る"
    : "🌙ふわっと検索してみる";
  if (fuzzySearchMode) renderFuzzySearch();
}

function renderSongCards(items) {
  return items.map(song => `
    <div class="col">
      <article class="card song-card h-100 ${isFavorite(song) ? "is-favorite" : ""}" role="button" tabindex="0" data-copy-song="${escapeHtml(song.title)}" data-copy-artist="${escapeHtml(song.artist)}" data-copy-no="${escapeHtml(song.no)}" data-song-key="${escapeHtml(favoriteKeyForSong(song))}" data-favorite-key="${escapeHtml(favoriteKeyForSong(song))}" aria-label="${escapeHtml(song.title)}をリクエスト形式でコピー">
        <div class="card-body song-card-body d-flex flex-column gap-2 p-3 p-md-4">
          <div class="song-card-header d-flex justify-content-between gap-3 align-items-start">
            <div class="song-card-text min-w-0">
              <h2 class="song-title h5 fw-bold mb-1">${escapeHtml(song.title)}</h2>
              <p class="song-artist mb-0">${escapeHtml(song.artist || "アーティスト未設定")}</p>
            </div>
            <span class="song-number text-secondary small flex-shrink-0">${escapeHtml(displaySongNumber(song.no))}</span>
          </div>

          <div class="song-card-meta d-flex flex-wrap gap-2 mt-auto">
            ${song.playable ? `<span class="badge rounded-pill badge-playable">${escapeHtml(song.playable)} 弾ける</span>` : ""}
            ${song.genre ? `<span class="badge rounded-pill text-bg-light border">${escapeHtml(song.genre)}</span>` : ""}
          </div>
        </div>
      </article>
    </div>
  `).join("");
}

function displaySongNumber(no) {
  const value = String(no || "").trim();
  if (!value) return "-";
  return value.includes("#") ? value : `#${value}`;
}

function render({ syncSearchGuide = false, forceSearchGuideSync = false } = {}) {
  const items = filteredSongs();
  const isDefaultSearchState = isSearchGuideDefaultState();

  els.stats.innerHTML = `
    <span class="badge rounded-pill stat-badge px-3 py-2">全曲数：<strong>${songs.length}</strong> 表示中：<strong>${items.length}</strong></span>
  `;
  els.playableFilter.classList.toggle("active", playableOnly);
  els.playableFilter.setAttribute("aria-pressed", String(playableOnly));
  els.playableFilter.textContent = playableOnly ? "ON" : "OFF";
  updateFavoriteFilterButton();
  if (syncSearchGuide) {
    syncSearchGuideOnSearchStateChange({ force: forceSearchGuideSync });
  }

  els.empty.hidden = isDefaultSearchState || items.length !== 0;
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
  const no = card.dataset.copyNo || "";
  const title = card.dataset.copySong || "";
  const artist = card.dataset.copyArtist || "";
  const songKey = card.dataset.songKey || "";
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
  const title = card.dataset.copySong || "";
  const artist = card.dataset.copyArtist || "";
  const key = normalizeCellText(card.dataset.songKey) || createSongKey(title, artist);
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
  const normalized = ["home", "search"].includes(tabName) ? tabName : "home";
  els.tabs.forEach(tab => {
    const active = tab.dataset.tab === normalized;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  els.panels.forEach(panel => {
    const active = panel.id === `panel-${normalized}`;
    panel.hidden = !active;
  });
  localStorage.setItem(ACTIVE_TAB_KEY, normalized);
}

function updateBackToTopVisibility() {
  els.backToTop.hidden = window.scrollY < 320;
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
els.fuzzySearchModeToggle.addEventListener("click", () => {
  setFuzzySearchMode(!fuzzySearchMode);
});
els.fuzzyCategoryTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-fuzzy-category]");
  if (!button) return;
  activeFuzzyCategoryIndex = Number(button.dataset.fuzzyCategory) || 0;
  activeFuzzyItemIndex = null;
  fuzzyResultLimit = FUZZY_RESULT_INITIAL_COUNT;
  renderFuzzySearch();
});
els.fuzzyCategoryContent.addEventListener("click", event => {
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
  switchTab("search");
  setFuzzySearchMode(true);
  els.fuzzySearchModeToggle.focus();
});
els.searchDetailToggle.addEventListener("click", () => {
  setSearchDetailsOpen(els.searchDetails.hidden);
});
els.searchGuideToggle.addEventListener("click", () => {
  setSearchGuideOpen(els.searchGuide.hidden);
});
els.reload.addEventListener("click", () => loadSheet({ showReloadFeedback: true }));
els.backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
els.panelFontSizes.forEach(option => {
  option.addEventListener("change", () => applyAppPanelFontSize(option.value));
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
window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

document.addEventListener("pointerdown", (event) => {
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

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-copy-song]");
  if (!card) return;
  event.preventDefault();
  handleCardCopy(card);
});

els.tabs.forEach(tab => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

applyTheme(localStorage.getItem(THEME_KEY));
applyAppPanelFontSize(localStorage.getItem(APP_PANEL_FONT_SIZE_KEY));
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
setSearchDetailsOpen(false);
setFuzzySearchMode(false);
applyColumnLayout();
switchTab(localStorage.getItem(ACTIVE_TAB_KEY));
updateBackToTopVisibility();
loadSheet();
