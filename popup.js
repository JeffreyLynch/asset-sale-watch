const STORAGE_KEY = "trackedAssets";

const versionLabel = document.querySelector("#versionLabel");
const affiliateDisclosure = document.querySelector("#affiliateDisclosure");
const pageHint = document.querySelector("#pageHint");
const message = document.querySelector("#message");
const addCurrent = document.querySelector("#addCurrent");
const watchPublisher = document.querySelector("#watchPublisher");
const openWatchList = document.querySelector("#openWatchList");
const refreshAll = document.querySelector("#refreshAll");
const assetsRoot = document.querySelector("#assets");

let activeTabId = null;

document.addEventListener("DOMContentLoaded", async () => {
  versionLabel.textContent = `Version ${chrome.runtime.getManifest().version}`;
  applyAffiliateDisclosure(affiliateDisclosure);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id || null;
  await updatePageHint(tab);
  await renderAssets();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    renderAssets();
  }
});

addCurrent.addEventListener("click", async () => {
  setMessage("Adding this asset...");
  const response = await chrome.runtime.sendMessage({ type: "addCurrentTab", tabId: activeTabId });
  setMessage(response?.ok ? "Added to watch list." : response?.error || "Could not add this page.");
  await renderAssets();
});

watchPublisher.addEventListener("click", async () => {
  setMessage("Watching this publisher...");
  const response = await chrome.runtime.sendMessage({ type: "watchCurrentPublisher", tabId: activeTabId });
  setMessage(response?.ok ? "Publisher watched." : response?.error || "Could not watch this publisher.");
});

refreshAll.addEventListener("click", async () => {
  setMessage("Checking watch list...");
  const response = await chrome.runtime.sendMessage({ type: "checkAll" });
  setMessage(response?.ok ? "Updated." : response?.error || "Check failed.");
  await renderAssets();
});

openWatchList.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("watchlist.html") });
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
  if (button.dataset.action === "remove") {
    await chrome.runtime.sendMessage({ type: "removeAsset", productId });
    await renderAssets();
  }
  if (button.dataset.action === "check") {
    setMessage("Checking asset...");
    const response = await chrome.runtime.sendMessage({ type: "checkNow", productId });
    setMessage(response?.ok ? "Updated." : response?.error || "Check failed.");
    await renderAssets();
  }
});

async function updatePageHint(tab) {
  const url = String(tab?.url || "");
  const pageContext = await getUnityPageContext(tab?.id, url);
  const productId = extractProductId(url) || pageContext.productId;
  const isPublisher = /assetstore\.unity\.com\/publishers\/\d+/i.test(url);

  if (productId) {
    pageHint.textContent = `Asset page detected: ${productId}`;
    addCurrent.disabled = false;
    watchPublisher.disabled = !pageContext.publisherId;
    return;
  }

  if (isPublisher) {
    pageHint.textContent = pageContext.publisherName ? `Publisher page detected: ${pageContext.publisherName}` : "Publisher page detected.";
    addCurrent.disabled = true;
    watchPublisher.disabled = false;
    return;
  }

  pageHint.textContent = "Open a Unity Asset Store asset page to add it.";
  addCurrent.disabled = true;
  watchPublisher.disabled = true;
}

async function getUnityPageContext(tabId, url) {
  const targetUrl = String(url || "");
  if (!tabId || !/https:\/\/assetstore\.unity\.com\//i.test(targetUrl)) {
    return {};
  }
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "collectUnityAssetContext" });
  } catch {
    return {};
  }
}

async function renderAssets() {
  const assets = await getTrackedAssets();
  if (!assets.length) {
    assetsRoot.innerHTML = '<div class="empty">No watched assets yet.</div>';
    return;
  }

  assetsRoot.innerHTML = sortAssets(assets).slice(0, 5).map(renderAsset).join("");
}

function sortAssets(assets) {
  return [...assets].sort((left, right) => {
    return compareStatus(left, right) || compareSaleEnd(left, right) || compareText(left.title || left.productId, right.title || right.productId);
  });
}

