# app

## About
A student-built PWA.

## Files
| File | Purpose |
|------|---------|
| index.html | Main page |
| styles.css | Styling |
| app.js | Logic, validation & GitHub storage |
| manifest.json | PWA manifest |
| sw.js | Offline support |
| data.json | App data (auto-created on first save) |
| README.md | This file |
| logo.png | App logo |

## Data Dictionary
| ID | Type | Label | Validations | Extra |
|----|------|-------|-------------|-------|
| field_1 | button | Button | None | — |
| field_2 | date | Date | None | — |
| field_3 | datetime | Date+Time | None | — |
| field_4 | text | Text | None | — |
| field_5 | number | Number | None | — |
| field_6 | textarea | Multi-line | None | — |
| field_7 | dropdown | Dropdown | None | — |
| field_8 | image | Image | None | — |
| field_9 | video | YouTube | None | — |

## Layout: 3 Columns (3 columns)

## Color Theme: Blush Rose
- Primary: #e8a0bf | Secondary: #f2c6de | Background: #fdf6f9

## Flow Logic
No custom logic.

## Data Storage
This app stores data in a `data.json` file in this GitHub repository using the GitHub API.
All users sharing the same repo URL see the same data.
Data is also cached in localStorage for offline use.

## How to Run
1. Deploy to GitHub Pages
2. Open the GitHub Pages URL in any browser
3. Share the link — all users see the same data!

## Install on Phone
1. Open the GitHub Pages URL on your phone
2. Tap browser menu → Add to Home Screen
3. The app works offline after first load

---
Built with App Co-Pilot
