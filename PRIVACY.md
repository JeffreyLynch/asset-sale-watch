# Privacy Notes

Unity Sale Watch is designed as a local browser extension.

## Data Stored Locally

The extension stores these items in `chrome.storage.local`:

- Watched Asset Store assets, including product IDs, publisher IDs, titles, prices, sale metadata, notes, tags, and cached descriptions.
- Watched publishers and recently reported sale item IDs.
- Discovery cache for New Release Sales and New Assets.
- User settings, alert preferences, filter preferences, dismissed items, and notification markers.

## Network Requests

The extension requests Unity Asset Store metadata from:

- `https://assetstore.unity.com/*`
- `https://unitytechnologiesproductionmkahteav.org.coveo.com/*`

These requests are used to resolve asset metadata, sale windows, publisher data, discovery results, and cached descriptions.

## Analytics and Tracking

The extension does not collect analytics, send telemetry, or upload watch-list data to a third-party service.

Outbound Unity Asset Store links may include the configured affiliate AID when affiliate links are enabled. The UI displays this disclosure when enabled: "Using these affiliate links helps support this extension."

## Backups

Backup export and import are user-initiated. Exported backup JSON files are created locally by the browser and are not uploaded by the extension.

## Public Release Notes

Before public distribution, verify the final store-listing privacy form against the actual release build and the current browser-store requirements.
