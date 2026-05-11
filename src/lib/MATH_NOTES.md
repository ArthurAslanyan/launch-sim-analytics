# LaunchIndex Mathematical Foundation

This document explains the mathematical models underlying LaunchIndex simulations.

## Core Principles

### 1. Volatility-Hit Frequency Coupling

Hit frequency and volatility are mathematically constrained via variance:

`Variance = E[Win²] - E[Win]²`

Higher hit frequency → more frequent small wins → lower variance → lower volatility.

**Compatibility ranges:**
- Very High vol: 12–22% hit frequency
- High vol: 18–28% hit frequency
- Medium vol: 25–38% hit frequency
- Low vol: 35–50% hit frequency

### 2. Behavioral D7 Model

D7 is NOT simply "D1 × decay factor". Real D7 depends on:

`D7 = D1 × retention_rate × vol_penalty`

where `retention_rate = base_rate + content_depth + feature_access`

**Content depth factors:**
- Progression systems: +0.35
- Daily incentives: +0.25
- Feature variety: +0.06 per feature (max 0.40)

### 3. Effective FDI

Raw FDI ignores whether players actually trigger features:

`Effective FDI = Raw FDI × P(trigger in session)`

where `P(trigger) = 1 - (1 - 1/trigger_freq)^session_spins`

A game with 70% FDI but 30% trigger probability has effective FDI of 21%.

### 4. Survival Curves: Piecewise Hazard Model

Player churn follows a bathtub curve, not exponential decay:

- **Phase 1 (0–20 spins):** High hazard (first impression) — 1.5× base rate
- **Phase 2 (20–80 spins):** Low hazard (engaged phase) — 0.6× base rate
- **Phase 3 (80+ spins):** Medium hazard (content exhaustion) — 1.2× base rate

### 5. Archetype Fit: Threshold Utility

Players use lexicographic preferences (elimination by aspects), not additive scoring:

1. Check hard constraints (deal-breakers)
2. If any fail → low fit score (≤4)
3. If all pass → soft scoring (5–10)

## RTP Redistribution Effects

Moving RTP from features to base game:

`ΔVolatility ≈ -1 tier per 10% FDI reduction`

Example: 68% FDI → 58% FDI = Very High → High volatility

## Constraint Checking

All recommendations pass through feasibility validation:
- Cluster mechanics require Cluster Pays game type
- Cascade/tumble recommendations require Cascades special mechanic on payline games
- Guaranteed outcomes flagged for RNG certification

## References

- Volatility-variance relationship: industry standard slot math
- D7 behavioral model: derived from Pragmatic Play 2023 retention data
- Effective FDI: game-theoretic expected value calculation
- Survival curves: adapted from churn modeling in mobile games (Weibull-like)
