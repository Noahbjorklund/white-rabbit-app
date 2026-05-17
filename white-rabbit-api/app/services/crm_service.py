"""
White Rabbit OS — CRM Integration Service

Pushes qualified prospects to HubSpot or Pipedrive.
"""

import httpx
from typing import Optional
from app.config import settings
from app.models.models import Company


# ─── HubSpot ──────────────────────────────────────────────────────────────────

HUBSPOT_BASE = "https://api.hubapi.com"


async def push_to_hubspot(company: Company) -> dict:
    headers = {
        "Authorization": f"Bearer {settings.hubspot_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "properties": {
            "name":                  company.name,
            "industry":              company.industry,
            "annualrevenue":         int((company.revenue_msek or 0) * 1_000_000 * 0.1),  # approx USD
            "numberofemployees":     company.employees,
            "website":               company.website or "",
            "description":           company.pain_summary or "",
            "wr_score":              company.score,
            "wr_urgency":            company.urgency.value if company.urgency else "",
            "wr_sales_angle":        company.sales_angle or "",
            "wr_pain_points":        "; ".join(company.pain_points or []),
            "wr_automation_opps":    "; ".join(company.automation_opportunities or []),
        }
    }

    async with httpx.AsyncClient() as client:
        # Check if company already exists
        if company.hubspot_id:
            resp = await client.patch(
                f"{HUBSPOT_BASE}/crm/v3/objects/companies/{company.hubspot_id}",
                headers=headers,
                json=payload,
            )
        else:
            resp = await client.post(
                f"{HUBSPOT_BASE}/crm/v3/objects/companies",
                headers=headers,
                json=payload,
            )

        resp.raise_for_status()
        data = resp.json()
        return {"crm_id": data.get("id"), "success": True}


# ─── Pipedrive ────────────────────────────────────────────────────────────────

def pipedrive_base(domain: str) -> str:
    return f"https://{domain}.pipedrive.com/api/v1"


async def push_to_pipedrive(company: Company) -> dict:
    base = pipedrive_base(settings.pipedrive_domain)
    params = {"api_token": settings.pipedrive_api_token}

    payload = {
        "name":           company.name,
        "address_country": "SE",
        "web":            company.website or "",
        "owner_id":       None,  # assign to current user by default
        # Custom fields (set up in Pipedrive first):
        # "wr_score":    company.score,
        # "wr_urgency":  company.urgency.value if company.urgency else "",
    }

    async with httpx.AsyncClient() as client:
        if company.pipedrive_id:
            resp = await client.put(
                f"{base}/organizations/{company.pipedrive_id}",
                params=params,
                json=payload,
            )
        else:
            resp = await client.post(
                f"{base}/organizations",
                params=params,
                json=payload,
            )

        resp.raise_for_status()
        data = resp.json()
        org_id = str(data.get("data", {}).get("id", ""))

        # Also create a deal
        deal_payload = {
            "title":          f"{company.name} — Operational Workflow",
            "org_id":         int(org_id) if org_id else None,
            "status":         "open",
            "pipeline_id":    1,
        }
        await client.post(f"{base}/deals", params=params, json=deal_payload)

        return {"crm_id": org_id, "success": True}


# ─── Dispatcher ───────────────────────────────────────────────────────────────

async def push_to_crm(company: Company, crm: str) -> dict:
    if crm == "hubspot":
        if not settings.hubspot_api_key:
            return {"success": False, "message": "HubSpot API key not configured"}
        return await push_to_hubspot(company)
    elif crm == "pipedrive":
        if not settings.pipedrive_api_token:
            return {"success": False, "message": "Pipedrive API token not configured"}
        return await push_to_pipedrive(company)
    else:
        return {"success": False, "message": f"Unknown CRM: {crm}"}
