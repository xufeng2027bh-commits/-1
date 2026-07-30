(() => {
  "use strict";

  if (window.top !== window || document.getElementById("tlcr-root")) {
    return;
  }

  const ROOT_ID = "tlcr-root";
  const CHUNK_SIZE = 200;
  const liveId =
    new URLSearchParams(window.location.search).get("liveId") || "unknown";
  const configKey = `tlcr:config:${window.location.origin}${window.location.pathname}`;
  const sessionKey = `tlcr:session:${liveId}`;

  const state = {
    recording: false,
    picking: null,
    authorElement: null,
    highlightedElement: null,
    config: null,
    session: null,
    chunk: [],
    observer: null,
    rowFingerprints: new WeakMap(),
    seenFingerprints: new Set(),
    historyScanRunning: false,
    historyScanAbort: false,
    persistTimer: null,
    writeChain: Promise.resolve(),
  };

  const ui = {};

  function nowIso() {
    return new Date().toISOString();
  }

  function newSession() {
    return {
      id: `${liveId}-${Date.now()}`,
      liveId,
      startedAt: nowIso(),
      endedAt: null,
      count: 0,
      chunkIndex: 0,
    };
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n\s*/g, " ")
      .trim();
  }

  function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function safeCssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function stableClasses(element) {
    return [...element.classList].filter((name) => {
      const lowered = name.toLowerCase();
      return (
        name.length <= 100 &&
        !lowered.startsWith("tlcr-") &&
        !["active", "selected", "hover", "focus", "open"].includes(lowered)
      );
    });
  }

  function signatureSelector(element) {
    const tag = element.tagName.toLowerCase();
    const classes = stableClasses(element);
    if (!classes.length) {
      return tag;
    }
    return `${tag}.${classes.map(safeCssEscape).join(".")}`;
  }

  function getElementPath(root, target) {
    const path = [];
    let current = target;

    while (current && current !== root) {
      const parent = current.parentElement;
      if (!parent) {
        return null;
      }
      path.unshift([...parent.children].indexOf(current));
      current = parent;
    }

    return current === root ? path : null;
  }

  function resolveElementPath(root, path) {
    let current = root;
    for (const index of path || []) {
      current = current?.children?.[index];
      if (!current) {
        return null;
      }
    }
    return current;
  }

  function commonAncestor(first, second) {
    const ancestors = new Set();
    let current = first;
    while (current) {
      ancestors.add(current);
      current = current.parentElement;
    }
    current = second;
    while (current && !ancestors.has(current)) {
      current = current.parentElement;
    }
    return current;
  }

  function chooseRowElement(authorElement, contentElement) {
    const base = commonAncestor(authorElement, contentElement);
    if (!base || base === document.body || base === document.documentElement) {
      return null;
    }

    let current = base;
    let fallback = base;
    for (let depth = 0; current && depth < 6; depth += 1) {
      const selector = signatureSelector(current);
      let count = 0;
      try {
        count = document.querySelectorAll(selector).length;
      } catch {
        count = 0;
      }

      if (count >= 2 && count <= 1000) {
        return { row: current, selector, matchCount: count };
      }

      fallback = current;
      current = current.parentElement;
      if (
        current === document.body ||
        current === document.documentElement ||
        current?.id === ROOT_ID
      ) {
        break;
      }
    }

    return {
      row: fallback,
      selector: signatureSelector(fallback),
      matchCount: 1,
    };
  }

  function parseAuthorHeader(header) {
    let remaining = cleanText(header);
    const timeMatches = [...remaining.matchAll(/(?:^|\s)(\d{1,2}:\d{2})(?=\s|$)/g)];
    const displayTime = timeMatches.length
      ? timeMatches[timeMatches.length - 1][1]
      : "";

    if (displayTime) {
      remaining = cleanText(
        remaining.replace(new RegExp(`\\s*${displayTime.replace(":", "\\:")}\\s*$`), "")
      );
    }

    const accountMatch = remaining.match(/[（(]([^()（）]+)[)）]/);
    const account = accountMatch ? cleanText(accountMatch[1]) : "";
    const nickname = cleanText(
      accountMatch ? remaining.replace(accountMatch[0], "") : remaining
    );

    return { nickname, account, displayTime };
  }

  function extractRecord(row) {
    if (!state.config) {
      return null;
    }

    const authorElement = resolveElementPath(row, state.config.authorPath);
    const contentElement = resolveElementPath(row, state.config.contentPath);
    if (!authorElement || !contentElement) {
      return null;
    }

    const header = cleanText(authorElement.textContent);
    const comment = cleanText(contentElement.textContent);
    if (!header || !comment || comment.length > 2000) {
      return null;
    }

    const parsed = parseAuthorHeader(header);
    if (!parsed.nickname && !parsed.account) {
      return null;
    }

    return {
      nickname: parsed.nickname,
      account: parsed.account,
      displayTime: parsed.displayTime,
      comment,
    };
  }

  function recordFingerprint(record) {
    return [
      record.nickname,
      record.account,
      record.displayTime,
      record.comment,
    ].join("\u241f");
  }

  function chunkStorageKey(index) {
    return `tlcr:records:${state.session.id}:${index}`;
  }

  function enqueueWrite(values) {
    state.writeChain = state.writeChain
      .catch(() => undefined)
      .then(() => chrome.storage.local.set(values));
    return state.writeChain;
  }

  function persistSnapshot() {
    if (!state.session) {
      return Promise.resolve();
    }
    const values = {
      [sessionKey]: { ...state.session },
      [chunkStorageKey(state.session.chunkIndex)]: [...state.chunk],
    };
    return enqueueWrite(values);
  }

  function schedulePersist() {
    window.clearTimeout(state.persistTimer);
    state.persistTimer = window.setTimeout(() => {
      state.persistTimer = null;
      persistSnapshot();
    }, 350);
  }

  async function flushNow() {
    window.clearTimeout(state.persistTimer);
    state.persistTimer = null;
    await persistSnapshot();
    await state.writeChain;
  }

  function rotateChunkIfNeeded() {
    if (state.chunk.length < CHUNK_SIZE) {
      return;
    }

    const completedIndex = state.session.chunkIndex;
    const completedChunk = [...state.chunk];
    state.session.chunkIndex += 1;
    state.chunk = [];

    enqueueWrite({
      [sessionKey]: { ...state.session },
      [`tlcr:records:${state.session.id}:${completedIndex}`]: completedChunk,
      [chunkStorageKey(state.session.chunkIndex)]: [],
    });
  }

  function updateUi() {
    if (!ui.status || !state.session) {
      return;
    }

    ui.count.textContent = String(state.session.count);
    ui.liveId.textContent = liveId;
    ui.start.disabled = !state.config;
    ui.start.textContent = state.recording ? "暂停记录" : "开始记录";
    ui.start.classList.toggle("tlcr-button-danger", state.recording);
    ui.history.textContent = state.historyScanRunning
      ? "停止补采"
      : "补采全部历史";
    ui.history.classList.toggle(
      "tlcr-button-danger",
      state.historyScanRunning
    );
    ui.config.disabled = state.historyScanRunning;
    ui.clear.disabled = state.historyScanRunning;
    ui.scanDelay.disabled = state.historyScanRunning;
    ui.status.textContent = state.recording
      ? "正在记录新评论"
      : state.config
        ? "已配置，等待开始"
        : "请先设置采集区域";
    ui.status.classList.toggle("is-recording", state.recording);
    ui.config.textContent = state.config ? "重新设置区域" : "设置采集区域";
  }

  function addRecord(record) {
    const fingerprint = recordFingerprint(record);
    if (state.seenFingerprints.has(fingerprint)) {
      return false;
    }

    state.seenFingerprints.add(fingerprint);

    state.session.count += 1;
    state.chunk.push({
      seq: state.session.count,
      liveId,
      capturedAt: nowIso(),
      displayTime: record.displayTime,
      nickname: record.nickname,
      account: record.account,
      comment: record.comment,
    });

    rotateChunkIfNeeded();
    schedulePersist();
    updateUi();
    return true;
  }

  function processRow(row, shouldRecord = true) {
    if (!(row instanceof Element)) {
      return;
    }

    const record = extractRecord(row);
    if (!record) {
      return;
    }

    const fingerprint = recordFingerprint(record);
    if (state.rowFingerprints.get(row) === fingerprint) {
      return;
    }
    state.rowFingerprints.set(row, fingerprint);

    if (shouldRecord && state.recording) {
      addRecord(record);
    }
  }

  function rowsInside(element) {
    if (!state.config || !(element instanceof Element)) {
      return [];
    }

    const rows = new Set();
    try {
      if (element.matches(state.config.rowSelector)) {
        rows.add(element);
      }
      element
        .querySelectorAll(state.config.rowSelector)
        .forEach((candidate) => rows.add(candidate));
      const closest = element.closest(state.config.rowSelector);
      if (closest) {
        rows.add(closest);
      }
    } catch {
      return [];
    }
    return [...rows];
  }

  function primeExistingRows() {
    if (!state.config) {
      return;
    }
    try {
      document
        .querySelectorAll(state.config.rowSelector)
        .forEach((row) => processRow(row, false));
    } catch {
      showMessage("页面结构已变化，请重新设置采集区域。", "error");
    }
  }

  function captureCurrentRows() {
    if (!state.config) {
      return { matched: 0, added: 0 };
    }

    let rows = [];
    try {
      rows = [...document.querySelectorAll(state.config.rowSelector)];
    } catch {
      showMessage("页面结构已变化，请重新设置采集区域。", "error");
      return { matched: 0, added: 0 };
    }

    let added = 0;
    rows.forEach((row) => {
      const record = extractRecord(row);
      if (!record) {
        return;
      }
      state.rowFingerprints.set(row, recordFingerprint(record));
      if (addRecord(record)) {
        added += 1;
      }
    });

    return { matched: rows.length, added };
  }

  function findCommentScroller() {
    if (!state.config) {
      return null;
    }

    let firstRow = null;
    try {
      firstRow = document.querySelector(state.config.rowSelector);
    } catch {
      return null;
    }
    if (!firstRow) {
      return null;
    }

    let current = firstRow.parentElement;
    let fallback = null;
    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      if (current.scrollHeight > current.clientHeight + 20) {
        fallback ||= current;
        const overflowY = window.getComputedStyle(current).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") {
          return current;
        }
      }
      current = current.parentElement;
    }
    return fallback;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function dispatchScroll(element) {
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  }

  function getVisibleRowsSignature() {
    if (!state.config) {
      return "";
    }
    try {
      const rows = [...document.querySelectorAll(state.config.rowSelector)];
      return rows
        .map((row) => cleanText(row.textContent).slice(0, 500))
        .join("\u241e");
    } catch {
      return "";
    }
  }

  function getScanDelay() {
    const selected = Number(ui.scanDelay?.value || 2000);
    return Number.isFinite(selected) ? Math.max(600, selected) : 2000;
  }

  async function waitForListToSettle(minimumWait) {
    const startedAt = Date.now();
    const maximumWait = Math.max(5000, minimumWait + 3000);
    let lastSignature = getVisibleRowsSignature();
    let stableSince = Date.now();

    while (Date.now() - startedAt < maximumWait) {
      if (state.historyScanAbort) {
        return;
      }
      await wait(200);
      const currentSignature = getVisibleRowsSignature();
      if (currentSignature !== lastSignature) {
        lastSignature = currentSignature;
        stableSince = Date.now();
      }

      const waitedLongEnough = Date.now() - startedAt >= minimumWait;
      const hasSettled = Date.now() - stableSince >= 700;
      if (waitedLongEnough && hasSettled) {
        return;
      }
    }
  }

  async function scanScrollDirection(scroller, direction, progress) {
    const maxSteps = 900;
    let stableEdgeRounds = 0;

    for (let stepNumber = 0; stepNumber < maxSteps; stepNumber += 1) {
      if (state.historyScanAbort) {
        return { stopped: true, reachedEdge: false };
      }

      const beforeTop = scroller.scrollTop;
      const beforeHeight = scroller.scrollHeight;
      const stepSize = Math.max(Math.floor(scroller.clientHeight * 0.48), 120);
      const maximumTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const target =
        direction === "up"
          ? Math.max(0, beforeTop - stepSize)
          : Math.min(maximumTop, beforeTop + stepSize);

      scroller.scrollTop = target;
      dispatchScroll(scroller);
      await waitForListToSettle(getScanDelay());

      const captured = captureCurrentRows();
      progress.added += captured.added;
      progress.steps += 1;
      const directionLabel = direction === "up" ? "向上查找旧评论" : "向下完整扫描";
      showMessage(
        `${directionLabel}：已扫描 ${progress.steps} 屏，新补采 ${progress.added} 条。`
      );

      const afterTop = scroller.scrollTop;
      const afterHeight = scroller.scrollHeight;
      const atEdge =
        direction === "up"
          ? afterTop <= 1
          : afterTop + scroller.clientHeight >= afterHeight - 2;

      if (!atEdge) {
        stableEdgeRounds = 0;
        continue;
      }

      if (direction === "up") {
        scroller.scrollTop = Math.min(2, Math.max(0, afterHeight - scroller.clientHeight));
        dispatchScroll(scroller);
        await wait(60);
        scroller.scrollTop = 0;
        dispatchScroll(scroller);
      }

      await waitForListToSettle(Math.max(getScanDelay(), 2500));
      const edgeCapture = captureCurrentRows();
      progress.added += edgeCapture.added;
      const heightStable = Math.abs(scroller.scrollHeight - afterHeight) <= 2;
      const positionStable =
        direction === "up"
          ? scroller.scrollTop <= 1
          : scroller.scrollTop + scroller.clientHeight >=
            scroller.scrollHeight - 2;

      if (
        heightStable &&
        positionStable &&
        Math.abs(afterTop - beforeTop) <= 2 &&
        Math.abs(afterHeight - beforeHeight) <= 2
      ) {
        stableEdgeRounds += 1;
      } else {
        stableEdgeRounds = 0;
      }

      if (stableEdgeRounds >= 3) {
        return { stopped: false, reachedEdge: true };
      }
    }

    return { stopped: false, reachedEdge: false };
  }

  async function collectAllHistory() {
    if (state.historyScanRunning) {
      state.historyScanAbort = true;
      showMessage("正在停止历史补采…");
      return;
    }
    if (!state.config) {
      showMessage("请先设置采集区域。", "error");
      return;
    }

    const scroller = findCommentScroller();
    if (!scroller) {
      showMessage(
        "没有识别到评论滚动区域，请确认评论区有内容并重新设置采集区域。",
        "error"
      );
      return;
    }

    state.historyScanRunning = true;
    state.historyScanAbort = false;
    updateUi();

    const progress = { added: 0, steps: 0 };
    const initiallyCaptured = captureCurrentRows();
    progress.added += initiallyCaptured.added;

    try {
      showMessage("开始向上滚动，加载更早的评论…");
      const upward = await scanScrollDirection(scroller, "up", progress);
      if (!upward.stopped) {
        showMessage("已到达最早位置，正在向下扫描全部已加载评论…");
        await scanScrollDirection(scroller, "down", progress);
      }

      await flushNow();
      if (state.historyScanAbort) {
        showMessage(
          `历史补采已停止，本次新增 ${progress.added} 条，已采集内容均已保存。`
        );
      } else {
        showMessage(
          `历史补采完成：扫描 ${progress.steps} 屏，新增 ${progress.added} 条，重复项已跳过。`,
          "success"
        );
      }
    } catch (error) {
      console.error("[淘宝直播评论记录器] 历史补采失败", error);
      showMessage("历史补采中断，请重新设置区域后重试。", "error");
    } finally {
      state.historyScanRunning = false;
      state.historyScanAbort = false;
      updateUi();
    }
  }

  function startObserver() {
    state.observer?.disconnect();
    state.observer = new MutationObserver((mutations) => {
      if (!state.recording) {
        return;
      }

      const candidates = new Set();
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target.parentElement) {
          rowsInside(mutation.target.parentElement).forEach((row) =>
            candidates.add(row)
          );
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            rowsInside(node).forEach((row) => candidates.add(row));
          }
        });
      }

      if (candidates.size) {
        window.setTimeout(() => {
          candidates.forEach((row) => processRow(row, true));
        }, 80);
      }
    });

    state.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function showMessage(message, type = "info") {
    ui.message.textContent = message;
    ui.message.dataset.type = type;
  }

  function clearHighlight() {
    state.highlightedElement?.classList.remove("tlcr-pick-highlight");
    state.highlightedElement = null;
  }

  function cancelPicking(message = "已取消区域设置。") {
    clearHighlight();
    state.picking = null;
    state.authorElement = null;
    document.removeEventListener("mouseover", handlePickMouseOver, true);
    document.removeEventListener("click", handlePickClick, true);
    document.removeEventListener("keydown", handlePickKeyDown, true);
    showMessage(message);
  }

  function handlePickMouseOver(event) {
    const target = event.target;
    if (!(target instanceof Element) || target.closest(`#${ROOT_ID}`)) {
      return;
    }
    clearHighlight();
    target.classList.add("tlcr-pick-highlight");
    state.highlightedElement = target;
  }

  function handlePickKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelPicking();
    }
  }

  async function finishConfiguration(contentElement) {
    const chosen = chooseRowElement(state.authorElement, contentElement);
    if (!chosen) {
      cancelPicking("两次点击不在同一条评论内，请重试。");
      return;
    }

    const authorPath = getElementPath(chosen.row, state.authorElement);
    const contentPath = getElementPath(chosen.row, contentElement);
    if (!authorPath || !contentPath) {
      cancelPicking("无法识别评论结构，请重试。");
      return;
    }

    const config = {
      rowSelector: chosen.selector,
      authorPath,
      contentPath,
      savedAt: nowIso(),
    };
    state.config = config;
    await chrome.storage.local.set({ [configKey]: config });
    cancelPicking(
      chosen.matchCount >= 2
        ? `设置成功，识别到 ${chosen.matchCount} 条同结构评论。`
        : "设置成功。若没有记录到新评论，请重新选择更完整的昵称行。"
    );
    primeExistingRows();
    updateUi();
  }

  function handlePickClick(event) {
    const target = event.target;
    if (!(target instanceof Element) || target.closest(`#${ROOT_ID}`)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    clearHighlight();

    if (state.picking === "author") {
      state.authorElement = target;
      state.picking = "content";
      showMessage("第 2 步：点击同一条评论的正文。按 Esc 可取消。");
      return;
    }

    if (state.picking === "content") {
      finishConfiguration(target);
    }
  }

  function beginPicking() {
    if (state.recording) {
      toggleRecording();
    }
    cancelPicking("");
    state.picking = "author";
    document.addEventListener("mouseover", handlePickMouseOver, true);
    document.addEventListener("click", handlePickClick, true);
    document.addEventListener("keydown", handlePickKeyDown, true);
    showMessage("第 1 步：点击任意评论的“昵称（账号）时间”文字行。");
  }

  async function toggleRecording() {
    if (!state.config) {
      showMessage("请先设置采集区域。", "error");
      return;
    }

    state.recording = !state.recording;
    if (state.recording) {
      state.session.endedAt = null;
      const captured = captureCurrentRows();
      startObserver();
      if (captured.added > 0) {
        showMessage(
          `已导入当前 ${captured.added} 条历史评论，继续等待新评论。`,
          "success"
        );
      } else if (captured.matched > 0) {
        showMessage("当前可见评论均已记录，继续等待新评论。", "success");
      } else {
        showMessage(
          "没有识别到评论，请确认评论区有内容或重新设置采集区域。",
          "error"
        );
      }
    } else {
      state.session.endedAt = nowIso();
      state.observer?.disconnect();
      await flushNow();
      showMessage("已暂停，当前记录已保存到本机。");
    }
    updateUi();
  }

  async function readAllRecords() {
    await flushNow();
    const keys = [];
    for (let index = 0; index <= state.session.chunkIndex; index += 1) {
      keys.push(`tlcr:records:${state.session.id}:${index}`);
    }
    const stored = await chrome.storage.local.get(keys);
    return keys
      .flatMap((key) => (Array.isArray(stored[key]) ? stored[key] : []))
      .sort((first, second) => first.seq - second.seq);
  }

  async function hydrateSeenFingerprints() {
    const keys = [];
    for (let index = 0; index <= state.session.chunkIndex; index += 1) {
      keys.push(`tlcr:records:${state.session.id}:${index}`);
    }
    const stored = await chrome.storage.local.get(keys);
    keys.forEach((key) => {
      const records = Array.isArray(stored[key]) ? stored[key] : [];
      records.forEach((record) => {
        state.seenFingerprints.add(recordFingerprint(record));
      });
    });
  }

  async function shortHash(value, cache) {
    const normalized = cleanText(value);
    if (!normalized) {
      return "";
    }
    if (cache.has(normalized)) {
      return cache.get(normalized);
    }
    const bytes = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const result = [...new Uint8Array(digest)]
      .slice(0, 8)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    cache.set(normalized, result);
    return result;
  }

  async function exportCsv() {
    const records = await readAllRecords();
    if (!records.length) {
      showMessage("目前没有可导出的评论。", "error");
      return;
    }

    showMessage("正在生成 CSV…");
    const anonymize = ui.anonymize.checked;
    const hashCache = new Map();
    const rows = [
      ["序号", "直播间ID", "采集时间", "页面时间", "昵称", "账号", "评论"],
    ];

    for (const record of records) {
      let nickname = record.nickname;
      let account = record.account;
      if (anonymize) {
        nickname = await shortHash(
          `${record.nickname}|${record.account}`,
          hashCache
        );
        account = "";
      }
      rows.push([
        record.seq,
        record.liveId,
        record.capturedAt,
        record.displayTime,
        nickname,
        account,
        record.comment,
      ]);
    }

    const csv = `\uFEFF${rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `淘宝直播评论-${liveId}-${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showMessage(`已导出 ${records.length} 条评论。`, "success");
  }

  async function clearCurrentSession() {
    if (
      !window.confirm(
        `确定清空当前直播间已记录的 ${state.session.count} 条评论吗？此操作无法撤销。`
      )
    ) {
      return;
    }

    state.recording = false;
    state.observer?.disconnect();
    window.clearTimeout(state.persistTimer);
    await state.writeChain.catch(() => undefined);

    const prefix = `tlcr:records:${state.session.id}:`;
    const allStored = await chrome.storage.local.get(null);
    const keys = Object.keys(allStored).filter((key) => key.startsWith(prefix));
    if (keys.length) {
      await chrome.storage.local.remove(keys);
    }

    state.session = newSession();
    state.chunk = [];
    state.rowFingerprints = new WeakMap();
    state.seenFingerprints.clear();
    await chrome.storage.local.set({ [sessionKey]: { ...state.session } });
    showMessage("当前记录已清空，已创建新会话。");
    updateUi();
  }

  function createUi() {
    const root = document.createElement("section");
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="tlcr-header">
        <div>
          <strong>直播评论记录器</strong>
          <span id="tlcr-status"></span>
        </div>
        <button id="tlcr-collapse" class="tlcr-icon-button" title="收起">−</button>
      </div>
      <div id="tlcr-body" class="tlcr-body">
        <div class="tlcr-summary">
          <span>直播间 <b id="tlcr-live-id"></b></span>
          <span>已记录 <b id="tlcr-count">0</b> 条</span>
        </div>
        <div class="tlcr-actions">
          <button id="tlcr-config" class="tlcr-button tlcr-button-secondary">设置采集区域</button>
          <button id="tlcr-start" class="tlcr-button tlcr-button-primary">开始记录</button>
          <button id="tlcr-history" class="tlcr-button tlcr-button-secondary tlcr-button-wide">补采全部历史</button>
          <button id="tlcr-export" class="tlcr-button tlcr-button-secondary">导出 CSV</button>
          <button id="tlcr-clear" class="tlcr-button tlcr-button-ghost">清空记录</button>
        </div>
        <label class="tlcr-speed">
          <span>历史补采速度</span>
          <select id="tlcr-scan-delay">
            <option value="2000" selected>慢速稳妥（约 2 秒/屏）</option>
            <option value="1200">标准（约 1.2 秒/屏）</option>
            <option value="700">快速（约 0.7 秒/屏）</option>
          </select>
        </label>
        <label class="tlcr-checkbox">
          <input id="tlcr-anonymize" type="checkbox" checked>
          导出时匿名化昵称（推荐）
        </label>
        <p id="tlcr-message" class="tlcr-message">
          开始时先导入当前评论，再持续记录新评论并自动去重。
        </p>
      </div>
    `;
    document.body.appendChild(root);

    ui.root = root;
    ui.body = root.querySelector("#tlcr-body");
    ui.status = root.querySelector("#tlcr-status");
    ui.liveId = root.querySelector("#tlcr-live-id");
    ui.count = root.querySelector("#tlcr-count");
    ui.config = root.querySelector("#tlcr-config");
    ui.start = root.querySelector("#tlcr-start");
    ui.history = root.querySelector("#tlcr-history");
    ui.export = root.querySelector("#tlcr-export");
    ui.clear = root.querySelector("#tlcr-clear");
    ui.scanDelay = root.querySelector("#tlcr-scan-delay");
    ui.anonymize = root.querySelector("#tlcr-anonymize");
    ui.message = root.querySelector("#tlcr-message");
    ui.collapse = root.querySelector("#tlcr-collapse");

    ui.config.addEventListener("click", beginPicking);
    ui.start.addEventListener("click", toggleRecording);
    ui.history.addEventListener("click", collectAllHistory);
    ui.export.addEventListener("click", exportCsv);
    ui.clear.addEventListener("click", clearCurrentSession);
    ui.collapse.addEventListener("click", () => {
      const collapsed = ui.body.classList.toggle("is-collapsed");
      ui.collapse.textContent = collapsed ? "+" : "−";
      ui.collapse.title = collapsed ? "展开" : "收起";
    });
  }

  async function initialize() {
    createUi();
    const stored = await chrome.storage.local.get([configKey, sessionKey]);
    state.config = stored[configKey] || null;
    state.session = stored[sessionKey] || newSession();

    const chunkKey = `tlcr:records:${state.session.id}:${state.session.chunkIndex}`;
    const storedChunk = await chrome.storage.local.get(chunkKey);
    state.chunk = Array.isArray(storedChunk[chunkKey])
      ? storedChunk[chunkKey]
      : [];

    await hydrateSeenFingerprints();
    await chrome.storage.local.set({ [sessionKey]: { ...state.session } });
    if (state.config) {
      primeExistingRows();
    }
    updateUi();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushNow();
      }
    });
    window.addEventListener("beforeunload", () => {
      flushNow();
    });
  }

  initialize().catch((error) => {
    console.error("[淘宝直播评论记录器] 初始化失败", error);
  });
})();
