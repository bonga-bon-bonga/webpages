const SHEET_ID = "1Dd-oj59leRwLI-Y1v1hD5tpEgk2yiu4w6DL7adkpr9g";
const GID = "0";
const MUSICLIST_JSON_PATH = "./data/musiclist.json";
const HOME_RECOMMEND_COUNT = 5;
const THEME_KEY = "nemupipiano:theme";
const APP_PANEL_FONT_SIZE_KEY = "nemupipiano:appPanelFontSize";
const ACTIVE_TAB_KEY = "nemupipiano:activeTab";
const SEARCH_SCOPE_KEY = "nemupipiano:searchScope";
const DISPLAY_COLUMNS_KEY = "nemupipiano:displayColumns";
const PLAYABLE_ONLY_KEY = "nemupipiano:playableOnly";
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
  reload: document.getElementById("reload"),
  clearFavorites: document.getElementById("clearFavorites"),
  favoriteFilter: document.getElementById("favoriteFilter"),
  searchDetailToggle: document.getElementById("searchDetailToggle"),
  searchDetails: document.getElementById("searchDetails"),
  playableFilter: document.getElementById("playableFilter"),
  stats: document.getElementById("stats"),
  songs: document.getElementById("songs"),
  empty: document.getElementById("empty"),
  homeRandomOptions: document.querySelectorAll("[data-home-random-source]"),
  homeRecommendations: document.getElementById("homeRecommendations"),
  homeRecommendEmpty: document.getElementById("homeRecommendEmpty"),
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
let musiclistItems = {};
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

// HTMLエスケープを行う関数。& < > " ' をそれぞれ対応するHTMLエンティティに置換する。nullやundefinedも空文字に変換する。
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Google Visualization APIのセルオブジェクトから値を取り出す。f（フォーマット済み値）があればそれを優先し、なければv（生の値）を返す。どちらもない場合は空文字を返す。
function cellValue(cell) {
  if (!cell) return "";
  return cell.f ?? cell.v ?? "";
}

// Google Visualization APIの列ヘッダーを正規化して返す。nullやundefinedを空文字に、前後のスペースを削除。
function normalizeHeader(value) {
  return String(value ?? "").trim();
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];

  return values
    .map(value => normalizeCellText(value))
    .filter(Boolean);
}

function normalizeMusiclistItems(data) {
  const items = data?.items || {};

  return Object.fromEntries(
    Object.entries(items).map(([key, value]) => [
      normalizeCellText(key),
      {
        searchWords: normalizeStringArray(value?.searchWords),
        artistAliases: normalizeStringArray(value?.artistAliases),
        tags: normalizeStringArray(value?.tags),
      },
    ])
  );
}

async function loadMusiclist() {
  const response = await fetch(MUSICLIST_JSON_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("musiclist.jsonの読み込みに失敗しました。");
  }

  return normalizeMusiclistItems(await response.json());
}

function musiclistKey(title, artist) {
  return `${normalizeCellText(title)}|${normalizeCellText(artist)}`;
}

