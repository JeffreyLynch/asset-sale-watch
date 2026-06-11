const STORAGE_KEY = "trackedAssets";
const SETTINGS_KEY = "settings";
const DISCOVERY_KEY = "discoveryCache";
const PUBLISHERS_KEY = "watchedPublishers";
const DISCOVERY_SORT_OPTIONS = ["date_added", "expiring_first", "expiring_last"];
const WATCH_LIST_SORT_OPTIONS = ["attention", "ends_soon", "added_newest", "checked_newest", "title_az", "publisher_az", "price_low", "discount_high", "status"];
const NEW_ASSETS_STATE_FILTER_OPTIONS = ["all", "on_sale", "free", "paid", "no_sale"];
const WATCH_STATUS_FILTER_OPTIONS = ["all", "active", "upcoming", "expired", "watching_no_sale", "error"];
const WATCH_PRICE_FILTER_OPTIONS = ["all", "free", "paid", "discounted", "unknown"];
const DISCOUNT_FILTER_OPTIONS = ["all", "25", "50", "70"];
const DESCRIPTION_FILTER_OPTIONS = ["all", "has_description", "missing_description"];
const FIRST_PUBLISHED_SOURCE_VERSION = 2;
const SHARE_CARD_WIDTH = 1200;
const SHARE_CARD_HEIGHT = 630;

const versionLabel = document.querySelector("#versionLabel");
const affiliateDisclosure = document.querySelector("#affiliateDisclosure");
const viewTabs = [...document.querySelectorAll("[data-view]")];
const watchView = document.querySelector("#watchView");
const discoveryView = document.querySelector("#discoveryView");
const newAssetsView = document.querySelector("#newAssetsView");
const publisherView = document.querySelector("#publisherView");
const radarView = document.querySelector("#radarView");
const assetsRoot = document.querySelector("#assets");
const discoveryRoot = document.querySelector("#discoveryAssets");
const newAssetsRoot = document.querySelector("#newAssets");
const publishersRoot = document.querySelector("#publishers");
const discoverySummary = document.querySelector("#discoverySummary");
const newAssetsSummary = document.querySelector("#newAssetsSummary");
const publisherSummary = document.querySelector("#publisherSummary");
const radarSummary = document.querySelector("#radarSummary");
const radarOutput = document.querySelector("#radarOutput");
const message = document.querySelector("#message");
const search = document.querySelector("#search");
const statusFilter = document.querySelector("#statusFilter");
const publisherFilter = document.querySelector("#publisherFilter");
const tagFilter = document.querySelector("#tagFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const priceStateFilter = document.querySelector("#priceStateFilter");
const discountFilter = document.querySelector("#discountFilter");
const descriptionFilter = document.querySelector("#descriptionFilter");
const sortSelect = document.querySelector("#sortSelect");
const resetWatchFilters = document.querySelector("#resetWatchFilters");
const checkAll = document.querySelector("#checkAll");
const clearExpired = document.querySelector("#clearExpired");
const refreshDiscovery = document.querySelector("#refreshDiscovery");
const refreshPublishers = document.querySelector("#refreshPublishers");
const refreshNewAssets = document.querySelector("#refreshNewAssets");
const watchSelectedDiscovery = document.querySelector("#watchSelectedDiscovery");
const dismissSelectedDiscovery = document.querySelector("#dismissSelectedDiscovery");
const selectAllDiscovery = document.querySelector("#selectAllDiscovery");
const clearDiscoverySelection = document.querySelector("#clearDiscoverySelection");
const resetDiscoveryFilters = document.querySelector("#resetDiscoveryFilters");
const watchSelectedNewAssets = document.querySelector("#watchSelectedNewAssets");
const dismissSelectedNewAssets = document.querySelector("#dismissSelectedNewAssets");
const selectAllNewAssets = document.querySelector("#selectAllNewAssets");
const clearNewAssetsSelection = document.querySelector("#clearNewAssetsSelection");
const resetNewAssetsFilters = document.querySelector("#resetNewAssetsFilters");
const discoverySearch = document.querySelector("#discoverySearch");
const discoveryPublisherFilter = document.querySelector("#discoveryPublisherFilter");
const discoveryCategoryFilter = document.querySelector("#discoveryCategoryFilter");
const discoveryDiscountFilter = document.querySelector("#discoveryDiscountFilter");
const discoveryDescriptionFilter = document.querySelector("#discoveryDescriptionFilter");
const newAssetsSearch = document.querySelector("#newAssetsSearch");
const newAssetsPublisherFilter = document.querySelector("#newAssetsPublisherFilter");
const newAssetsStateFilter = document.querySelector("#newAssetsStateFilter");
const newAssetsCategoryFilter = document.querySelector("#newAssetsCategoryFilter");
const newAssetsDiscountFilter = document.querySelector("#newAssetsDiscountFilter");
const newAssetsDescriptionFilter = document.querySelector("#newAssetsDescriptionFilter");
const discoverySortSelect = document.querySelector("#discoverySortSelect");
const showHiddenDiscovery = document.querySelector("#showHiddenDiscovery");
const showHiddenNewAssets = document.querySelector("#showHiddenNewAssets");
const backToTop = document.querySelector("#backToTop");
const openSettings = document.querySelector("#openSettings");
const closeSettings = document.querySelector("#closeSettings");
const settingsDialog = document.querySelector("#settingsDialog");
const saveSettings = document.querySelector("#saveSettings");
const runDiagnostics = document.querySelector("#runDiagnostics");
const copyDiagnostics = document.querySelector("#copyDiagnostics");
const diagnosticsOutput = document.querySelector("#diagnosticsOutput");
const shareDialog = document.querySelector("#shareDialog");
const closeShareDialog = document.querySelector("#closeShareDialog");
const shareTitle = document.querySelector("#shareTitle");
const shareSubtitle = document.querySelector("#shareSubtitle");
const sharePreview = document.querySelector("#sharePreview");
const shareDisclosure = document.querySelector("#shareDisclosure");
const copyShareTextButton = document.querySelector("#copyShareText");
const copySharePackageButton = document.querySelector("#copySharePackage");
const downloadShareCardButton = document.querySelector("#downloadShareCard");
const generateRadar = document.querySelector("#generateRadar");
const copyRadar = document.querySelector("#copyRadar");
const copyRadarSocial = document.querySelector("#copyRadarSocial");
const exportBackup = document.querySelector("#exportBackup");
const importBackup = document.querySelector("#importBackup");
const backupFileInput = document.querySelector("#backupFileInput");
const checkIntervalSelect = document.querySelector("#checkIntervalSelect");
const retentionSelect = document.querySelector("#retentionSelect");
const currencySelect = document.querySelector("#currencySelect");
const newAssetQueueLimitSelect = document.querySelector("#newAssetQueueLimitSelect");
const newAssetMaxAgeSelect = document.querySelector("#newAssetMaxAgeSelect");
const alertAssetEntersSale = document.querySelector("#alertAssetEntersSale");
const alertSaleEnding = document.querySelector("#alertSaleEnding");
const alertSaleEndChanged = document.querySelector("#alertSaleEndChanged");
const alertPublisherNewSale = document.querySelector("#alertPublisherNewSale");
const alertDiscoveryDigest = document.querySelector("#alertDiscoveryDigest");
const collectDescriptions = document.querySelector("#collectDescriptions");

const selectedDiscoveryIds = new Set();
const selectedNewAssetIds = new Set();
let currentVisibleDiscoveryIds = [];
let currentVisibleNewAssetIds = [];
let lastDiagnosticsText = "";
let activeShareItem = null;

const FALLBACK_SETTINGS = {
  checkIntervalMinutes: 30,
  reminderThresholdHours: [24, 1],
  expiredRetentionDays: 30,
  newAssetQueueLimit: 48,
  newAssetMaxAgeDays: 14,
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
    saleEndingReminders: true,
    saleEndChanged: true,
    publisherNewSale: true,
    discoveryDigest: false
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  versionLabel.textContent = `Version ${chrome.runtime.getManifest().version}`;
  applyAffiliateDisclosure(affiliateDisclosure);
  await loadSettingsPanel();
  await loadViewPreferences();
  await renderAssets();
  await renderDiscovery();
  await renderNewAssets();
  await renderPublishers();
  await renderDealRadar();
  syncBackToTopVisibility();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes[STORAGE_KEY] || changes[SETTINGS_KEY] || changes[DISCOVERY_KEY] || changes[PUBLISHERS_KEY])) {
    if (changes[SETTINGS_KEY]) {
      applyViewPreferences(changes[SETTINGS_KEY].newValue || FALLBACK_SETTINGS);
      applySettingsToControls(changes[SETTINGS_KEY].newValue || FALLBACK_SETTINGS);
    }
    renderAssets();
    renderDiscovery();
    renderNewAssets();
    renderPublishers();
    renderDealRadar();
  }
});

viewTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

search.addEventListener("input", renderAssets);
statusFilter.addEventListener("change", async () => {
  await saveViewPreference({ watchStatusFilter: statusFilter.value });
  await renderAssets();
});
publisherFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(publisherFilter, publisherFilter.value);
  await saveViewPreference({ watchPublisherFilter: publisherFilter.value });
  await renderAssets();
});
tagFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(tagFilter, tagFilter.value);
  await saveViewPreference({ watchTagFilter: tagFilter.value });
  await renderAssets();
});
categoryFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(categoryFilter, categoryFilter.value);
  await saveViewPreference({ watchCategoryFilter: categoryFilter.value });
  await renderAssets();
});
priceStateFilter.addEventListener("change", async () => {
  await saveViewPreference({ watchPriceStateFilter: priceStateFilter.value });
  await renderAssets();
});
discountFilter.addEventListener("change", async () => {
  await saveViewPreference({ watchDiscountFilter: discountFilter.value });
  await renderAssets();
});
descriptionFilter.addEventListener("change", async () => {
  await saveViewPreference({ watchDescriptionFilter: descriptionFilter.value });
  await renderAssets();
});
resetWatchFilters.addEventListener("click", async () => {
  search.value = "";
  setSelectValue(statusFilter, "all");
  setDynamicFilterPreference(publisherFilter, "all");
  setDynamicFilterPreference(tagFilter, "all");
  setDynamicFilterPreference(categoryFilter, "all");
  setSelectValue(priceStateFilter, "all");
  setSelectValue(discountFilter, "all");
  setSelectValue(descriptionFilter, "all");
  await saveViewPreference({
    watchStatusFilter: "all",
    watchPublisherFilter: "all",
    watchTagFilter: "all",
    watchCategoryFilter: "all",
    watchPriceStateFilter: "all",
    watchDiscountFilter: "all",
    watchDescriptionFilter: "all"
  });
  setMessage("Watch-list filters reset.");
  await renderAssets();
});
sortSelect.addEventListener("change", async () => {
  await saveViewPreference({ watchListSort: sortSelect.value });
  await renderAssets();
});

discoverySortSelect.addEventListener("change", async () => {
  await saveViewPreference({ discoverySort: discoverySortSelect.value });
  await renderDiscovery();
});

