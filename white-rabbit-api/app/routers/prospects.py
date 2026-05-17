from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.models import Company, Contact, Deal, DealStage
from app.schemas.schemas import (
    CompanyCreate, CompanyUpdate, CompanyOut,
    ContactCreate, ContactOut,
    DealCreate, DealUpdate, DealOut,
)
from app.services.scoring import score_prospect, ScoreRequest

router = APIRouter(prefix="/prospects", tags=["prospects"])


# ─── Companies ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[CompanyOut])
async def list_prospects(
    limit:    int = Query(50, le=200),
    offset:   int = Query(0),
    industry: Optional[str] = None,
    min_score: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Company).order_by(desc(Company.score))
    if industry:
        q = q.where(Company.industry == industry)
    if min_score is not None:
        q = q.where(Company.score >= min_score)
    result = await db.execute(q.limit(limit).offset(offset))
    return result.scalars().all()


@router.post("/", response_model=CompanyOut, status_code=201)
async def create_prospect(
    body: CompanyCreate,
    db: AsyncSession = Depends(get_db),
):
    # Auto-score on creation
    score_req = ScoreRequest(
        revenue_msek=body.revenue_msek,
        growth_pct=body.growth_pct,
        employees=body.employees,
        industry=body.industry,
        hiring_signals=body.hiring_signals,
        tech_stack=body.tech_stack or [],
    )
    scored = score_prospect(score_req)

    company = Company(
        **body.model_dump(),
        score=scored.score,
        score_breakdown=scored.breakdown,
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyOut)
async def get_prospect(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_prospect(
    company_id: int,
    body: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Company not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(company, field, value)

    # Re-score if relevant fields changed
    if any(f in body.model_dump(exclude_none=True) for f in ["revenue_msek","growth_pct","employees","industry","tech_stack"]):
        score_req = ScoreRequest(
            revenue_msek=company.revenue_msek,
            growth_pct=company.growth_pct,
            employees=company.employees,
            industry=company.industry,
            hiring_signals=company.hiring_signals,
            tech_stack=company.tech_stack or [],
        )
        scored = score_prospect(score_req)
        company.score = scored.score
        company.score_breakdown = scored.breakdown

    await db.commit()
    await db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=204)
async def delete_prospect(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Company not found")
    await db.delete(company)
    await db.commit()


# ─── Contacts ────────────────────────────────────────────────────────────────

@router.get("/{company_id}/contacts", response_model=List[ContactOut])
async def list_contacts(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contact).where(Contact.company_id == company_id)
    )
    return result.scalars().all()


@router.post("/{company_id}/contacts", response_model=ContactOut, status_code=201)
async def add_contact(
    company_id: int,
    body: ContactCreate,
    db: AsyncSession = Depends(get_db),
):
    body.company_id = company_id
    contact = Contact(**body.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


# ─── Deals ───────────────────────────────────────────────────────────────────

@router.get("/{company_id}/deals", response_model=List[DealOut])
async def list_deals(company_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Deal).where(Deal.company_id == company_id)
    )
    return result.scalars().all()


@router.post("/{company_id}/deals", response_model=DealOut, status_code=201)
async def create_deal(
    company_id: int,
    body: DealCreate,
    db: AsyncSession = Depends(get_db),
):
    body.company_id = company_id
    deal = Deal(**body.model_dump())
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


@router.patch("/{company_id}/deals/{deal_id}", response_model=DealOut)
async def update_deal(
    company_id: int,
    deal_id: int,
    body: DealUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deal).where(Deal.id == deal_id, Deal.company_id == company_id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(deal, field, value)
    deal.last_activity = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(deal)
    return deal