function enrichSongWithMusiclist(song) {
  const extra = musiclistItems[musiclistKey(song.title, song.artist)] || {};

  return {
    ...song,
    searchWords: extra.searchWords || [],
    artistAliases: extra.artistAliases || [],
    tags: extra.tags || [],
  };
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
  return `${normalizeCellText(song.title)}|${normalizeCellText(song.artist)}`;
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

// Google Visualization APIを使ってシートを読み込む。レスポンスはJSONP形式で返されるため、コールバック関数を動的に生成して対応する。
function loadSheet({ showReloadFeedback = false } = {}) {
  if (showReloadFeedback) {
    setReloadButtonState("loading");
  } else {
    els.reload.disabled = true;
  }
  let loadSucceeded = false;

  const musiclistPromise = loadMusiclist()
    .then(items => ({ items }))
    .catch(error => ({ error }));
  const callbackName = "handleSheetResponse_" + Date.now();
  const script = document.createElement("script");
  const query = encodeURIComponent("select *");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${GID}&tq=${query}&tqx=out:json;responseHandler:${callbackName}`;

  window[callbackName] = async (response) => {
    try {
      if (response.status !== "ok") {
        throw new Error(response.errors?.[0]?.detailed_message || "Google Sheetsの読み込みに失敗しました。");
      }

      const musiclistResult = await musiclistPromise;
      if (musiclistResult.error) throw musiclistResult.error;

      musiclistItems = musiclistResult.items;
      songs = parseGvizResponse(response).map(enrichSongWithMusiclist);
      setupGenreOptions(songs);
      pickHomeRecommendations();
      render();
      renderHome();
      loadSucceeded = true;
    } catch (error) {
      console.error(error);
    } finally {
      if (showReloadFeedback) {
        setReloadButtonState(loadSucceeded ? "complete" : "error");
      } else {
        els.reload.disabled = false;
      }
      script.remove();
      delete window[callbackName];
    }
  };

  script.onerror = () => {
    if (showReloadFeedback) {
      setReloadButtonState("error");
    } else {
      els.reload.disabled = false;
    }
    script.remove();
    delete window[callbackName];
  };

  script.src = url;
  document.body.appendChild(script);
}

// Google Visualization APIのレスポンスから曲データを抽出して整形
function parseGvizResponse(response) {
  const table = response.table || {};
  const rows = table.rows || [];
  const cols = table.cols || [];
  if (rows.length === 0) return [];

  let headers = cols.map((col, index) => normalizeHeader(col.label || col.id || `col${index + 1}`));
  let dataRows = rows;

  const knownHeaders = ["No", "弾ける曲", "曲名", "アーティスト", "ジャンル", "補足"];
  const hasKnownHeader = headers.some(header => knownHeaders.includes(header));
  if (!hasKnownHeader) {
    const firstRowValues = rows[0].c.map(cell => normalizeHeader(cellValue(cell)));
    if (firstRowValues.some(value => knownHeaders.includes(value))) {
      headers = firstRowValues;
      dataRows = rows.slice(1);
    }
  }

  return dataRows
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header || `col${index + 1}`] = cellValue(row.c[index]);
      });
      return {
        no: item["No"] || item["no"] || "",
        playable: item["弾ける曲"] || item["playable"] || "",
        title: normalizeCellText(item["曲名"] || item["title"] || ""),
        artist: normalizeCellText(item["アーティスト"] || item["artist"] || ""),
        genre: normalizeCellText(item["ジャンル"] || item["genre"] || ""),
        note: normalizeCellText(item["補足"] || item["note"] || ""),
        raw: item,
      };
    })
    .filter(song => song.title || song.artist || song.genre);
}

// セルの値を正規化して返す（nullやundefinedを空文字に、複数スペースを単一スペースに置換、前後のスペースを削除）
function normalizeCellText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

// 曲データからジャンルの選択肢を生成
function setupGenreOptions(items) {
  const current = els.genre.value;
  const genres = [...new Set(items.map(item => item.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));

  els.genre.innerHTML = '<option value="">すべてのジャンル</option>' +
    genres.map(genre => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`).join("");

  if (genres.includes(current)) els.genre.value = current;
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
  const titleTargets = [song.title, ...normalizeStringArray(song.searchWords)];
  const artistTargets = [song.artist, ...normalizeStringArray(song.artistAliases)];

  if (scope === "title") return titleTargets;
  if (scope === "artist") return artistTargets;
  return [...titleTargets, ...artistTargets];
}

function matchesSearchKeyword(song, keyword, scope) {
  if (!keyword) return true;

  const searchTargets = searchTargetsForScope(song, scope);

  return searchTargets.some(target => createSearchKey(target).includes(keyword));
}

