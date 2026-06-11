import "./affiliate.js";

const UNITY_ORG_ID = "unitytechnologiesproductionmkahteav";
const COVEO_SEARCH_URL = `https://${UNITY_ORG_ID}.org.coveo.com/rest/search/v2?organizationId=${UNITY_ORG_ID}`;
const UNITY_TOKEN_URL = "https://assetstore.unity.com/api/coveo/search-token?searchHub=listing";
const STORAGE_KEY = "trackedAssets";
const SETTINGS_KEY = "settings";
const DISCOVERY_KEY = "discoveryCache";
const PUBLISHERS_KEY = "watchedPublishers";
const ASSET_SCHEMA_VERSION = 1;
const PUBLISHER_SCHEMA_VERSION = 2;
const CHECK_ALARM = "unity-sale-watch-check";
const CHECK_INTERVAL_MINUTES = 30;
const EXPIRED_RETENTION_DAYS = 30;
const REMINDER_THRESHOLDS_HOURS = [24, 1];
const PAGE_MENU_ID = "unity-sale-watch-add-page";
const LINK_MENU_ID = "unity-sale-watch-add-link";
const PUBLISHER_MENU_ID = "unity-sale-watch-add-publisher";
const NEW_RELEASE_SALE_FILTER = "new_release_discount";
const DISCOVERY_RESULT_LIMIT = 96;
const NEW_ASSET_RESULT_LIMIT = 48;
const NEW_ASSET_MAX_RESULT_LIMIT = 1000;
const CHECK_INTERVAL_OPTIONS = [15, 30, 60, 360];
const REMINDER_THRESHOLD_OPTIONS = [48, 24, 6, 1];
const RETENTION_OPTIONS = [7, 30, 90, "never"];
const NEW_ASSET_LIMIT_OPTIONS = [48, 100, 250, 500, 1000];
const NEW_ASSET_AGE_OPTIONS_DAYS = [3, 7, 14, 30];
const DISCOVERY_SORT_OPTIONS = ["date_added", "expiring_first", "expiring_last"];
const WATCH_LIST_SORT_OPTIONS = ["attention", "ends_soon", "added_newest", "checked_newest", "title_az", "publisher_az", "price_low", "discount_high", "status"];
const NEW_ASSETS_STATE_FILTER_OPTIONS = ["all", "on_sale", "free", "paid", "no_sale"];
const WATCH_STATUS_FILTER_OPTIONS = ["all", "active", "upcoming", "expired", "watching_no_sale", "error"];
const WATCH_PRICE_FILTER_OPTIONS = ["all", "free", "paid", "discounted", "unknown"];
const DISCOUNT_FILTER_OPTIONS = ["all", "25", "50", "70"];
const DESCRIPTION_FILTER_OPTIONS = ["all", "has_description", "missing_description"];
const DISCOVERY_DETAIL_CONCURRENCY = 4;
const FIRST_PUBLISHED_SOURCE_VERSION = 2;
const BACKUP_SCHEMA_VERSION = 1;
const DESCRIPTION_MAX_LENGTH = 5000;
const BACKGROUND_LOADED_AT = new Date().toISOString();
const NOTIFICATION_TARGETS_KEY = "notificationTargets";
const NOTIFICATION_TARGET_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const QUIET_NOTIFICATION_DEFAULTS_VERSION = 1;

const runtimeHealth = {
  backgroundLoadedAt: BACKGROUND_LOADED_AT,
  lastMessage: null,
  lastMessageError: null,
  lastAlarmStartedAt: null,
  lastAlarmFinishedAt: null,
  lastAlarmError: null,
  inFlightChecks: 0,
  unhandledErrors: []
};

const DEFAULT_SETTINGS = {
  checkIntervalMinutes: CHECK_INTERVAL_MINUTES,
  reminderThresholdHours: REMINDER_THRESHOLDS_HOURS,
  expiredRetentionDays: EXPIRED_RETENTION_DAYS,
  newAssetQueueLimit: NEW_ASSET_RESULT_LIMIT,
  newAssetMaxAgeDays: 14,
  quietNotificationDefaultsVersion: QUIET_NOTIFICATION_DEFAULTS_VERSION,
  watchListSort: "attention",
  watchStatusFilter: "all",
  watchPublisherFilter: "all",
  watchTagFilter: "all",
  watchCategoryFilter: "all",
  watchPriceStateFilter: "all",
  watchDiscountFilter: "all",
  watchDescriptionFilter: "all",
  discoverySort: "date_added",
  discoveryPublisherFilter: "all",
  discoveryCategoryFilter: "all",
  discoveryDiscountFilter: "all",
  discoveryDescriptionFilter: "all",
  showHiddenDiscovery: false,
  newAssetsPublisherFilter: "all",
  newAssetsStateFilter: "all",
  newAssetsCategoryFilter: "all",
  newAssetsDiscountFilter: "all",
  newAssetsDescriptionFilter: "all",
  showHiddenNewAssets: false,
  collectDescriptions: false,
  currency: "USD",
  alerts: {
    assetEntersSale: true,
    saleEndingReminders: false,
    saleEndChanged: false,
    publisherNewSale: false,
    discoveryDigest: false
  }
};

const FIELDS = [
  "ec_sale",
  "ec_name",
  "ec_thumbnails",
  "ec_price",
  "ec_price_filter",
  "publisher_name",
  "publisher_id",
  "ec_product_id",
  "ec_sale_filters",
  "ec_sale_discount_percentage_filter",
  "product_slug",
  "category_slug",
  "ec_category",
  "ec_categories",
  "sysdate",
  "date",
  "first_published_at",
  "last_published_at"
];

chrome.runtime.onInstalled.addListener(async () => {
  await migrateStoredAssets();
  await migrateWatchedPublishers();
  await migrateSettings();
  await setupContextMenu();
  await ensureAlarm();
  await updateBadgeStatus();
});

chrome.runtime.onStartup.addListener(async () => {
  await migrateStoredAssets();
  await migrateWatchedPublishers();
  await migrateSettings();
  await setupContextMenu();
  await ensureAlarm();
  await updateBadgeStatus();
});

self.addEventListener("error", (event) => {
  recordRuntimeError("error", event.error || event.message);
});

self.addEventListener("unhandledrejection", (event) => {
  recordRuntimeError("unhandledrejection", event.reason);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === PAGE_MENU_ID || info.menuItemId === LINK_MENU_ID) {
    addFromContext(info, tab).catch((error) => notify("Asset Sale Watch", error.message, { url: getWatchlistUrl() }));
  }
  if (info.menuItemId === PUBLISHER_MENU_ID) {
    watchPublisherFromTab(tab?.id).catch((error) => notify("Asset Sale Watch", error.message, { url: getWatchlistUrl() }));
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) {
    runtimeHealth.lastAlarmStartedAt = new Date().toISOString();
    runtimeHealth.inFlightChecks += 1;
    checkAllAssets()
      .then(() => {
        runtimeHealth.lastAlarmFinishedAt = new Date().toISOString();
        runtimeHealth.lastAlarmError = null;
      })
      .catch((error) => {
        runtimeHealth.lastAlarmError = serializeRuntimeError(error);
        recordRuntimeError("alarm", error);
      })
      .finally(() => {
        runtimeHealth.inFlightChecks = Math.max(0, runtimeHealth.inFlightChecks - 1);
      });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  runtimeHealth.lastMessage = {
    type: message?.type || "unknown",
    receivedAt: new Date().toISOString(),
    senderTabId: sender.tab?.id || null,
    senderUrl: String(sender.url || sender.tab?.url || "")
  };
  handleMessage(message, sender)
    .then((payload) => {
      runtimeHealth.lastMessageError = null;
      sendResponse({ ok: true, ...payload });
    })
    .catch((error) => {
      runtimeHealth.lastMessageError = serializeRuntimeError(error);
      recordRuntimeError("message", error);
      sendResponse({ ok: false, error: error.message });
    });
  return true;
});

chrome.notifications.onClicked.addListener((notificationId) => {
  openNotificationTarget(notificationId).catch((error) => recordRuntimeError("notificationClick", error));
});

async function setupContextMenu() {
  await chrome.contextMenus.removeAll();
  await chrome.contextMenus.create({
    id: PAGE_MENU_ID,
    title: "Add to Asset Sale Watch",
    contexts: ["page", "image"],
    documentUrlPatterns: ["https://assetstore.unity.com/*"]
  });
  await chrome.contextMenus.create({
    id: LINK_MENU_ID,
    title: "Add to Asset Sale Watch",
    contexts: ["link"],
    documentUrlPatterns: ["https://assetstore.unity.com/*"],
    targetUrlPatterns: ["https://assetstore.unity.com/*"]
  });
  await chrome.contextMenus.create({
    id: PUBLISHER_MENU_ID,
    title: "Watch publisher in Asset Sale Watch",
    contexts: ["page"],
    documentUrlPatterns: ["https://assetstore.unity.com/publishers/*"]
  });
}

async function ensureAlarm() {
  const settings = await getSettings();
  const periodInMinutes = settings.checkIntervalMinutes;
  const alarm = await chrome.alarms.get(CHECK_ALARM);
  if (alarm?.periodInMinutes === periodInMinutes) {
    return;
  }

  await chrome.alarms.clear(CHECK_ALARM);
  await chrome.alarms.create(CHECK_ALARM, {
    delayInMinutes: 1,
    periodInMinutes
  });
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "addCurrentTab":
      return { asset: await addFromTab(message.tabId) };
    case "trackAsset":
      return { asset: await trackAsset(message.payload || {}, { refresh: true }) };
    case "watchCurrentPublisher":
      return { publisher: await watchPublisherFromTab(message.tabId) };
    case "watchPublisher":
      return { publisher: await watchPublisher(message.payload || {}) };
    case "unwatchPublisher":
      await unwatchPublisher(message.publisherId);
      return {};
    case "clearPublisherReports":
      return { publisher: await clearPublisherReports(message.publisherId) };
    case "getPublishers":
      return { publishers: await getWatchedPublishers() };
    case "refreshPublishers":
      return { publishers: await refreshWatchedPublishers({ notifyChanges: false }) };
    case "removeAsset":
      await removeAsset(message.productId);
      return {};
    case "updateAssetMeta":
      return { asset: await updateAssetMeta(message.productId, message.patch || {}) };
    case "fetchDescription":
      return { description: await fetchAndStoreDescription(message.productId, message.source, message.publisherId) };
    case "getSettings":
      return { settings: await getSettings() };
    case "updateSettings":
      return { settings: await updateSettings(message.patch || {}) };
    case "getDiagnostics":
      return { diagnostics: await getDiagnostics() };
    case "exportBackup":
      return { backup: await exportBackup() };
    case "importBackup":
      return { summary: await importBackup(message.backup || {}) };
    case "getDiscovery":
      return { discovery: await getDiscoveryCache() };
    case "refreshDiscovery":
      return { discovery: await refreshDiscovery({ notifyChanges: false }) };
    case "refreshNewAssets":
      return { discovery: await refreshNewAssets() };
    case "dismissDiscovery":
      return { discovery: await dismissDiscovery(message.productId) };
    case "dismissNewAsset":
      return { discovery: await dismissNewAsset(message.productId) };
    case "checkNow":
      return { asset: await refreshAsset(message.productId, { notifyChanges: false }) };
    case "checkAll":
      await checkAllAssets({ notifyChanges: false });
      return {};
    case "clearExpired":
      return { removed: await clearExpired({ forceAll: Boolean(message.forceAll) }) };
    case "getPageContext":
      return { context: await getTabUnityContext(sender.tab?.id) };
    default:
      throw new Error("Unknown Asset Sale Watch command.");
  }
}

