from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.models import Company, Activity, ActivityType
from app.schemas.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    SummarizeRequest, SummarizeResponse,
    ScoreRequest, ScoreResponse,
    CRMPushRequest, CRMPushResponse,
)
from app.services.ai_service import analyze_prospect, summarize_meeting
from app.services.scoring import score_prospect
from app.services.crm_service import push_to_crm

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run Claude prospect analysis.
    If save_to_company is provided, persists results to that company record.
    """
    try:
        result = await analyze_prospect(body)
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")

    # Persist to company if requested
    if body.save_to_company:
        res = await db.execute(
            select(Company).where(Company.id == body.save_to_company)
        )
        company = res.scalar_one_or_none()
        if company:
            company.pain_points              = result.pain_points
            company.workflow_issues          = result.workflow_issues
            company.automation_opportunities = result.automation_opportunities
            company.sales_angle              = result.sales_angle
            company.sdr_notes                = result.sdr_notes
            company.pain_summary             = result.summary
            company.urgency                  = result.urgency_level
            company.estimated_hours_saved    = result.estimated_monthly_hours_saved
            company.ai_analyzed_at           = datetime.now(timezone.utc)
            await db.commit()

    return result


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    body: SummarizeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Summarize a meeting transcript.
    If company_id is provided, saves summary as an activity.
    """
    try:
        result = await summarize_meeting(body)
    except Exception as e:
        raise HTTPException(500, f"Summarization failed: {str(e)}")

    # Persist activity if company_id given
    if body.company_id:
        activity = Activity(
            company_id=body.company_id,
            contact_id=body.contact_id,
            type=ActivityType.meeting,
            notes=body.transcript[:500] + "..." if len(body.transcript) > 500 else body.transcript,
            next_step=result.next_step,
            ai_pain_points=result.pain_points,
            ai_systems=result.systems,
            ai_buying_signals=result.buying_signals,
            ai_objections=result.objections,
            ai_urgency=result.urgency,
            ai_next_step=result.next_step,
        )
        db.add(activity)
        await db.commit()

    return result


@router.post("/score", response_model=ScoreResponse)
async def score(body: ScoreRequest):
    """Score a prospect without saving to DB."""
    return score_prospect(body)


@router.post("/crm/push", response_model=CRMPushResponse)
async def crm_push(
    body: CRMPushRequest,
    db: AsyncSession = Depends(get_db),
):
    """Push a qualified prospect to HubSpot or Pipedrive."""
    res = await db.execute(select(Company).where(Company.id == body.company_id))
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Company not found")

    try:
        result = await push_to_crm(company, body.crm)
    except Exception as e:
        raise HTTPException(500, f"CRM push failed: {str(e)}")

    if result.get("success"):
        # Update CRM sync status
        now = datetime.now(timezone.utc)
        if body.crm == "hubspot":
            company.hubspot_id = result.get("crm_id")
        elif body.crm == "pipedrive":
            company.pipedrive_id = result.get("crm_id")
        company.crm_synced_at = now
        await db.commit()

    return CRMPushResponse(
        success=result.get("success", False),
        crm=body.crm,
        crm_id=result.get("crm_id"),
        message=result.get("message", "Pushed successfully"),
    )
