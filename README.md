# Asset Sale Watch

**Never miss a Unity Asset Store sale again.** Asset Sale Watch is a free, local-first browser extension that watches the assets and publishers you care about and alerts you the moment a sale starts — or before one ends.

🌐 **Website / today's deals / sale calendar:** https://jeffreylynch.github.io/asset-sale-watch/

> Chrome Web Store listing: coming soon (in review). Until then, load it unpacked — see below.

## Features

- **Sale-end countdowns** with reminders at 48h / 24h / 6h / 1h — flash deals rotate daily during big sales and are designed to be missed.
- **Publisher watching** — get notified when publishers you follow discount anything, including Publisher of the Week.
- **Price-drop alerts** — watch any asset, even ones not on sale; get pinged when it enters a sale or drops in price.
- **New-release discovery** — browse launch discounts and recently published assets with category/discount/price filters.
- **Notes, tags, and filters** on everything you watch; JSON backup export/import.
- **Local-first privacy** — no account, no telemetry, no server. Everything stays in your browser. See the [privacy policy](https://jeffreylynch.github.io/asset-sale-watch/privacy.html).

## Install

**From source (until the store listing is live):**

1. Download or clone this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository folder.
5. Open any [Unity Asset Store](https://assetstore.unity.com/) asset page, right-click, and choose **Add to Asset Sale Watch** — or click the toolbar icon.

## How it works

The extension reads publicly available listing metadata from Unity's own services (the Asset Store website and its Coveo search backend) on a schedule you control. Nothing is scraped from your browsing, nothing is injected into store pages, and no data leaves your machine.

## How it's funded

Asset Sale Watch is free and open source. Some outbound Asset Store links generated **inside the extension's own UI** — and deal links on the companion website — are affiliate links: purchases made through them earn a small commission at no extra cost to you. This is disclosed in the UI next to those links. The extension never modifies or injects anything into the Asset Store pages you browse, and the share/copy features deliberately produce clean, non-affiliate links.

## Development

No build step, no dependencies — plain JavaScript, Manifest V3.

```
npm run qa     # run tests + syntax checks
```

The companion site under `site/` is regenerated automatically every 12 hours by the [site workflow](.github/workflows/site.yml), which queries Unity's public listing API and deploys to GitHub Pages.

## License

[MIT](LICENSE).

Asset Sale Watch is not sponsored by or affiliated with Unity Technologies or its affiliates. "Unity" and "Unity Asset Store" are trademarks or registered trademarks of Unity Technologies or its affiliates in the U.S. and elsewhere.
