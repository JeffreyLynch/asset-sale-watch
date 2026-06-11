const UNITY_SALE_WATCH_AFFILIATE = {
  mode: "affiliate",
  aid: "1011lumz4",
  disclosure: "Using these affiliate links helps support this extension."
};
globalThis.UNITY_SALE_WATCH_AFFILIATE = UNITY_SALE_WATCH_AFFILIATE;

function isAffiliateModeEnabled() {
  return UNITY_SALE_WATCH_AFFILIATE.mode === "affiliate" && Boolean(UNITY_SALE_WATCH_AFFILIATE.aid);
}
globalThis.isAffiliateModeEnabled = isAffiliateModeEnabled;

function assetStoreUrl(url) {
  const rawUrl = String(url || "");
  if (!isAffiliateModeEnabled()) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname !== "assetstore.unity.com") {
      return rawUrl;
    }
    parsed.searchParams.set("aid", UNITY_SALE_WATCH_AFFILIATE.aid);
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}
globalThis.assetStoreUrl = assetStoreUrl;

function buildAfLink(url) {
  const rawUrl = String(url || "");
  if (!isAffiliateModeEnabled()) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname !== "assetstore.unity.com") {
      return rawUrl;
    }
    parsed.searchParams.delete("aid");
    parsed.searchParams.delete("pubref");
    parsed.searchParams.delete("camref");
    return `https://af.unity.com/sr/camref:${UNITY_SALE_WATCH_AFFILIATE.aid}/destination:${parsed.toString()}`;
  } catch {
    return rawUrl;
  }
}
globalThis.buildAfLink = buildAfLink;

function cleanAssetStoreUrl(url) {
  const rawUrl = String(url || "");
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === "af.unity.com") {
      const destination = getAfDestination(rawUrl);
      return destination ? cleanAssetStoreUrl(destination) : parsed.toString();
    }
    if (parsed.hostname === "assetstore.unity.com") {
      parsed.searchParams.delete("aid");
      parsed.searchParams.delete("pubref");
      parsed.searchParams.delete("camref");
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}
globalThis.cleanAssetStoreUrl = cleanAssetStoreUrl;

function getAfDestination(url) {
  const marker = "/destination:";
  const markerIndex = String(url || "").indexOf(marker);
  return markerIndex >= 0 ? String(url || "").slice(markerIndex + marker.length) : "";
}
globalThis.getAfDestination = getAfDestination;

function applyAffiliateDisclosure(element) {
  if (!element) {
    return;
  }
  element.hidden = !isAffiliateModeEnabled();
  element.textContent = isAffiliateModeEnabled() ? UNITY_SALE_WATCH_AFFILIATE.disclosure : "";
}
globalThis.applyAffiliateDisclosure = applyAffiliateDisclosure;

function affiliateDisclosureText() {
  return isAffiliateModeEnabled() ? UNITY_SALE_WATCH_AFFILIATE.disclosure : "";
}
globalThis.affiliateDisclosureText = affiliateDisclosureText;

function affiliateNotificationMessage(message) {
  const text = String(message || "").trim();
  if (!isAffiliateModeEnabled()) {
    return text;
  }
  return text ? `${text} Opens an affiliate Asset Store link.` : "Opens an affiliate Asset Store link.";
}
globalThis.affiliateNotificationMessage = affiliateNotificationMessage;
