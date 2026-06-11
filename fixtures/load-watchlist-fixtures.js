(() => {
  const now = Date.now();
  const iso = (offsetMs) => new Date(now + offsetMs).toISOString();
  const hours = (value) => value * 60 * 60 * 1000;
  const days = (value) => value * 24 * hours(1);

  const base = {
    publisherId: "999000",
    publisherName: "Fixture Publisher",
    imageUrl: "",
    originalPrice: 49.99,
    currentPrice: 24.99,
    addedAt: iso(-days(4)),
    updatedAt: iso(0),
    lastCheckedAt: iso(-hours(1)),
    notificationState: {},
    notes: "Fixture row for manual UI testing.",
    tags: ["fixture"],
    watchMode: "sale",
    enteredSaleAt: iso(-days(2)),
    lastSaleSeenAt: iso(-hours(1)),
    schemaVersion: 1
  };

  const trackedAssets = [
    {
      ...base,
      productId: "900001",
      title: "Fixture Active Sale",
      url: "https://assetstore.unity.com/packages/package/900001",
      category: "tools",
      status: "active",
      statusLabel: `Sale ends ${new Date(iso(days(3))).toLocaleString()}`,
      sale: {
        type: "on_sale",
        startsAt: iso(-days(5)),
        endsAt: iso(days(3)),
        prices: {},
        discount: { value: 0.5 }
      },
      expiredAt: null
    },
    {
      ...base,
      productId: "900002",
      title: "Fixture Urgent Sale",
      url: "https://assetstore.unity.com/packages/package/900002",
      category: "art",
      currentPrice: 9.99,
      tags: ["fixture", "urgent"],
      status: "active",
      statusLabel: `Sale ends ${new Date(iso(hours(3))).toLocaleString()}`,
      sale: {
        type: "on_sale",
        startsAt: iso(-days(5)),
        endsAt: iso(hours(3)),
        prices: {},
        discount: { value: 0.8 }
      },
      expiredAt: null
    },
    {
      ...base,
      productId: "900003",
      title: "Fixture Expired Sale",
      url: "https://assetstore.unity.com/packages/package/900003",
      category: "audio",
      currentPrice: 19.99,
      status: "expired",
      statusLabel: `Sale ended ${new Date(iso(-days(2))).toLocaleString()}`,
      sale: {
        type: "on_sale",
        startsAt: iso(-days(16)),
        endsAt: iso(-days(2)),
        prices: {},
        discount: { value: 0.6 }
      },
      expiredAt: iso(-days(2))
    },
    {
      ...base,
      productId: "900004",
      title: "Fixture Error State",
      url: "https://assetstore.unity.com/packages/package/900004",
      category: "tools",
      currentPrice: null,
      originalPrice: null,
      status: "error",
      statusLabel: "Fixture lookup failed",
      sale: null,
      expiredAt: null,
      lastError: "Fixture lookup failed"
    },
    {
      ...base,
      productId: "900005",
      title: "Fixture Watching No Sale",
      url: "https://assetstore.unity.com/packages/package/900005",
      category: "templates",
      currentPrice: 49.99,
      status: "watching_no_sale",
      statusLabel: "Watching for the next sale",
      sale: null,
      expiredAt: null,
      enteredSaleAt: null,
      lastSaleSeenAt: null,
      tags: ["fixture", "watch"]
    }
  ];

  chrome.storage.local.set({ trackedAssets }).then(() => {
    console.log(`Loaded ${trackedAssets.length} Unity Sale Watch fixtures.`);
  });
})();
