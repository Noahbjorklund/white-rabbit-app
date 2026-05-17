from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, Text, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()


# ─── Enums ────────────────────────────────────────────────────────────────────

class DealStage(str, enum.Enum):
    new         = "new"
    qualified   = "qualified"
    contacted   = "contacted"
    meeting     = "meeting"
    proposal    = "proposal"
    negotiation = "negotiation"
    closed_won  = "closed_won"
    closed_lost = "closed_lost"


class ActivityType(str, enum.Enum):
    call     = "call"
    email    = "email"
    meeting  = "meeting"
    note     = "note"
    task     = "task"


class TaskType(str, enum.Enum):
    follow_up     = "follow_up"
    send_proposal = "send_proposal"
    book_meeting  = "book_meeting"
    enrich        = "enrich"
    push_to_crm   = "push_to_crm"
    other         = "other"


class UrgencyLevel(str, enum.Enum):
    high   = "high"
    medium = "medium"
    low    = "low"


# ─── Models ───────────────────────────────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id                   = Column(Integer, primary_key=True, index=True)
    name                 = Column(String(255), nullable=False, index=True)
    industry             = Column(String(100), nullable=False)
    revenue_msek         = Column(Float)
    growth_pct           = Column(Float)
    employees            = Column(Integer)
    profitability        = Column(String(50))   # "yes" | "no" | "unknown"
    hiring_signals       = Column(Text)
    tech_stack           = Column(JSON, default=list)   # ["Fortnox", "Shopify"]
    website              = Column(String(500))
    linkedin             = Column(String(500))
    geographic_region    = Column(String(100), default="Stockholm")

    # Scoring
    score                = Column(Integer, default=0)
    score_breakdown      = Column(JSON, default=dict)   # {"Revenue > 50M": 20, ...}

    # AI analysis
    pain_summary         = Column(Text)
    pain_points          = Column(JSON, default=list)
    workflow_issues      = Column(JSON, default=list)
    automation_opportunities = Column(JSON, default=list)
    sales_angle          = Column(Text)
    sdr_notes            = Column(Text)
    urgency              = Column(Enum(UrgencyLevel), default=UrgencyLevel.medium)
    estimated_hours_saved = Column(Integer)
    ai_analyzed_at       = Column(DateTime(timezone=True))

    # CRM sync
    hubspot_id           = Column(String(100))
    pipedrive_id         = Column(String(100))
    crm_synced_at        = Column(DateTime(timezone=True))

    # Meta
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now())

    contacts    = relationship("Contact",  back_populates="company", cascade="all, delete-orphan")
    activities  = relationship("Activity", back_populates="company", cascade="all, delete-orphan")
    deals       = relationship("Deal",     back_populates="company", cascade="all, delete-orphan")
    tasks       = relationship("Task",     back_populates="company", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    id              = Column(Integer, primary_key=True, index=True)
    company_id      = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name            = Column(String(255))
    title           = Column(String(255))
    email           = Column(String(255), index=True)
    phone           = Column(String(100))
    linkedin        = Column(String(500))
    decision_score  = Column(Integer, default=0)   # how key a decision-maker they are
    enriched        = Column(Boolean, default=False)
    enriched_at     = Column(DateTime(timezone=True))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    company     = relationship("Company",  back_populates="contacts")
    activities  = relationship("Activity", back_populates="contact")


class Activity(Base):
    __tablename__ = "activities"

    id            = Column(Integer, primary_key=True, index=True)
    company_id    = Column(Integer, ForeignKey("companies.id"), nullable=False)
    contact_id    = Column(Integer, ForeignKey("contacts.id"))
    type          = Column(Enum(ActivityType), nullable=False)
    notes         = Column(Text)
    next_step     = Column(Text)
    assigned_to   = Column(String(255))
    activity_date = Column(DateTime(timezone=True), server_default=func.now())

    # AI-extracted meeting summaries
    ai_pain_points    = Column(JSON, default=list)
    ai_systems        = Column(JSON, default=list)
    ai_buying_signals = Column(JSON, default=list)
    ai_objections     = Column(JSON, default=list)
    ai_urgency        = Column(String(50))
    ai_next_step      = Column(Text)

    company = relationship("Company",  back_populates="activities")
    contact = relationship("Contact",  back_populates="activities")


class Deal(Base):
    __tablename__ = "deals"

    id              = Column(Integer, primary_key=True, index=True)
    company_id      = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stage           = Column(Enum(DealStage), default=DealStage.new)
    estimated_value = Column(Float)
    health_score    = Column(Integer, default=50)   # 0–100
    last_activity   = Column(DateTime(timezone=True))
    closed_at       = Column(DateTime(timezone=True))
    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="deals")


class Task(Base):
    __tablename__ = "tasks"

    id          = Column(Integer, primary_key=True, index=True)
    company_id  = Column(Integer, ForeignKey("companies.id"), nullable=False)
    assigned_to = Column(String(255))
    task_type   = Column(Enum(TaskType), default=TaskType.other)
    description = Column(Text)
    due_date    = Column(DateTime(timezone=True))
    completed   = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="tasks")