function compareStatus(left, right) {
  const order = { active: 0, upcoming: 1, error: 2, watching_no_sale: 3, no_sale: 3, expired: 4, pending: 5 };
  return (order[getEffectiveStatus(left).value] ?? 9) - (order[getEffectiveStatus(right).value] ?? 9);
}

function compareSaleEnd(left, right) {
  const leftTime = Date.parse(left.sale?.endsAt || "");
  const rightTime = Date.parse(right.sale?.endsAt || "");
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
  return leftTime - rightTime;
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), undefined, { sensitivity: "base" });
}

function renderAsset(asset) {
  const status = getEffectiveStatus(asset);
  const timeLeft = getTimeLeft(asset);
  return `
    <article class="asset-card compact">
      ${asset.imageUrl ? `<img src="${escapeHtml(asset.imageUrl)}" alt="">` : '<div class="image-placeholder"></div>'}
      <div>
        <div class="row">
          <h3><a href="${escapeHtml(assetStoreUrl(asset.url))}" target="_blank" rel="noreferrer">${escapeHtml(asset.title || `Asset ${asset.productId}`)}</a></h3>
          <span class="status ${escapeHtml(status.value)}">${escapeHtml(formatStatusName(status.value))}</span>
        </div>
        <p>${renderPublisherLink(asset.publisherId, asset.publisherName)}</p>
        <p class="price">${escapeHtml(formatPrice(asset))}</p>
        <p>${escapeHtml(status.label)}${timeLeft ? ` (${escapeHtml(timeLeft)})` : ""}</p>
        <div class="actions">
          <button data-action="check" data-product-id="${escapeHtml(asset.productId)}">Check</button>
          <button data-action="copyLink" data-url="${escapeHtml(asset.url)}">Copy Link</button>
          <button data-action="remove" data-product-id="${escapeHtml(asset.productId)}">Remove</button>
        </div>
      </div>
    </article>
  `;
}

async function getTrackedAssets() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

function setMessage(text) {
  message.textContent = text;
}

async function copyAffiliateLink(url) {
  const link = assetStoreUrl(url);
  try {
    await navigator.clipboard.writeText(link);
    setMessage("Affiliate link copied.");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = link;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    setMessage("Affiliate link copied.");
  }
}

function extractProductId(value) {
  const text = String(value || "");
  const packageMatch = text.match(/\/packages\/package\/(\d+)/i);
  if (packageMatch) {
    return packageMatch[1];
  }
  const slugMatch = text.match(/\/packages\/[^?#]*?(\d+)(?:[/?#]|$)/i);
  return slugMatch ? slugMatch[1] : "";
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

function renderPublisherLink(publisherId, publisherName) {
  const label = publisherName || (publisherId ? `Publisher ${publisherId}` : "Unknown publisher");
  if (!publisherId) {
    return escapeHtml(label);
  }
  return `<a class="publisher-link" href="${escapeHtml(assetStoreUrl(getPublisherUrl(publisherId)))}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
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
    return { value: "upcoming", label: `Sale starts ${new Date(asset.sale.startsAt).toLocaleString()}` };
  }
  if (Number.isFinite(endsAt) && now <= endsAt) {
    return { value: "active", label: `Sale ends ${new Date(asset.sale.endsAt).toLocaleString()}` };
  }
  if (Number.isFinite(endsAt)) {
    return { value: "expired", label: `Sale ended ${new Date(asset.sale.endsAt).toLocaleString()}` };
  }
  return { value: asset.status || "pending", label: asset.statusLabel || "Pending" };
}

function formatStatusName(value) {
  if (value === "watching_no_sale" || value === "no_sale") {
    return "No sale";
  }
  return String(value || "pending").replaceAll("_", " ");
}

function getTimeLeft(asset) {
  if (!asset.sale?.endsAt) {
    return "";
  }
  const diffMs = Date.parse(asset.sale.endsAt) - Date.now();
  if (!Number.isFinite(diffMs)) {
    return "";
  }
  if (diffMs <= 0) {
    return `${formatDuration(Math.abs(diffMs))} ago`;
  }
  return `${formatDuration(diffMs)} left`;
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
