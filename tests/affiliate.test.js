const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const affiliatePath = path.join(projectRoot, "affiliate.js");

function loadAffiliate(sourceTransform = (source) => source) {
  const source = sourceTransform(fs.readFileSync(affiliatePath, "utf8"));
  const sandbox = { URL };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.__exports = { assetStoreUrl, buildAfLink, cleanAssetStoreUrl, affiliateDisclosureText, config: UNITY_SALE_WATCH_AFFILIATE };`, sandbox);
  return sandbox.__exports;
}

function testAffiliateModeAddsAidAndDisclosure() {
  const affiliate = loadAffiliate();
  const aid = affiliate.config.aid;
  assert.strictEqual(affiliate.config.mode, "affiliate");
  assert.strictEqual(
    affiliate.assetStoreUrl("https://assetstore.unity.com/packages/tools/example-123?foo=bar"),
    `https://assetstore.unity.com/packages/tools/example-123?foo=bar&aid=${aid}`
  );
  assert.strictEqual(
    affiliate.affiliateDisclosureText(),
    "Using these affiliate links helps support this extension."
  );
}

function testPersonalModeDoesNotRewriteLinksOrShowDisclosure() {
  const affiliate = loadAffiliate((source) => source.replace('mode: "affiliate"', 'mode: "personal"'));
  const input = "https://assetstore.unity.com/packages/tools/example-123?foo=bar";
  assert.strictEqual(affiliate.config.mode, "personal");
  assert.strictEqual(affiliate.assetStoreUrl(input), input);
  assert.strictEqual(affiliate.affiliateDisclosureText(), "");
}

function testCleanUrlRemovesAffiliateParameters() {
  const affiliate = loadAffiliate();
  const aid = affiliate.config.aid;
  assert.strictEqual(
    affiliate.cleanAssetStoreUrl(`https://assetstore.unity.com/packages/tools/example-123?aid=${aid}&pubref=x&camref=y&foo=bar`),
    "https://assetstore.unity.com/packages/tools/example-123?foo=bar"
  );
}

function testBuildAfLinkWrapsAssetStoreUrlAndStripsExistingAid() {
  const affiliate = loadAffiliate();
  const aid = affiliate.config.aid;
  assert.strictEqual(
    affiliate.buildAfLink(`https://assetstore.unity.com/packages/tools/example-123?foo=bar&aid=${aid}`),
    `https://af.unity.com/sr/camref:${aid}/destination:https://assetstore.unity.com/packages/tools/example-123?foo=bar`
  );
}

function testBuildAfLinkPassesThroughInPersonalMode() {
  const affiliate = loadAffiliate((source) => source.replace('mode: "affiliate"', 'mode: "personal"'));
  const input = "https://assetstore.unity.com/packages/tools/example-123?foo=bar";
  assert.strictEqual(affiliate.buildAfLink(input), input);
}

function testBuildAfLinkPassesThroughNonAssetStoreUrls() {
  const affiliate = loadAffiliate();
  const input = "https://example.com/packages/tools/example-123?foo=bar";
  assert.strictEqual(affiliate.buildAfLink(input), input);
}

function testCleanUrlUnwrapsAfLinks() {
  const affiliate = loadAffiliate();
  const aid = affiliate.config.aid;
  assert.strictEqual(
    affiliate.cleanAssetStoreUrl(`https://af.unity.com/sr/camref:${aid}/destination:https://assetstore.unity.com/packages/tools/example-123?foo=bar&aid=${aid}&pubref=x&camref=y`),
    "https://assetstore.unity.com/packages/tools/example-123?foo=bar"
  );
}

const tests = [
  testAffiliateModeAddsAidAndDisclosure,
  testPersonalModeDoesNotRewriteLinksOrShowDisclosure,
  testCleanUrlRemovesAffiliateParameters,
  testBuildAfLinkWrapsAssetStoreUrlAndStripsExistingAid,
  testBuildAfLinkPassesThroughInPersonalMode,
  testBuildAfLinkPassesThroughNonAssetStoreUrls,
  testCleanUrlUnwrapsAfLinks
];

for (const test of tests) {
  test();
  console.log(`✓ ${test.name}`);
}