async function addFromContext(info, tab) {
  const tabUrl = String(tab?.url || "");
  const url = String(info.linkUrl || info.pageUrl || tabUrl || "");
  const pageUrl = String(info.pageUrl || tabUrl || "");
  const pageContext = await getTabUnityContext(tab?.id, {
    targetUrl: url,
    preferLastContext: true
  });
  const context = await resolveContext(url, pageUrl, pageContext);
  const asset = await trackAsset(context, { refresh: true });
  await notify("Added to Asset Sale Watch", affiliateNotificationMessage(asset.title || `Asset ${asset.productId}`), { url: getAssetNotificationUrl(asset) });
  return asset;
}

async function addFromTab(tabId) {
  const [tab] = tabId ? [await chrome.tabs.get(tabId)] : await chrome.tabs.query({ active: true, currentWindow: true });
  const url = String(tab?.url || "");
  const pageContext = await getTabUnityContext(tab?.id, { targetUrl: url });
  const context = await resolveContext(url, url, pageContext);
  return trackAsset(context, { refresh: true });
}

async function watchPublisherFromTab(tabId) {
  const [tab] = tabId ? [await chrome.tabs.get(tabId)] : await chrome.tabs.query({ active: true, currentWindow: true });
  const url = String(tab?.url || "");
  const pageContext = await getTabUnityContext(tab?.id, { targetUrl: url });
  const context = resolvePublisherContext(url, {
    ...pageContext,
    title: pageContext.title || (/https:\/\/assetstore\.unity\.com\//i.test(url) ? tab?.title || "" : "")
  });
  return watchPublisher(context);
}

async function resolveContext(targetUrl, pageUrl, pageContext = {}) {
  const productId = extractProductId(targetUrl) || extractProductId(pageUrl) || pageContext.productId;
  if (!productId) {
    throw new Error("Open or right-click a Unity Asset Store package page/link to add it.");
  }

  const lookup = await lookupProductById(productId).catch(() => null);
  const publisherId = lookup?.publisherId || pageContext.publisherId || extractPublisherId(pageUrl) || extractPublisherId(targetUrl) || "";
  const url = productId ? `https://assetstore.unity.com/packages/package/${productId}` : targetUrl;

  if (!publisherId) {
    throw new Error("Could not infer the clicked asset's publisher. Right-click the asset title/image/card, then try Add to Asset Sale Watch again.");
  }

  return {
    productId,
    publisherId,
    url,
    title: lookup?.title || pageContext.title || "",
    publisherName: lookup?.publisherName || pageContext.publisherName || "",
    imageUrl: lookup?.imageUrl || pageContext.imageUrl || "",
    category: lookup?.category || pageContext.category || ""
  };
}

function resolvePublisherContext(pageUrl, pageContext = {}) {
  const publisherId = extractPublisherId(pageUrl) || pageContext.publisherId || "";
  if (!publisherId) {
    throw new Error("Open a Unity Asset Store publisher page to watch it.");
  }

  return {
    publisherId,
    publisherName: pageContext.publisherName || publisherNameFromTitle(pageContext.title) || `Publisher ${publisherId}`,
    url: `https://assetstore.unity.com/publishers/${publisherId}`,
    imageUrl: pageContext.imageUrl || ""
  };
}

async function getTabUnityContext(tabId, options = {}) {
  const targetUrl = String(options.targetUrl || "");
  if (!tabId || (Object.prototype.hasOwnProperty.call(options, "targetUrl") && !/https:\/\/assetstore\.unity\.com\//i.test(targetUrl))) {
    return {};
  }
  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: "collectUnityAssetContext",
      targetUrl,
      preferLastContext: Boolean(options.preferLastContext)
    });
  } catch {
    return {};
  }
}

async function trackAsset(input, options = {}) {
  const productId = normalizeId(input.productId);
  const publisherId = normalizeId(input.publisherId);
  if (!productId) {
    throw new Error("Missing Unity Asset Store product id.");
  }
  if (!publisherId) {
    throw new Error("Missing Unity Asset Store publisher id.");
  }

  const assets = await getTrackedAssets();
  const existing = assets.find((asset) => asset.productId === productId);
  const now = new Date().toISOString();
  const originalPrice = Number(input.originalPrice);
  const currentPrice = Number(input.currentPrice);
  const entry = {
    productId,
    publisherId,
    title: input.title || existing?.title || `Unity asset ${productId}`,
    publisherName: input.publisherName || existing?.publisherName || "",
    url: input.url || existing?.url || `https://assetstore.unity.com/packages/package/${productId}`,
    imageUrl: input.imageUrl || existing?.imageUrl || "",
    category: input.category || existing?.category || "",
    originalPrice: existing?.originalPrice ?? (Number.isFinite(originalPrice) ? originalPrice : null),
    currentPrice: existing?.currentPrice ?? (Number.isFinite(currentPrice) ? currentPrice : null),
    sale: existing?.sale ?? input.sale ?? null,
    status: existing?.status || input.status || "pending",
    statusLabel: existing?.statusLabel || input.statusLabel || "Pending first check",
    notes: existing?.notes || "",
    tags: normalizeTags(existing?.tags),
    description: existing?.description || input.description || "",
    descriptionFetchedAt: existing?.descriptionFetchedAt || input.descriptionFetchedAt || null,
    descriptionSource: existing?.descriptionSource || input.descriptionSource || "",
    watchMode: existing?.watchMode || "sale",
    enteredSaleAt: existing?.enteredSaleAt || null,
    lastSaleSeenAt: existing?.lastSaleSeenAt || null,
    addedAt: existing?.addedAt || now,
    updatedAt: now,
    lastCheckedAt: existing?.lastCheckedAt || null,
    expiredAt: existing?.expiredAt || null,
    lastError: null,
    notificationState: normalizeNotificationState(existing?.notificationState),
    schemaVersion: ASSET_SCHEMA_VERSION
  };

  await setTrackedAssets(upsertAsset(assets, entry));
  return options.refresh ? refreshAsset(productId, { notifyChanges: false }) : entry;
}

async function removeAsset(productId) {
  const id = normalizeId(productId);
  const assets = await getTrackedAssets();
  await setTrackedAssets(assets.filter((asset) => asset.productId !== id));
}

async function updateAssetMeta(productId, patch = {}) {
  const id = normalizeId(productId);
  const assets = await getTrackedAssets();
  const existing = assets.find((asset) => asset.productId === id);
  if (!existing) {
    throw new Error("Tracked asset was not found.");
  }

  const updated = normalizeTrackedAsset({
    ...existing,
    notes: typeof patch.notes === "string" ? patch.notes : existing.notes,
    tags: patch.tags !== undefined ? normalizeTags(patch.tags) : existing.tags,
    updatedAt: new Date().toISOString()
  });
  await setTrackedAssets(upsertAsset(assets, updated));
  return updated;
}

async function fetchAndStoreDescription(productId, source = "tracked", publisherId = "") {
  const id = normalizeId(productId);
  if (!id) {
    throw new Error("Missing Unity Asset Store product id.");
  }

  if (source === "discovery" || source === "newAssets") {
    return fetchAndStoreDiscoveryDescription(id, source);
  }
  if (source === "publisherSale") {
    return fetchAndStorePublisherSaleDescription(id, publisherId);
  }
  return fetchAndStoreTrackedDescription(id);
}

async function fetchAndStoreTrackedDescription(productId) {
  const assets = await getTrackedAssets();
  const existing = assets.find((asset) => asset.productId === productId);
  if (!existing) {
    throw new Error("Tracked asset was not found.");
  }

  const updated = await attachDescription(existing);
  await setTrackedAssets(upsertAsset(assets, updated));
  return pickDescriptionPayload(updated);
}

async function fetchAndStoreDiscoveryDescription(productId, source) {
  const cache = await getDiscoveryCache();
  const listName = source === "newAssets" ? "newAssets" : "newReleaseSales";
  const items = cache[listName] || [];
  const item = items.find((entry) => entry.productId === productId);
  if (!item) {
    throw new Error("Discovery item was not found.");
  }

  const updated = await attachDescription(item);
  await setDiscoveryCache({
    ...cache,
    [listName]: items.map((entry) => entry.productId === productId ? updated : entry)
  });
  return pickDescriptionPayload(updated);
}

async function fetchAndStorePublisherSaleDescription(productId, publisherId) {
  const id = normalizeId(publisherId);
  if (!id) {
    throw new Error("Missing Unity Asset Store publisher id.");
  }

  const publishers = await getWatchedPublishers();
  const publisher = publishers.find((entry) => entry.publisherId === id);
  const item = publisher?.saleItems?.find((entry) => entry.productId === productId);
  if (!publisher || !item) {
    throw new Error("Publisher sale item was not found.");
  }

  const updated = await attachDescription(item);
  await setWatchedPublishers(upsertPublisher(publishers, {
    ...publisher,
    saleItems: publisher.saleItems.map((entry) => entry.productId === productId ? updated : entry),
    updatedAt: new Date().toISOString()
  }));
  return pickDescriptionPayload(updated);
}

async function attachDescription(item) {
  const fetched = await fetchAssetDescription(item);
  return {
    ...item,
    ...fetched,
    updatedAt: new Date().toISOString()
  };
}