discoverySearch.addEventListener("input", () => renderDiscovery());
discoveryPublisherFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(discoveryPublisherFilter, discoveryPublisherFilter.value);
  await saveViewPreference({ discoveryPublisherFilter: discoveryPublisherFilter.value });
  await renderDiscovery();
});
discoveryCategoryFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(discoveryCategoryFilter, discoveryCategoryFilter.value);
  await saveViewPreference({ discoveryCategoryFilter: discoveryCategoryFilter.value });
  await renderDiscovery();
});
discoveryDiscountFilter.addEventListener("change", async () => {
  await saveViewPreference({ discoveryDiscountFilter: discoveryDiscountFilter.value });
  await renderDiscovery();
});
discoveryDescriptionFilter.addEventListener("change", async () => {
  await saveViewPreference({ discoveryDescriptionFilter: discoveryDescriptionFilter.value });
  await renderDiscovery();
});
resetDiscoveryFilters.addEventListener("click", async () => {
  discoverySearch.value = "";
  setDynamicFilterPreference(discoveryPublisherFilter, "all");
  setDynamicFilterPreference(discoveryCategoryFilter, "all");
  setSelectValue(discoveryDiscountFilter, "all");
  setSelectValue(discoveryDescriptionFilter, "all");
  showHiddenDiscovery.checked = false;
  await saveViewPreference({
    discoveryPublisherFilter: "all",
    discoveryCategoryFilter: "all",
    discoveryDiscountFilter: "all",
    discoveryDescriptionFilter: "all",
    showHiddenDiscovery: false
  });
  selectedDiscoveryIds.clear();
  setMessage("New Release Sales filters reset.");
  await renderDiscovery();
});
newAssetsSearch.addEventListener("input", () => renderNewAssets());
newAssetsPublisherFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(newAssetsPublisherFilter, newAssetsPublisherFilter.value);
  await saveViewPreference({ newAssetsPublisherFilter: newAssetsPublisherFilter.value });
  await renderNewAssets();
});
newAssetsStateFilter.addEventListener("change", async () => {
  await saveViewPreference({ newAssetsStateFilter: newAssetsStateFilter.value });
  await renderNewAssets();
});
newAssetsCategoryFilter.addEventListener("change", async () => {
  setDynamicFilterPreference(newAssetsCategoryFilter, newAssetsCategoryFilter.value);
  await saveViewPreference({ newAssetsCategoryFilter: newAssetsCategoryFilter.value });
  await renderNewAssets();
});
newAssetsDiscountFilter.addEventListener("change", async () => {
  await saveViewPreference({ newAssetsDiscountFilter: newAssetsDiscountFilter.value });
  await renderNewAssets();
});
newAssetsDescriptionFilter.addEventListener("change", async () => {
  await saveViewPreference({ newAssetsDescriptionFilter: newAssetsDescriptionFilter.value });
  await renderNewAssets();
});
resetNewAssetsFilters.addEventListener("click", async () => {
  newAssetsSearch.value = "";
  setDynamicFilterPreference(newAssetsPublisherFilter, "all");
  setSelectValue(newAssetsStateFilter, "all");
  setDynamicFilterPreference(newAssetsCategoryFilter, "all");
  setSelectValue(newAssetsDiscountFilter, "all");
  setSelectValue(newAssetsDescriptionFilter, "all");
  showHiddenNewAssets.checked = false;
  await saveViewPreference({
    newAssetsPublisherFilter: "all",
    newAssetsStateFilter: "all",
    newAssetsCategoryFilter: "all",
    newAssetsDiscountFilter: "all",
    newAssetsDescriptionFilter: "all",
    showHiddenNewAssets: false
  });
  selectedNewAssetIds.clear();
  setMessage("New Assets filters reset.");
  await renderNewAssets();
});

checkAll.addEventListener("click", async () => {
  setMessage("Checking all assets...");
  const response = await chrome.runtime.sendMessage({ type: "checkAll" });
  setMessage(response?.ok ? "Updated." : response?.error || "Check failed.");
});

clearExpired.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "clearExpired" });
  setMessage(response?.ok ? `Removed ${response.removed || 0} old expired entries.` : response?.error || "Clear failed.");
});

refreshDiscovery.addEventListener("click", async () => {
  setMessage("Refreshing discovery...");
  const response = await chrome.runtime.sendMessage({ type: "refreshDiscovery" });
  const refreshError = response?.error || response?.discovery?.lastError;
  setMessage(response?.ok && !refreshError ? "Discovery updated." : refreshError || "Discovery refresh failed.");
  await renderDiscovery(response?.discovery);
});

showHiddenDiscovery.addEventListener("change", async () => {
  await saveViewPreference({ showHiddenDiscovery: showHiddenDiscovery.checked });
  await renderDiscovery();
});
showHiddenNewAssets.addEventListener("change", async () => {
  await saveViewPreference({ showHiddenNewAssets: showHiddenNewAssets.checked });
  await renderNewAssets();
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", syncBackToTopVisibility, { passive: true });

refreshPublishers.addEventListener("click", async () => {
  setMessage("Checking publishers...");
  const response = await chrome.runtime.sendMessage({ type: "refreshPublishers" });
  setMessage(response?.ok ? "Publishers updated." : response?.error || "Publisher check failed.");
  await renderPublishers(response?.publishers);
});

refreshNewAssets.addEventListener("click", async () => {
  setMessage("Refreshing new assets...");
  const response = await chrome.runtime.sendMessage({ type: "refreshNewAssets" });
  const refreshError = response?.error || response?.discovery?.newAssetsLastError;
  setMessage(response?.ok && !refreshError ? "New assets updated." : refreshError || "New assets refresh failed.");
  await renderNewAssets(response?.discovery);
});

watchSelectedDiscovery.addEventListener("click", async () => {
  await watchSelectedItems("discovery");
});

selectAllDiscovery.addEventListener("click", () => {
  selectAllVisible("discovery");
  renderDiscovery();
});

dismissSelectedDiscovery.addEventListener("click", async () => {
  await dismissSelectedItems("discovery");
});

clearDiscoverySelection.addEventListener("click", () => {
  selectedDiscoveryIds.clear();
  renderDiscovery();
});

watchSelectedNewAssets.addEventListener("click", async () => {
  await watchSelectedItems("newAssets");
});

selectAllNewAssets.addEventListener("click", () => {
  selectAllVisible("newAssets");
  renderNewAssets();
});

dismissSelectedNewAssets.addEventListener("click", async () => {
  await dismissSelectedItems("newAssets");
});

clearNewAssetsSelection.addEventListener("click", () => {
  selectedNewAssetIds.clear();
  renderNewAssets();
});

openSettings.addEventListener("click", () => {
  settingsDialog.showModal();
});

closeSettings.addEventListener("click", () => {
  settingsDialog.close();
});

settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) {
    settingsDialog.close();
  }
});

saveSettings.addEventListener("click", async () => {
  setMessage("Saving settings...");
  const response = await chrome.runtime.sendMessage({
    type: "updateSettings",
    patch: collectSettingsFromControls()
  });
  setMessage(response?.ok ? "Settings saved." : response?.error || "Settings save failed.");
  if (response?.ok) {
    settingsDialog.close();
  }
});

runDiagnostics.addEventListener("click", async () => {
  diagnosticsOutput.hidden = false;
  copyDiagnostics.disabled = true;
  lastDiagnosticsText = "";
  diagnosticsOutput.textContent = "Running diagnostics...";
  try {
    const response = await chrome.runtime.sendMessage({ type: "getDiagnostics" });
    if (!response?.ok) {
      lastDiagnosticsText = response?.error || "Diagnostics failed.";
      diagnosticsOutput.textContent = lastDiagnosticsText;
      copyDiagnostics.disabled = false;
      setMessage(response?.error || "Diagnostics failed.");
      return;
    }
    const diagnostics = response.diagnostics || {};
    const helperState = diagnostics.helperState || {};
    const helpersOk = Object.values(helperState).every((value) => value === "function");
    const status = `Diagnostics ${helpersOk && !diagnostics.settingsError ? "OK" : "warning"}: background ${diagnostics.extensionVersion || "unknown"}, queue helpers ${helpersOk ? "loaded" : "missing"}.`;
    lastDiagnosticsText = `${status}\n\n${JSON.stringify(diagnostics, null, 2)}`;
    diagnosticsOutput.textContent = lastDiagnosticsText;
    copyDiagnostics.disabled = false;
    setMessage(status);
    console.info("Asset Sale Watch diagnostics", diagnostics);
  } catch (error) {
    lastDiagnosticsText = `Diagnostics failed: ${error.message}`;
    diagnosticsOutput.textContent = lastDiagnosticsText;
    copyDiagnostics.disabled = false;
    setMessage(`Diagnostics failed: ${error.message}`);
  }
});

copyDiagnostics.addEventListener("click", async () => {
  const text = lastDiagnosticsText || diagnosticsOutput.textContent || "";
  if (!text.trim()) {
    return;
  }
  await copyText(text);
  setMessage("Diagnostics copied.");
});

closeShareDialog.addEventListener("click", () => {
  shareDialog.close();
});

shareDialog.addEventListener("click", (event) => {
  if (event.target === shareDialog) {
    shareDialog.close();
  }
});

shareDialog.addEventListener("change", (event) => {
  if (event.target.name === "shareFormat") {
    updateSharePreview();
  }
});

copyShareTextButton.addEventListener("click", async () => {
  if (!activeShareItem) {
    return;
  }
  await copyText(getActiveShareText());
  setMessage("Share text copied.");
});

copySharePackageButton.addEventListener("click", async () => {
  if (!activeShareItem) {
    return;
  }
  setMessage("Creating share card...");
  const blob = await createShareCardBlob(activeShareItem);
  const copiedImage = await copySharePackage(getActiveShareText(), blob);
  if (!copiedImage) {
    downloadBlob(blob, shareFileName(activeShareItem));
  }
  setMessage(copiedImage ? "Share card and text copied." : "Share text copied and card downloaded.");
});

downloadShareCardButton.addEventListener("click", async () => {
  if (!activeShareItem) {
    return;
  }
  setMessage("Creating share card...");
  downloadBlob(await createShareCardBlob(activeShareItem), shareFileName(activeShareItem));
  setMessage("Share card downloaded.");
});

generateRadar.addEventListener("click", async () => {
  await renderDealRadar();
  setMessage("Deal Radar generated.");
});

copyRadar.addEventListener("click", async () => {
  if (!radarOutput.value.trim()) {
    await renderDealRadar();
  }
  await copyText(radarOutput.value);
  setMessage("Deal Radar copied.");
});

copyRadarSocial.addEventListener("click", async () => {
  await copyText(await buildDealRadarSocialSummary());
  setMessage("Deal Radar social summary copied.");
});

exportBackup.addEventListener("click", async () => {
  setMessage("Exporting backup...");
  const response = await chrome.runtime.sendMessage({ type: "exportBackup" });
  if (!response?.ok) {
    setMessage(response?.error || "Backup export failed.");
    return;
  }
  downloadBackup(response.backup);
  setMessage("Backup exported.");
});

importBackup.addEventListener("click", () => {
  backupFileInput.click();
});

backupFileInput.addEventListener("change", async () => {
  const file = backupFileInput.files?.[0];
  backupFileInput.value = "";
  if (!file) {
    return;
  }
  const confirmed = window.confirm("Importing a backup will replace the current watch list, settings, discovery cache, and publisher watches. Continue?");
  if (!confirmed) {
    return;
  }

  try {
    setMessage("Importing backup...");
    const backup = JSON.parse(await file.text());
    const response = await chrome.runtime.sendMessage({ type: "importBackup", backup });
    if (!response?.ok) {
      setMessage(response?.error || "Backup import failed.");
      return;
    }
    const summary = response.summary || {};
    setMessage(`Backup imported: ${summary.trackedAssetCount || 0} assets, ${summary.watchedPublisherCount || 0} publishers.`);
    await loadSettingsPanel();
    await loadViewPreferences();
    await renderAssets();
    await renderDiscovery();
    await renderNewAssets();
    await renderPublishers();
  } catch (error) {
    setMessage(`Backup import failed: ${error.message}`);
  }
});

assetsRoot.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const productId = button.dataset.productId;
  if (button.dataset.action === "copyLink") {
    await copyAffiliateLink(button.dataset.url);
    return;
  }
  if (button.dataset.action === "shareDeal") {
    openShareDialog(await getTrackedAssetItem(productId), "watched asset");
    return;
  }
  if (button.dataset.action === "remove") {
    await chrome.runtime.sendMessage({ type: "removeAsset", productId });
  }
  if (button.dataset.action === "check") {
    setMessage("Checking asset...");
    const response = await chrome.runtime.sendMessage({ type: "checkNow", productId });
    setMessage(response?.ok ? "Updated." : response?.error || "Check failed.");
  }
  if (button.dataset.action === "saveMeta") {
    const card = button.closest(".asset-card");
    const notes = card.querySelector(".notes-input")?.value || "";
    const tags = card.querySelector(".tags-input")?.value || "";
    setMessage("Saving notes...");
    const response = await chrome.runtime.sendMessage({
      type: "updateAssetMeta",
      productId,
      patch: { notes, tags }
    });
    setMessage(response?.ok ? "Saved." : response?.error || "Save failed.");
  }
  if (button.dataset.action === "fetchDescription") {
    await fetchDescription(productId, "tracked");
    await renderAssets();
  }
  if (button.dataset.action === "watchPublisher") {
    await watchPublisherFromButton(button);
  }
});

