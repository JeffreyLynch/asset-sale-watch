let lastContextMenuContext = null;
let lastContextMenuRoot = null;

document.addEventListener("contextmenu", (event) => {
  const root = findAssetRoot(event.target);
  lastContextMenuRoot = root;
  lastContextMenuContext = collectUnityAssetContext({ eventTarget: event.target, root });
}, true);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "collectUnityAssetContext") {
    return false;
  }

  sendResponse(collectUnityAssetContext({
    targetUrl: message.targetUrl || "",
    preferLastContext: Boolean(message.preferLastContext)
  }));
  return true;
});

function collectUnityAssetContext(options = {}) {
  if (options.preferLastContext && lastContextMenuContext?.productId) {
    return mergeContext(lastContextMenuContext, collectTargetUrlContext(options.targetUrl, lastContextMenuRoot));
  }

  if (options.eventTarget) {
    const root = options.root || findAssetRoot(options.eventTarget);
    const targetUrl = findPackageUrl(options.eventTarget) || findPackageUrl(root);
    return collectTargetUrlContext(targetUrl, root);
  }

  if (options.targetUrl) {
    const anchor = findAnchorForUrl(options.targetUrl);
    const root = findAssetRoot(anchor);
    return collectTargetUrlContext(options.targetUrl, root);
  }

  return collectPageContext();
}

function collectTargetUrlContext(targetUrl, root) {
  const pageContext = collectPageContext();
  const scopedPublisher = root ? extractScopedPublisher(root) : {};
  const embeddedProduct = findEmbeddedProduct(targetUrl, root);
  const scopedTitle = root ? extractScopedTitle(root) : "";
  const scopedImage = root ? extractScopedImage(root) : "";
  const scopedPackageUrl = root ? findPackageUrl(root) : "";
  const canUsePageProduct = isPackageDetailPage();
  const canUsePagePublisher = canUsePageProduct || isPublisherPage();

  return {
    productId: extractProductId(targetUrl) || extractProductId(scopedPackageUrl) || embeddedProduct?.productId || (canUsePageProduct ? pageContext.productId : ""),
    publisherId: scopedPublisher.publisherId || embeddedProduct?.publisherId || (canUsePagePublisher ? pageContext.publisherId : ""),
    title: scopedTitle || embeddedProduct?.title || (canUsePageProduct ? pageContext.title : ""),
    publisherName: scopedPublisher.publisherName || embeddedProduct?.publisherName || (canUsePagePublisher ? pageContext.publisherName : ""),
    imageUrl: scopedImage || embeddedProduct?.imageUrl || (canUsePageProduct ? pageContext.imageUrl : ""),
    targetUrl: targetUrl || scopedPackageUrl || embeddedProduct?.url || ""
  };
}

function collectPageContext() {
  const pageText = document.documentElement.innerHTML;
  const productId = extractProductId(location.href)
    || firstMatch(pageText, /assetstore:\/\/product\/(\d+)/i)
    || firstMatch(pageText, /"ec_product_id"\s*:\s*\[\s*"(\d+)"/i)
    || firstMatch(pageText, /\\"ec_product_id\\"\s*:\s*\[\s*\\"(\d+)\\"/i)
    || firstMatch(pageText, /"permanentid"\s*:\s*"(\d+)"/i);
  const publisherId = extractPublisherId(location.href)
    || extractPublisherIdFromLinks()
    || firstMatch(pageText, /"publisher_id"\s*:\s*"(\d+)"/i)
    || firstMatch(pageText, /\\"publisher_id\\"\s*:\s*\\"(\d+)\\"/i)
    || firstMatch(pageText, /"publisherId"\s*:\s*"(\d+)"/i)
    || firstMatch(pageText, /\\"publisherId\\"\s*:\s*\\"(\d+)\\"/i);

  return {
    productId,
    publisherId,
    title: extractTitle(),
    publisherName: extractPublisherName(),
    imageUrl: extractImageUrl()
  };
}

function mergeContext(base, overlay) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay || {})) {
    if (value) {
      merged[key] = value;
    }
  }
  return merged;
}