async function fetchAssetDescription(item) {
  const productId = normalizeId(item.productId);
  const url = item.url || `https://assetstore.unity.com/packages/package/${productId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Description fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const description = extractProductDescription(html, productId);
  if (!description) {
    throw new Error("No product description was found on the Asset Store page.");
  }

  return {
    description,
    descriptionFetchedAt: new Date().toISOString(),
    descriptionSource: url
  };
}

function pickDescriptionPayload(item) {
  return {
    productId: item.productId,
    description: item.description || "",
    descriptionFetchedAt: item.descriptionFetchedAt || null,
    descriptionSource: item.descriptionSource || ""
  };
}

async function checkAllAssets(options = {}) {
  await clearExpired();
  const assets = await getTrackedAssets();
  await Promise.allSettled(assets.map((asset) => refreshAsset(asset.productId, { notifyChanges: options.notifyChanges !== false })));
  await refreshDiscovery({ notifyChanges: options.notifyChanges !== false }).catch(() => null);
  await refreshNewAssets().catch(() => null);
  await refreshWatchedPublishers({ notifyChanges: options.notifyChanges !== false }).catch(() => null);
  await clearExpired();
}

async function refreshAsset(productId, options = {}) {
  const id = normalizeId(productId);
  const assets = await getTrackedAssets();
  const existing = assets.find((asset) => asset.productId === id);
  if (!existing) {
    throw new Error("Tracked asset was not found.");
  }

  const now = new Date().toISOString();

  try {
    const result = await fetchUnitySale(existing.publisherId, existing.productId);
    let updated = mergeRefreshResult(existing, result, now);
    const settings = await getSettings();
    if (settings.collectDescriptions && !updated.description) {
      updated = await attachDescription(updated).catch(() => updated);
    }
    await setTrackedAssets(upsertAsset(assets, updated));

    let current = updated;
    if (options.notifyChanges !== false) {
      current = await notifySaleEntry(current, existing);
      await notifyOnChanges(current, existing);
      await notifyReminders(current);
    }

    return current;
  } catch (error) {
    const failed = normalizeTrackedAsset({
      ...existing,
      status: "error",
      statusLabel: error.message,
      lastError: error.message,
      lastCheckedAt: now,
      updatedAt: now
    });
    await setTrackedAssets(upsertAsset(assets, failed));
    return failed;
  }
}

async function fetchUnitySale(publisherId, productId) {
  const token = await getSearchToken();
  let result = await findPublisherProduct(token, publisherId, productId);
  if (!result) {
    const lookup = await productSearch(token, productId);
    result = (lookup.results || []).find((item) => {
      const rawIds = item.raw?.ec_product_id;
      const ids = Array.isArray(rawIds) ? rawIds : [rawIds];
      return ids.map(String).includes(String(productId));
    });
  }
  if (!result) {
    throw new Error(`Could not find product ${productId}.`);
  }

  const raw = result.raw || {};
  const sale = pickRelevantSale(parseUnitySale(raw.ec_sale));
  const productIds = Array.isArray(raw.ec_product_id) ? raw.ec_product_id : [raw.ec_product_id].filter(Boolean);
  const originalPrice = Number(raw.ec_price);
  const currentPrice = Number(raw.ec_price_filter);
  const hasPriceDrop = Number.isFinite(originalPrice) && Number.isFinite(currentPrice) && currentPrice < originalPrice;
  const status = deriveStatus(sale, { hasPriceDrop });

  return {
    productId: String(productIds[0] || productId),
    publisherId: String(raw.publisher_id || publisherId),
    title: raw.ec_name || result.title || `Unity asset ${productId}`,
    publisherName: raw.publisher_name || "",
    url: result.clickUri || `https://assetstore.unity.com/packages/package/${productId}`,
    imageUrl: raw.ec_thumbnails || "",
    category: extractCategory(raw),
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    sale,
    status: status.value,
    statusLabel: status.label,
    expiredAt: status.value === "expired" ? sale?.endsAt || new Date().toISOString() : null
  };
}

async function getSearchToken() {
  const response = await fetch(UNITY_TOKEN_URL, { credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Unity search token request failed: ${response.status}`);
  }
  const token = await response.json();
  if (!token || typeof token !== "string") {
    throw new Error("Unity returned an invalid search token.");
  }
  return token;
}

async function findPublisherProduct(token, publisherId, productId) {
  const pageSize = 100;
  let firstResult = 0;
  let totalCount = Infinity;

  while (firstResult < totalCount && firstResult < 1000) {
    const page = await coveoSearch(token, publisherId, pageSize, firstResult);
    totalCount = Number(page.totalCount || 0);
    const found = (page.results || []).find((result) => {
      const rawIds = result.raw?.ec_product_id;
      const ids = Array.isArray(rawIds) ? rawIds : [rawIds];
      return ids.map(String).includes(String(productId));
    });
    if (found) {
      return found;
    }
    firstResult += pageSize;
  }

  return null;
}

async function lookupProductById(productId) {
  const token = await getSearchToken();
  const page = await productSearch(token, productId);
  const result = (page.results || []).find((item) => {
    const rawIds = item.raw?.ec_product_id;
    const ids = Array.isArray(rawIds) ? rawIds : [rawIds];
    return ids.map(String).includes(String(productId));
  });

  if (!result) {
    return null;
  }

  const raw = result.raw || {};
  return {
    productId: String(Array.isArray(raw.ec_product_id) ? raw.ec_product_id[0] : raw.ec_product_id || productId),
    publisherId: String(raw.publisher_id || ""),
    title: raw.ec_name || result.title || "",
    publisherName: raw.publisher_name || "",
    imageUrl: raw.ec_thumbnails || "",
    category: extractCategory(raw)
  };
}

async function productSearch(token, productId) {
  const body = {
    q: String(productId),
    numberOfResults: 5,
    fieldsToInclude: FIELDS,
    context: {
      website: "assetstore",
      language: "en-US",
      userGroups: ["assetStoreUsers"],
      ec_price: "USD",
      ec_price_filter: "USD",
      popularity: false
    }
  };

  const response = await fetch(COVEO_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Unity product lookup failed: ${response.status}`);
  }
  return response.json();
}

async function coveoSearch(token, publisherId, numberOfResults, firstResult) {
  const body = {
    q: "",
    aq: `@publisher_id == "${publisherId}"`,
    numberOfResults,
    firstResult,
    fieldsToInclude: FIELDS,
    context: {
      website: "assetstore",
      language: "en-US",
      userGroups: ["assetStoreUsers"],
      ec_price: "USD",
      ec_price_filter: "USD",
      popularity: false
    }
  };

  const response = await fetch(COVEO_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Unity search request failed: ${response.status}`);
  }
  return response.json();
}

async function discoverySearch(token) {
  const body = {
    q: "",
    aq: `@ec_sale_filters == "${NEW_RELEASE_SALE_FILTER}"`,
    numberOfResults: DISCOVERY_RESULT_LIMIT,
    firstResult: 0,
    fieldsToInclude: FIELDS,
    context: {
      website: "assetstore",
      language: "en-US",
      userGroups: ["assetStoreUsers"],
      ec_price: "USD",
      ec_price_filter: "USD",
      popularity: false
    }
  };

  const response = await fetch(COVEO_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Unity discovery request failed: ${response.status}`);
  }
  return response.json();
}

async function newAssetsSearch(token) {
  return newAssetsSearchPage(token, NEW_ASSET_RESULT_LIMIT, 0);
}

async function newAssetsSearchPage(token, numberOfResults, firstResult) {
  const body = {
    q: "",
    sortCriteria: "first_published_at descending",
    numberOfResults,
    firstResult,
    fieldsToInclude: FIELDS,
    context: {
      website: "assetstore",
      language: "en-US",
      userGroups: ["assetStoreUsers"],
      ec_price: "USD",
      ec_price_filter: "USD",
      popularity: false
    }
  };

  const response = await fetch(COVEO_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Unity new assets request failed: ${response.status}`);
  }
  return response.json();
}

function parseUnitySale(value) {
  if (!value || typeof value !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pickRelevantSale(sales, typeFilter = "") {
  const now = Date.now();
  const normalized = sales
    .map((sale) => ({
      type: sale.type || "on_sale",
      startsAt: sale.dates?.starts || null,
      endsAt: sale.dates?.ends || null,
      prices: sale.prices || {},
      discount: sale.discount || null
    }))
    .filter((sale) => !typeFilter || sale.type === typeFilter)
    .filter((sale) => sale.startsAt && sale.endsAt)
    .filter((sale) => Number.isFinite(Date.parse(sale.startsAt)) && Number.isFinite(Date.parse(sale.endsAt)));

  const active = normalized
    .filter((sale) => Date.parse(sale.startsAt) <= now && now <= Date.parse(sale.endsAt))
    .sort((left, right) => Date.parse(left.endsAt) - Date.parse(right.endsAt))[0];
  if (active) {
    return active;
  }

  const upcoming = normalized
    .filter((sale) => Date.parse(sale.startsAt) > now)
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))[0];
  if (upcoming) {
    return upcoming;
  }

  return normalized
    .filter((sale) => Date.parse(sale.endsAt) < now)
    .sort((left, right) => Date.parse(right.endsAt) - Date.parse(left.endsAt))[0] || null;
}

function deriveStatus(sale, options = {}) {
  if (!sale) {
    if (options.hasPriceDrop) {
      return { value: "active", label: "Price is below the original price; no sale deadline found" };
    }
    return { value: "watching_no_sale", label: "Watching for the next sale" };
  }

  const now = Date.now();
  const startsAt = Date.parse(sale.startsAt);
  const endsAt = Date.parse(sale.endsAt);

  if (now < startsAt) {
    return { value: "upcoming", label: `Sale starts ${new Date(startsAt).toLocaleString()}` };
  }
  if (now <= endsAt) {
    return { value: "active", label: `Sale ends ${new Date(endsAt).toLocaleString()}` };
  }
  return { value: "expired", label: `Sale ended ${new Date(endsAt).toLocaleString()}` };
}

function formatReminderTimeLeft(ms) {
  const totalMinutes = Math.max(1, Math.round(Math.max(0, ms) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

function mergeRefreshResult(existing, result, checkedAt) {
  if (result.status === "expired" && !existing.sale?.endsAt) {
    return normalizeTrackedAsset({
      ...existing,
      ...result,
      sale: null,
      status: "watching_no_sale",
      statusLabel: "Watching for the next sale",
      expiredAt: null,
      lastCheckedAt: checkedAt,
      updatedAt: checkedAt,
      lastError: null
    });
  }

  const existingSaleEnded = existing.sale?.endsAt && Date.parse(existing.sale.endsAt) <= Date.now();
  if (result.status === "watching_no_sale" && existingSaleEnded) {
    return normalizeTrackedAsset({
      ...existing,
      ...result,
      sale: existing.sale,
      status: "expired",
      statusLabel: `Sale ended ${new Date(existing.sale.endsAt).toLocaleString()}`,
      expiredAt: existing.sale.endsAt,
      lastSaleSeenAt: existing.lastSaleSeenAt || checkedAt,
      lastCheckedAt: checkedAt,
      updatedAt: checkedAt,
      lastError: null
    });
  }

  const saleLike = isSaleLike(result);
  const existingSaleKey = getSaleKey(existing);
  const resultSaleKey = getSaleKey(result);

  return normalizeTrackedAsset({
    ...existing,
    ...result,
    expiredAt: result.status === "expired" ? result.expiredAt || result.sale?.endsAt || checkedAt : null,
    enteredSaleAt: saleLike && resultSaleKey !== existingSaleKey ? checkedAt : existing.enteredSaleAt || null,
    lastSaleSeenAt: saleLike ? checkedAt : existing.lastSaleSeenAt || null,
    lastCheckedAt: checkedAt,
    updatedAt: checkedAt,
    lastError: null
  });
}

async function notifySaleEntry(asset, previous) {
  const settings = await getSettings();
  if (!settings.alerts.assetEntersSale) {
    return asset;
  }

  if (!isNoSaleLike(previous) || !isSaleLike(asset)) {
    return asset;
  }

  const saleKey = getSaleKey(asset);
  const key = `entered_sale_${saleKey}`;
  const notificationState = normalizeNotificationState(asset.notificationState);
  if (notificationState[key]) {
    return asset;
  }

  const now = new Date().toISOString();
  notificationState[key] = now;
  const updated = normalizeTrackedAsset({
    ...asset,
    notificationState,
    enteredSaleAt: asset.enteredSaleAt || now,
    lastSaleSeenAt: now
  });
  const assets = await getTrackedAssets();
  await setTrackedAssets(upsertAsset(assets, updated));
  await notify(
    updated.title || "Unity asset is on sale",
    updated.sale?.endsAt ? affiliateNotificationMessage(`Sale ends ${new Date(updated.sale.endsAt).toLocaleString()}. Click to open the asset.`) : affiliateNotificationMessage("Price dropped below the original price. Click to open the asset."),
    { url: getAssetNotificationUrl(updated) }
  );
  return updated;
}

async function notifyOnChanges(asset, previous) {
  const settings = await getSettings();
  if (!settings.alerts.saleEndChanged) {
    return;
  }

  if (isNoSaleLike(previous) && isSaleLike(asset)) {
    return;
  }

  const before = previous.sale?.endsAt || previous.status;
  const after = asset.sale?.endsAt || asset.status;
  if (before && before !== after) {
    await notify(asset.title || "Unity sale changed", affiliateNotificationMessage(asset.statusLabel || "Sale metadata changed. Click to open the asset."), { url: getAssetNotificationUrl(asset) });
  }
}

async function notifyReminders(asset) {
  const settings = await getSettings();
  if (!settings.alerts.saleEndingReminders) {
    return;
  }

  if (asset.status !== "active" || !asset.sale?.endsAt) {
    return;
  }

  const endsAt = Date.parse(asset.sale.endsAt);
  const remainingMs = endsAt - Date.now();
  if (remainingMs <= 0) {
    return;
  }

  const notificationState = { ...(asset.notificationState || {}) };
  const crossed = settings.reminderThresholdHours
    .map(Number)
    .filter((hours) => Number.isFinite(hours) && hours > 0)
    .sort((left, right) => left - right)
    .filter((hours) => remainingMs <= hours * 60 * 60 * 1000);
  const nextReminder = crossed.find((hours) => !notificationState[`reminder_${hours}h_${asset.sale.endsAt}`]);
  if (!nextReminder) {
    return;
  }

  for (const hours of crossed) {
    const thresholdMs = hours * 60 * 60 * 1000;
    const key = `reminder_${hours}h_${asset.sale.endsAt}`;
    if (remainingMs <= thresholdMs) {
      notificationState[key] = new Date().toISOString();
    }
  }

  await notify(asset.title || "Unity sale ending soon", affiliateNotificationMessage(`Sale ends in about ${formatReminderTimeLeft(remainingMs)}. Click to open the asset.`), { url: getAssetNotificationUrl(asset) });

  const assets = await getTrackedAssets();
  const current = assets.find((item) => item.productId === asset.productId) || asset;
  await setTrackedAssets(upsertAsset(assets, { ...current, notificationState }));
}

async function notify(title, message, target = {}) {
  const notificationId = `unity-sale-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title,
    message
  });
  await rememberNotificationTarget(notificationId, target);
}