discoveryRoot.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const productId = button.dataset.productId;
  if (button.dataset.action === "copyLink") {
    await copyAffiliateLink(button.dataset.url);
    return;
  }
  if (button.dataset.action === "shareDeal") {
    openShareDialog(await getDiscoveryItem(productId), "new-release sale");
    return;
  }
  if (button.dataset.action === "dismissDiscovery") {
    const response = await chrome.runtime.sendMessage({ type: "dismissDiscovery", productId });
    setMessage(response?.ok ? "Discovery item hidden." : response?.error || "Could not hide discovery item.");
    await renderDiscovery(response?.discovery);
  }
  if (button.dataset.action === "watchDiscovery") {
    const item = await getDiscoveryItem(productId);
    if (!item) {
      setMessage("Discovery item was not found.");
      return;
    }
    setMessage("Adding discovery item to watch list...");
    const response = await chrome.runtime.sendMessage({ type: "trackAsset", payload: item });
    setMessage(response?.ok ? "Added to watch list." : response?.error || "Could not add discovery item.");
    await renderAssets();
    await renderDiscovery();
  }
  if (button.dataset.action === "watchPublisher") {
    await watchPublisherFromButton(button);
  }
  if (button.dataset.action === "fetchDescription") {
    await fetchDescription(productId, "discovery");
    await renderDiscovery();
  }
});

discoveryRoot.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-action='toggleDiscoverySelection']");
  if (!input) {
    return;
  }
  updateSelection(selectedDiscoveryIds, input.dataset.productId, input.checked);
  updateBulkButtons();
});

newAssetsRoot.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const productId = button.dataset.productId;
  if (button.dataset.action === "copyLink") {
    await copyAffiliateLink(button.dataset.url);
    return;
  }
  if (button.dataset.action === "shareDeal") {
    openShareDialog(await getNewAssetItem(productId), "new asset");
    return;
  }
  if (button.dataset.action === "dismissNewAsset") {
    const response = await chrome.runtime.sendMessage({ type: "dismissNewAsset", productId });
    setMessage(response?.ok ? "New asset hidden." : response?.error || "Could not hide new asset.");
    await renderNewAssets(response?.discovery);
  }
  if (button.dataset.action === "watchNewAsset") {
    const item = await getNewAssetItem(productId);
    if (!item) {
      setMessage("New asset was not found.");
      return;
    }
    setMessage("Adding new asset to watch list...");
    const response = await chrome.runtime.sendMessage({ type: "trackAsset", payload: item });
    setMessage(response?.ok ? "Added to watch list." : response?.error || "Could not add new asset.");
    await renderAssets();
    await renderNewAssets();
  }
  if (button.dataset.action === "watchPublisher") {
    await watchPublisherFromButton(button);
  }
  if (button.dataset.action === "fetchDescription") {
    await fetchDescription(productId, "newAssets");
    await renderNewAssets();
  }
});

newAssetsRoot.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-action='toggleNewAssetSelection']");
  if (!input) {
    return;
  }
  updateSelection(selectedNewAssetIds, input.dataset.productId, input.checked);
  updateBulkButtons();
});

publishersRoot.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.action === "copyLink") {
    await copyAffiliateLink(button.dataset.url);
    return;
  }
  if (button.dataset.action === "shareDeal") {
    openShareDialog(await getPublisherSaleItem(button.dataset.publisherId, button.dataset.productId), "publisher sale");
    return;
  }
  if (button.dataset.action === "unwatchPublisher") {
    const response = await chrome.runtime.sendMessage({ type: "unwatchPublisher", publisherId: button.dataset.publisherId });
    setMessage(response?.ok ? "Publisher unwatched." : response?.error || "Could not unwatch publisher.");
    await renderPublishers();
    await renderAssets();
    await renderDiscovery();
  }
  if (button.dataset.action === "clearPublisherReports") {
    const response = await chrome.runtime.sendMessage({ type: "clearPublisherReports", publisherId: button.dataset.publisherId });
    setMessage(response?.ok ? "Publisher report history cleared." : response?.error || "Could not clear publisher reports.");
    await renderPublishers();
  }
  if (button.dataset.action === "watchPublisherSale") {
    const item = await getPublisherSaleItem(button.dataset.publisherId, button.dataset.productId);
    if (!item) {
      setMessage("Publisher sale item was not found.");
      return;
    }
    setMessage("Adding publisher sale item to watch list...");
    const response = await chrome.runtime.sendMessage({ type: "trackAsset", payload: item });
    setMessage(response?.ok ? "Added to watch list." : response?.error || "Could not add sale item.");
    await renderAssets();
    await renderPublishers();
    await renderDiscovery();
  }
  if (button.dataset.action === "fetchPublisherSaleDescription") {
    await fetchDescription(button.dataset.productId, "publisherSale", button.dataset.publisherId);
    await renderPublishers();
  }
});

function setActiveView(view) {
  const nextView = view === "discovery" || view === "newAssets" || view === "publishers" || view === "radar" ? view : "watch";
  watchView.hidden = nextView !== "watch";
  discoveryView.hidden = nextView !== "discovery";
  newAssetsView.hidden = nextView !== "newAssets";
  publisherView.hidden = nextView !== "publishers";
  radarView.hidden = nextView !== "radar";
  for (const button of viewTabs) {
    button.classList.toggle("active", button.dataset.view === nextView);
  }
  if (nextView === "radar") {
    renderDealRadar();
  }
}

async function renderAssets() {
  const [assets, publishers] = await Promise.all([getTrackedAssets(), getWatchedPublishers()]);
  const watchedPublisherIds = new Set(publishers.map((publisher) => publisher.publisherId));
  syncFilterOptions(assets);
  const filtered = sortAssets(filterAssets(assets), sortSelect.value);
  if (!filtered.length) {
    assetsRoot.innerHTML = '<div class="empty">No matching assets.</div>';
    return;
  }
  assetsRoot.innerHTML = filtered.map((asset) => renderAsset(asset, { isPublisherWatched: watchedPublisherIds.has(String(asset.publisherId)) })).join("");
}

async function renderDiscovery(cacheOverride = null) {
  const [assets, discovery, publishers] = await Promise.all([
    getTrackedAssets(),
    cacheOverride ? Promise.resolve(cacheOverride) : getDiscoveryCache(),
    getWatchedPublishers()
  ]);
  const trackedIds = new Set(assets.map((asset) => String(asset.productId)));
  const watchedPublisherIds = new Set(publishers.map((publisher) => publisher.publisherId));
  const dismissedIds = new Set(discovery.dismissedProductIds || []);
  syncDiscoveryFilters(discovery.newReleaseSales || []);
  const showHidden = showHiddenDiscovery.checked;
  const term = discoverySearch.value.trim().toLowerCase();
  const visible = sortDiscoveryItems(discovery.newReleaseSales || [], discoverySortSelect.value)
    .filter((item) => showHidden || (!trackedIds.has(String(item.productId)) && !dismissedIds.has(String(item.productId))))
    .filter((item) => matchesDiscoverySearch(item, term))
    .filter((item) => matchesDiscoveryFilters(item));
  currentVisibleDiscoveryIds = visible.map((item) => String(item.productId));
  syncSelectionToVisible(selectedDiscoveryIds, visible);
  updateBulkButtons();

  discoverySummary.textContent = formatDiscoverySummary(discovery, visible.length);
  if (discovery.lastError) {
    discoveryRoot.innerHTML = `<div class="empty">Discovery refresh failed: ${escapeHtml(discovery.lastError)}</div>`;
    return;
  }
  if (!discovery.fetchedAt) {
    discoveryRoot.innerHTML = '<div class="empty">Refresh discovery to load new-release sale items.</div>';
    return;
  }
  if (!visible.length) {
    discoveryRoot.innerHTML = term
      ? '<div class="empty">No discovery items match that search.</div>'
      : '<div class="empty">No visible discovery items. Toggle Show hidden or refresh discovery.</div>';
    return;
  }

  discoveryRoot.innerHTML = visible.map((item) => renderDiscoveryItem(item, {
    isTracked: trackedIds.has(String(item.productId)),
    isDismissed: dismissedIds.has(String(item.productId)),
    isPublisherWatched: watchedPublisherIds.has(String(item.publisherId)),
    isSelected: selectedDiscoveryIds.has(String(item.productId)),
    selectionAction: "toggleDiscoverySelection"
  })).join("");
}

async function renderNewAssets(cacheOverride = null) {
  const [assets, discovery, publishers] = await Promise.all([
    getTrackedAssets(),
    cacheOverride ? Promise.resolve(cacheOverride) : getDiscoveryCache(),
    getWatchedPublishers()
  ]);
  const trackedIds = new Set(assets.map((asset) => String(asset.productId)));
  const watchedPublisherIds = new Set(publishers.map((publisher) => publisher.publisherId));
  const dismissedIds = new Set(discovery.dismissedNewAssetProductIds || []);
  syncNewAssetFilters(discovery.newAssets || []);
  const showHidden = showHiddenNewAssets.checked;
  const term = newAssetsSearch.value.trim().toLowerCase();
  const state = newAssetsStateFilter.value;
  const publisher = newAssetsPublisherFilter.value;
  const category = newAssetsCategoryFilter.value;
  const visible = sortNewAssetItems(discovery.newAssets || [])
    .filter((item) => showHidden || (!trackedIds.has(String(item.productId)) && !dismissedIds.has(String(item.productId))))
    .filter((item) => matchesDiscoverySearch(item, term))
    .filter((item) => matchesNewAssetState(item, state))
    .filter((item) => publisher === "all" || normalizeFilterValue(item.publisherName) === publisher)
    .filter((item) => category === "all" || normalizeFilterValue(item.category) === category)
    .filter((item) => matchesMinDiscount(item, newAssetsDiscountFilter.value))
    .filter((item) => matchesDescriptionFilter(item, newAssetsDescriptionFilter.value));
  currentVisibleNewAssetIds = visible.map((item) => String(item.productId));
  syncSelectionToVisible(selectedNewAssetIds, visible);
  updateBulkButtons();

  newAssetsSummary.textContent = await formatNewAssetsSummary(discovery, visible.length);
  if (discovery.newAssetsLastError) {
    newAssetsRoot.innerHTML = `<div class="empty">New assets refresh failed: ${escapeHtml(discovery.newAssetsLastError)}</div>`;
    return;
  }
  if (!discovery.newAssetsFetchedAt) {
    newAssetsRoot.innerHTML = '<div class="empty">Refresh new assets to load recently published Asset Store items.</div>';
    return;
  }
  if (!visible.length) {
    newAssetsRoot.innerHTML = term
      ? '<div class="empty">No new assets match that search.</div>'
      : '<div class="empty">No visible new assets. Toggle Show hidden or refresh new assets.</div>';
    return;
  }

  newAssetsRoot.innerHTML = visible.map((item) => renderDiscoveryItem(item, {
    source: "newAssets",
    isTracked: trackedIds.has(String(item.productId)),
    isDismissed: dismissedIds.has(String(item.productId)),
    isPublisherWatched: watchedPublisherIds.has(String(item.publisherId)),
    isSelected: selectedNewAssetIds.has(String(item.productId)),
    selectionAction: "toggleNewAssetSelection"
  })).join("");
}

