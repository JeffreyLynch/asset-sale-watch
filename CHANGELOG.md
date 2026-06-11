# Asset Sale Watch Changelog

All notable changes to this extension should be recorded here. Every extension code release must bump `manifest.json`; documentation-only updates may be noted without changing the extension version.

## 0.7.1 — Visual polish: design tokens, hover/active states and transitions, dark-mode status pills, accessible focus ring, image skeletons. CSS-only.

## 0.7.0 - 2026-06-11

- Renamed to Asset Sale Watch for trademark compliance.
- Unified affiliate URL helpers into one shared module.
- Added AF link support for share/social surfaces.
- Removed the tabs permission — current-page detection now relies on host permissions only (no more 'read browsing history' install warning).
- Bumped the extension version.

## 0.6.28 - 2026-05-28

- Added automated Node QA for affiliate/release-mode URL behavior, quiet notification defaults, notification target allowlisting, affiliate notification disclosure, and JavaScript syntax checks.
- Added an explicit `UNITY_SALE_WATCH_AFFILIATE.mode` switch so personal/local builds can disable affiliate rewriting and disclosures while affiliate release builds keep them enabled.
- Made notification clicks actionable while constraining targets to Unity Asset Store URLs or the extension's own pages.
- Added runtime health diagnostics for messages, alarms, and background errors.
- Quieted nonessential notification defaults for new installs while preserving explicit existing alert choices during settings migration.

## 0.6.27 - 2026-05-13

- Removed the green Share Deal button styling so share/export controls match the subdued secondary action style.

## 0.6.26 - 2026-05-13

- Moved share, copy, and open actions into right-aligned secondary action groups on asset, discovery, publisher, and publisher-sale cards.
- Repositioned Deal Radar as a right-side Exports utility tab instead of a core watch-list tab.
- Kept watch, check, save, dismiss, publisher, and remove actions grouped with the main workflow controls.

## 0.6.25 - 2026-05-10

- Added Reset Filters buttons for Watch List, New Release Sales, and New Assets views.
- Added a Deal Radar tab that generates a weekly markdown digest from cached watched assets, discovery results, new assets, and publisher sale items.
- Added Copy Radar and Copy Social Summary actions for human-reviewed sharing.

## 0.6.24 - 2026-05-10

- Added a dedicated Social post share format for short X/LinkedIn-style updates.
- Share card generation now uses the asset thumbnail when the browser can load it safely.
- Share card generation falls back to the generated Unity Sale badge when a thumbnail is unavailable or blocked.

## 0.6.23 - 2026-05-10

- Added a Share Deal composer with format options for card + text, plain text, Reddit-safe text, Markdown, and clean non-affiliate links.
- Share previews are editable before copying, while card download/copy remains generated locally.
- Added clean Asset Store link generation that removes affiliate parameters for trust-sensitive sharing.

## 0.6.22 - 2026-05-10

- Added Share Deal actions for watched assets, New Release Sales, New Assets, and publisher sale items.
- Share Deal automatically builds share text with the affiliate-safe Asset Store link and disclosure.
- Share Deal generates a PNG social card locally, copies the card/text package when supported, and falls back to copying text plus downloading the PNG.

## 0.6.21 - 2026-05-10

- Added a release checklist covering smoke tests, permissions, privacy, affiliate compliance, store listing prep, and packaged release validation.
- Added privacy notes for local storage, Unity metadata requests, affiliate links, and backups.
- Added a store listing draft with feature copy, permission rationale, disclosure text, and screenshot checklist.
- Added an ethical growth roadmap for shareable deal cards, public deal pages, weekly Deal Radar, creator/publisher loops, and human-approved promotion.

## 0.6.20 - 2026-05-10

- Softened the affiliate disclosure to "Using these affiliate links helps support this extension."
- Added a Copy Diagnostics action next to Run Diagnostics in Settings.
- Persisted watch-list, New Release Sales, and New Assets select/checkbox filter choices across reloads.
- Kept dynamic publisher, tag, and category filter choices pending until matching cached options are available.

## 0.6.19 - 2026-05-09

- Added Copy Link actions for watched assets, discovery items, publisher sale items, publisher cards, and popup assets.
- Copied Asset Store links use the centralized affiliate URL helper.

## 0.6.18 - 2026-05-09

- Made New Assets queue and age setting normalization independent of helper-function lookup.
- Moved diagnostics output into the Settings dialog so results are visible while the modal is open.
- Diagnostics now reports settings normalization errors instead of failing before output.

## 0.6.17 - 2026-05-09

- Added Settings diagnostics to report the live background version, helper loading state, normalized settings, and storage counts.
- Diagnostics now make stale service-worker reload issues easier to identify from the watch-list page.

## 0.6.16 - 2026-05-09

- Added on-demand description caching for publisher sale items.
- Publisher sale items now show a short cached description preview when available.

## 0.6.15 - 2026-05-09

- Added Select All and Select None controls for New Release Sales and New Assets selections.
- Select All applies to the current filtered result set.

## 0.6.14 - 2026-05-09