async function rememberNotificationTarget(notificationId, target = {}) {
  const url = normalizeNotificationUrl(target.url) || getWatchlistUrl();
  const data = await chrome.storage.local.get(NOTIFICATION_TARGETS_KEY);
  const targets = pruneNotificationTargets(data[NOTIFICATION_TARGETS_KEY] || {});
  targets[notificationId] = {
    url,
    createdAt: new Date().toISOString()
  };
  await chrome.storage.local.set({ [NOTIFICATION_TARGETS_KEY]: targets });
}

async function openNotificationTarget(notificationId) {
  const data = await chrome.storage.local.get(NOTIFICATION_TARGETS_KEY);
  const targets = pruneNotificationTargets(data[NOTIFICATION_TARGETS_KEY] || {});
  const target = targets[notificationId];
  delete targets[notificationId];
  await chrome.storage.local.set({ [NOTIFICATION_TARGETS_KEY]: targets });
  await chrome.notifications.clear(notificationId);
  await chrome.tabs.create({ url: normalizeNotificationUrl(target?.url) || getWatchlistUrl() });
}

function pruneNotificationTargets(targets = {}) {
  const cutoff = Date.now() - NOTIFICATION_TARGET_RETENTION_MS;
  return Object.fromEntries(Object.entries(targets).filter(([, target]) => {
    const createdAt = Date.parse(target?.createdAt || "");
    return Number.isFinite(createdAt) && createdAt >= cutoff && normalizeNotificationUrl(target?.url);
  }));
}

function normalizeNotificationUrl(url) {
  const rawUrl = String(url || "");
  if (!rawUrl) {
    return "";
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "chrome-extension:" && parsed.toString().startsWith(chrome.runtime.getURL(""))) {
      return parsed.toString();
    }
    if (parsed.protocol === "https:" && parsed.hostname === "assetstore.unity.com") {
      return parsed.toString();
    }
  } catch {
    return "";
  }
  return "";
}

function getWatchlistUrl() {
  return chrome.runtime.getURL("watchlist.html");
}

function getAssetNotificationUrl(asset) {
  return assetStoreUrl(asset?.url || (asset?.productId ? `https://assetstore.unity.com/packages/package/${asset.productId}` : "")) || getWatchlistUrl();
}

function recordRuntimeError(source, error) {
  runtimeHealth.unhandledErrors.push({
    source,
    occurredAt: new Date().toISOString(),
    error: serializeRuntimeError(error)
  });
  runtimeHealth.unhandledErrors = runtimeHealth.unhandledErrors.slice(-10);
}

function serializeRuntimeError(error) {
  if (!error) {
    return { message: "Unknown error" };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || ""
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  try {
    return {
      message: JSON.stringify(error)
    };
  } catch {
    return { message: String(error) };
  }
}

async function updateBadgeStatus(assets = null) {
  const source = assets || await readStoredAssetsForBadge();
  const urgentCount = source.filter(isUrgentBadgeAsset).length;
  await chrome.action.setBadgeBackgroundColor({ color: "#f79009" });
  await chrome.action.setBadgeText({ text: urgentCount > 0 ? String(Math.min(urgentCount, 99)) : "" });
  await chrome.action.setTitle({
    title: urgentCount > 0
      ? `Asset Sale Watch - ${urgentCount} sale${urgentCount === 1 ? "" : "s"} ending within 24h`
      : "Asset Sale Watch"
  });
}

async function readStoredAssetsForBadge() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const rawAssets = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  return rawAssets.map(normalizeTrackedAsset).filter(Boolean);
}

function isUrgentBadgeAsset(asset) {
  if (asset.status === "error") {
    return false;
  }
  const endsAt = Date.parse(asset.sale?.endsAt || "");
  if (!Number.isFinite(endsAt)) {
    return false;
  }
  const remainingMs = endsAt - Date.now();
  return remainingMs >= 0 && remainingMs <= 24 * 60 * 60 * 1000;
}

async function clearExpired(options = {}) {
  const assets = await getTrackedAssets();
  const settings = await getSettings();
  const retentionDays = settings.expiredRetentionDays;
  const cutoff = retentionDays === "never" ? null : Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const kept = [];
  let removed = 0;

  for (const asset of assets) {
    const expiredTime = getExpiredTime(asset);
    const isExpired = Number.isFinite(expiredTime);
    const shouldRemove = options.forceAll
      ? isExpired
      : isExpired && cutoff !== null && expiredTime < cutoff;

    if (shouldRemove) {
      removed += 1;
    } else {
      kept.push(asset);
    }
  }

  if (removed > 0) {
    await setTrackedAssets(kept);
  }
  return removed;
}

async function getTrackedAssets() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const rawAssets = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const { assets, changed } = migrateAssets(rawAssets);
  if (changed) {
    await setTrackedAssets(assets);
  }
  return assets;
}

async function setTrackedAssets(assets) {
  const normalized = assets.map(normalizeTrackedAsset);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  await updateBadgeStatus(normalized);
}

async function getWatchedPublishers() {
  const data = await chrome.storage.local.get(PUBLISHERS_KEY);
  const rawPublishers = Array.isArray(data[PUBLISHERS_KEY]) ? data[PUBLISHERS_KEY] : [];
  const { publishers, changed } = migratePublishers(rawPublishers);
  if (changed) {
    await setWatchedPublishers(publishers);
  }
  return publishers;
}

async function setWatchedPublishers(publishers) {
  await chrome.storage.local.set({ [PUBLISHERS_KEY]: publishers.map(normalizeWatchedPublisher).filter(Boolean) });
}

async function watchPublisher(input = {}) {
  const publisherId = normalizeId(input.publisherId);
  if (!publisherId) {
    throw new Error("Missing Unity Asset Store publisher id.");
  }

  const publishers = await getWatchedPublishers();
  const existing = publishers.find((publisher) => publisher.publisherId === publisherId);
  const profile = await fetchPublisherProfile(publisherId).catch(() => ({}));
  const now = new Date().toISOString();
  const publisher = normalizeWatchedPublisher({
    ...existing,
    publisherId,
    publisherName: input.publisherName || existing?.publisherName || profile.publisherName || `Publisher ${publisherId}`,
    url: input.url || existing?.url || `https://assetstore.unity.com/publishers/${publisherId}`,
    imageUrl: normalizeAssetStoreImageUrl(input.imageUrl || existing?.imageUrl || profile.imageUrl || profile.overviewImageUrl || ""),
    addedAt: existing?.addedAt || now,
    updatedAt: now
  });
  await setWatchedPublishers(upsertPublisher(publishers, publisher));
  return publisher;
}

async function unwatchPublisher(publisherId) {
  const id = normalizeId(publisherId);
  const publishers = await getWatchedPublishers();
  await setWatchedPublishers(publishers.filter((publisher) => publisher.publisherId !== id));
}

async function clearPublisherReports(publisherId) {
  const id = normalizeId(publisherId);
  const publishers = await getWatchedPublishers();
  const existing = publishers.find((publisher) => publisher.publisherId === id);
  if (!existing) {
    throw new Error("Watched publisher was not found.");
  }

  const updated = normalizeWatchedPublisher({
    ...existing,
    reportedProductIds: [],
    notificationState: {},
    updatedAt: new Date().toISOString()
  });
  await setWatchedPublishers(upsertPublisher(publishers, updated));
  return updated;
}

async function refreshWatchedPublishers(options = {}) {
  const publishers = await getWatchedPublishers();
  if (!publishers.length) {
    return [];
  }

  const token = await getSearchToken();
  const refreshed = [];
  for (const publisher of publishers) {
    refreshed.push(await refreshWatchedPublisher(publisher, token, options));
  }
  await setWatchedPublishers(refreshed);
  return refreshed;
}

