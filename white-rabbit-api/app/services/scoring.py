"""
White Rabbit OS — Prospect Scoring Engine

Scores Nordic SMB companies based on ideal customer profile criteria.
Returns a score 0–100+ and a breakdown of contributing factors.
"""

from typing import Optional, List, Dict, Tuple
from app.schemas.schemas import ScoreRequest, ScoreResponse

ADMIN_HEAVY_INDUSTRIES = {
    "ecommerce", "staffing", "recruitment", "logistics",
    "construction", "real_estate", "healthcare_admin",
    "wholesale", "b2b_sales"
}

CRM_SYSTEMS = {"hubspot", "pipedrive", "salesforce"}
FINANCE_SYSTEMS = {"fortnox", "visma", "pe", "xero", "quickbooks"}
ECOMMERCE_SYSTEMS = {"shopify", "woocommerce", "magento"}
KNOWN_SYSTEMS = CRM_SYSTEMS | FINANCE_SYSTEMS | ECOMMERCE_SYSTEMS


def score_prospect(req: ScoreRequest) -> ScoreResponse:
    score = 0
    breakdown: Dict[str, int] = {}

    # ── Revenue ────────────────────────────────────────────────
    if req.revenue_msek is not None:
        if req.revenue_msek >= 50:
            score += 20
            breakdown["Revenue ≥ 50 MSEK"] = 20
        elif req.revenue_msek >= 20:
            score += 10
            breakdown["Revenue 20–50 MSEK"] = 10
        elif req.revenue_msek < 10:
            score -= 30
            breakdown["Revenue too small (< 10 MSEK)"] = -30

    # ── Growth ─────────────────────────────────────────────────
    if req.growth_pct is not None:
        if req.growth_pct >= 20:
            score += 25
            breakdown["Growth ≥ 20%"] = 25
        elif req.growth_pct >= 10:
            score += 12
            breakdown["Growth 10–20%"] = 12
        elif req.growth_pct < 0:
            score -= 10
            breakdown["Negative growth"] = -10

    # ── Employees ──────────────────────────────────────────────
    if req.employees is not None:
        if 20 <= req.employees <= 200:
            score += 20
            breakdown["20–200 employees (ideal)"] = 20
        elif req.employees > 250:
            score -= 25
            breakdown["Enterprise size (> 250 employees)"] = -25
        elif req.employees < 10:
            score -= 30
            breakdown["Too small (< 10 employees)"] = -30

    # ── Industry ───────────────────────────────────────────────
    if req.industry and req.industry.lower() in ADMIN_HEAVY_INDUSTRIES:
        score += 15
        breakdown["Admin-heavy industry"] = 15

    # ── Hiring signals ─────────────────────────────────────────
    if req.hiring_signals:
        ops_keywords = [
            "operations", "admin", "coordinator", "finance",
            "logistics", "payroll", "controller", "back office"
        ]
        signals_lower = req.hiring_signals.lower()
        if any(k in signals_lower for k in ops_keywords):
            score += 10
            breakdown["Hiring ops/admin roles"] = 10

    # ── Tech stack signals ─────────────────────────────────────
    if req.tech_stack:
        stack_lower = [s.lower() for s in req.tech_stack]
        known_hits = [s for s in stack_lower if any(k in s for k in KNOWN_SYSTEMS)]
        if known_hits:
            score += 15
            breakdown[f"Known systems: {', '.join(req.tech_stack[:3])}"] = 15

        # Disconnected finance + ecommerce is a strong signal
        has_finance = any(k in stack_lower for s in stack_lower for k in FINANCE_SYSTEMS if k in s)
        has_ecom    = any(k in stack_lower for s in stack_lower for k in ECOMMERCE_SYSTEMS if k in s)
        if has_finance and has_ecom:
            score += 10
            breakdown["Finance + ecommerce stack (likely sync gap)"] = 10

        # Excel is always a pain signal
        if "excel" in stack_lower or "google sheets" in stack_lower:
            score += 5
            breakdown["Spreadsheet-heavy stack"] = 5

    # ── Internal dev team ──────────────────────────────────────
    if req.has_internal_dev is True:
        score -= 20
        breakdown["Has internal engineering team"] = -20
    elif req.has_internal_dev is False and req.employees and req.employees > 0:
        score += 10
        breakdown["No internal dev team"] = 10

    # ── Tier classification ────────────────────────────────────
    if score >= 75:
        tier = "hot"
    elif score >= 50:
        tier = "warm"
    else:
        tier = "cold"

    return ScoreResponse(score=max(0, score), breakdown=breakdown, tier=tier)
