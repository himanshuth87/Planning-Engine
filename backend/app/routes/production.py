"""Production planning API: schedule and daily plan."""
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ProductionPlan
from app.schemas import ProductionPlanResponse
from app.services.production_planning import (
    generate_production_plan,
    get_daily_schedule,
    get_plan_for_date_range,
)

router = APIRouter(prefix="/production", tags=["production"])


@router.post("/generate", response_model=List[ProductionPlanResponse])
def generate_plan(
    start_date: date | None = Query(None, alias="start_date"),
    db: Session = Depends(get_db),
):
    return generate_production_plan(db, start_date)


@router.get("/today", response_model=List[ProductionPlanResponse])
def today_plan(db: Session = Depends(get_db)):
    return get_daily_schedule(db, date.today())


@router.get("/schedule", response_model=List[ProductionPlanResponse])
def schedule(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    db: Session = Depends(get_db),
):
    return get_plan_for_date_range(db, from_date, to_date)