async function refreshWatchedPublisher(publisher, token, options = {}) {
  const now = new Date().toISOString();
  try {
    const saleItems = await fetchPublisherSaleItems(token, publisher.publisherId);
    const profile = publisher.imageUrl ? {} : await fetchPublisherProfile(publisher.publisherId).catch(() => ({}));
    const saleProductIds = saleItems.map((item) => item.productId);
    const previousReported = new Set(publisher.reportedProductIds || []);
    const isInitialCheck = !publisher.lastCheckedAt && previousReported.size === 0;
    const newSaleItems = isInitialCheck
      ? []
      : saleItems.filter((item) => !previousReported.has(item.productId));

    const reportedProductIds = [...new Set([
      ...(publisher.reportedProductIds || []),
      ...saleProductIds
    ])];
    const updated = normalizeWatchedPublisher({
      ...publisher,
      publisherName: publisher.publisherName || profile.publisherName || `Publisher ${publisher.publisherId}`,
      imageUrl: normalizeAssetStoreImageUrl(publisher.imageUrl || profile.imageUrl || profile.overviewImageUrl || saleItems[0]?.imageUrl || ""),
      saleItemCount: saleItems.length,
      lastSaleItems: saleProductIds,
      saleItems,
      reportedProductIds,
      lastCheckedAt: now,
      updatedAt: now,
      lastError: null
    });

    if (options.notifyChanges !== false && newSaleItems.length > 0) {
      await notifyPublisherSaleItems(updated, newSaleItems);
    }

    return updated;
  } catch (error) {
    return normalizeWatchedPublisher({
      ...publisher,
      lastCheckedAt: now,
      updatedAt: now,
      lastError: error.message
    });
  }
}

async function fetchPublisherSaleItems(token, publisherId) {
  const pageSize = 100;
  let firstResult = 0;
  let totalCount = Infinity;
  const saleItems = [];

  while (firstResult < totalCount && firstResult < 1000) {
    const page = await coveoSearch(token, publisherId, pageSize, firstResult);
    totalCount = Number(page.totalCount || 0);
    saleItems.push(...(page.results || []).map(normalizePublisherSaleResult).filter(Boolean));
    firstResult += pageSize;
  }

  return saleItems.sort(comparePublisherSaleItems);
}

async function notifyPublisherSaleItems(publisher, saleItems) {
  const settings = await getSettings();
  if (!settings.alerts.publisherNewSale) {
    return;
  }

  const first = saleItems[0];
  const extra = saleItems.length > 1 ? ` and ${saleItems.length - 1} more` : "";
  await notify(
    `${publisher.publisherName || "Watched publisher"} has new sale items`,
    `${first?.title || "A Unity asset"}${extra} ${saleItems.length === 1 ? "is" : "are"} discounted. Click to open Asset Sale Watch.`,
    { url: getWatchlistUrl() }
  );
}

async function getDiscoveryCache() {
  const data = await chrome.storage.local.get(DISCOVERY_KEY);
  return normalizeDiscoveryCache(data[DISCOVERY_KEY] || {});
}

async function setDiscoveryCache(cache) {
  await chrome.storage.local.set({ [DISCOVERY_KEY]: normalizeDiscoveryCache(cache) });
}

async function refreshDiscovery(options = {}) {
  const existing = await getDiscoveryCache();
  const existingById = new Map(existing.newReleaseSales.map((item) => [item.productId, item]));
  const now = new Date().toISOString();
  try {
    const token = await getSearchToken();
    const page = await discoverySearch(token);
    const normalizedResults = (page.results || [])
      .map(normalizeDiscoveryResult)
      .filter(Boolean);
    const results = (await enrichDiscoveryPublicationDates(normalizedResults, existingById))
      .sort(compareDiscoveryResults);
    const digestItems = await getDiscoveryDigestItems(results, existing, existingById, options);
    const digestReportedProductIds = [
      ...new Set([
        ...existing.digestReportedProductIds,
        ...digestItems.map((item) => item.productId)
      ])
    ];
    const cache = normalizeDiscoveryCache({
      ...existing,
      newReleaseSales: results,
      digestReportedProductIds,
      fetchedAt: now,
      lastError: null
    });
    await setDiscoveryCache(cache);
    if (digestItems.length > 0) {
      await notifyDiscoveryDigest(digestItems);
    }
    return cache;
  } catch (error) {
    const failed = normalizeDiscoveryCache({
      ...existing,
      fetchedAt: existing.fetchedAt || null,
      lastError: error.message
    });
    await setDiscoveryCache(failed);
    return failed;
  }
}

async function getDiscoveryDigestItems(results, existing, existingById, options = {}) {
  if (options.notifyChanges === false || !existing.fetchedAt) {
    return [];
  }

  const settings = await getSettings();
  if (!settings.alerts.discoveryDigest) {
    return [];
  }

  const assets = await getTrackedAssets();
  const trackedIds = new Set(assets.map((asset) => asset.productId));
  const dismissedIds = new Set(existing.dismissedProductIds);
  const reportedIds = new Set(existing.digestReportedProductIds);
  return results.filter((item) => {
    const id = item.productId;
    return id && !existingById.has(id) && !trackedIds.has(id) && !dismissedIds.has(id) && !reportedIds.has(id);
  });
}

async function notifyDiscoveryDigest(items) {
  const first = items[0];
  const extra = items.length > 1 ? ` and ${items.length - 1} more` : "";
  await notify(
    "New Unity release sale found",
    `${first?.title || "A Unity asset"}${extra} ${items.length === 1 ? "is" : "are"} in New Release Sales. Click to open Asset Sale Watch.`,
    { url: getWatchlistUrl() }
  );
}

async function refreshNewAssets() {
  const existing = await getDiscoveryCache();
  const settings = await getSettings();
  const queueLimit = settings.newAssetQueueLimit;
  const cutoff = Date.now() - settings.newAssetMaxAgeDays * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();
  try {
    const token = await getSearchToken();
    const results = [];
    const pageSize = Math.min(100, queueLimit);
    let firstResult = 0;
    let totalCount = Infinity;
    let reachedAgeLimit = false;

    while (results.length < queueLimit && firstResult < totalCount && firstResult < NEW_ASSET_MAX_RESULT_LIMIT && !reachedAgeLimit) {
      const page = await newAssetsSearchPage(token, pageSize, firstResult);
      totalCount = Number(page.totalCount || 0);
      const normalized = (page.results || []).map(normalizeNewAssetResult).filter(Boolean);
      for (const item of normalized) {
        const firstPublished = Date.parse(item.firstPublishedAt || "");
        if (Number.isFinite(firstPublished) && firstPublished < cutoff) {
          reachedAgeLimit = true;
          break;
        }
        results.push(item);
        if (results.length >= queueLimit) {
          break;
        }
      }
      firstResult += pageSize;
    }

    const visibleResults = results
      .sort(compareNewAssets)
      .slice(0, queueLimit);
    const cache = normalizeDiscoveryCache({
      ...existing,
      newAssets: visibleResults,
      newAssetsFetchedAt: now,
      newAssetsLastError: null
    });
    await setDiscoveryCache(cache);
    return cache;
  } catch (error) {
    const failed = normalizeDiscoveryCache({
      ...existing,
      newAssetsFetchedAt: existing.newAssetsFetchedAt || null,
      newAssetsLastError: error.message
    });
    await setDiscoveryCache(failed);
    return failed;
  }
}

async function enrichDiscoveryPublicationDates(items, existingById) {
  return mapWithConcurrency(items, DISCOVERY_DETAIL_CONCURRENCY, async (item) => {
    const existing = existingById.get(item.productId);
    if (existing?.firstPublishedAt && existing.firstPublishedSourceVersion === FIRST_PUBLISHED_SOURCE_VERSION) {
      return normalizeDiscoveryItem({
        ...item,
        firstPublishedAt: existing.firstPublishedAt,
        firstPublishedSourceVersion: existing.firstPublishedSourceVersion,
        latestReleaseAt: item.latestReleaseAt || existing.latestReleaseAt || null
      });
    }

    const firstPublishedAt = await fetchFirstPublishedAt(item).catch(() => null);
    return normalizeDiscoveryItem({
      ...item,
      firstPublishedAt: firstPublishedAt || existing?.firstPublishedAt || null,
      firstPublishedSourceVersion: firstPublishedAt ? FIRST_PUBLISHED_SOURCE_VERSION : existing?.firstPublishedSourceVersion || 0,
      latestReleaseAt: item.latestReleaseAt || existing?.latestReleaseAt || null
    });
  });
}

async function fetchFirstPublishedAt(item) {
  const candidates = [
    item.url,
    item.productId ? `https://assetstore.unity.com/packages/package/${item.productId}` : ""
  ].filter(Boolean);
  const seen = new Set();

  for (const candidate of candidates) {
    const url = normalizeProductUrl(candidate);
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);

    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    const firstPublishedAt = extractFirstPublishedDate(html, item.productId);
    if (firstPublishedAt) {
      return firstPublishedAt;
    }
  }

  return null;
}

async function fetchPublisherProfile(publisherId) {
  const id = normalizeId(publisherId);
  if (!id) {
    return {};
  }

  const response = await fetch(`https://assetstore.unity.com/publishers/${id}`, { credentials: "omit" });
  if (!response.ok) {
    return {};
  }

  return extractPublisherProfile(await response.text());
}

function extractPublisherProfile(html) {
  const publisherAvatarUrl = extractJsonishValue(html, "publisherAvatarUrl");
  const overviewImageUrl = extractJsonishValue(html, "imageUrl");
  const publisherName = extractJsonishValue(html, "publisherName")
    || extractMetaContent(html, "twitter:title")
    || extractMetaContent(html, "og:title");
  return {
    publisherName: publisherNameFromTitle(decodeJsonish(publisherName)),
    imageUrl: normalizeAssetStoreImageUrl(decodeJsonish(publisherAvatarUrl)),
    overviewImageUrl: normalizeAssetStoreImageUrl(decodeJsonish(overviewImageUrl))
  };
}

async function dismissDiscovery(productId) {
  const id = normalizeId(productId);
  const cache = await getDiscoveryCache();
  const dismissedProductIds = [...new Set([...cache.dismissedProductIds, id].filter(Boolean))];
  const updated = normalizeDiscoveryCache({ ...cache, dismissedProductIds });
  await setDiscoveryCache(updated);
  return updated;
}

async function dismissNewAsset(productId) {
  const id = normalizeId(productId);
  const cache = await getDiscoveryCache();
  const dismissedNewAssetProductIds = [...new Set([...cache.dismissedNewAssetProductIds, id].filter(Boolean))];
  const updated = normalizeDiscoveryCache({ ...cache, dismissedNewAssetProductIds });
  await setDiscoveryCache(updated);
  return updated;
}

async function getSettings() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(data[SETTINGS_KEY] || {});
}

async function updateSettings(patch = {}) {
  const current = await getSettings();
  const merged = normalizeSettings({
    ...current,
    ...patch,
    alerts: {
      ...current.alerts,
      ...(patch.alerts || {})
    }
  });
  await chrome.storage.local.set({ [SETTINGS_KEY]: merged });
  await ensureAlarm();
  return merged;
}

async function exportBackup() {
  return {
    app: "Asset Sale Watch",
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    extensionVersion: chrome.runtime.getManifest().version,
    trackedAssets: await getTrackedAssets(),
    settings: await getSettings(),
    discoveryCache: await getDiscoveryCache(),
    watchedPublishers: await getWatchedPublishers()
  };
}

