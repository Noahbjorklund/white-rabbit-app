"""
White Rabbit OS — Claude AI Analysis Service

Runs prospect analysis and meeting summarization via Claude API.
Designed for token efficiency — sends structured metadata, not raw text.
"""

import json
import anthropic
from datetime import datetime, timezone
from typing import Optional
from app.config import settings
from app.schemas.schemas import (
    AnalyzeRequest, AnalyzeResponse,
    SummarizeRequest, SummarizeResponse,
)

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

# ─── System prompts ────────────────────────────────────────────────────────────

PROSPECT_SYSTEM_PROMPT = """You are an operational efficiency consultant for White Rabbit, a Nordic operational intelligence company.

Your role is to analyze growing Nordic SMB companies and identify operational inefficiencies, disconnected systems, and workflow bottlenecks.

You focus on:
- Administrative inefficiencies and manual workflows
- Duplicated work and disconnected systems
- Scaling challenges and workflow friction

Rules:
- NEVER use AI buzzwords or hype language
- ALWAYS focus on operational efficiency, business value, time savings
- Be concise and commercially useful
- Return ONLY valid JSON, no markdown, no preamble, no trailing text"""

MEETING_SYSTEM_PROMPT = """You are a sales operations assistant for White Rabbit.

Summarize sales conversations clearly and concisely.
Extract commercially useful information structured for CRM usage.

Rules:
- Be concise and practical
- Focus on operational pain, not general business discussion
- Return ONLY valid JSON, no markdown, no preamble"""


# ─── Prospect analysis ────────────────────────────────────────────────────────

def build_prospect_prompt(req: AnalyzeRequest) -> str:
    systems = ", ".join(req.tech_stack) if req.tech_stack else "unknown"
    return f"""Analyze this Nordic SMB company:

Company: {req.company_name}
Industry: {req.industry}
Revenue: {req.revenue_msek or "unknown"} MSEK
Growth: {req.growth_pct or "unknown"}%
Employees: {req.employees or "unknown"}
Profitability: {req.profitability}
Hiring signals: {req.hiring_signals or "none"}
Tech stack: {systems}

Return this exact JSON:
{{
  "pain_points": ["list of likely operational pain points"],
  "workflow_issues": ["list of likely manual workflow problems"],
  "automation_opportunities": ["list of specific automation wins"],
  "best_contacts": ["job titles to target"],
  "sales_angle": "one sharp sentence positioning the sales approach",
  "sdr_notes": "2-3 sentences of practical SDR outreach notes",
  "summary": "one sentence executive summary",
  "urgency_level": "high|medium|low",
  "estimated_monthly_hours_saved": <integer estimate of hours saved per month>
}}"""


async def analyze_prospect(req: AnalyzeRequest) -> AnalyzeResponse:
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=settings.claude_max_tokens,
        system=PROSPECT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_prospect_prompt(req)}],
    )

    raw = "".join(b.text for b in message.content if hasattr(b, "text"))
    clean = raw.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean)

    return AnalyzeResponse(
        pain_points=data.get("pain_points", []),
        workflow_issues=data.get("workflow_issues", []),
        automation_opportunities=data.get("automation_opportunities", []),
        best_contacts=data.get("best_contacts", []),
        sales_angle=data.get("sales_angle", ""),
        sdr_notes=data.get("sdr_notes", ""),
        summary=data.get("summary", ""),
        urgency_level=data.get("urgency_level", "medium"),
        estimated_monthly_hours_saved=int(data.get("estimated_monthly_hours_saved", 0)),
        tokens_used=message.usage.input_tokens + message.usage.output_tokens,
    )


# ─── Meeting summarization ─────────────────────────────────────────────────────

def build_meeting_prompt(req: SummarizeRequest) -> str:
    # Token optimization: truncate very long transcripts
    transcript = req.transcript
    if len(transcript) > 4000:
        transcript = transcript[:4000] + "\n\n[transcript truncated for analysis]"

    return f"""Summarize this sales conversation and extract operational intelligence:

TRANSCRIPT:
{transcript}

Return this exact JSON:
{{
  "pain_points": ["operational pain points mentioned"],
  "systems": ["systems/tools mentioned"],
  "buying_signals": ["signals of interest or urgency"],
  "objections": ["objections or concerns raised"],
  "urgency": "high|medium|low",
  "next_step": "single recommended next commercial action"
}}"""


async def summarize_meeting(req: SummarizeRequest) -> SummarizeResponse:
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=settings.claude_max_tokens,
        system=MEETING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_meeting_prompt(req)}],
    )

    raw = "".join(b.text for b in message.content if hasattr(b, "text"))
    clean = raw.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean)

    return SummarizeResponse(
        pain_points=data.get("pain_points", []),
        systems=data.get("systems", []),
        buying_signals=data.get("buying_signals", []),
        objections=data.get("objections", []),
        urgency=data.get("urgency", "medium"),
        next_step=data.get("next_step", ""),
        tokens_used=message.usage.input_tokens + message.usage.output_tokens,
    )