- Added Watch List filters for price state, minimum discount, and cached description status.
- Watch List filters now support finding free, paid, discounted, unknown-price, described, or missing-description assets.

## 0.6.13 - 2026-05-09

- Added New Release Sales filters for publisher, category, minimum discount, and description cache status.
- Added New Assets filters for publisher, minimum discount, and description cache status.
- Kept discovery selections pruned as filters narrow the visible result set.

## 0.6.12 - 2026-05-09

- Added optional watched-asset description collection during refreshes.
- Added on-demand Fetch Description and Refresh Description actions for watched assets, New Release Sales, and New Assets.
- Stored cleaned plain-text descriptions with fetched timestamps and source URLs.
- Included cached descriptions in watch-list and discovery search.

## 0.6.11 - 2026-05-09

- Added affiliate link rewriting for outbound Unity Asset Store links using the configured AID.
- Centralized Asset Store outbound URL handling in `affiliate.js`.
- Added a visible affiliate tracking disclosure in the popup and watch-list page.
- Made popup asset titles clickable through the same outbound link helper.

## 0.6.10 - 2026-05-09

- Added selectable cards in New Release Sales and New Assets.
- Added Watch Selected, Dismiss Selected, and Clear Selection bulk actions for both discovery queues.
- Bulk actions confirm before changing selected items and prune selections when filters change.

## 0.6.9 - 2026-05-09

- Added JSON backup export for watched assets, settings, discovery cache, and watched publishers.
- Added JSON backup import with confirmation before replacing local extension data.
- Added backup restore normalization so imported data is migrated through current schemas.

## 0.6.8 - 2026-05-09

- Persisted New Assets state, category, and Show hidden filters across watch-list reloads.
- Added settings migration defaults for New Assets view preferences.
- Preserved New Assets filter preferences when saving the main settings dialog.

## 0.6.7 - 2026-05-09

- Raised the New Assets queue size option to 1,000 assets.
- Raised the New Assets age window option to 30 days.
- Added New Assets filters for category and sale/price state.
- New Assets refresh now pages through Unity results until it reaches the queue limit, the age limit, or the 1,000-item hard cap.

## 0.6.6 - 2026-05-09

- Added New Assets settings for queue size: 48, 100, 250, or 500 assets.
- Added New Assets settings for age window: 3, 7, or 14 days.
- New Assets refresh now pages through Unity results until it reaches the queue limit, the age limit, or the 500-item hard cap.
- New Assets summary now shows the active queue and age settings.

## 0.6.5 - 2026-05-09

- Added a New Assets tab for recently first-published Asset Store items, whether or not they are on sale.
- Added a bounded 48-item new-assets queue sourced from Unity's `first_published_at` metadata.
- Added search, show-hidden, refresh, Watch, Dismiss, Open, and Watch Publisher actions for New Assets.
- Scheduled checks now refresh the New Assets queue alongside sale discovery.

## 0.6.4 - 2026-05-09

- Added optional New Release Sales digest notifications for newly discovered launch discounts.
- Kept manual discovery refreshes quiet while scheduled checks honor the Discovery digest setting.
- Added duplicate suppression for discovery digests using `digestReportedProductIds`.

## 0.6.3 - 2026-05-09

- Added publisher avatar storage and rendering on the Publishers tab.
- Backfilled watched publisher avatars from Unity publisher profile metadata during publisher checks.
- Added a browser action badge showing watched sales ending within 24 hours.
- Updated publisher-page context extraction to prefer Unity publisher avatars.

## 0.6.2 - 2026-05-09

- Added search to the New Release Sales view.
- Added a floating Top button on the full watch-list page.
- Linked publisher names on popup, watch-list, and discovery cards to Unity publisher pages.
- Added a per-publisher Clear Reports action so publisher notification history can be reset.
- Fixed sale-ending reminders to report the actual remaining time when a scheduled check catches a later threshold.

## 0.6.1 - 2026-05-08

- Added publisher refresh checks that scan watched publishers for active or upcoming discounted items.
- Added duplicate-safe publisher sale alerts using `reportedProductIds`.
- Added current publisher sale items to the Publishers tab with one-click Watch actions.
- Added a Check Publishers button for manual publisher refreshes without noisy notifications.

## 0.6.0 - 2026-05-08

- Added `watchedPublishers` storage with migration/defaults for publisher ID, name, added date, last check date, sale item counts, reported product IDs, and notification state.
- Added Watch Publisher actions from the popup, publisher-page context menu, watched asset rows, and discovery rows.
- Added a Publishers tab on the full watch-list page with watched asset counts, discovery sale counts, open, and unwatch controls.
- Improved publisher-page context extraction so publisher names can be inferred from profile pages.

## 0.5.5 - 2026-05-08

- Fixed first-published extraction so discovery reads the date from the matching product record instead of the first product record on the detail page.
- Marked first-published metadata with a source version so older cached discovery dates are rechecked on the next refresh.
- Updated the discovery summary hint to ask for date verification when cached first-published metadata is stale.

## 0.5.4 - 2026-05-08

