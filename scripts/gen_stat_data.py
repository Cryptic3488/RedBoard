"""
Generates sample stat CSV files for RedBoard demo data.
Output: sample_data/practices/ and sample_data/games/
Player names are generic — use the match-override UI to map them to your roster.
"""

import csv, random, math, os
from pathlib import Path

random.seed(7)

OUT = Path(__file__).parent.parent / "sample_data"
(OUT / "practices").mkdir(parents=True, exist_ok=True)
(OUT / "games").mkdir(parents=True, exist_ok=True)

# ── Roster ────────────────────────────────────────────────────────────────────
# name,               min,  pts,  reb,  ast,  stl,  blk,  to
PLAYERS = [
    ("Andrew Byerly",      28,   13,    6,    4,   1.5,  0.8,  2.0),
]

HEADERS = ["Player", "Min", "Pts", "FGM", "FGA", "3PM", "3PA",
           "FTM", "FTA", "Reb", "OREB", "DREB",
           "Ast", "Stl", "Blk", "TO", "PF"]

def jitter(base, pct=0.25, lo=0):
    """Return base ± pct of base, floored at lo."""
    spread = base * pct
    return max(lo, base + random.uniform(-spread, spread))

def row(player, trend=0.0, scale=1.0):
    name, min_b, pts_b, reb_b, ast_b, stl_b, blk_b, to_b = player

    # Apply trend and scale, add noise
    pts  = round(jitter((pts_b + trend * 0.6) * scale, 0.25, 0))
    reb  = round(jitter((reb_b + trend * 0.2) * scale, 0.25, 0))
    ast  = round(jitter((ast_b + trend * 0.15) * scale, 0.30, 0))
    stl  = round(jitter(stl_b * scale, 0.40, 0))
    blk  = round(jitter(blk_b * scale, 0.50, 0))
    to   = round(jitter(max(0.3, to_b - trend * 0.05) * scale, 0.35, 0))
    mins = round(jitter(min_b * scale, 0.10, 2))
    pf   = round(jitter(2.0, 0.40, 0))

    # Shooting splits derived from points
    # Assume ~35% of points from 3s, ~10% from FT, rest from 2s
    pts3  = round(pts * 0.32)
    ptsFT = round(pts * 0.12)
    pts2  = max(0, pts - pts3 - ptsFT)

    fgm  = pts2 // 2 + pts3 // 3
    fgm  = max(0, fgm)
    fga  = max(fgm, round(fgm / max(0.38, jitter(0.42, 0.10))))

    tpm  = pts3 // 3
    tpa  = max(tpm, round(tpm / max(0.28, jitter(0.34, 0.12))))

    ftm  = ptsFT
    fta  = max(ftm, ftm + random.randint(0, 2))

    oreb = max(0, round(reb * jitter(0.30, 0.20)))
    dreb = max(0, reb - oreb)

    return {
        "Player": name,
        "Min":    mins,
        "Pts":    pts,
        "FGM":    fgm,
        "FGA":    fga,
        "3PM":    tpm,
        "3PA":    tpa,
        "FTM":    ftm,
        "FTA":    fta,
        "Reb":    reb,
        "OREB":   oreb,
        "DREB":   dreb,
        "Ast":    ast,
        "Stl":    stl,
        "Blk":    blk,
        "TO":     to,
        "PF":     pf,
    }

def write_csv(path, rows):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADERS)
        w.writeheader()
        w.writerows(rows)

# ── Practice sessions — 4 weeks, 2 per week ──────────────────────────────────
# trend increases each session so charts show a clear improvement arc
PRACTICES = [
    ("2026-03-02", "Preseason Practice 1"),
    ("2026-03-04", "Preseason Practice 2"),
    ("2026-03-09", "Week 2 — Monday Practice"),
    ("2026-03-11", "Week 2 — Wednesday Practice"),
    ("2026-03-16", "Week 3 — Monday Practice"),
    ("2026-03-18", "Week 3 — Wednesday Practice"),
    ("2026-03-23", "Week 4 — Monday Practice"),
    ("2026-03-25", "Week 4 — Wednesday Practice"),
]

for i, (date, label) in enumerate(PRACTICES):
    trend = i * 0.4           # gradual improvement
    scale = 0.72              # practices = ~72% of game intensity
    rows = [row(p, trend, scale) for p in PLAYERS]
    fname = OUT / "practices" / f"{date}_practice.csv"
    write_csv(fname, rows)
    print(f"  {fname.name}")

# ── Games — 6 opponents, spread across the same window ───────────────────────
GAMES = [
    ("2026-03-01", "vs. Ohio Wesleyan"),
    ("2026-03-06", "vs. Kenyon College"),
    ("2026-03-10", "vs. Wittenberg"),
    ("2026-03-15", "vs. College of Wooster"),
    ("2026-03-19", "vs. DePauw University"),
    ("2026-03-26", "vs. Hiram College"),
]

for i, (date, label) in enumerate(GAMES):
    trend = i * 0.5
    rows = [row(p, trend, 1.0) for p in PLAYERS]
    fname = OUT / "games" / f"{date}_game.csv"
    write_csv(fname, rows)
    print(f"  {fname.name}")

print(f"\nDone. {len(PRACTICES)} practice files + {len(GAMES)} game files in sample_data/")
print("\nPlayer name in CSVs: Andrew Byerly")