function findAssetRoot(start) {
  if (!start || start === document || start === window) {
    return null;
  }

  const element = start.nodeType === Node.ELEMENT_NODE ? start : start.parentElement;
  if (!element) {
    return null;
  }

  const direct = element.closest('article, [data-test*="product"], [data-test*="asset"], li, atomic-result, [class*="card"], [class*="Card"], [role="listitem"]');
  if (direct && findPackageUrl(direct)) {
    return direct;
  }
  if (direct && findEmbeddedProduct("", direct)) {
    return direct;
  }

  let candidate = element.parentElement;
  for (let depth = 0; candidate && depth < 12; depth += 1, candidate = candidate.parentElement) {
    if (findPackageUrl(candidate) || findEmbeddedProduct("", candidate)) {
      return candidate;
    }
  }

  const packageAnchor = element.closest('a[href*="/packages/"]');
  if (!packageAnchor) {
    return direct;
  }

  let parent = packageAnchor.parentElement;
  for (let depth = 0; parent && depth < 8; depth += 1, parent = parent.parentElement) {
    if (findPackageUrl(parent) && parent.querySelector('a[href*="/publishers/"]')) {
      return parent;
    }
  }

  return packageAnchor;
}

function findPackageUrl(root) {
  if (!root) {
    return "";
  }

  if (root.matches?.('a[href*="/packages/"]')) {
    return absolutize(root.getAttribute("href") || root.href || "");
  }

  const anchor = root.querySelector?.('a[href*="/packages/"]');
  return anchor ? absolutize(anchor.getAttribute("href") || anchor.href || "") : "";
}

function findAnchorForUrl(url) {
  const targetId = extractProductId(url);
  if (!targetId) {
    return null;
  }

  return [...document.querySelectorAll('a[href*="/packages/"]')]
    .find((anchor) => extractProductId(anchor.getAttribute("href") || anchor.href || "") === targetId) || null;
}

function extractScopedPublisher(root) {
  const link = root.querySelector?.('a[href*="/publishers/"]');
  if (!link) {
    return {};
  }

  return {
    publisherId: extractPublisherId(link.getAttribute("href") || link.href || ""),
    publisherName: cleanText(link.textContent)
  };
}

function extractScopedTitle(root) {
  const packageAnchor = root.querySelector?.('a[href*="/packages/"]');
  const label = packageAnchor?.getAttribute("aria-label") || packageAnchor?.textContent || "";
  return cleanTitle(label) || cleanTitle(root.querySelector?.("h2, h3, h4")?.textContent || "");
}

function extractScopedImage(root) {
  const image = root.querySelector?.("img");
  const src = image?.currentSrc || image?.src || image?.getAttribute("src") || "";
  return src.startsWith("//") ? `https:${src}` : src;
}

function findEmbeddedProduct(targetUrl, root) {
  const productId = extractProductId(targetUrl) || extractProductId(findPackageUrl(root));
  const products = getEmbeddedProducts();
  if (!products.length) {
    return null;
  }

  if (productId) {
    const byId = products.find((product) => product.productId === productId);
    if (byId) {
      return byId;
    }
  }

  if (!root) {
    return null;
  }

  const rootText = cleanText(root.textContent).toLowerCase();
  const imageValues = [...root.querySelectorAll?.("img") || []]
    .flatMap((image) => [image.currentSrc, image.src, image.getAttribute("src"), image.getAttribute("alt")])
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return products.find((product) => {
    const name = product.title.toLowerCase();
    const imageNeedles = [product.imageUrl, product.iconImageUrl]
      .filter(Boolean)
      .flatMap((url) => [url.toLowerCase(), imageFileName(url).toLowerCase()])
      .filter(Boolean);

    return (name && rootText.includes(name)) || imageNeedles.some((needle) => {
      return needle && imageValues.some((value) => value.includes(needle) || needle.includes(value));
    });
  }) || null;
}

function getEmbeddedProducts() {
  const html = document.documentElement.innerHTML;
  const productBlocks = html.match(/\{"id":"\d+"[\s\S]*?"__typename":"ProductQ","events":\[\]\}/g) || [];
  const products = [];
  const seen = new Set();

  for (const block of productBlocks) {
    const productId = firstMatch(block, /"id":"(\d+)"/);
    if (!productId || seen.has(productId)) {
      continue;
    }
    seen.add(productId);

    const title = decodeJsonish(firstMatch(block, /"name":"((?:\\.|[^"\\])*)"/));
    const publisherName = decodeJsonish(firstMatch(block, /"publisherName":"((?:\\.|[^"\\])*)"/));
    const publisherId = firstMatch(block, /"publisherId":(\d+)/);
    const category = decodeJsonish(firstMatch(block, /"category":"((?:\\.|[^"\\])*)"/));
    const imageUrl = normalizeImageUrl(decodeJsonish(firstMatch(block, /"mainImage":"((?:\\.|[^"\\])*)"/)));
    const iconImageUrl = normalizeImageUrl(decodeJsonish(firstMatch(block, /"iconImage":"((?:\\.|[^"\\])*)"/)));

    products.push({
      productId,
      title,
      publisherName,
      publisherId,
      imageUrl,
      iconImageUrl,
      url: category && title ? `https://assetstore.unity.com/packages/${category}/${slugify(title)}-${productId}` : `https://assetstore.unity.com/packages/package/${productId}`
    });
  }

  return products;
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