// 検索キーワードとジャンルで曲をフィルタリングする。キーワードは曲名、アーティスト名、補助検索語に対して部分一致で検索する。
function filteredSongs() {
  const keyword = createSearchKey(els.search.value);
  const searchScope = getSearchScope();
  const genre = els.genre.value;

  return songs.filter(song => {
    const keywordOk = matchesSearchKeyword(song, keyword, searchScope);
    const genreOk = !genre || song.genre === genre;
    const playableOk = !playableOnly || isPlayable(song);
    const favoriteOk = !favoriteOnly || isFavorite(song);
    return keywordOk && genreOk && playableOk && favoriteOk;
  });
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

function gridClassesForColumns(columns) {
  if (columns === "1") return "row row-cols-1 g-3 mt-1 song-grid";
  if (columns === "2") return "row row-cols-1 row-cols-md-2 g-3 mt-1 song-grid";
  return "row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mt-1 song-grid";
}

function applyColumnLayout() {
  const gridClassName = gridClassesForColumns(displayColumnCount);

  [els.homeRecommendations, els.copyHistorySongs, els.songs].forEach(grid => {
    if (!grid) return;
    grid.className = gridClassName;
    grid.dataset.columns = displayColumnCount;
  });
}

function renderSongCards(items) {
  return items.map(song => `
    <div class="col">
      <article class="card song-card h-100 ${isFavorite(song) ? "is-favorite" : ""}" role="button" tabindex="0" data-copy-song="${escapeHtml(song.title)}" data-copy-artist="${escapeHtml(song.artist)}" data-copy-no="${escapeHtml(song.no)}" data-favorite-key="${escapeHtml(favoriteKeyForSong(song))}" aria-label="${escapeHtml(song.title)}をリクエスト形式でコピー">
        <div class="card-body song-card-body d-flex flex-column gap-2 p-3 p-md-4">
          <div class="song-card-header d-flex justify-content-between gap-3 align-items-start">
            <div class="song-card-text min-w-0">
              <h2 class="song-title h5 fw-bold mb-1">${escapeHtml(song.title)}</h2>
              <p class="song-artist mb-0">${escapeHtml(song.artist || "アーティスト未設定")}</p>
            </div>
            <span class="song-number text-secondary small flex-shrink-0">#${escapeHtml(song.no || "-")}</span>
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

function render() {
  const items = filteredSongs();

  els.stats.innerHTML = `
    <span class="badge rounded-pill stat-badge px-3 py-2">全曲数：<strong>${songs.length}</strong> 表示中：<strong>${items.length}</strong></span>
  `;
  els.playableFilter.classList.toggle("active", playableOnly);
  els.playableFilter.setAttribute("aria-pressed", String(playableOnly));
  els.playableFilter.textContent = playableOnly ? "ON" : "OFF";
  updateFavoriteFilterButton();

  els.empty.hidden = items.length !== 0;
  els.songs.innerHTML = renderSongCards(items);
}

function renderHome() {
  updateHomeRandomSourceButtons();
  els.homeRecommendEmpty.hidden = homeRecommendedSongs.length !== 0;
  els.homeRecommendations.innerHTML = renderSongCards(homeRecommendedSongs);
  renderCopyHistory();
}

function updateHomeRandomSourceButtons() {
  els.homeRandomOptions.forEach(button => {
    const active = button.dataset.homeRandomSource === homeRandomSource;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
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

    const matchedSong = songs.find(song => favoriteKeyForSong(song) === key);
    items.push(matchedSong || {
      no: entry?.no || "",
      title: entry?.title || "",
      artist: entry?.artist || "",
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
  const noPrefix = no ? `${no}.` : "";
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
  const text = requestText({ no, title, artist });

  try {
    await copyToClipboard(text);
    recordCopyHistory({ no, title, artist, text });
    showCopyToast("クリップボードにコピーしました！", text);
  } catch (error) {
    console.error(error);
    showCopyToast("コピーに失敗しました");
  }
}

function recordCopyHistory({ no, title, artist, text }) {
  const key = favoriteKeyForSong({ title, artist });
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
  const key = favoriteKeyForSong({ title, artist });
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

els.search.addEventListener("input", render);
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
els.playableFilter.addEventListener("click", () => {
  playableOnly = !playableOnly;
  localStorage.setItem(PLAYABLE_ONLY_KEY, String(playableOnly));
  render();
});
els.favoriteFilter.addEventListener("click", () => {
  favoriteOnly = !favoriteOnly;
  localStorage.setItem(FAVORITES_ONLY_KEY, String(favoriteOnly));
  render();
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
els.searchDetailToggle.addEventListener("click", () => {
  setSearchDetailsOpen(els.searchDetails.hidden);
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
homeRandomSource = ["all", "playable", "favorite"].includes(localStorage.getItem(HOME_RANDOM_SOURCE_KEY))
  ? localStorage.getItem(HOME_RANDOM_SOURCE_KEY)
  : "all";
favoriteOnly = loadSavedBoolean(FAVORITES_ONLY_KEY, false);
loadFavoriteKeys();
setSearchDetailsOpen(false);
applyColumnLayout();
switchTab(localStorage.getItem(ACTIVE_TAB_KEY));
updateBackToTopVisibility();
loadSheet();
