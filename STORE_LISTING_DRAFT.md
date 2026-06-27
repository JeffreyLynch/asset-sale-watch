# Store Listing Draft

## Extension Name

Asset Sale Watch - Unity Asset Store Deals

## Short Description

Unity Asset Store price tracker: sale alerts, publisher watches, price drops - watchlist stays local.

## Full Description

Asset Sale Watch is a Unity Asset Store price tracker and sale-alert extension for developers who want to catch price drops, publisher sales, flash deals, and sale-ending deadlines without juggling tabs.

Core features:

- Watch Unity Asset Store assets from asset pages, publisher pages, and sale/search listings.
- Track assets even when they are not currently on sale, then get notified when they enter a sale or drop in price.
- See sale end times, time left, prices, discounts, publishers, categories, and cached descriptions.
- Browse New Release Sales and New Assets from the Asset Store metadata feed.
- Watch publishers for newly discounted assets.
- Add notes and tags to assets you are considering.
- Filter and sort watch lists, discovery lists, and new assets.
- Configure reminder timing, refresh cadence, expired-entry retention, theme, and alerts.
- Export and import local backups.

Privacy-first posture:

Asset Sale Watch does not collect telemetry, track personal information, require an account, sell data, or upload your watch list to a third-party service. Watch lists, notes, tags, settings, and backups stay local in your browser unless you choose to export a backup file.

Affiliate disclosure:

Some outbound Unity Asset Store links may include an affiliate identifier. Using these affiliate links helps support this extension.

This extension is not affiliated with, endorsed by, sponsored by, or approved by Unity Technologies.

## Permission Rationale

- Storage: saves watched assets, settings, notes, tags, discovery cache, publisher watches, and backups.
- Alarms: checks watched assets and publishers on a schedule.
- Notifications: alerts when watched assets enter sale, sales are ending, sale end times change, or watched publishers have new sale items.
- Context menus: adds assets and publishers from Unity Asset Store pages with right-click actions.
- No browsing-history-level tabs permission is requested; current-page detection uses Unity Asset Store host access only.
- Unity Asset Store host access: reads supported Asset Store pages and metadata needed to resolve assets, publishers, sale windows, and descriptions.
- Coveo host access: searches Unity's public listing metadata used by the Asset Store.

## Screenshot Checklist

- [ ] Popup with watched assets and version label.
- [ ] Watch List with price, discount, sale end, time left, notes, and tags.
- [ ] New Release Sales with sorting and filters.
- [ ] New Assets with queue settings applied.
- [ ] Publishers tab with publisher avatar and sale items.
- [ ] Settings dialog with alert, theme, retention, queue, diagnostics, backup, and description controls.