async function getDiagnostics() {
  let settings = null;
  let settingsError = null;
  try {
    settings = await getSettings();
  } catch (error) {
    settingsError = error.message;
  }
  const storage = await chrome.storage.local.get([STORAGE_KEY, SETTINGS_KEY, DISCOVERY_KEY, PUBLISHERS_KEY, NOTIFICATION_TARGETS_KEY]);
  return {
    extensionVersion: chrome.runtime.getManifest().version,
    backgroundLoadedAt: BACKGROUND_LOADED_AT,
    checkedAt: new Date().toISOString(),
    runtimeHealth: {
      ...runtimeHealth,
      unhandledErrors: runtimeHealth.unhandledErrors.slice(-10)
    },
    helperState: {
      normalizeNewAssetQueueLimit: typeof normalizeNewAssetQueueLimit,
      normalizeNewAssetMaxAgeDays: typeof normalizeNewAssetMaxAgeDays,
      normalizeSettings: typeof normalizeSettings
    },
    settings,
    settingsError,
    counts: {
      trackedAssets: Array.isArray(storage[STORAGE_KEY]) ? storage[STORAGE_KEY].length : 0,
      watchedPublishers: Array.isArray(storage[PUBLISHERS_KEY]) ? storage[PUBLISHERS_KEY].length : 0,
      newReleaseSales: Array.isArray(storage[DISCOVERY_KEY]?.newReleaseSales) ? storage[DISCOVERY_KEY].newReleaseSales.length : 0,
      newAssets: Array.isArray(storage[DISCOVERY_KEY]?.newAssets) ? storage[DISCOVERY_KEY].newAssets.length : 0,
      notificationTargets: storage[NOTIFICATION_TARGETS_KEY] && typeof storage[NOTIFICATION_TARGETS_KEY] === "object" ? Object.keys(storage[NOTIFICATION_TARGETS_KEY]).length : 0
    }
  };
}

async function importBackup(backup = {}) {
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
    throw new Error("Backup file is not an Asset Sale Watch JSON object.");
  }

  const trackedAssets = Array.isArray(backup.trackedAssets)
    ? backup.trackedAssets.filter((asset) => normalizeId(asset?.productId))
    : [];
  const watchedPublishers = Array.isArray(backup.watchedPublishers)
    ? backup.watchedPublishers.filter((publisher) => normalizeId(publisher?.publisherId))
    : [];
  const settings = normalizeSettings(backup.settings || {});
  const discoveryCache = normalizeDiscoveryCache(backup.discoveryCache || {});

  await setTrackedAssets(trackedAssets);
  await setWatchedPublishers(watchedPublishers);
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  await setDiscoveryCache(discoveryCache);
  await ensureAlarm();

  return {
    trackedAssetCount: trackedAssets.length,
    watchedPublisherCount: watchedPublishers.length,
    discoveryCount: discoveryCache.newReleaseSales.length,
    newAssetCount: discoveryCache.newAssets.length
  };
}

async function migrateSettings() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  const current = data[SETTINGS_KEY] || {};
  const migrated = current.quietNotificationDefaultsVersion === QUIET_NOTIFICATION_DEFAULTS_VERSION
    ? current
    : {
        ...current,
        quietNotificationDefaultsVersion: QUIET_NOTIFICATION_DEFAULTS_VERSION,
        alerts: {
          ...DEFAULT_SETTINGS.alerts,
          ...(current.alerts || {})
        }
      };
  const normalized = normalizeSettings(migrated);
  if (JSON.stringify(current) !== JSON.stringify(normalized)) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
  }
}

function normalizeSettings(settings = {}) {
  const checkIntervalMinutes = CHECK_INTERVAL_OPTIONS.includes(Number(settings.checkIntervalMinutes))
    ? Number(settings.checkIntervalMinutes)
    : DEFAULT_SETTINGS.checkIntervalMinutes;
  const expiredRetentionDays = normalizeRetentionDays(settings.expiredRetentionDays);
  const reminderThresholdHours = normalizeReminderThresholds(settings.reminderThresholdHours);
  const queueLimit = Number(settings.newAssetQueueLimit);
  const newAssetQueueLimit = NEW_ASSET_LIMIT_OPTIONS.includes(queueLimit) ? queueLimit : DEFAULT_SETTINGS.newAssetQueueLimit;
  const maxAgeDays = Number(settings.newAssetMaxAgeDays);
  const newAssetMaxAgeDays = NEW_ASSET_AGE_OPTIONS_DAYS.includes(maxAgeDays) ? maxAgeDays : DEFAULT_SETTINGS.newAssetMaxAgeDays;

  return {
    ...settings,
    checkIntervalMinutes,
    reminderThresholdHours,
    expiredRetentionDays,
    newAssetQueueLimit,
    newAssetMaxAgeDays,
    quietNotificationDefaultsVersion: Number(settings.quietNotificationDefaultsVersion) || DEFAULT_SETTINGS.quietNotificationDefaultsVersion,
    watchListSort: normalizeSettingsOption(settings.watchListSort, WATCH_LIST_SORT_OPTIONS, DEFAULT_SETTINGS.watchListSort),
    watchStatusFilter: normalizeSettingsOption(settings.watchStatusFilter, WATCH_STATUS_FILTER_OPTIONS, DEFAULT_SETTINGS.watchStatusFilter),
    watchPublisherFilter: normalizeCategoryFilter(settings.watchPublisherFilter),
    watchTagFilter: normalizeCategoryFilter(settings.watchTagFilter),
    watchCategoryFilter: normalizeCategoryFilter(settings.watchCategoryFilter),
    watchPriceStateFilter: normalizeSettingsOption(settings.watchPriceStateFilter, WATCH_PRICE_FILTER_OPTIONS, DEFAULT_SETTINGS.watchPriceStateFilter),
    watchDiscountFilter: normalizeSettingsOption(settings.watchDiscountFilter, DISCOUNT_FILTER_OPTIONS, DEFAULT_SETTINGS.watchDiscountFilter),
    watchDescriptionFilter: normalizeSettingsOption(settings.watchDescriptionFilter, DESCRIPTION_FILTER_OPTIONS, DEFAULT_SETTINGS.watchDescriptionFilter),
    discoverySort: normalizeDiscoverySort(settings.discoverySort),
    discoveryPublisherFilter: normalizeCategoryFilter(settings.discoveryPublisherFilter),
    discoveryCategoryFilter: normalizeCategoryFilter(settings.discoveryCategoryFilter),
    discoveryDiscountFilter: normalizeSettingsOption(settings.discoveryDiscountFilter, DISCOUNT_FILTER_OPTIONS, DEFAULT_SETTINGS.discoveryDiscountFilter),
    discoveryDescriptionFilter: normalizeSettingsOption(settings.discoveryDescriptionFilter, DESCRIPTION_FILTER_OPTIONS, DEFAULT_SETTINGS.discoveryDescriptionFilter),
    showHiddenDiscovery: settings.showHiddenDiscovery === true,
    newAssetsPublisherFilter: normalizeCategoryFilter(settings.newAssetsPublisherFilter),
    newAssetsStateFilter: normalizeNewAssetsStateFilter(settings.newAssetsStateFilter),
    newAssetsCategoryFilter: normalizeCategoryFilter(settings.newAssetsCategoryFilter),
    newAssetsDiscountFilter: normalizeSettingsOption(settings.newAssetsDiscountFilter, DISCOUNT_FILTER_OPTIONS, DEFAULT_SETTINGS.newAssetsDiscountFilter),
    newAssetsDescriptionFilter: normalizeSettingsOption(settings.newAssetsDescriptionFilter, DESCRIPTION_FILTER_OPTIONS, DEFAULT_SETTINGS.newAssetsDescriptionFilter),
    showHiddenNewAssets: settings.showHiddenNewAssets === true,
    collectDescriptions: settings.collectDescriptions === true,
    currency: settings.currency === "USD" ? "USD" : DEFAULT_SETTINGS.currency,
    alerts: {
      ...DEFAULT_SETTINGS.alerts,
      ...(settings.alerts || {}),
      assetEntersSale: settings.alerts?.assetEntersSale ?? DEFAULT_SETTINGS.alerts.assetEntersSale,
      saleEndingReminders: settings.alerts?.saleEndingReminders ?? DEFAULT_SETTINGS.alerts.saleEndingReminders,
      saleEndChanged: settings.alerts?.saleEndChanged ?? DEFAULT_SETTINGS.alerts.saleEndChanged,
      publisherNewSale: settings.alerts?.publisherNewSale ?? DEFAULT_SETTINGS.alerts.publisherNewSale,
      discoveryDigest: settings.alerts?.discoveryDigest === true
    }
  };
}

function normalizeDiscoveryCache(cache = {}) {
  return {
    newReleaseSales: Array.isArray(cache.newReleaseSales) ? cache.newReleaseSales.map(normalizeDiscoveryItem).filter(Boolean) : [],
    newAssets: Array.isArray(cache.newAssets) ? cache.newAssets.map(normalizeDiscoveryItem).filter(Boolean) : [],
    fetchedAt: cache.fetchedAt || null,
    newAssetsFetchedAt: cache.newAssetsFetchedAt || null,
    dismissedProductIds: Array.isArray(cache.dismissedProductIds) ? [...new Set(cache.dismissedProductIds.map(normalizeId).filter(Boolean))] : [],
    dismissedNewAssetProductIds: Array.isArray(cache.dismissedNewAssetProductIds) ? [...new Set(cache.dismissedNewAssetProductIds.map(normalizeId).filter(Boolean))] : [],
    digestReportedProductIds: Array.isArray(cache.digestReportedProductIds) ? [...new Set(cache.digestReportedProductIds.map(normalizeId).filter(Boolean))] : [],
    lastError: cache.lastError || null,
    newAssetsLastError: cache.newAssetsLastError || null
  };
}

function normalizeDiscoveryResult(result) {
  const raw = result.raw || {};
  const sale = pickRelevantSale(parseUnitySale(raw.ec_sale), NEW_RELEASE_SALE_FILTER);
  if (!sale || sale.type !== NEW_RELEASE_SALE_FILTER) {
    return null;
  }

  const status = deriveStatus(sale);
  if (status.value !== "active" && status.value !== "upcoming") {
    return null;
  }

  const productIds = Array.isArray(raw.ec_product_id) ? raw.ec_product_id : [raw.ec_product_id].filter(Boolean);
  const originalPrice = Number(raw.ec_price);
  const currentPrice = Number(raw.ec_price_filter);
  const latestReleaseAt = normalizeDate(raw.date || raw.sysdate);
  return normalizeDiscoveryItem({
    productId: String(productIds[0] || raw.permanentid || ""),
    publisherId: String(raw.publisher_id || ""),
    title: raw.ec_name || result.title || "",
    publisherName: raw.publisher_name || "",
    url: result.clickUri || (productIds[0] ? `https://assetstore.unity.com/packages/package/${productIds[0]}` : ""),
    imageUrl: raw.ec_thumbnails || "",
    category: extractCategory(raw),
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    discountPercent: normalizeDiscount(raw.ec_sale_discount_percentage_filter, sale),
    sale,
    status: status.value,
    statusLabel: status.label,
    firstPublishedAt: null,
    latestReleaseAt
  });
}

