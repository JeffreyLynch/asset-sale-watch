const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const affiliatePath = path.join(projectRoot, "affiliate.js");
const backgroundPath = path.join(projectRoot, "background.js");

function noop() {}

function loadBackground() {
  const affiliateSource = fs.readFileSync(affiliatePath, "utf8");
  const source = fs.readFileSync(backgroundPath, "utf8").replace(/^import "\.\/affiliate\.js";\r?\n\r?\n?/, "");
  const chrome = {
    runtime: {
      getURL: (value = "") => `chrome-extension://test-id/${value}`,
      getManifest: () => ({ version: "0.0.0-test" }),
      onInstalled: { addListener: noop },
      onStartup: { addListener: noop },
      onMessage: { addListener: noop }
    },
    contextMenus: {
      onClicked: { addListener: noop },
      removeAll: async () => {},
      create: async () => {}
    },
    alarms: {
      onAlarm: { addListener: noop },
      get: async () => null,
      clear: async () => {},
      create: async () => {}
    },
    notifications: {
      onClicked: { addListener: noop },
      create: async () => {},
      clear: async () => {}
    },
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {}
      }
    },
    action: {
      setBadgeBackgroundColor: async () => {},
      setBadgeText: async () => {},
      setTitle: async () => {}
    },
    tabs: {
      create: async () => {},
      query: async () => [],
      get: async () => ({}),
      sendMessage: async () => ({})
    }
  };
  const sandbox = {
    URL,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    JSON,
    RegExp,
    Error,
    Promise,
    Intl,
    console,
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    chrome,
    self: { addEventListener: noop }
  };
  vm.createContext(sandbox);
  vm.runInContext(affiliateSource, sandbox);
  vm.runInContext(`${source}\nthis.__exports = { normalizeSettings, assetStoreUrl, getWatchlistUrl, getAssetNotificationUrl, normalizeNotificationUrl, pruneNotificationTargets, affiliateNotificationMessage, config: UNITY_SALE_WATCH_AFFILIATE };`, sandbox);
  return sandbox.__exports;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function testAlertDefaultsAreQuietExceptAssetSale() {
  const background = loadBackground();
  assert.deepStrictEqual(plain(background.normalizeSettings({}).alerts), {
    assetEntersSale: true,
    saleEndingReminders: false,
    saleEndChanged: false,
    publisherNewSale: false,
    discoveryDigest: false
  });
}

function testAlertSettingsRespectExplicitOptInAndOptOut() {
  const background = loadBackground();
  assert.deepStrictEqual(plain(background.normalizeSettings({ alerts: {
    assetEntersSale: false,
    saleEndingReminders: true,
    saleEndChanged: true,
    publisherNewSale: true,
    discoveryDigest: true
  } }).alerts), {
    assetEntersSale: false,
    saleEndingReminders: true,
    saleEndChanged: true,
    publisherNewSale: true,
    discoveryDigest: true
  });
}

function testAssetNotificationUrlUsesAffiliateAssetStoreUrl() {
  const background = loadBackground();
  const aid = background.config.aid;
  assert.strictEqual(
    background.getAssetNotificationUrl({ url: "https://assetstore.unity.com/packages/tools/example-123?foo=bar" }),
    `https://assetstore.unity.com/packages/tools/example-123?foo=bar&aid=${aid}`
  );
}

function testNormalizeSettingsUsesCurrentQuietDefaultsVersion() {
  const background = loadBackground();
  assert.strictEqual(background.normalizeSettings({}).quietNotificationDefaultsVersion, 1);
}

function testAffiliateNotificationMessagesDiscloseAffiliateLinks() {
  const background = loadBackground();
  assert.strictEqual(
    background.affiliateNotificationMessage("Sale ends soon."),
    "Sale ends soon. Opens an affiliate Asset Store link."
  );
}

function testNotificationUrlAllowlist() {
  const background = loadBackground();
  assert.strictEqual(background.normalizeNotificationUrl("https://assetstore.unity.com/packages/package/123"), "https://assetstore.unity.com/packages/package/123");
  assert.strictEqual(background.normalizeNotificationUrl("chrome-extension://test-id/watchlist.html"), "chrome-extension://test-id/watchlist.html");
  assert.strictEqual(background.normalizeNotificationUrl("https://assetstore.unity.com.evil.test/packages/package/123"), "");
  assert.strictEqual(background.normalizeNotificationUrl("https://example.com/"), "");
  assert.strictEqual(background.normalizeNotificationUrl("javascript:alert(1)"), "");
}

const tests = [
  testAlertDefaultsAreQuietExceptAssetSale,
  testAlertSettingsRespectExplicitOptInAndOptOut,
  testNormalizeSettingsUsesCurrentQuietDefaultsVersion,
  testAssetNotificationUrlUsesAffiliateAssetStoreUrl,
  testAffiliateNotificationMessagesDiscloseAffiliateLinks,
  testNotificationUrlAllowlist
];

for (const test of tests) {
  test();
  console.log(`✓ ${test.name}`);
}