async function getDiscoveryCache() {
  const response = await chrome.runtime.sendMessage({ type: "getDiscovery" });
  return response?.ok ? response.discovery : {
    newReleaseSales: [],
    newAssets: [],
    dismissedProductIds: [],
    dismissedNewAssetProductIds: [],
    fetchedAt: null,
    newAssetsFetchedAt: null,
    lastError: response?.error || null,
    newAssetsLastError: response?.error || null
  };
}

async function getSettings() {
  const response = await chrome.runtime.sendMessage({ type: "getSettings" });
  return response?.ok ? response.settings : FALLBACK_SETTINGS;
}

async function getDiscoveryItem(productId) {
  const discovery = await getDiscoveryCache();
  return (discovery.newReleaseSales || []).find((item) => String(item.productId) === String(productId));
}

async function getNewAssetItem(productId) {
  const discovery = await getDiscoveryCache();
  return (discovery.newAssets || []).find((item) => String(item.productId) === String(productId));
}

async function fetchDescription(productId, source, publisherId = "") {
  setMessage("Fetching description...");
  const response = await chrome.runtime.sendMessage({ type: "fetchDescription", productId, source, publisherId });
  const description = response?.description?.description || "";
  setMessage(response?.ok ? `Description saved${description ? ` (${description.length} characters).` : "."}` : response?.error || "Description fetch failed.");
  return response;
}

async function copyAffiliateLink(url) {
  await copyText(assetStoreUrl(url));
  setMessage("Affiliate link copied.");
}

function openShareDialog(item, sourceLabel = "deal") {
  if (!item) {
    setMessage("Share item was not found.");
    return;
  }

  activeShareItem = item;
  shareTitle.textContent = "Share Deal";
  shareSubtitle.textContent = `${item.title || `Asset ${item.productId}`} (${sourceLabel})`;
  shareDisclosure.textContent = typeof affiliateDisclosureText === "function" ? affiliateDisclosureText() : "";
  shareDisclosure.hidden = !shareDisclosure.textContent;
  setShareFormat("quick");
  updateSharePreview();
  shareDialog.showModal();
}

async function shareDeal(item, sourceLabel = "deal") {
  if (!item) {
    setMessage("Share item was not found.");
    return;
  }

  setMessage("Creating share card...");
  const shareText = buildShareText(item, "quick");
  const blob = await createShareCardBlob(item);
  const copiedImage = await copySharePackage(shareText, blob);
  if (!copiedImage) {
    downloadBlob(blob, shareFileName(item));
  }
  setMessage(copiedImage
    ? `Share card and ${sourceLabel} text copied.`
    : `Share text copied and ${sourceLabel} card downloaded.`);
}

function updateSharePreview() {
  if (!activeShareItem) {
    sharePreview.value = "";
    return;
  }
  const format = getShareFormat();
  sharePreview.value = buildShareText(activeShareItem, format);
  copySharePackageButton.hidden = format !== "quick";
  downloadShareCardButton.hidden = format === "clean";
  copyShareTextButton.textContent = format === "clean" ? "Copy Link" : "Copy Text";
}

function getActiveShareText() {
  return activeShareItem ? sharePreview.value : "";
}

function getShareFormat() {
  return document.querySelector("input[name='shareFormat']:checked")?.value || "quick";
}

function setShareFormat(format) {
  const input = document.querySelector(`input[name='shareFormat'][value='${format}']`);
  if (input) {
    input.checked = true;
  }
}

async function copySharePackage(text, imageBlob) {
  if (window.ClipboardItem && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "image/png": imageBlob
        })
      ]);
      return true;
    } catch {
      // Fall through to text-only clipboard plus PNG download.
    }
  }
  await copyText(text);
  return false;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function buildShareText(item, format = "quick") {
  if (format === "clean") {
    return getShareUrl(item, { affiliate: false });
  }
  if (format === "markdown") {
    return buildMarkdownShareText(item);
  }
  if (format === "social") {
    return buildSocialShareText(item);
  }
  if (format === "reddit") {
    return buildRedditShareText(item);
  }

  const lines = [];
  const title = item.title || `Unity asset ${item.productId}`;
  const publisher = item.publisherName ? ` by ${item.publisherName}` : "";
  const discount = formatDiscount(item);
  const price = formatPrice(item);
  const deadline = getShareDeadline(item);
  lines.push(`${title}${publisher}`);
  lines.push([discount, price].filter(Boolean).join(" - "));
  if (deadline) {
    lines.push(deadline);
  }
  if (item.category) {
    lines.push(`Category: ${item.category}`);
  }
  lines.push("");
  lines.push(getShareUrl(item));
  const disclosure = getShareDisclosure();
  if (disclosure) {
    lines.push("");
    lines.push(disclosure);
  }
  lines.push("Shared from Asset Sale Watch.");
  return lines.filter((line, index, all) => line || all[index - 1]).join("\n");
}

function buildSocialShareText(item) {
  const title = item.title || `Unity asset ${item.productId}`;
  const publisher = item.publisherName ? ` by ${item.publisherName}` : "";
  const discount = formatDiscount(item);
  const price = formatPrice(item);
  const deadline = getShareDeadline(item);
  const lines = [
    `${discount ? `${discount} ` : ""}${title}${publisher}`,
    price,
    deadline,
    "",
    getShareUrl(item, { af: true }),
    "",
    "Shared with Asset Sale Watch",
    getShareDisclosure()
  ];
  return lines.filter((line, index, all) => line || all[index - 1]).join("\n");
}

function buildRedditShareText(item) {
  const title = item.title || `Unity asset ${item.productId}`;
  const discount = formatDiscount(item);
  const price = formatPrice(item);
  const deadline = getShareDeadline(item);
  const lines = [
    `${title}${item.publisherName ? ` by ${item.publisherName}` : ""}`,
    [discount, price].filter(Boolean).join(" - "),
    deadline,
    item.category ? `Category: ${item.category}` : "",
    "",
    getShareUrl(item, { affiliate: false }),
    "",
    "Non-affiliate link above for community sharing. Shared from Asset Sale Watch."
  ];
  return lines.filter((line, index, all) => line || all[index - 1]).join("\n");
}

function buildMarkdownShareText(item) {
  const title = item.title || `Unity asset ${item.productId}`;
  const discount = formatDiscount(item);
  const price = formatPrice(item);
  const deadline = getShareDeadline(item);
  const disclosure = getShareDisclosure();
  const bullets = [
    item.publisherName ? `Publisher: ${item.publisherName}` : "",
    [discount, price].filter(Boolean).join(" - "),
    deadline,
    item.category ? `Category: ${item.category}` : ""
  ].filter(Boolean);
  return [
    `### [${escapeMarkdown(title)}](${getShareUrl(item)})`,
    "",
    ...bullets.map((line) => `- ${line}`),
    disclosure ? "" : null,
    disclosure || null,
    "",
    "Shared from Asset Sale Watch."
  ].filter((line) => line !== null).join("\n");
}

function getShareUrl(item, options = {}) {
  const url = item.url || "";
  if (options.af === true && typeof buildAfLink === "function") {
    return buildAfLink(url);
  }
  return options.affiliate === false || typeof assetStoreUrl !== "function"
    ? cleanAssetStoreUrl(url)
    : assetStoreUrl(url);
}

function getShareDisclosure() {
  return typeof affiliateDisclosureText === "function" ? affiliateDisclosureText() : "";
}

function getShareDeadline(item) {
  const status = getEffectiveStatus(item);
  if (status.value === "active" && item.sale?.endsAt) {
    const diffMs = Date.parse(item.sale.endsAt) - Date.now();
    return `Sale ends ${formatDate(item.sale.endsAt)} (${formatDuration(diffMs)} left).`;
  }
  if (status.value === "upcoming" && item.sale?.startsAt) {
    return `Sale starts ${formatDate(item.sale.startsAt)}.`;
  }
  if (status.value === "expired" && item.sale?.endsAt) {
    return `Sale ended ${formatDate(item.sale.endsAt)}.`;
  }
  if (item.firstPublishedAt) {
    return `First published ${formatDate(item.firstPublishedAt)}.`;
  }
  return status.label || "";
}

async function createShareCardBlob(item) {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  const thumbnail = await loadShareThumbnail(item.imageUrl);
  drawShareCard(ctx, item, thumbnail);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not generate share card."));
      }
    }, "image/png");
  });
}

function drawShareCard(ctx, item, thumbnail = null) {
  const width = SHARE_CARD_WIDTH;
  const height = SHARE_CARD_HEIGHT;
  const title = item.title || `Unity asset ${item.productId}`;
  const publisher = item.publisherName || "Unity Asset Store";
  const category = item.category || "asset";
  const discount = formatDiscount(item) || "Deal";
  const price = formatPrice(item);
  const deadline = getShareDeadline(item);
  const disclosure = typeof affiliateDisclosureText === "function" ? affiliateDisclosureText() : "";

  ctx.fillStyle = "#101318";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#18202b";
  roundRect(ctx, 48, 48, width - 96, height - 96, 26);
  ctx.fill();

  drawShareCardVisual(ctx, thumbnail, discount);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 50px system-ui, -apple-system, Segoe UI, sans-serif";
  const titleBottom = drawWrappedText(ctx, title, 340, 112, 760, 60, 3);

  ctx.fillStyle = "#b8c4d8";
  ctx.font = "700 26px system-ui, -apple-system, Segoe UI, sans-serif";
  drawWrappedText(ctx, publisher, 340, Math.min(titleBottom + 18, 300), 760, 34, 1);

  ctx.fillStyle = "#ff8a80";
  ctx.font = "900 48px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(price, 82, 382);

  ctx.fillStyle = "#dbeafe";
  ctx.font = "800 28px system-ui, -apple-system, Segoe UI, sans-serif";
  drawWrappedText(ctx, deadline || "Track this asset with Asset Sale Watch.", 82, 430, 1020, 38, 2);

  ctx.fillStyle = "#2f3b4d";
  roundRect(ctx, 82, 516, 1020, 56, 16);
  ctx.fill();
  ctx.fillStyle = "#f2f4f7";
  ctx.font = "800 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`Category: ${category}`, 108, 552);

  ctx.textAlign = "right";
  ctx.fillStyle = "#9aa7ba";
  ctx.font = "700 18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(disclosure || "Shared from Asset Sale Watch", 1080, 552);
}