- Kept unknown first-published dates from sorting as if they were latest-release dates when known first-published dates are available.
- Added a discovery summary hint when cached results still need Refresh Discovery to backfill first-published dates.

## 0.5.3 - 2026-05-08

- Changed discovery date sorting to use the package detail page's `firstPublishedDate` instead of Coveo's update timestamp.
- Cached separate `firstPublishedAt` and `latestReleaseAt` values for New Release Sales results.
- Renamed the discovery sort/card label to First published and displayed Latest release separately.

## 0.5.2 - 2026-05-08

- Renamed the discovery date sort label to Added to store for clearer intent.
- Displayed the Unity listing date on each New Release Sales discovery card.
- Preferred Unity's `date` field over `sysdate` when caching discovery listing dates.

## 0.5.1 - 2026-05-08

- Added a New Release Sales sort control with Date added, Expiring first, and Expiring last options.
- Persisted the discovery sort preference in settings and migrated a default value.
- Changed the discovery default to Date added so the newest launch discounts appear first.

## 0.5.0 - 2026-05-08

- Added New Release Sales discovery as a second full watch-list view.
- Added `discoveryCache` storage with cached results, fetch timestamp, dismissed product IDs, and refresh errors.
- Added Unity Coveo discovery refresh using the `new_release_discount` sale filter.
- Added Watch, Dismiss, and Open actions for discovery items.
- Hid already watched and dismissed discovery items by default, with a Show hidden toggle.
- Sorted discovery by sale ending soon, then highest discount, then newest metadata date.
- Scheduled checks now refresh discovery cache in the background.

## 0.4.4 - 2026-05-08

- Raised expired entries in Priority sorting so missed sales appear near the top.
- Priority now orders errors, urgent active sales, recently expired entries, active sales, upcoming sales, no-sale watches, then pending entries.

## 0.4.3 - 2026-05-08

- Renamed the default watch-list sort from "Needs attention" to "Priority".
- Tightened priority sorting so errors and urgent active sales rise first.
- Tightened active-ending-soon sorting so expired sale dates do not jump ahead of live/upcoming deadlines.
- Added a DevTools fixture loader for active, urgent, expired, error, and no-sale watch-list states.

## 0.4.2 - 2026-05-08

- Moved watch-list settings into a discreet dialog opened from the header.
- Kept the watch list and filters contiguous so settings no longer interrupt list review.

## 0.4.1 - 2026-05-08

- Added conservative pre-1.0 versioning guidance to the roadmap.
- Added a watch-list settings panel for check interval, reminder thresholds, expired retention, currency, theme, and alert toggles.
- Added background settings migration/defaults while preserving existing theme and sort settings.
- Made the scheduled Chrome alarm honor 15m, 30m, 1h, and 6h check interval settings.
- Made reminder notifications and expired cleanup honor saved settings.
- Added alert toggles for asset sale entry, sale ending reminders, sale end changes, publisher sale items, and discovery digest.

## 0.4.0 - 2026-05-08

- Added editable notes and comma-separated tags for watched assets on the full watch-list page.
- Added persistent notes/tags storage updates through the service worker.
- Added publisher, tag, and category filters that combine with status and text search.
- Expanded text search to include notes, tags, and category metadata.
- Marked the no-sale asset workflow complete now that assets can be watched without current sale metadata.

## 0.3.0 - 2026-05-08

- Added visible version labels to the popup and full watch-list page.
- Added storage migration defaults for notes, tags, category, watch mode, sale tracking dates, and notification state.
- Added first-class `watching_no_sale` support so assets without current sale metadata stay on the watch list.
- Treat old expired Unity sale metadata as no-sale when an asset is first watched without an existing sale history.
- Added notifications for watched no-sale assets when sale metadata appears or the observed price drops below the original price.
- Updated expired cleanup so no-sale watched assets are not removed as expired entries.
- Documented extension reload steps in the README.

## 0.2.4 - 2026-05-08

- Improved listing-page right-click adds by using exact product lookup by product ID.
- Added fallback sale resolution so product card metadata issues do not block assets that can be resolved directly.
- Kept existing watch entries updated instead of duplicating them when the same asset is added again.

## 0.2.3 - 2026-05-08

- Made sale deadline and time-left information more prominent in the watch-list view.
- Derived live status from sale start/end times so expired entries stop appearing as active.
- Split ending-soon and expired visual treatment: urgent deadlines use orange, expired items use red.

## 0.2.2 - 2026-05-08

- Added stronger price styling and discount badges to the watch-list page.
- Added watch-list sorting options.
- Improved right-click support for Unity Asset Store listing and search pages.

## 0.2.1 - 2026-05-07

- Added dark mode support.
- Improved popup and watch-list styling.
- Added better management controls for checking and removing watched assets.

## 0.2.0 - 2026-05-07

- Moved the extension into the Chrome Extensions workspace.
- Added context-menu workflow for Unity Asset Store package and publisher/listing pages.
- Added popup management and full watch-list page.
- Added scheduled checks, notifications, and expired-entry retention.
