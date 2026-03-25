# Backlog (Not in current scope)

Add new requests here. Do not implement unless promoted.

Template:

- Title:
- Description:
- Value:
- Complexity (S/M/L):
- Dependencies:
- Notes:

---

## Player Profile — Career Snapshot (Deferred from Profile v1)

- **Title:** Profile page — career stats summary card (Option C)
- **Description:** Add a "Career Snapshot" section to the player Profile page showing career scoring average, total games played, and season-best stat — all derived from existing `stat_entries` data. No new DB columns needed; pull from `usePlayerStats` hook.
- **Value:** Makes the Profile feel like a real player card, adds pride/identity beyond just account settings.
- **Complexity:** S (data already exists, purely a display component)
- **Dependencies:** Profile page (v1) must exist first; `usePlayerStats` hook already returns career avg data.
- **Notes:** Could display: career PPG, career RPG, career APG, games played count, season-best single-game score. Consider a "player card" aesthetic — jersey number prominent, stats in a horizontal strip below the avatar.
