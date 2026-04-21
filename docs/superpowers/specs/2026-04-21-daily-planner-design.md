# Daily Planner — Design Spec
**Date:** 2026-04-21

## Overview

A personal daily-driver web page with two tabs: a persistent task list and a named, archivable grocery list. Hosted on GitHub Pages, backed by Supabase for cross-device access (desktop + phone). Auto-prints the task list each morning via Windows Task Scheduler.

---

## Architecture

- **Frontend:** Single `index.html`, vanilla JS, Supabase JS client loaded from CDN
- **Backend:** Supabase (existing instance) — Postgres via REST API
- **Hosting:** GitHub Pages (new repo: `daily-planner`)
- **Config:** `config.js` holds Supabase URL + anon key, excluded from git via `.gitignore`
- **No build step** — deploys directly from the repo root

---

## Data Model

### `tasks`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() |
| `text` | text | Task content |
| `completed` | boolean | Default false |
| `created_at` | timestamptz | Default now() |

### `grocery_lists`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | User-provided name |
| `created_at` | timestamptz | Default now() |
| `archived_at` | timestamptz | Null = currently active |

### `grocery_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `list_id` | uuid | FK → grocery_lists.id |
| `text` | text | Item content |
| `removed` | boolean | Default false |
| `created_at` | timestamptz | Default now() |

One active grocery list at a time (where `archived_at IS NULL`). Archiving sets `archived_at` to now(). Reloading an archived list copies its non-removed items into a new active list.

---

## UI

### Layout
- Tab bar at top: **Tasks** | **Groceries**
- Clean, minimal — readable on phone and desktop
- Print stylesheet scoped to tasks only

### Tasks Tab
- Text input + Add button at top
- List of tasks below, each with:
  - Checkbox (marks `completed`, shows strikethrough)
  - Task text
  - Delete button (removes from DB entirely)
- No auto-clear — user removes tasks manually

### Groceries Tab
- Active list title displayed at top (editable inline or via prompt)
- Text input + Add button to add items to active list
- Each item has a delete button (sets `removed = true`, visually removes)
- **Archive List** button — sets `archived_at`, prompts for a new active list title
- If no active list exists (first load or after archiving without creating a new one), tab shows a "Start a new list" prompt asking for a title
- Collapsible **Archived Lists** section below:
  - Shows past lists by title + date
  - Each has a **Reload** button — copies non-removed items into a new active list with the same title

---

## Auto-Print

- Page detects `?print=1` query param on load and calls `window.print()` automatically
- Print stylesheet hides tab UI, groceries tab, and all interactive controls — renders only the task list as clean black-on-white text
- Windows Task Scheduler runs a `.bat` or `.vbs` script each morning at a set time that opens:
  `https://<username>.github.io/daily-planner/?print=1`
  in Chrome with the default printer configured

---

## Security

- Supabase anon key is public by design (Supabase's model) but the project is personal-use only
- Row-Level Security (RLS) can be left permissive since there's no auth and no sensitive data
- `config.js` is gitignored to avoid committing the key to a public repo — user sets it up locally and on any device they use

---

## Files

```
daily-planner/
├── index.html          # Full app — tabs, task list, grocery list
├── config.js           # Supabase URL + anon key (gitignored)
├── config.example.js   # Template showing required keys
├── style.css           # App styles + print stylesheet
├── app.js              # All JS logic
├── print.bat           # Windows Task Scheduler script
├── .gitignore
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-21-daily-planner-design.md
```
