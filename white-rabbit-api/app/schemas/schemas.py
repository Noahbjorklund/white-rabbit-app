from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import DealStage, ActivityType, TaskType, UrgencyLevel


# ─── Company schemas ───────────────────────────────────────────────────────────

class CompanyBase(BaseModel):
    name:             str
    industry:         str
    revenue_msek:     Optional[float] = None
    growth_pct:       Optional[float] = None
    employees:        Optional[int]   = None
    profitability:    Optional[str]   = "unknown"
    hiring_signals:   Optional[str]   = None
    tech_stack:       Optional[List[str]] = []
    website:          Optional[str]   = None
    linkedin:         Optional[str]   = None
    geographic_region: Optional[str]  = "Stockholm"


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name:             Optional[str]        = None
    industry:         Optional[str]        = None
    revenue_msek:     Optional[float]      = None
    growth_pct:       Optional[float]      = None
    employees:        Optional[int]        = None
    profitability:    Optional[str]        = None
    hiring_signals:   Optional[str]        = None
    tech_stack:       Optional[List[str]]  = None
    website:          Optional[str]        = None


class CompanyOut(CompanyBase):
    id:                      int
    score:                   int
    score_breakdown:         Optional[Dict[str, Any]] = {}
    pain_summary:            Optional[str] = None
    pain_points:             Optional[List[str]] = []
    workflow_issues:         Optional[List[str]] = []
    automation_opportunities: Optional[List[str]] = []
    sales_angle:             Optional[str] = None
    sdr_notes:               Optional[str] = None
    urgency:                 Optional[UrgencyLevel] = None
    estimated_hours_saved:   Optional[int] = None
    ai_analyzed_at:          Optional[datetime] = None
    hubspot_id:              Optional[str] = None
    pipedrive_id:            Optional[str] = None
    crm_synced_at:           Optional[datetime] = None
    created_at:              datetime

    model_config = {"from_attributes": True}


# ─── Contact schemas ───────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    company_id:     int
    name:           Optional[str] = None
    title:          Optional[str] = None
    email:          Optional[str] = None
    phone:          Optional[str] = None
    linkedin:       Optional[str] = None
    decision_score: Optional[int] = 0


class ContactOut(ContactCreate):
    id:          int
    enriched:    bool
    enriched_at: Optional[datetime] = None
    created_at:  datetime

    model_config = {"from_attributes": True}


# ─── Activity schemas ──────────────────────────────────────────────────────────

class ActivityCreate(BaseModel):
    company_id:    int
    contact_id:    Optional[int] = None
    type:          ActivityType
    notes:         Optional[str] = None
    next_step:     Optional[str] = None
    assigned_to:   Optional[str] = None
    activity_date: Optional[datetime] = None


class ActivityOut(ActivityCreate):
    id:                  int
    ai_pain_points:      Optional[List[str]] = []
    ai_systems:          Optional[List[str]] = []
    ai_buying_signals:   Optional[List[str]] = []
    ai_objections:       Optional[List[str]] = []
    ai_urgency:          Optional[str] = None
    ai_next_step:        Optional[str] = None
    activity_date:       datetime

    model_config = {"from_attributes": True}


# ─── Deal schemas ──────────────────────────────────────────────────────────────

class DealCreate(BaseModel):
    company_id:      int
    stage:           DealStage = DealStage.new
    estimated_value: Optional[float] = None
    notes:           Optional[str] = None


class DealUpdate(BaseModel):
    stage:           Optional[DealStage] = None
    estimated_value: Optional[float]     = None
    health_score:    Optional[int]       = None
    notes:           Optional[str]       = None


class DealOut(DealCreate):
    id:           int
    health_score: int
    last_activity: Optional[datetime] = None
    closed_at:    Optional[datetime] = None
    created_at:   datetime

    model_config = {"from_attributes": True}


# ─── Task schemas ──────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    company_id:  int
    assigned_to: Optional[str] = None
    task_type:   TaskType = TaskType.other
    description: Optional[str] = None
    due_date:    Optional[datetime] = None


class TaskOut(TaskCreate):
    id:           int
    completed:    bool
    completed_at: Optional[datetime] = None
    created_at:   datetime

    model_config = {"from_attributes": True}


# ─── AI Analysis schemas ───────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    company_name:    str
    industry:        str
    revenue_msek:    Optional[float] = None
    growth_pct:      Optional[float] = None
    employees:       Optional[int]   = None
    profitability:   Optional[str]   = "unknown"
    hiring_signals:  Optional[str]   = None
    tech_stack:      Optional[List[str]] = []
    save_to_company: Optional[int]   = None   # company id to save results to


class AnalyzeResponse(BaseModel):
    pain_points:                List[str]
    workflow_issues:            List[str]
    automation_opportunities:   List[str]
    best_contacts:              List[str]
    sales_angle:                str
    sdr_notes:                  str
    summary:                    str
    urgency_level:              str
    estimated_monthly_hours_saved: int
    tokens_used:                Optional[int] = None


# ─── Scoring schemas ───────────────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    revenue_msek:    Optional[float] = None
    growth_pct:      Optional[float] = None
    employees:       Optional[int]   = None
    industry:        Optional[str]   = None
    hiring_signals:  Optional[str]   = None
    tech_stack:      Optional[List[str]] = []
    has_internal_dev: Optional[bool] = False


class ScoreResponse(BaseModel):
    score:      int
    breakdown:  Dict[str, int]
    tier:       str   # "hot" | "warm" | "cold"


# ─── Meeting summary schemas ───────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    transcript:  str
    company_id:  Optional[int] = None
    contact_id:  Optional[int] = None


class SummarizeResponse(BaseModel):
    pain_points:    List[str]
    systems:        List[str]
    buying_signals: List[str]
    objections:     List[str]
    urgency:        str
    next_step:      str
    tokens_used:    Optional[int] = None


# ─── CRM push schema ───────────────────────────────────────────────────────────

class CRMPushRequest(BaseModel):
    company_id: int
    crm:        str   # "hubspot" | "pipedrive"


class CRMPushResponse(BaseModel):
    success:    bool
    crm:        str
    crm_id:     Optional[str] = None
    message:    str