function normalizeNewAssetResult(result) {
  const raw = result.raw || {};
  const sale = pickRelevantSale(parseUnitySale(raw.ec_sale));
  const productIds = Array.isArray(raw.ec_product_id) ? raw.ec_product_id : [raw.ec_product_id].filter(Boolean);
  const originalPrice = Number(raw.ec_price);
  const currentPrice = Number(raw.ec_price_filter);
  const hasPriceDrop = Number.isFinite(originalPrice) && Number.isFinite(currentPrice) && currentPrice < originalPrice;
  const status = deriveStatus(sale, { hasPriceDrop });
  return normalizeDiscoveryItem({
    productId: String(productIds[0] || raw.permanentid || ""),
    publisherId: String(raw.publisher_id || ""),
    title: raw.ec_name || result.title || "",
    publisherName: raw.publisher_name || "",
    url: result.clickUri || raw.clickableuri || (productIds[0] ? `https://assetstore.unity.com/packages/package/${productIds[0]}` : ""),
    imageUrl: raw.ec_thumbnails || "",
    category: extractCategory(raw),
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    discountPercent: normalizeDiscount(raw.ec_sale_discount_percentage_filter, sale) ?? normalizePriceDiscount(originalPrice, currentPrice),
    sale,
    status: status.value,
    statusLabel: status.label,
    firstPublishedAt: normalizeDate(raw.first_published_at),
    firstPublishedSourceVersion: FIRST_PUBLISHED_SOURCE_VERSION,
    latestReleaseAt: normalizeDate(raw.last_published_at || raw.date || raw.sysdate)
  });
}

function normalizeDiscoveryItem(item = {}) {
  const productId = normalizeId(item.productId);
  if (!productId) {
    return null;
  }
  return {
    productId,
    publisherId: normalizeId(item.publisherId),
    title: item.title || `Unity asset ${productId}`,
    publisherName: item.publisherName || "",
    url: item.url || `https://assetstore.unity.com/packages/package/${productId}`,
    imageUrl: item.imageUrl || "",
    category: item.category || "",
    originalPrice: Number.isFinite(Number(item.originalPrice)) ? Number(item.originalPrice) : null,
    currentPrice: Number.isFinite(Number(item.currentPrice)) ? Number(item.currentPrice) : null,
    discountPercent: Number.isFinite(Number(item.discountPercent)) ? Number(item.discountPercent) : null,
    sale: item.sale || null,
    status: item.status || "pending",
    statusLabel: item.statusLabel || "",
    description: normalizeDescription(item.description),
    descriptionFetchedAt: normalizeDate(item.descriptionFetchedAt) || null,
    descriptionSource: item.descriptionSource || "",
    firstPublishedAt: normalizeDate(item.firstPublishedAt) || null,
    firstPublishedSourceVersion: Number(item.firstPublishedSourceVersion) === FIRST_PUBLISHED_SOURCE_VERSION ? FIRST_PUBLISHED_SOURCE_VERSION : 0,
    latestReleaseAt: normalizeDate(item.latestReleaseAt || item.publishedAt) || null
  };
}

function normalizePublisherSaleResult(result) {
  const raw = result.raw || {};
  const sale = pickRelevantSale(parseUnitySale(raw.ec_sale));
  const productIds = Array.isArray(raw.ec_product_id) ? raw.ec_product_id : [raw.ec_product_id].filter(Boolean);
  const originalPrice = Number(raw.ec_price);
  const currentPrice = Number(raw.ec_price_filter);
  const hasPriceDrop = Number.isFinite(originalPrice) && Number.isFinite(currentPrice) && currentPrice < originalPrice;
  const status = deriveStatus(sale, { hasPriceDrop });
  if (status.value !== "active" && status.value !== "upcoming") {
    return null;
  }

  return normalizePublisherSaleItem({
    productId: String(productIds[0] || raw.permanentid || ""),
    publisherId: String(raw.publisher_id || ""),
    title: raw.ec_name || result.title || "",
    publisherName: raw.publisher_name || "",
    url: result.clickUri || (productIds[0] ? `https://assetstore.unity.com/packages/package/${productIds[0]}` : ""),
    imageUrl: raw.ec_thumbnails || "",
    category: extractCategory(raw),
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : null,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    discountPercent: normalizeDiscount(raw.ec_sale_discount_percentage_filter, sale) ?? normalizePriceDiscount(originalPrice, currentPrice),
    sale,
    status: status.value,
    statusLabel: status.label,
    saleFilters: Array.isArray(raw.ec_sale_filters) ? raw.ec_sale_filters : [raw.ec_sale_filters].filter(Boolean)
  });
}

function normalizePublisherSaleItem(item = {}) {
  const productId = normalizeId(item.productId);
  if (!productId) {
    return null;
  }

  return {
    productId,
    publisherId: normalizeId(item.publisherId),
    title: item.title || `Unity asset ${productId}`,
    publisherName: item.publisherName || "",
    url: item.url || `https://assetstore.unity.com/packages/package/${productId}`,
    imageUrl: item.imageUrl || "",
    category: item.category || "",
    originalPrice: Number.isFinite(Number(item.originalPrice)) ? Number(item.originalPrice) : null,
    currentPrice: Number.isFinite(Number(item.currentPrice)) ? Number(item.currentPrice) : null,
    discountPercent: Number.isFinite(Number(item.discountPercent)) ? Number(item.discountPercent) : null,
    sale: item.sale || null,
    status: item.status || "active",
    statusLabel: item.statusLabel || "",
    description: normalizeDescription(item.description),
    descriptionFetchedAt: normalizeDate(item.descriptionFetchedAt) || null,
    descriptionSource: item.descriptionSource || "",
    saleFilters: Array.isArray(item.saleFilters) ? item.saleFilters.filter(Boolean) : []
  };
}

function normalizeDiscount(rawDiscount, sale) {
  const direct = Number(rawDiscount);
  if (Number.isFinite(direct)) {
    return direct;
  }
  const saleValue = Number(sale?.discount?.value);
  return Number.isFinite(saleValue) ? saleValue : null;
}

function normalizePriceDiscount(originalPrice, currentPrice) {
  if (Number.isFinite(originalPrice) && Number.isFinite(currentPrice) && originalPrice > 0 && currentPrice < originalPrice) {
    return (originalPrice - currentPrice) / originalPrice;
  }
  return null;
}

function extractProductDescription(html, productId) {
  const text = String(html || "");
  const id = escapeRegExp(normalizeId(productId));
  const productPattern = new RegExp(`"Product"\\s*:\\s*\\{\\s*"${id}"\\s*:\\s*\\{[\\s\\S]*?"description"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`);
  const productMatch = text.match(productPattern);
  if (productMatch) {
    return normalizeDescription(htmlToPlainText(decodeJsonish(productMatch[1])));
  }

  const descriptionMatch = text.match(/"description"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (descriptionMatch) {
    return normalizeDescription(htmlToPlainText(decodeJsonish(descriptionMatch[1])));
  }

  return normalizeDescription(decodeHtmlEntities(extractMetaContent(text, "description") || extractMetaContent(text, "og:description")));
}

function htmlToPlainText(html) {
  return decodeHtmlEntities(String(html || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " "));
}

function decodeHtmlEntities(value) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " "
  };
  return String(value || "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    }
    if (lower.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    }
    return entities[lower] || match;
  });
}

function compareDiscoveryResults(left, right) {
  return compareDates(left.sale?.endsAt, right.sale?.endsAt, true)
    || compareNumbersDesc(left.discountPercent, right.discountPercent)
    || compareFirstPublishedDesc(left, right)
    || String(left.title).localeCompare(String(right.title), undefined, { sensitivity: "base" });
}

function compareNewAssets(left, right) {
  return compareFirstPublishedDesc(left, right)
    || String(left.title).localeCompare(String(right.title), undefined, { sensitivity: "base" });
}

function compareFirstPublishedDesc(left, right) {
  return compareDatesDesc(left.firstPublishedAt, right.firstPublishedAt)
    || compareDatesDesc(left.latestReleaseAt, right.latestReleaseAt);
}

function comparePublisherSaleItems(left, right) {
  return compareDates(getSaleEndForSort(left), getSaleEndForSort(right), true)
    || compareNumbersDesc(left.discountPercent, right.discountPercent)
    || String(left.title).localeCompare(String(right.title), undefined, { sensitivity: "base" });
}

function getSaleEndForSort(item = {}) {
  const endsAt = Date.parse(item.sale?.endsAt || "");
  return Number.isFinite(endsAt) && endsAt >= Date.now() ? item.sale.endsAt : "";
}

function extractFirstPublishedDate(html, productId) {
  const text = String(html || "");
  const id = normalizeId(productId);
  if (id) {
    const productDate = extractFirstPublishedDateForProduct(text, id);
    if (productDate) {
      return productDate;
    }
  }

  const matches = [...text.matchAll(/"firstPublishedDate"\s*:\s*"([^"]+)"/g)];
  return matches.length === 1 ? normalizeDate(matches[0][1]) : null;
}

function extractFirstPublishedDateForProduct(html, productId) {
  const starts = [
    `"Product":{"${productId}":{"id":"${productId}"`,
    `"${productId}":{"id":"${productId}"`,
    `{"id":"${productId}"`
  ];

  for (const needle of starts) {
    const start = html.indexOf(needle);
    if (start < 0) {
      continue;
    }

    const productEnd = html.indexOf('"__typename":"Product"', start);
    const end = productEnd >= 0 ? productEnd : Math.min(html.length, start + 120000);
    const block = html.slice(start, end);
    const match = block.match(/"firstPublishedDate"\s*:\s*"([^"]+)"/);
    if (match) {
      return normalizeDate(match[1]);
    }
  }

  return null;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }));
  return results;
}

function normalizeRetentionDays(value) {
  if (value === "never") {
    return "never";
  }
  const days = Number(value);
  return RETENTION_OPTIONS.includes(days) ? days : DEFAULT_SETTINGS.expiredRetentionDays;
}

function normalizeDiscoverySort(value) {
  return DISCOVERY_SORT_OPTIONS.includes(value) ? value : DEFAULT_SETTINGS.discoverySort;
}

function normalizeNewAssetsStateFilter(value) {
  return NEW_ASSETS_STATE_FILTER_OPTIONS.includes(value) ? value : DEFAULT_SETTINGS.newAssetsStateFilter;
}

function normalizeSettingsOption(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function normalizeCategoryFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "all";
}

function normalizeReminderThresholds(value) {
  const values = (Array.isArray(value) ? value : DEFAULT_SETTINGS.reminderThresholdHours)
    .map(Number)
    .filter((hours) => REMINDER_THRESHOLD_OPTIONS.includes(hours));
  const unique = [...new Set(values)];
  return unique.length ? unique.sort((left, right) => right - left) : DEFAULT_SETTINGS.reminderThresholdHours;
}

function normalizeNewAssetQueueLimit(value) {
  const limit = Number(value);
  return NEW_ASSET_LIMIT_OPTIONS.includes(limit) ? limit : DEFAULT_SETTINGS.newAssetQueueLimit;
}

function normalizeNewAssetMaxAgeDays(value) {
  const days = Number(value);
  return NEW_ASSET_AGE_OPTIONS_DAYS.includes(days) ? days : DEFAULT_SETTINGS.newAssetMaxAgeDays;
}