function drawShareCardVisual(ctx, thumbnail, discount) {
  ctx.save();
  roundRect(ctx, 80, 82, 220, 220, 24);
  ctx.clip();
  if (thumbnail) {
    drawCoverImage(ctx, thumbnail, 80, 82, 220, 220);
    ctx.restore();
    ctx.fillStyle = "#b42318";
    roundRect(ctx, 94, 244, 112, 38, 10);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 20px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(discount, 150, 269);
    return;
  }

  ctx.fillStyle = "#223047";
  ctx.fillRect(80, 82, 220, 220);
  ctx.restore();
  ctx.fillStyle = "#4c8dff";
  ctx.font = "900 46px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(discount, 190, 185);
  ctx.font = "800 24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#dbeafe";
  ctx.fillText("Unity Sale", 190, 230);
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function loadShareThumbnail(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = imageUrl;
  });
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
    if (lines.length === maxLines) {
      break;
    }
  }
  if (line && lines.length < maxLines) {
    lines.push(line);
  }
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S+$/, "")}...`;
  }
  lines.forEach((currentLine, index) => ctx.fillText(currentLine, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function shareFileName(item) {
  const slug = String(item.title || item.productId || "unity-sale")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "unity-sale";
  return `${slug}-unity-sale-watch.png`;
}

async function watchSelectedItems(source) {
  const selectedIds = getSelectedIds(source);
  if (!selectedIds.length) {
    return;
  }
  const confirmed = window.confirm(`Watch ${selectedIds.length} selected ${formatBulkSourceName(source)}?`);
  if (!confirmed) {
    return;
  }

  const items = await getSelectedDiscoveryItems(source, selectedIds);
  let added = 0;
  let failed = 0;
  setMessage(`Adding ${items.length} selected items...`);
  for (const item of items) {
    const response = await chrome.runtime.sendMessage({ type: "trackAsset", payload: item });
    if (response?.ok) {
      added += 1;
    } else {
      failed += 1;
    }
  }

  getSelectionSet(source).clear();
  setMessage(`${added} item${added === 1 ? "" : "s"} added${failed ? `, ${failed} failed` : ""}.`);
  await renderAssets();
  await renderDiscovery();
  await renderNewAssets();
}

async function dismissSelectedItems(source) {
  const selectedIds = getSelectedIds(source);
  if (!selectedIds.length) {
    return;
  }
  const confirmed = window.confirm(`Dismiss ${selectedIds.length} selected ${formatBulkSourceName(source)}?`);
  if (!confirmed) {
    return;
  }

  let hidden = 0;
  let failed = 0;
  const messageType = source === "discovery" ? "dismissDiscovery" : "dismissNewAsset";
  setMessage(`Dismissing ${selectedIds.length} selected items...`);
  for (const productId of selectedIds) {
    const response = await chrome.runtime.sendMessage({ type: messageType, productId });
    if (response?.ok) {
      hidden += 1;
    } else {
      failed += 1;
    }
  }

  getSelectionSet(source).clear();
  setMessage(`${hidden} item${hidden === 1 ? "" : "s"} dismissed${failed ? `, ${failed} failed` : ""}.`);
  if (source === "discovery") {
    await renderDiscovery();
  } else {
    await renderNewAssets();
  }
}

async function getSelectedDiscoveryItems(source, selectedIds) {
  const discovery = await getDiscoveryCache();
  const items = source === "discovery" ? discovery.newReleaseSales || [] : discovery.newAssets || [];
  const byId = new Map(items.map((item) => [String(item.productId), item]));
  return selectedIds.map((productId) => byId.get(String(productId))).filter(Boolean);
}

function getSelectedIds(source) {
  return [...getSelectionSet(source)];
}

function getSelectionSet(source) {
  return source === "discovery" ? selectedDiscoveryIds : selectedNewAssetIds;
}

function selectAllVisible(source) {
  const selection = getSelectionSet(source);
  const visibleIds = source === "discovery" ? currentVisibleDiscoveryIds : currentVisibleNewAssetIds;
  for (const productId of visibleIds) {
    selection.add(productId);
  }
  updateBulkButtons();
}

function formatBulkSourceName(source) {
  return source === "discovery" ? "new-release sale items" : "new assets";
}

function updateSelection(selection, productId, isSelected) {
  const id = String(productId || "");
  if (!id) {
    return;
  }
  if (isSelected) {
    selection.add(id);
  } else {
    selection.delete(id);
  }
}

function syncSelectionToVisible(selection, visibleItems) {
  const visibleIds = new Set(visibleItems.map((item) => String(item.productId)));
  for (const productId of [...selection]) {
    if (!visibleIds.has(productId)) {
      selection.delete(productId);
    }
  }
}

function updateBulkButtons() {
  const discoveryCount = selectedDiscoveryIds.size;
  watchSelectedDiscovery.textContent = `Watch Selected${discoveryCount ? ` (${discoveryCount})` : ""}`;
  dismissSelectedDiscovery.textContent = `Dismiss Selected${discoveryCount ? ` (${discoveryCount})` : ""}`;
  selectAllDiscovery.disabled = currentVisibleDiscoveryIds.length === 0;
  watchSelectedDiscovery.disabled = discoveryCount === 0;
  dismissSelectedDiscovery.disabled = discoveryCount === 0;
  clearDiscoverySelection.disabled = discoveryCount === 0;

  const newAssetCount = selectedNewAssetIds.size;
  watchSelectedNewAssets.textContent = `Watch Selected${newAssetCount ? ` (${newAssetCount})` : ""}`;
  dismissSelectedNewAssets.textContent = `Dismiss Selected${newAssetCount ? ` (${newAssetCount})` : ""}`;
  selectAllNewAssets.disabled = currentVisibleNewAssetIds.length === 0;
  watchSelectedNewAssets.disabled = newAssetCount === 0;
  dismissSelectedNewAssets.disabled = newAssetCount === 0;
  clearNewAssetsSelection.disabled = newAssetCount === 0;
}

async function getWatchedPublishers() {
  const response = await chrome.runtime.sendMessage({ type: "getPublishers" });
  return response?.ok && Array.isArray(response.publishers) ? response.publishers : [];
}

async function watchPublisherFromButton(button) {
  const publisherId = button.dataset.publisherId || "";
  if (!publisherId) {
    setMessage("Publisher id was not found.");
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: "watchPublisher",
    payload: {
      publisherId,
      publisherName: button.dataset.publisherName || "",
      url: `https://assetstore.unity.com/publishers/${publisherId}`
    }
  });
  setMessage(response?.ok ? "Publisher watched." : response?.error || "Could not watch publisher.");
  await renderPublishers();
  await renderAssets();
  await renderDiscovery();
}

async function renderPublishers(publishersOverride = null) {
  const [publishers, assets, discovery] = await Promise.all([
    publishersOverride ? Promise.resolve(publishersOverride) : getWatchedPublishers(),
    getTrackedAssets(),
    getDiscoveryCache()
  ]);
  const sorted = [...publishers].sort((left, right) => compareText(left.publisherName, right.publisherName));
  publisherSummary.textContent = `${sorted.length} watched publisher${sorted.length === 1 ? "" : "s"}.`;
  if (!sorted.length) {
    publishersRoot.innerHTML = '<div class="empty">No watched publishers yet. Use Watch Publisher on asset or discovery rows, or the popup on a publisher page.</div>';
    return;
  }

  publishersRoot.innerHTML = sorted.map((publisher) => renderPublisher(publisher, publisherStats(publisher, assets, discovery))).join("");
}

function publisherStats(publisher, assets, discovery) {
  const publisherId = String(publisher.publisherId);
  const discoveryItems = discovery.newReleaseSales || [];
  return {
    watchedAssetCount: assets.filter((asset) => String(asset.publisherId) === publisherId).length,
    discoverySaleCount: discoveryItems.filter((item) => String(item.publisherId) === publisherId).length,
    watchedProductIds: new Set(assets.map((asset) => String(asset.productId)))
  };
}

async function renderDealRadar() {
  const radar = await buildDealRadar();
  radarOutput.value = radar.markdown;
  radarSummary.textContent = `${radar.itemCount} highlighted item${radar.itemCount === 1 ? "" : "s"} from cached extension data. Generated ${formatDate(new Date().toISOString())}.`;
}

async function buildDealRadar() {
  const [assets, discovery, publishers] = await Promise.all([
    getTrackedAssets(),
    getDiscoveryCache(),
    getWatchedPublishers()
  ]);
  const activeWatched = assets.filter((item) => getEffectiveStatus(item).value === "active");
  const urgentWatched = activeWatched.filter(isUrgentSale).sort(compareActiveSaleEnd).slice(0, 5);
  const newReleaseSales = (discovery.newReleaseSales || [])
    .filter((item) => getEffectiveStatus(item).value === "active")
    .sort((left, right) => compareNumberDesc(discountPercent(left), discountPercent(right)) || compareActiveSaleEnd(left, right))
    .slice(0, 8);
  const newAssetSales = (discovery.newAssets || [])
    .filter((item) => getEffectiveStatus(item).value === "active" || isDiscountedPrice(item))
    .sort((left, right) => compareDiscoveryFirstPublishedDesc(left, right) || compareNumberDesc(discountPercent(left), discountPercent(right)))
    .slice(0, 6);
  const publisherItems = publishers
    .flatMap((publisher) => (publisher.saleItems || []).map((item) => ({ ...item, publisherName: item.publisherName || publisher.publisherName })))
    .filter((item) => getEffectiveStatus(item).value === "active")
    .sort(compareActiveSaleEnd)
    .slice(0, 6);

  const sections = [
    renderRadarSection("Ending Soon From Watch List", urgentWatched, "No watched sales are ending within 24 hours."),
    renderRadarSection("Top New Release Sales", newReleaseSales, "No cached New Release Sales yet. Refresh discovery first."),
    renderRadarSection("New Assets On Sale", newAssetSales, "No cached new assets on sale yet."),
    renderRadarSection("Watched Publisher Deals", publisherItems, "No watched publisher sale items cached yet.")
  ];
  const itemCount = urgentWatched.length + newReleaseSales.length + newAssetSales.length + publisherItems.length;
  const markdown = [
    `# Unity Deal Radar - ${new Date().toLocaleDateString()}`,
    "",
    "Generated from local Asset Sale Watch cache. Review before posting.",
    "",
    ...sections,
    "",
    getShareDisclosure() || null,
    "Shared from Asset Sale Watch."
  ].filter((line) => line !== null).join("\n");
  return { markdown, itemCount };
}

function renderRadarSection(title, items, emptyText) {
  if (!items.length) {
    return [`## ${title}`, "", emptyText, ""].join("\n");
  }
  return [
    `## ${title}`,
    "",
    ...items.map((item, index) => `${index + 1}. ${formatRadarItem(item)}`),
    ""
  ].join("\n");
}

function formatRadarItem(item) {
  const title = item.title || `Asset ${item.productId}`;
  const publisher = item.publisherName ? ` by ${item.publisherName}` : "";
  const discount = formatDiscount(item);
  const price = formatPrice(item);
  const deadline = getShareDeadline(item);
  const details = [discount, price, deadline].filter(Boolean).join(" | ");
  return `[${title}](${getShareUrl(item)})${publisher}${details ? ` - ${details}` : ""}`;
}

async function buildDealRadarSocialSummary() {
  const radar = await buildDealRadar();
  const lines = radar.markdown
    .split("\n")
    .filter((line) => /^\d+\. /.test(line))
    .slice(0, 5)
    .map((line) => line.replace(/^\d+\. /, "- ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"));
  return [
    "Unity Deal Radar",
    `${radar.itemCount} highlighted Asset Store deal${radar.itemCount === 1 ? "" : "s"} from my local watch/discovery cache.`,
    "",
    ...lines,
    "",
    "Generated with Asset Sale Watch."
  ].join("\n");
}

function isDiscountedPrice(item) {
  const current = Number(item.currentPrice);
  const original = Number(item.originalPrice);
  return Number.isFinite(current) && Number.isFinite(original) && original > current;
}

async function getPublisherSaleItem(publisherId, productId) {
  const publishers = await getWatchedPublishers();
  const publisher = publishers.find((item) => String(item.publisherId) === String(publisherId));
  return (publisher?.saleItems || []).find((item) => String(item.productId) === String(productId));
}

function matchesDiscoverySearch(item, term) {
  if (!term) {
    return true;
  }
  const haystack = [
    item.title,
    item.publisherName,
    item.productId,
    item.category,
    item.description,
    ...(Array.isArray(item.saleFilters) ? item.saleFilters : [])
  ].join(" ").toLowerCase();
  return haystack.includes(term);
}

function matchesNewAssetState(item, state) {
  if (state === "all") {
    return true;
  }
  const status = getEffectiveStatus(item).value;
  const current = Number(item.currentPrice);
  const original = Number(item.originalPrice);
  const hasCurrent = Number.isFinite(current);
  const hasOriginal = Number.isFinite(original);
  const hasDiscountedPrice = hasCurrent && hasOriginal && original > current;

  if (state === "on_sale") {
    return status === "active" || status === "upcoming" || hasDiscountedPrice;
  }
  if (state === "free") {
    return hasCurrent && current === 0;
  }
  if (state === "paid") {
    return hasCurrent && current > 0;
  }
  if (state === "no_sale") {
    return status === "watching_no_sale" || status === "no_sale";
  }
  return true;
}

function matchesDiscoveryFilters(item) {
  const publisher = discoveryPublisherFilter.value;
  const category = discoveryCategoryFilter.value;
  return (publisher === "all" || normalizeFilterValue(item.publisherName) === publisher)
    && (category === "all" || normalizeFilterValue(item.category) === category)
    && matchesMinDiscount(item, discoveryDiscountFilter.value)
    && matchesDescriptionFilter(item, discoveryDescriptionFilter.value);
}