function isPackageDetailPage() {
  return Boolean(extractProductId(location.href));
}

function isPublisherPage() {
  return Boolean(extractPublisherId(location.href));
}

function extractPublisherIdFromLinks() {
  const link = [...document.querySelectorAll('a[href*="/publishers/"]')]
    .map((anchor) => anchor.getAttribute("href") || anchor.href || "")
    .find((href) => /\/publishers\/\d+/i.test(href));
  return extractPublisherId(link);
}

function extractTitle() {
  const selectors = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]'
  ];
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.content?.trim();
    if (value) {
      return value.replace(/\s*\|\s*Unity Asset Store\s*$/i, "");
    }
  }

  const heading = document.querySelector("h1")?.textContent?.trim();
  if (heading) {
    return heading;
  }

  return document.title.replace(/\s*\|\s*Unity Asset Store\s*$/i, "").trim();
}

function extractPublisherName() {
  if (isPublisherPage()) {
    const heading = cleanText(document.querySelector("h1")?.textContent || "");
    if (heading) {
      return heading;
    }
  }

  const publisherLink = document.querySelector('a[href*="/publishers/"]');
  const text = publisherLink?.textContent?.trim();
  if (text) {
    return text;
  }

  const html = document.documentElement.innerHTML;
  return decodeJsonish(firstMatch(html, /"publisher_name"\s*:\s*"([^"]+)"/i))
    || decodeJsonish(firstMatch(html, /\\"publisher_name\\"\s*:\s*\\"([^"]+)\\"/i))
    || decodeJsonish(firstMatch(html, /"publisherName"\s*:\s*"([^"]+)"/i))
    || decodeJsonish(firstMatch(html, /\\"publisherName\\"\s*:\s*\\"([^"]+)\\"/i))
    || publisherNameFromTitle(document.title);
}

function extractImageUrl() {
  const html = document.documentElement.innerHTML;
  if (isPublisherPage()) {
    const publisherAvatar = normalizeImageUrl(decodeJsonish(
      firstMatch(html, /"publisherAvatarUrl":"((?:\\.|[^"\\])*)"/)
        || firstMatch(html, /\\"publisherAvatarUrl\\"\s*:\s*\\"((?:\\\\.|[^"\\])*)\\"/)
    ));
    if (publisherAvatar) {
      return publisherAvatar;
    }
  }

  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]'
  ];
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.content?.trim();
    if (value) {
      return value.startsWith("//") ? `https:${value}` : value;
    }
  }

  if (isPublisherPage()) {
    return normalizeImageUrl(decodeJsonish(
      firstMatch(html, /"imageUrl":"((?:\\.|[^"\\])*)"/)
        || firstMatch(html, /\\"imageUrl\\"\s*:\s*\\"((?:\\\\.|[^"\\])*)\\"/)
    ));
  }
  return "";
}

function firstMatch(value, pattern) {
  const match = String(value || "").match(pattern);
  return match ? match[1] : "";
}

function absolutize(value) {
  if (!value) {
    return "";
  }
  try {
    return new URL(value, location.origin).href;
  } catch {
    return value;
  }
}

function normalizeImageUrl(value) {
  if (!value) {
    return "";
  }
  return value.startsWith("//") ? `https:${value}` : value;
}

function imageFileName(value) {
  try {
    return new URL(normalizeImageUrl(value)).pathname.split("/").pop() || "";
  } catch {
    return String(value || "").split("/").pop() || "";
  }
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTitle(value) {
  return cleanText(value)
    .replace(/\s*\|\s*Unity Asset Store\s*$/i, "")
    .replace(/^open\s+/i, "")
    .trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeJsonish(value) {
  if (!value) {
    return "";
  }
  try {
    return JSON.parse(`"${value.replaceAll('"', '\\"')}"`);
  } catch {
    return value.replaceAll("\\u0026", "&").replaceAll('\\"', '"');
  }
}

function publisherNameFromTitle(value) {
  return String(value || "")
    .replace(/\s*\u00b7\s*Publisher Profile\s*\|\s*Unity Asset Store\s*$/i, "")
    .replace(/\s*\|\s*Unity Asset Store\s*$/i, "")
    .trim();
}
