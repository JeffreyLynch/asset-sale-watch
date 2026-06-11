// Autonomous deals-page generator for the Asset Sale Watch companion site.
// Node 20+; zero dependencies. Run: node site/generate.mjs
// Queries Unity's public Coveo listing API (the same backend assetstore.unity.com
// uses) for current discounts and regenerates deals.html, data/deals.json,
// sitemap.xml, and the weekly promo draft. On any failure it leaves the
// previously generated output untouched.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = (process.env.SITE_BASE_URL || "https://jeffreylynch.github.io/asset-sale-watch").replace(/\/+$/, "");
const CAMREF = "1011lumz4";
const USER_AGENT = `AssetSaleWatch-site-generator/1.0 (+${BASE_URL})`;
const TOKEN_URL = "https://assetstore.unity.com/api/coveo/search-token?searchHub=listing";
const SEARCH_URL = "https://unitytechnologiesproductionmkahteav.org.coveo.com/rest/search/v2?organizationId=unitytechnologiesproductionmkahteav";
const MAX_DEALS = 48;
const MIN_DEALS_TO_PUBLISH = 5;
const DISCLOSURE = "Disclosure: links on this page are affiliate links — if you buy through them we earn a commission at no extra cost to you.";
const ATTRIBUTION = "Asset Sale Watch is not sponsored by or affiliated with Unity Technologies or its affiliates. \"Unity\" and \"Unity Asset Store\" are trademarks or registered trademarks of Unity Technologies or its affiliates in the U.S. and elsewhere.";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function afLink(url) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("aid");
    parsed.searchParams.delete("pubref");
    parsed.searchParams.delete("camref");
    return `https://af.unity.com/sr/camref:${CAMREF}/destination:${parsed.toString()}`;
  } catch {
    return url;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, ...(options.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function getSearchToken() {
  const res = await fetchWithTimeout(TOKEN_URL);
  if (!res.ok) throw new Error(`token request failed: ${res.status}`);
  const text = (await res.text()).trim();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.token === "string") return parsed.token;
  } catch {
    /* fall through to raw handling */
  }
  return text.replace(/^"+|"+$/g, "");
}

const FIELDS = [
  "ec_name", "ec_price", "ec_price_filter", "ec_sale",
  "ec_sale_discount_percentage_filter", "publisher_name", "publisher_id",
  "ec_product_id", "product_slug", "category_slug", "ec_category",
  "ec_thumbnails", "first_published_at",
];