function matchesMinDiscount(item, value) {
  if (value === "all") {
    return true;
  }
  const minimum = Number(value) / 100;
  const discount = discountPercent(item);
  return Number.isFinite(discount) && discount >= minimum;
}

function matchesDescriptionFilter(item, value) {
  if (value === "has_description") {
    return Boolean(item.description);
  }
  if (value === "missing_description") {
    return !item.description;
  }
  return true;
}

function filterAssets(assets) {
  const term = search.value.trim().toLowerCase();
  const status = statusFilter.value;
  const publisher = publisherFilter.value;
  const tag = tagFilter.value;
  const category = categoryFilter.value;
  const priceState = priceStateFilter.value;
  const discount = discountFilter.value;
  const description = descriptionFilter.value;

  return assets.filter((asset) => {
    const matchesStatus = status === "all" || getEffectiveStatus(asset).value === status;
    const tags = getAssetTags(asset);
    const matchesPublisher = publisher === "all" || normalizeFilterValue(asset.publisherName) === publisher;
    const matchesTag = tag === "all" || tags.some((assetTag) => normalizeFilterValue(assetTag) === tag);
    const matchesCategory = category === "all" || normalizeFilterValue(asset.category) === category;
    const matchesPriceState = matchesPriceFilter(asset, priceState);
    const matchesDiscount = matchesMinDiscount(asset, discount);
    const matchesDescription = matchesDescriptionFilter(asset, description);
    const haystack = `${asset.title || ""} ${asset.publisherName || ""} ${asset.productId} ${asset.category || ""} ${asset.notes || ""} ${asset.description || ""} ${tags.join(" ")}`.toLowerCase();
    return matchesStatus && matchesPublisher && matchesTag && matchesCategory && matchesPriceState && matchesDiscount && matchesDescription && (!term || haystack.includes(term));
  });
}

function matchesPriceFilter(asset, value) {
  if (value === "all") {
    return true;
  }
  const current = Number(asset.currentPrice);
  const original = Number(asset.originalPrice);
  const hasCurrent = Number.isFinite(current);
  const hasOriginal = Number.isFinite(original);
  if (value === "free") {
    return hasCurrent && current === 0;
  }
  if (value === "paid") {
    return hasCurrent && current > 0;
  }
  if (value === "discounted") {
    return hasCurrent && hasOriginal && original > current;
  }
  if (value === "unknown") {
    return !hasCurrent;
  }
  return true;
}

function renderAsset(asset, state = {}) {
  const saleWindow = asset.sale
    ? `${formatDate(asset.sale.startsAt)} to ${formatDate(asset.sale.endsAt)}`
    : "No sale window";
  const checked = asset.lastCheckedAt ? `Checked ${formatDate(asset.lastCheckedAt)}` : "Not checked yet";
  const status = getEffectiveStatus(asset);
  const deadline = getDeadlineInfo(asset);

  return `
    <article class="asset-card">
      ${asset.imageUrl ? `<img src="${escapeHtml(asset.imageUrl)}" alt="">` : '<div class="image-placeholder"></div>'}
      <div class="asset-body">
        <div class="row">
          <div>
            <h2><a href="${escapeHtml(assetStoreUrl(asset.url))}" target="_blank" rel="noreferrer">${escapeHtml(asset.title || `Asset ${asset.productId}`)}</a></h2>
            <p>${renderPublisherLink(asset.publisherId, asset.publisherName)}</p>
          </div>
          <span class="status ${escapeHtml(status.value)}">${escapeHtml(formatStatusName(status.value))}</span>
        </div>
        <div class="deadline ${escapeHtml(deadline.tone)}">
          <strong>${escapeHtml(deadline.heading)}</strong>
          <span>${escapeHtml(deadline.primary)}</span>
          <em>${escapeHtml(deadline.secondary)}</em>
        </div>
        <div class="meta-grid">
          <div><strong>Price</strong>${renderPrice(asset)}</div>
          <p><strong>Status</strong>${escapeHtml(status.label)}</p>
          <p><strong>Category</strong>${escapeHtml(asset.category || "Uncategorized")}</p>
          <p><strong>Sale window</strong>${escapeHtml(saleWindow)}</p>
          <p><strong>Last check</strong>${escapeHtml(checked)}</p>
        </div>
        ${renderDescriptionPreview(asset)}
        <section class="triage-panel">
          <label>
            <span>Notes</span>
            <textarea class="notes-input" rows="3" spellcheck="true">${escapeHtml(asset.notes || "")}</textarea>
          </label>
          <label>
            <span>Tags</span>
            <input class="tags-input" type="text" value="${escapeHtml(getAssetTags(asset).join(", "))}" placeholder="wishlist, tools, art">
          </label>
          ${renderTags(getAssetTags(asset))}
        </section>
        ${asset.lastError ? `<p class="error">${escapeHtml(asset.lastError)}</p>` : ""}
        <div class="actions">
          <div class="primary-actions">
            <button data-action="saveMeta" data-product-id="${escapeHtml(asset.productId)}">Save Notes</button>
            <button data-action="check" data-product-id="${escapeHtml(asset.productId)}">Check</button>
            <button data-action="fetchDescription" data-product-id="${escapeHtml(asset.productId)}">${asset.description ? "Refresh Description" : "Fetch Description"}</button>
            <button data-action="watchPublisher" data-publisher-id="${escapeHtml(asset.publisherId)}" data-publisher-name="${escapeHtml(asset.publisherName)}" ${state.isPublisherWatched || !asset.publisherId ? "disabled" : ""}>${state.isPublisherWatched ? "Publisher Watched" : "Watch Publisher"}</button>
            <button data-action="remove" data-product-id="${escapeHtml(asset.productId)}">Remove</button>
          </div>
          <div class="secondary-actions">
            <button class="share-action" data-action="shareDeal" data-product-id="${escapeHtml(asset.productId)}">Share Deal</button>
            <button data-action="copyLink" data-url="${escapeHtml(asset.url)}">Copy Link</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderDiscoveryItem(item, state = {}) {
  const isNewAsset = state.source === "newAssets";
  const deadline = isNewAsset ? getPublishedInfo(item) : getDeadlineInfo(item);
  const saleWindow = item.sale
    ? `${formatDate(item.sale.startsAt)} to ${formatDate(item.sale.endsAt)}`
    : "No sale window";
  const firstPublished = item.firstPublishedAt ? formatDate(item.firstPublishedAt) : "Unknown";
  const latestRelease = item.latestReleaseAt ? formatDate(item.latestReleaseAt) : "Unknown";
  const hiddenNote = state.isTracked ? "Already watched" : state.isDismissed ? "Hidden" : "";
  const statusLabel = hiddenNote || (isNewAsset && item.status === "watching_no_sale" ? "New" : formatStatusName(item.status));
  const watchAction = isNewAsset ? "watchNewAsset" : "watchDiscovery";
  const dismissAction = isNewAsset ? "dismissNewAsset" : "dismissDiscovery";

  return `
    <article class="asset-card discovery-card">
      ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="">` : '<div class="image-placeholder"></div>'}
      <div class="asset-body">
        <div class="row">
          <div>
            <h2><a href="${escapeHtml(assetStoreUrl(item.url))}" target="_blank" rel="noreferrer">${escapeHtml(item.title || `Asset ${item.productId}`)}</a></h2>
            <p>${renderPublisherLink(item.publisherId, item.publisherName)}</p>
          </div>
          <span class="status ${escapeHtml(item.status)}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="deadline ${escapeHtml(deadline.tone)}">
          <strong>${escapeHtml(deadline.heading)}</strong>
          <span>${escapeHtml(deadline.primary)}</span>
          <em>${escapeHtml(deadline.secondary)}</em>
        </div>
        <div class="meta-grid">
          <div><strong>Price</strong>${renderPrice(item)}</div>
          <p><strong>Discount</strong>${escapeHtml(formatDiscount(item) || "No discount")}</p>
          <p><strong>Category</strong>${escapeHtml(item.category || "Uncategorized")}</p>
          <p><strong>First published</strong>${escapeHtml(firstPublished)}</p>
          <p><strong>Latest release</strong>${escapeHtml(latestRelease)}</p>
          <p><strong>Sale window</strong>${escapeHtml(item.sale ? saleWindow : "Not on sale")}</p>
        </div>
        ${renderDescriptionPreview(item)}
        <div class="actions">
          <div class="primary-actions">
            ${state.selectionAction ? `<label class="bulk-select"><input type="checkbox" data-action="${escapeHtml(state.selectionAction)}" data-product-id="${escapeHtml(item.productId)}" ${state.isSelected ? "checked" : ""}> Select</label>` : ""}
            <button data-action="${watchAction}" data-product-id="${escapeHtml(item.productId)}" ${state.isTracked ? "disabled" : ""}>Watch</button>
            <button data-action="fetchDescription" data-product-id="${escapeHtml(item.productId)}">${item.description ? "Refresh Description" : "Fetch Description"}</button>
            <button data-action="watchPublisher" data-publisher-id="${escapeHtml(item.publisherId)}" data-publisher-name="${escapeHtml(item.publisherName)}" ${state.isPublisherWatched || !item.publisherId ? "disabled" : ""}>${state.isPublisherWatched ? "Publisher Watched" : "Watch Publisher"}</button>
            <button data-action="${dismissAction}" data-product-id="${escapeHtml(item.productId)}" ${state.isDismissed ? "disabled" : ""}>Dismiss</button>
          </div>
          <div class="secondary-actions">
            <button class="share-action" data-action="shareDeal" data-product-id="${escapeHtml(item.productId)}">Share Deal</button>
            <button data-action="copyLink" data-url="${escapeHtml(item.url)}">Copy Link</button>
            <a class="button-link" href="${escapeHtml(assetStoreUrl(item.url))}" target="_blank" rel="noreferrer">Open</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderPublisher(publisher, stats = {}) {
  const added = publisher.addedAt ? formatDate(publisher.addedAt) : "Unknown";
  const checked = publisher.lastCheckedAt ? formatDate(publisher.lastCheckedAt) : "Not checked yet";
  const saleItems = publisher.saleItems || [];
  const saleItemCount = publisher.lastCheckedAt
    ? publisher.saleItemCount || 0
    : publisher.saleItemCount || saleItems.length || stats.discoverySaleCount || 0;
  return `
    <article class="asset-card publisher-card">
      ${publisher.imageUrl ? `<img class="publisher-image" src="${escapeHtml(publisher.imageUrl)}" alt="">` : '<div class="image-placeholder publisher-image"></div>'}
      <div class="asset-body">
        <div class="row">
          <div>
            <h2><a href="${escapeHtml(assetStoreUrl(publisher.url))}" target="_blank" rel="noreferrer">${escapeHtml(publisher.publisherName || `Publisher ${publisher.publisherId}`)}</a></h2>
            <p>Publisher ${escapeHtml(publisher.publisherId)}</p>
          </div>
          <span class="status active">Watched</span>
        </div>
        <div class="meta-grid">
          <p><strong>Watched assets</strong>${escapeHtml(String(stats.watchedAssetCount || 0))}</p>
          <p><strong>Sale items found</strong>${escapeHtml(String(saleItemCount))}</p>
          <p><strong>Added</strong>${escapeHtml(added)}</p>
          <p><strong>Last check</strong>${escapeHtml(checked)}</p>
        </div>
        ${publisher.lastError ? `<p class="error">${escapeHtml(publisher.lastError)}</p>` : ""}
        ${renderPublisherSaleItems(publisher, stats)}
        <div class="actions">
          <div class="primary-actions">
            <button data-action="clearPublisherReports" data-publisher-id="${escapeHtml(publisher.publisherId)}">Clear Reports</button>
            <button data-action="unwatchPublisher" data-publisher-id="${escapeHtml(publisher.publisherId)}">Unwatch</button>
          </div>
          <div class="secondary-actions">
            <a class="button-link" href="${escapeHtml(assetStoreUrl(publisher.url))}" target="_blank" rel="noreferrer">Open</a>
            <button data-action="copyLink" data-url="${escapeHtml(publisher.url)}">Copy Link</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderPublisherSaleItems(publisher, stats = {}) {
  const saleItems = publisher.saleItems || [];
  if (!saleItems.length) {
    return publisher.lastCheckedAt ? '<div class="publisher-sale-list empty-inline">No current discounted items found.</div>' : "";
  }

  return `
    <section class="publisher-sale-list">
      <h3>Current sale items</h3>
      ${saleItems.slice(0, 6).map((item) => renderPublisherSaleItem(publisher, item, stats)).join("")}
    </section>
  `;
}

function renderPublisherSaleItem(publisher, item, stats = {}) {
  const deadline = getDeadlineInfo(item);
  const isWatched = stats.watchedProductIds?.has(String(item.productId));
  return `
    <div class="publisher-sale-item">
      ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="">` : '<div class="image-placeholder"></div>'}
      <div>
        <strong><a href="${escapeHtml(assetStoreUrl(item.url))}" target="_blank" rel="noreferrer">${escapeHtml(item.title || `Asset ${item.productId}`)}</a></strong>
        <p>${renderPrice(item)}</p>
        ${item.description ? `<p>${escapeHtml(shortenText(item.description, 180))}</p>` : ""}
        <p>${escapeHtml(deadline.primary)}${deadline.secondary ? `, ${escapeHtml(deadline.secondary)}` : ""}</p>
      </div>
      <div class="publisher-sale-actions">
        <div class="primary-actions">
          <button data-action="watchPublisherSale" data-publisher-id="${escapeHtml(publisher.publisherId)}" data-product-id="${escapeHtml(item.productId)}" ${isWatched ? "disabled" : ""}>${isWatched ? "Watched" : "Watch"}</button>
          <button data-action="fetchPublisherSaleDescription" data-publisher-id="${escapeHtml(publisher.publisherId)}" data-product-id="${escapeHtml(item.productId)}">${item.description ? "Refresh Description" : "Fetch Description"}</button>
        </div>
        <div class="secondary-actions">
          <button class="share-action" data-action="shareDeal" data-publisher-id="${escapeHtml(publisher.publisherId)}" data-product-id="${escapeHtml(item.productId)}">Share Deal</button>
          <button data-action="copyLink" data-url="${escapeHtml(item.url)}">Copy Link</button>
        </div>
      </div>
    </div>
  `;
}

function renderPublisherLink(publisherId, publisherName) {
  const label = publisherName || (publisherId ? `Publisher ${publisherId}` : "Unknown publisher");
  if (!publisherId) {
    return escapeHtml(label);
  }
  return `<a class="publisher-link" href="${escapeHtml(assetStoreUrl(getPublisherUrl(publisherId)))}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function renderDescriptionPreview(item) {
  if (!item.description) {
    return "";
  }
  const fetched = item.descriptionFetchedAt ? `Fetched ${formatDate(item.descriptionFetchedAt)}` : "Description cached";
  return `
    <section class="description-preview">
      <strong>Description</strong>
      <p>${escapeHtml(shortenText(item.description, 650))}</p>
      <em>${escapeHtml(fetched)}</em>
    </section>
  `;
}

