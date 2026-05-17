from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from app.db.database import get_db
from app.models.models import Activity, Task
from app.schemas.schemas import ActivityCreate, ActivityOut, TaskCreate, TaskOut
from datetime import datetime, timezone

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/", response_model=List[ActivityOut])
async def list_activities(
    company_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    q = select(Activity).order_by(desc(Activity.activity_date))
    if company_id:
        q = q.where(Activity.company_id == company_id)
    result = await db.execute(q.limit(limit))
    return result.scalars().all()


@router.post("/", response_model=ActivityOut, status_code=201)
async def create_activity(body: ActivityCreate, db: AsyncSession = Depends(get_db)):
    activity = Activity(**body.model_dump())
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


@router.get("/{activity_id}", response_model=ActivityOut)
async def get_activity(activity_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(404, "Activity not found")
    return activity


# ─── Tasks ────────────────────────────────────────────────────────────────────

tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])


@tasks_router.get("/", response_model=List[TaskOut])
async def list_tasks(
    company_id: Optional[int] = None,
    completed: Optional[bool] = False,
    db: AsyncSession = Depends(get_db),
):
    q = select(Task).order_by(Task.due_date)
    if company_id:
        q = q.where(Task.company_id == company_id)
    if completed is not None:
        q = q.where(Task.completed == completed)
    result = await db.execute(q)
    return result.scalars().all()


@tasks_router.post("/", response_model=TaskOut, status_code=201)
async def create_task(body: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(**body.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@tasks_router.patch("/{task_id}/complete", response_model=TaskOut)
async def complete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    task.completed = True
    task.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task