async function migrateStoredAssets() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const rawAssets = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const { assets, changed } = migrateAssets(rawAssets);
  if (changed) {
    await setTrackedAssets(assets);
  }
}

async function migrateWatchedPublishers() {
  const data = await chrome.storage.local.get(PUBLISHERS_KEY);
  const rawPublishers = Array.isArray(data[PUBLISHERS_KEY]) ? data[PUBLISHERS_KEY] : [];
  const { publishers, changed } = migratePublishers(rawPublishers);
  if (changed) {
    await setWatchedPublishers(publishers);
  }
}

function migrateAssets(assets) {
  const migrated = assets.map(normalizeTrackedAsset);
  return {
    assets: migrated,
    changed: JSON.stringify(assets) !== JSON.stringify(migrated)
  };
}

function migratePublishers(publishers) {
  const migrated = publishers.map(normalizeWatchedPublisher).filter(Boolean);
  return {
    publishers: migrated,
    changed: JSON.stringify(publishers) !== JSON.stringify(migrated)
  };
}

function normalizeTrackedAsset(asset = {}) {
  const saleEnded = asset.sale?.endsAt && Date.parse(asset.sale.endsAt) <= Date.now();
  let status = asset.status || "pending";
  let statusLabel = asset.statusLabel || "";
  let expiredAt = asset.expiredAt || null;

  if (status === "no_sale") {
    if (saleEnded) {
      status = "expired";
      statusLabel = statusLabel || `Sale ended ${new Date(asset.sale.endsAt).toLocaleString()}`;
      expiredAt = expiredAt || asset.sale.endsAt;
    } else {
      status = "watching_no_sale";
      statusLabel = statusLabel === "No active or upcoming sale found" || !statusLabel ? "Watching for the next sale" : statusLabel;
      expiredAt = null;
    }
  }

  return {
    ...asset,
    productId: normalizeId(asset.productId),
    publisherId: normalizeId(asset.publisherId),
    title: asset.title || (asset.productId ? `Unity asset ${asset.productId}` : ""),
    publisherName: asset.publisherName || "",
    url: asset.url || (asset.productId ? `https://assetstore.unity.com/packages/package/${normalizeId(asset.productId)}` : ""),
    imageUrl: asset.imageUrl || "",
    category: asset.category || "",
    notes: typeof asset.notes === "string" ? asset.notes : "",
    tags: normalizeTags(asset.tags),
    description: normalizeDescription(asset.description),
    descriptionFetchedAt: normalizeDate(asset.descriptionFetchedAt) || null,
    descriptionSource: asset.descriptionSource || "",
    watchMode: asset.watchMode || "sale",
    enteredSaleAt: asset.enteredSaleAt || null,
    lastSaleSeenAt: asset.lastSaleSeenAt || null,
    status,
    statusLabel,
    expiredAt,
    notificationState: normalizeNotificationState(asset.notificationState),
    schemaVersion: ASSET_SCHEMA_VERSION
  };
}

function normalizeWatchedPublisher(publisher = {}) {
  const publisherId = normalizeId(publisher.publisherId);
  if (!publisherId) {
    return null;
  }

  return {
    publisherId,
    publisherName: publisher.publisherName || `Publisher ${publisherId}`,
    url: publisher.url || `https://assetstore.unity.com/publishers/${publisherId}`,
    imageUrl: normalizeAssetStoreImageUrl(publisher.imageUrl || ""),
    addedAt: publisher.addedAt || new Date().toISOString(),
    updatedAt: publisher.updatedAt || publisher.addedAt || null,
    lastCheckedAt: publisher.lastCheckedAt || null,
    saleItemCount: Number.isFinite(Number(publisher.saleItemCount)) ? Number(publisher.saleItemCount) : 0,
    lastSaleItems: Array.isArray(publisher.lastSaleItems) ? publisher.lastSaleItems.map(normalizeId).filter(Boolean) : [],
    saleItems: Array.isArray(publisher.saleItems) ? publisher.saleItems.map(normalizePublisherSaleItem).filter(Boolean) : [],
    reportedProductIds: Array.isArray(publisher.reportedProductIds) ? [...new Set(publisher.reportedProductIds.map(normalizeId).filter(Boolean))] : [],
    lastError: publisher.lastError || null,
    notificationState: normalizeNotificationState(publisher.notificationState),
    schemaVersion: PUBLISHER_SCHEMA_VERSION
  };
}

function upsertAsset(assets, asset) {
  const without = assets.filter((item) => item.productId !== asset.productId);
  return [...without, asset].sort(compareAssets);
}

function upsertPublisher(publishers, publisher) {
  const without = publishers.filter((item) => item.publisherId !== publisher.publisherId);
  return [...without, publisher].sort((left, right) => {
    return String(left.publisherName || left.publisherId)
      .localeCompare(String(right.publisherName || right.publisherId), undefined, { sensitivity: "base" });
  });
}

function compareAssets(left, right) {
  const order = { active: 0, upcoming: 1, error: 2, watching_no_sale: 3, no_sale: 3, expired: 4, pending: 5 };
  const statusDiff = (order[left.status] ?? 9) - (order[right.status] ?? 9);
  if (statusDiff !== 0) {
    return statusDiff;
  }
  return String(left.title || left.productId).localeCompare(String(right.title || right.productId));
}

function extractProductId(value) {
  const text = String(value || "");
  const packageMatch = text.match(/\/packages\/package\/(\d+)/i);
  if (packageMatch) {
    return packageMatch[1];
  }

  const slugMatch = text.match(/\/packages\/[^?#]*?(\d+)(?:[/?#]|$)/i);
  if (slugMatch) {
    return slugMatch[1];
  }

  const productUriMatch = text.match(/assetstore:\/\/product\/(\d+)/i);
  return productUriMatch ? productUriMatch[1] : "";
}

function extractPublisherId(value) {
  const match = String(value || "").match(/\/publishers\/(\d+)/i);
  return match ? match[1] : "";
}

function publisherNameFromTitle(value) {
  return String(value || "")
    .replace(/\s*\u00b7\s*Publisher Profile\s*\|\s*Unity Asset Store\s*$/i, "")
    .replace(/\s*\|\s*Unity Asset Store\s*$/i, "")
    .trim();
}

function extractJsonishValue(value, key) {
  const text = String(value || "");
  const escapedPattern = new RegExp(`\\\\"${key}\\\\"\\s*:\\s*\\\\"((?:\\\\\\\\.|[^\\\\"])*)\\\\"`, "i");
  const escapedMatch = text.match(escapedPattern);
  if (escapedMatch) {
    return escapedMatch[1];
  }

  const plainPattern = new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i");
  const plainMatch = text.match(plainPattern);
  return plainMatch ? plainMatch[1] : "";
}

function extractMetaContent(html, name) {
  const pattern = new RegExp(`<meta\\s+(?:name|property)=["']${escapeRegExp(name)}["']\\s+content=["']([^"']+)["']`, "i");
  const reversePattern = new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:name|property)=["']${escapeRegExp(name)}["']`, "i");
  const match = String(html || "").match(pattern) || String(html || "").match(reversePattern);
  return match ? match[1] : "";
}

function decodeJsonish(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  try {
    return JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
  } catch {
    return text
      .replaceAll("\\/", "/")
      .replaceAll("\\u002F", "/")
      .replaceAll("\\u0026", "&")
      .replaceAll('\\"', '"');
  }
}

function normalizeAssetStoreImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (text.startsWith("//")) {
    return `https:${text}`;
  }
  if (text.startsWith("/")) {
    return `https://assetstore.unity.com${text}`;
  }
  return text;
}

function normalizeDescription(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, DESCRIPTION_MAX_LENGTH);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractCategory(raw = {}) {
  const candidates = [raw.ec_category, raw.ec_categories, raw.category_slug].flat().filter(Boolean);
  return candidates.length ? String(candidates[0]) : "";
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function normalizeProductUrl(value) {
  try {
    return new URL(String(value || ""), "https://assetstore.unity.com").href;
  } catch {
    return "";
  }
}

function compareDates(left, right, missingLast = false) {
  const leftTime = Date.parse(left || "");
  const rightTime = Date.parse(right || "");
  const leftValid = Number.isFinite(leftTime);
  const rightValid = Number.isFinite(rightTime);
  if (!leftValid && !rightValid) {
    return 0;
  }
  if (!leftValid) {
    return missingLast ? 1 : -1;
  }
  if (!rightValid) {
    return missingLast ? -1 : 1;
  }
  return leftTime - rightTime;
}

function compareDatesDesc(left, right) {
  const leftTime = Date.parse(left || "");
  const rightTime = Date.parse(right || "");
  const leftValid = Number.isFinite(leftTime);
  const rightValid = Number.isFinite(rightTime);
  if (!leftValid && !rightValid) {
    return 0;
  }
  if (!leftValid) {
    return 1;
  }
  if (!rightValid) {
    return -1;
  }
  return rightTime - leftTime;
}

function compareNumbers(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftValid = Number.isFinite(leftNumber);
  const rightValid = Number.isFinite(rightNumber);
  if (!leftValid && !rightValid) {
    return 0;
  }
  if (!leftValid) {
    return 1;
  }
  if (!rightValid) {
    return -1;
  }
  return leftNumber - rightNumber;
}

function compareNumbersDesc(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftValid = Number.isFinite(leftNumber);
  const rightValid = Number.isFinite(rightNumber);
  if (!leftValid && !rightValid) {
    return 0;
  }
  if (!leftValid) {
    return 1;
  }
  if (!rightValid) {
    return -1;
  }
  return rightNumber - leftNumber;
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((tag) => String(tag).trim()).filter(Boolean))];
  }
  if (typeof value === "string") {
    return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
  }
  return [];
}

function normalizeNotificationState(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getSaleKey(asset = {}) {
  if (asset.sale?.startsAt || asset.sale?.endsAt) {
    return `${asset.sale?.startsAt || "unknown"}_${asset.sale?.endsAt || "unknown"}`;
  }
  if (asset.status === "active" && Number.isFinite(Number(asset.currentPrice))) {
    return `price_drop_${asset.currentPrice}_${asset.originalPrice ?? "unknown"}`;
  }
  return asset.status || "";
}

function isNoSaleLike(asset = {}) {
  const status = asset.status === "no_sale" ? "watching_no_sale" : asset.status;
  return status === "watching_no_sale" || (!asset.sale && status !== "active" && status !== "upcoming");
}

function isSaleLike(asset = {}) {
  return asset.status === "active" || asset.status === "upcoming";
}

function getExpiredTime(asset = {}) {
  if (asset.status === "expired") {
    const explicit = Date.parse(asset.expiredAt || "");
    if (Number.isFinite(explicit)) {
      return explicit;
    }
  }

  const saleEnd = Date.parse(asset.sale?.endsAt || "");
  if (Number.isFinite(saleEnd) && saleEnd <= Date.now() && asset.status !== "watching_no_sale") {
    return saleEnd;
  }
  return NaN;
}

function normalizeId(value) {
  const match = String(value || "").match(/\d+/);
  return match ? match[0] : "";
}