function shortenText(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function renderTags(tags = []) {
  if (!Array.isArray(tags) || !tags.length) {
    return "";
  }
  return `<div class="tag-list">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function syncFilterOptions(assets) {
  syncSelectOptions(publisherFilter, collectOptions(assets, (asset) => asset.publisherName), "All publishers");
  syncSelectOptions(tagFilter, collectOptions(assets, getAssetTags, true), "All tags");
  syncSelectOptions(categoryFilter, collectOptions(assets, (asset) => asset.category), "All categories");
}

function syncDiscoveryFilters(items) {
  syncSelectOptions(discoveryPublisherFilter, collectOptions(items, (item) => item.publisherName), "All publishers");
  syncSelectOptions(discoveryCategoryFilter, collectOptions(items, (item) => item.category), "All categories");
}

function syncNewAssetFilters(items) {
  syncSelectOptions(newAssetsPublisherFilter, collectOptions(items, (item) => item.publisherName), "All publishers");
  syncSelectOptions(newAssetsCategoryFilter, collectOptions(items, (item) => item.category), "All categories");
}

function syncSelectOptions(select, options, allLabel) {
  const preferred = normalizeFilterValue(select.dataset.pendingValue || select.value || "all") || "all";
  select.innerHTML = [
    `<option value="all">${escapeHtml(allLabel)}</option>`,
    ...options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
  ].join("");
  select.value = options.some((option) => option.value === preferred) ? preferred : "all";
  select.dataset.pendingValue = preferred === "all" || select.value === preferred ? select.value : preferred;
  select.disabled = options.length === 0;
}

function collectOptions(assets, getValue, flatten = false) {
  const byValue = new Map();
  for (const asset of assets) {
    const raw = getValue(asset);
    const values = flatten ? (Array.isArray(raw) ? raw : [raw]) : [raw];
    for (const item of values || []) {
      const label = String(item || "").trim();
      const value = normalizeFilterValue(label);
      if (value && !byValue.has(value)) {
        byValue.set(value, { value, label });
      }
    }
  }
  return [...byValue.values()].sort((left, right) => compareText(left.label, right.label));
}

function sortDiscoveryItems(items, sortMode) {
  return [...items].sort((left, right) => {
    switch (sortMode) {
      case "expiring_first":
        return compareActiveSaleEnd(left, right)
          || compareDiscoveryFirstPublishedDesc(left, right)
          || compareNumberDesc(discoveryDiscount(left), discoveryDiscount(right))
          || compareTitle(left, right);
      case "expiring_last":
        return compareActiveSaleEndDesc(left, right)
          || compareDiscoveryFirstPublishedDesc(left, right)
          || compareNumberDesc(discoveryDiscount(left), discoveryDiscount(right))
          || compareTitle(left, right);
      case "date_added":
      default:
        return compareDiscoveryFirstPublishedDesc(left, right)
          || compareActiveSaleEnd(left, right)
          || compareNumberDesc(discoveryDiscount(left), discoveryDiscount(right))
          || compareTitle(left, right);
    }
  });
}

function sortNewAssetItems(items) {
  return [...items].sort((left, right) => {
    return compareDiscoveryFirstPublishedDesc(left, right) || compareTitle(left, right);
  });
}

function formatDiscoverySummary(discovery, visibleCount) {
  const total = discovery.newReleaseSales?.length || 0;
  const fetched = discovery.fetchedAt ? `Updated ${formatDate(discovery.fetchedAt)}` : "Not refreshed yet";
  const hidden = Math.max(0, total - visibleCount);
  const staleFirstPublished = (discovery.newReleaseSales || [])
    .filter((item) => !item.firstPublishedAt || item.firstPublishedSourceVersion !== FIRST_PUBLISHED_SOURCE_VERSION)
    .length;
  const refreshHint = staleFirstPublished ? ` ${staleFirstPublished} cached items need Refresh Discovery to verify first-published dates.` : "";
  return `${visibleCount} visible, ${total} cached${hidden ? `, ${hidden} hidden` : ""}. ${fetched}.${refreshHint}`;
}

async function formatNewAssetsSummary(discovery, visibleCount) {
  const total = discovery.newAssets?.length || 0;
  const fetched = discovery.newAssetsFetchedAt ? `Updated ${formatDate(discovery.newAssetsFetchedAt)}` : "Not refreshed yet";
  const hidden = Math.max(0, total - visibleCount);
  const settings = await getSettings();
  return `${visibleCount} visible, ${total} cached${hidden ? `, ${hidden} hidden` : ""}. ${fetched}. Queue: up to ${settings.newAssetQueueLimit || 48} assets from ${settings.newAssetMaxAgeDays || 14} days.`;
}

function sortAssets(assets, sortMode) {
  return [...assets].sort((left, right) => {
    switch (sortMode) {
      case "ends_soon":
        return compareActiveSaleEnd(left, right) || compareTitle(left, right);
      case "added_newest":
        return compareDateDesc(left.addedAt, right.addedAt) || compareTitle(left, right);
      case "checked_newest":
        return compareDateDesc(left.lastCheckedAt, right.lastCheckedAt) || compareTitle(left, right);
      case "title_az":
        return compareTitle(left, right);
      case "publisher_az":
        return compareText(left.publisherName, right.publisherName) || compareTitle(left, right);
      case "price_low":
        return compareNumberAsc(left.currentPrice, right.currentPrice) || compareTitle(left, right);
      case "discount_high":
        return compareNumberDesc(discountPercent(left), discountPercent(right)) || compareTitle(left, right);
      case "status":
        return compareStatus(left, right) || compareSaleEnd(left, right) || compareTitle(left, right);
      case "attention":
      default:
        return compareAttention(left, right) || compareTitle(left, right);
    }
  });
}

function compareAttention(left, right) {
  return compareNumberAsc(attentionRank(left), attentionRank(right))
    || compareActiveSaleEnd(left, right)
    || compareDateDesc(left.sale?.endsAt || left.expiredAt || left.addedAt, right.sale?.endsAt || right.expiredAt || right.addedAt)
    || compareTitle(left, right);
}

function compareStatus(left, right) {
  const order = { active: 0, upcoming: 1, error: 2, watching_no_sale: 3, no_sale: 3, expired: 4, pending: 5 };
  return (order[getEffectiveStatus(left).value] ?? 9) - (order[getEffectiveStatus(right).value] ?? 9);
}

function compareSaleEnd(left, right) {
  return compareDateAsc(left.sale?.endsAt, right.sale?.endsAt, true);
}

function compareActiveSaleEnd(left, right) {
  return compareDateAsc(getFutureSaleEnd(left), getFutureSaleEnd(right), true);
}

function compareActiveSaleEndDesc(left, right) {
  return compareDateDesc(getFutureSaleEnd(left), getFutureSaleEnd(right));
}

function getFutureSaleEnd(asset) {
  const status = getEffectiveStatus(asset).value;
  const endsAt = Date.parse(asset.sale?.endsAt || "");
  if ((status === "active" || status === "upcoming") && Number.isFinite(endsAt) && endsAt >= Date.now()) {
    return asset.sale.endsAt;
  }
  return "";
}

function attentionRank(asset) {
  const status = getEffectiveStatus(asset).value;
  if (status === "error") {
    return 0;
  }
  if (status === "active" && isUrgentSale(asset)) {
    return 1;
  }
  if (status === "expired") {
    return 2;
  }
  if (status === "active") {
    return 3;
  }
  if (status === "upcoming") {
    return 4;
  }
  if (status === "watching_no_sale" || status === "no_sale") {
    return 5;
  }
  return 6;
}

function isUrgentSale(asset) {
  const endsAt = Date.parse(asset.sale?.endsAt || "");
  if (!Number.isFinite(endsAt)) {
    return false;
  }
  const remainingMs = endsAt - Date.now();
  return remainingMs >= 0 && remainingMs <= 24 * 60 * 60 * 1000;
}

function compareDateAsc(left, right, missingLast = false) {
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

function compareDateDesc(left, right) {
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

function compareTitle(left, right) {
  return compareText(left.title || left.productId, right.title || right.productId);
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base" });
}

function normalizeFilterValue(value) {
  return String(value || "").trim().toLowerCase();
}

function setDynamicFilterPreference(select, value) {
  select.dataset.pendingValue = normalizeFilterValue(value || "all") || "all";
}

function getAssetTags(asset) {
  if (Array.isArray(asset.tags)) {
    return asset.tags;
  }
  if (typeof asset.tags === "string") {
    return asset.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function compareNumberAsc(left, right) {
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

function compareNumberDesc(left, right) {
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

function discountPercent(asset) {
  const discoveryValue = Number(asset.discountPercent);
  if (Number.isFinite(discoveryValue)) {
    return discoveryValue;
  }
  const discount = Number(asset.sale?.discount?.value);
  if (Number.isFinite(discount)) {
    return discount;
  }
  const original = Number(asset.originalPrice);
  const current = Number(asset.currentPrice);
  if (Number.isFinite(original) && Number.isFinite(current) && original > 0) {
    return (original - current) / original;
  }
  return NaN;
}

function discoveryDiscount(item) {
  const value = discountPercent(item);
  return Number.isFinite(value) ? value : -1;
}

function compareDiscoveryFirstPublishedDesc(left, right) {
  return compareDateDesc(left.firstPublishedAt, right.firstPublishedAt)
    || compareDateDesc(left.latestReleaseAt, right.latestReleaseAt);
}

async function getTrackedAssets() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function getTrackedAssetItem(productId) {
  const assets = await getTrackedAssets();
  return assets.find((item) => String(item.productId) === String(productId));
}

async function loadViewPreferences() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  const settings = data[SETTINGS_KEY] || FALLBACK_SETTINGS;
  applyViewPreferences(settings);
}

async function saveViewPreference(patch) {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  await chrome.storage.local.set({
    [SETTINGS_KEY]: {
      ...(data[SETTINGS_KEY] || {}),
      ...patch
    }
  });
}

function normalizeDiscoverySort(value) {
  return DISCOVERY_SORT_OPTIONS.includes(value) ? value : FALLBACK_SETTINGS.discoverySort;
}

function normalizeNewAssetsStateFilter(value) {
  return NEW_ASSETS_STATE_FILTER_OPTIONS.includes(value) ? value : FALLBACK_SETTINGS.newAssetsStateFilter;
}

function applyViewPreferences(settings = FALLBACK_SETTINGS) {
  const normalized = {
    ...FALLBACK_SETTINGS,
    ...settings
  };
  setSelectValue(sortSelect, normalizeSelectOption(normalized.watchListSort, WATCH_LIST_SORT_OPTIONS, FALLBACK_SETTINGS.watchListSort));
  setSelectValue(statusFilter, normalizeSelectOption(normalized.watchStatusFilter, WATCH_STATUS_FILTER_OPTIONS, FALLBACK_SETTINGS.watchStatusFilter));
  setDynamicFilterPreference(publisherFilter, normalized.watchPublisherFilter);
  setDynamicFilterPreference(tagFilter, normalized.watchTagFilter);
  setDynamicFilterPreference(categoryFilter, normalized.watchCategoryFilter);
  setSelectValue(priceStateFilter, normalizeSelectOption(normalized.watchPriceStateFilter, WATCH_PRICE_FILTER_OPTIONS, FALLBACK_SETTINGS.watchPriceStateFilter));
  setSelectValue(discountFilter, normalizeSelectOption(normalized.watchDiscountFilter, DISCOUNT_FILTER_OPTIONS, FALLBACK_SETTINGS.watchDiscountFilter));
  setSelectValue(descriptionFilter, normalizeSelectOption(normalized.watchDescriptionFilter, DESCRIPTION_FILTER_OPTIONS, FALLBACK_SETTINGS.watchDescriptionFilter));

  setSelectValue(discoverySortSelect, normalizeDiscoverySort(normalized.discoverySort));
  setDynamicFilterPreference(discoveryPublisherFilter, normalized.discoveryPublisherFilter);
  setDynamicFilterPreference(discoveryCategoryFilter, normalized.discoveryCategoryFilter);
  setSelectValue(discoveryDiscountFilter, normalizeSelectOption(normalized.discoveryDiscountFilter, DISCOUNT_FILTER_OPTIONS, FALLBACK_SETTINGS.discoveryDiscountFilter));
  setSelectValue(discoveryDescriptionFilter, normalizeSelectOption(normalized.discoveryDescriptionFilter, DESCRIPTION_FILTER_OPTIONS, FALLBACK_SETTINGS.discoveryDescriptionFilter));
  showHiddenDiscovery.checked = normalized.showHiddenDiscovery === true;

  setDynamicFilterPreference(newAssetsPublisherFilter, normalized.newAssetsPublisherFilter);
  setSelectValue(newAssetsStateFilter, normalizeNewAssetsStateFilter(normalized.newAssetsStateFilter));
  setDynamicFilterPreference(newAssetsCategoryFilter, normalized.newAssetsCategoryFilter);
  setSelectValue(newAssetsDiscountFilter, normalizeSelectOption(normalized.newAssetsDiscountFilter, DISCOUNT_FILTER_OPTIONS, FALLBACK_SETTINGS.newAssetsDiscountFilter));
  setSelectValue(newAssetsDescriptionFilter, normalizeSelectOption(normalized.newAssetsDescriptionFilter, DESCRIPTION_FILTER_OPTIONS, FALLBACK_SETTINGS.newAssetsDescriptionFilter));
  showHiddenNewAssets.checked = normalized.showHiddenNewAssets === true;
}

function normalizeSelectOption(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function setSelectValue(select, value) {
  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
  }
}

function downloadBackup(backup) {
  const payload = JSON.stringify(backup, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `asset-sale-watch-backup-${date}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function loadSettingsPanel() {
  applySettingsToControls(await getSettings());
}

function applySettingsToControls(settings = FALLBACK_SETTINGS) {
  const normalized = {
    ...FALLBACK_SETTINGS,
    ...settings,
    alerts: {
      ...FALLBACK_SETTINGS.alerts,
      ...(settings.alerts || {})
    }
  };
  checkIntervalSelect.value = String(normalized.checkIntervalMinutes);
  retentionSelect.value = String(normalized.expiredRetentionDays);
  currencySelect.value = normalized.currency || "USD";
  newAssetQueueLimitSelect.value = String(normalized.newAssetQueueLimit || FALLBACK_SETTINGS.newAssetQueueLimit);
  newAssetMaxAgeSelect.value = String(normalized.newAssetMaxAgeDays || FALLBACK_SETTINGS.newAssetMaxAgeDays);
  collectDescriptions.checked = normalized.collectDescriptions === true;
  alertAssetEntersSale.checked = normalized.alerts.assetEntersSale;
  alertSaleEnding.checked = normalized.alerts.saleEndingReminders;
  alertSaleEndChanged.checked = normalized.alerts.saleEndChanged;
  alertPublisherNewSale.checked = normalized.alerts.publisherNewSale;
  alertDiscoveryDigest.checked = normalized.alerts.discoveryDigest;

  const enabledReminders = new Set((normalized.reminderThresholdHours || []).map(Number));
  for (const input of getReminderInputs()) {
    input.checked = enabledReminders.has(Number(input.dataset.reminderHours));
  }
}

function collectSettingsFromControls() {
  return {
    checkIntervalMinutes: Number(checkIntervalSelect.value),
    expiredRetentionDays: retentionSelect.value === "never" ? "never" : Number(retentionSelect.value),
    currency: currencySelect.value,
    newAssetQueueLimit: Number(newAssetQueueLimitSelect.value),
    newAssetMaxAgeDays: Number(newAssetMaxAgeSelect.value),
    collectDescriptions: collectDescriptions.checked,
    reminderThresholdHours: getReminderInputs()
      .filter((input) => input.checked)
      .map((input) => Number(input.dataset.reminderHours)),
    alerts: {
      assetEntersSale: alertAssetEntersSale.checked,
      saleEndingReminders: alertSaleEnding.checked,
      saleEndChanged: alertSaleEndChanged.checked,
      publisherNewSale: alertPublisherNewSale.checked,
      discoveryDigest: alertDiscoveryDigest.checked
    }
  };
}

function getReminderInputs() {
  return [...document.querySelectorAll("[data-reminder-hours]")];
}

function syncBackToTopVisibility() {
  backToTop.hidden = window.scrollY < 420;
}

function setMessage(text) {
  message.textContent = text;
}

function formatPrice(asset) {
  const current = Number(asset.currentPrice);
  const original = Number(asset.originalPrice);
  if (Number.isFinite(current) && Number.isFinite(original) && current !== original) {
    return `$${current.toFixed(2)} from $${original.toFixed(2)}`;
  }
  if (Number.isFinite(current)) {
    return `$${current.toFixed(2)}`;
  }
  return "Price unavailable";
}

function renderPrice(asset) {
  const current = Number(asset.currentPrice);
  const original = Number(asset.originalPrice);
  const discount = formatDiscount(asset);

  if (Number.isFinite(current) && Number.isFinite(original) && current !== original) {
    return `
      <span class="price-line">
        <span class="current-price">$${current.toFixed(2)}</span>
        <span class="original-price">$${original.toFixed(2)}</span>
        ${discount ? `<span class="discount-badge">${escapeHtml(discount)}</span>` : ""}
      </span>
    `;
  }

  if (Number.isFinite(current)) {
    return `<span class="price-line"><span class="current-price">$${current.toFixed(2)}</span></span>`;
  }

  return '<span class="price-line unavailable-price">Price unavailable</span>';
}

function formatDiscount(asset) {
  const discount = discountPercent(asset);
  if (!Number.isFinite(discount) || discount <= 0) {
    return "";
  }
  return `-${Math.round(discount * 100)}%`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString();
}

function getPublisherUrl(publisherId) {
  return `https://assetstore.unity.com/publishers/${encodeURIComponent(publisherId)}`;
}

function getEffectiveStatus(asset) {
  if (asset.status === "error") {
    return { value: "error", label: asset.statusLabel || asset.lastError || "Check failed" };
  }
  if (!asset.sale?.startsAt || !asset.sale?.endsAt) {
    const value = asset.status === "no_sale" ? "watching_no_sale" : asset.status || "watching_no_sale";
    return { value, label: asset.statusLabel || (value === "watching_no_sale" ? "Watching for the next sale" : "No sale deadline found") };
  }

  const now = Date.now();
  const startsAt = Date.parse(asset.sale.startsAt);
  const endsAt = Date.parse(asset.sale.endsAt);
  if (Number.isFinite(startsAt) && now < startsAt) {
    return { value: "upcoming", label: `Sale starts ${formatDate(asset.sale.startsAt)}` };
  }
  if (Number.isFinite(endsAt) && now <= endsAt) {
    return { value: "active", label: `Sale ends ${formatDate(asset.sale.endsAt)}` };
  }
  if (Number.isFinite(endsAt)) {
    return { value: "expired", label: `Sale ended ${formatDate(asset.sale.endsAt)}` };
  }
  return { value: asset.status || "pending", label: asset.statusLabel || "Pending" };
}

function getDeadlineInfo(asset) {
  const status = getEffectiveStatus(asset);
  if (!asset.sale?.endsAt) {
    if (status.value === "active") {
      return {
        heading: "Price Drop",
        primary: "No deadline found",
        secondary: "Watching for sale metadata",
        tone: "normal"
      };
    }
    if (status.value === "watching_no_sale") {
      return {
        heading: "Watching",
        primary: "No active sale",
        secondary: "We'll alert when one appears",
        tone: "neutral"
      };
    }
    return {
      heading: "Deadline",
      primary: "No sale deadline",
      secondary: "",
      tone: "neutral"
    };
  }

  const endsAt = Date.parse(asset.sale.endsAt);
  const diffMs = endsAt - Date.now();
  if (status.value === "expired") {
    return {
      heading: "Expired",
      primary: formatDate(asset.sale.endsAt),
      secondary: `${formatDuration(Math.abs(diffMs))} ago`,
      tone: "expired"
    };
  }

  return {
    heading: "Ends",
    primary: formatDate(asset.sale.endsAt),
    secondary: `${formatDuration(diffMs)} left`,
    tone: diffMs <= 24 * 60 * 60 * 1000 ? "urgent" : "normal"
  };
}

function getPublishedInfo(item) {
  return {
    heading: "Published",
    primary: item.firstPublishedAt ? formatDate(item.firstPublishedAt) : "Unknown",
    secondary: item.latestReleaseAt ? `Latest release ${formatDate(item.latestReleaseAt)}` : "",
    tone: "neutral"
  };
}

function formatStatusName(value) {
  if (value === "watching_no_sale" || value === "no_sale") {
    return "No sale";
  }
  return String(value || "pending").replaceAll("_", " ");
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeMarkdown(value) {
  return String(value || "").replace(/([\\`*_{}\[\]()#+\-.!|>])/g, "\\$1");
}