async function searchDeals(token, aq) {
  const body = {
    q: "",
    aq,
    sortCriteria: "@ec_sale_discount_percentage_filter descending",
    numberOfResults: 60,
    fieldsToInclude: FIELDS,
    context: {
      website: "assetstore",
      language: "en-US",
      userGroups: ["assetStoreUsers"],
      ec_price: "USD",
      ec_price_filter: "USD",
    },
  };
  const res = await fetchWithTimeout(SEARCH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

function firstUrlIn(value) {
  const match = String(value ?? "").match(/https?:\/\/[^\s"'\\,\]}]+/);
  return match ? match[0] : "";
}

function parseSaleEnd(rawSale) {
  try {
    const sales = JSON.parse(String(rawSale));
    if (!Array.isArray(sales)) return "";
    for (const sale of sales) {
      const ends = sale?.dates?.ends;
      if (ends) return new Date(ends).toISOString();
    }
  } catch {
    /* sale metadata is best-effort */
  }
  return "";
}

function toItem(result) {
  const raw = result?.raw || {};
  const title = String(result?.title || raw.ec_name || "").trim();
  const productId = String(raw.ec_product_id || "").trim();
  const slug = String(raw.product_slug || "").trim();
  const cleanUrl = result?.clickUri
    || (slug && productId ? `https://assetstore.unity.com/packages/slug/${slug}-${productId}` : "");
  const original = Number(raw.ec_price);
  const current = Number(raw.ec_price_filter);
  // Coveo returns the discount as a fraction (0.9 = 90% off), not a percentage.
  let discountPct = Number(raw.ec_sale_discount_percentage_filter);
  if (Number.isFinite(discountPct) && discountPct > 0 && discountPct <= 1) {
    discountPct = Math.round(discountPct * 100);
  } else if (Number.isFinite(discountPct) && discountPct > 1) {
    discountPct = Math.round(discountPct);
  } else if (Number.isFinite(original) && Number.isFinite(current) && original > current && original > 0) {
    discountPct = Math.round(((original - current) / original) * 100);
  } else {
    discountPct = 0;
  }
  return {
    id: productId,
    title,
    publisher: String(raw.publisher_name || "").trim(),
    category: String(raw.ec_category || raw.category_slug || "").trim(),
    url: cleanUrl,
    afUrl: cleanUrl ? afLink(cleanUrl) : "",
    thumbnail: firstUrlIn(raw.ec_thumbnails),
    originalPrice: Number.isFinite(original) ? original : null,
    currentPrice: Number.isFinite(current) ? current : null,
    discountPct,
    saleEndsAt: parseSaleEnd(raw.ec_sale),
  };
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function money(value) {
  return value === null ? "" : `$${value.toFixed(2)}`;
}

function endsLabel(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `Sale ends ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

function dealCard(item) {
  const thumb = item.thumbnail
    ? `<img class="thumb" src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">`
    : `<div class="thumb" role="presentation"></div>`;
  const was = item.originalPrice !== null && item.originalPrice !== item.currentPrice
    ? `<span class="price-was">${escapeHtml(money(item.originalPrice))}</span>` : "";
  const now = item.currentPrice !== null
    ? `<span class="price-now">${item.currentPrice === 0 ? "FREE" : escapeHtml(money(item.currentPrice))}</span>` : "";
  const ends = endsLabel(item.saleEndsAt);
  return `<article class="card">
  ${thumb}
  <h3><a href="${escapeHtml(item.afUrl)}" rel="sponsored nofollow noopener" target="_blank">${escapeHtml(item.title)}</a></h3>
  <p class="meta">${escapeHtml(item.publisher)}${item.category ? ` · ${escapeHtml(item.category)}` : ""}</p>
  <div class="price-row">${now}${was}<span class="badge">-${item.discountPct}%</span></div>
  ${ends ? `<p class="ends">${escapeHtml(ends)}</p>` : ""}
</article>`;
}

function dealsPage(items, generatedAt) {
  const stamp = new Date(generatedAt).toUTCString();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Today's best Unity Asset Store deals — Asset Sale Watch</title>
<meta name="description" content="The biggest live discounts on the Unity Asset Store right now, refreshed twice daily. Tools, art, audio, and more at up to 95% off.">
<link rel="canonical" href="${BASE_URL}/deals.html">
<meta property="og:title" content="Today's best Unity Asset Store deals">
<meta property="og:description" content="The biggest live Unity Asset Store discounts, refreshed twice daily.">
<meta property="og:type" content="website">
<meta property="og:url" content="${BASE_URL}/deals.html">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="container">
  <header class="site-header">
    <a class="brand" href="./">Asset Sale Watch</a>
    <nav class="site-nav" aria-label="Site">
      <a href="./">Home</a>
      <a href="deals.html" aria-current="page">Today's Deals</a>
      <a href="sale-calendar.html">Sale Calendar</a>
      <a href="privacy.html">Privacy</a>
    </nav>
  </header>
  <section class="prose">
    <h1>Today's best Unity Asset Store deals</h1>
    <p class="generated-note">Refreshed automatically · Last updated ${escapeHtml(stamp)}</p>
    <p class="disclosure">${escapeHtml(DISCLOSURE)}</p>
  </section>
  <section class="grid" aria-label="Current deals">
${items.map(dealCard).join("\n")}
  </section>
  <section class="prose">
    <p>Want these as browser alerts instead of a bookmark? <a href="./">Asset Sale Watch</a> is a free, local-first extension that watches assets and publishers for you and pings you when sales start or end. Check the <a href="sale-calendar.html">sale calendar</a> for what's coming next.</p>
  </section>
  <footer class="site-footer">
    <p>${escapeHtml(ATTRIBUTION)}</p>
    <p><a href="./">Home</a> · <a href="sale-calendar.html">Sale calendar</a> · <a href="privacy.html">Privacy</a></p>
  </footer>
</div>
</body>
</html>
`;
}

function sitemap(generatedAt) {
  const pageMtime = (file) => {
    try {
      return statSync(path.join(SITE_DIR, file)).mtime.toISOString().slice(0, 10);
    } catch {
      return generatedAt.slice(0, 10);
    }
  };
  const urls = [
    { loc: `${BASE_URL}/`, lastmod: pageMtime("index.html") },
    { loc: `${BASE_URL}/deals.html`, lastmod: generatedAt.slice(0, 10) },
    { loc: `${BASE_URL}/sale-calendar.html`, lastmod: pageMtime("sale-calendar.html") },
    { loc: `${BASE_URL}/privacy.html`, lastmod: pageMtime("privacy.html") },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;
}

function weeklyDraft(items, generatedAt) {
  const top = items.slice(0, 10);
  const digestLines = top.map((item, index) => {
    const price = item.currentPrice === 0 ? "FREE" : money(item.currentPrice);
    return `${index + 1}. **${item.title}** by ${item.publisher} — ${price} (${item.discountPct}% off)${item.originalPrice !== null ? `, was ${money(item.originalPrice)}` : ""}\n   ${item.url}`;
  });
  const redditLines = top.slice(0, 8).map((item) => {
    const price = item.currentPrice === 0 ? "FREE" : money(item.currentPrice);
    return `- ${item.title} (${item.publisher}) — ${price}, ${item.discountPct}% off: ${item.url}`;
  });
  const topItem = top[0];
  const social = topItem
    ? `Top Unity Asset Store deal right now: ${topItem.title} at ${topItem.discountPct}% off${topItem.currentPrice !== null ? ` (${topItem.currentPrice === 0 ? "FREE" : money(topItem.currentPrice)})` : ""}. More: ${topItem.afUrl} (affiliate) #unity3d #gamedev`
    : "";
  return `# Weekly Unity Asset Store deals digest — generated ${generatedAt.slice(0, 10)}

> All links below in sections 1–2 are CLEAN, non-affiliate links (safe for Reddit/forums).
> The social post in section 3 uses an affiliate link and says so.

## 1. Digest (top ${top.length} current deals)

${digestLines.join("\n")}

## 2. Reddit-safe text (paste as-is; no affiliate links, no hype)

This week's deeper Unity Asset Store discounts, for anyone stocking up:

${redditLines.join("\n")}

(I maintain Asset Sale Watch, a free local-first extension that alerts on sales — link in profile if useful.)

## 3. Social post (X/Bluesky, with affiliate link + disclosure)

${social}
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  console.log(`[generate] ${generatedAt} base=${BASE_URL}`);

  const token = await getSearchToken();
  let results = [];
  let aqUsed = "@ec_sale_discount_percentage_filter>0";
  try {
    results = await searchDeals(token, aqUsed);
  } catch (error) {
    console.warn(`[generate] primary query failed (${error.message}); falling back`);
  }
  if (results.length === 0) {
    aqUsed = '@ec_sale_filters=="new_release_discount"';
    results = await searchDeals(token, aqUsed);
  }
  console.log(`[generate] aq=${aqUsed} results=${results.length}`);

  const items = results
    .map(toItem)
    .filter((item) => item.title && item.url && item.discountPct > 0)
    .sort((a, b) => b.discountPct - a.discountPct)
    .slice(0, MAX_DEALS);

  if (items.length < MIN_DEALS_TO_PUBLISH) {
    console.error(`[generate] only ${items.length} valid deals — refusing to overwrite existing output`);
    process.exitCode = 0;
    return;
  }

  mkdirSync(path.join(SITE_DIR, "data"), { recursive: true });
  mkdirSync(path.join(SITE_DIR, "drafts"), { recursive: true });

  writeFileSync(
    path.join(SITE_DIR, "data", "deals.json"),
    JSON.stringify({ generatedAt, source: "unity-assetstore-coveo", count: items.length, items }, null, 2),
  );
  writeFileSync(path.join(SITE_DIR, "deals.html"), dealsPage(items, generatedAt));
  writeFileSync(path.join(SITE_DIR, "sitemap.xml"), sitemap(generatedAt));

  const { year, week } = isoWeek(new Date(generatedAt));
  const draftPath = path.join(SITE_DIR, "drafts", `${year}-W${String(week).padStart(2, "0")}-digest.md`);
  if (!existsSync(draftPath)) {
    writeFileSync(draftPath, weeklyDraft(items, generatedAt));
    console.log(`[generate] wrote weekly draft ${path.basename(draftPath)}`);
  }

  console.log(`[generate] wrote ${items.length} deals`);
}

main().catch((error) => {
  console.error(`[generate] FAILED: ${error.message} — existing output left untouched`);
  process.exitCode = 1;
});
