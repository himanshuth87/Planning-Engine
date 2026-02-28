"""Dashboard API: today's plan, pending, completed, delays."""
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SalesOrder, ProductionPlan
from app.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _order_to_dict(o):
    return {
        "id": o.id,
        "order_id": o.order_id,
        "product_name": o.product_name,
        "quantity": o.quantity,
        "color": o.color,
        "delivery_date": o.delivery_date.isoformat() if o.delivery_date else None,
        "status": o.status,
    }


def _plan_to_dict(p):
    batch = p.batch
    return {
        "id": p.id,
        "planned_date": p.planned_date.isoformat() if p.planned_date else None,
        "product_name": batch.product_name if batch else "",
        "color": batch.color if batch else "",
        "quantity_planned": p.quantity_planned,
        "status": p.status,
        "machine_id": p.machine_id,
    }


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    today_plans = (
        db.query(ProductionPlan)
        .filter(ProductionPlan.planned_date == today)
        .order_by(ProductionPlan.machine_id)
        .all()
    )
    pending = db.query(SalesOrder).filter(SalesOrder.status == "pending").order_by(SalesOrder.delivery_date).all()
    completed = db.query(SalesOrder).filter(SalesOrder.status == "completed").count()
    delayed = list(db.query(SalesOrder).filter(SalesOrder.status == "delayed").order_by(SalesOrder.delivery_date).all())
    at_risk = db.query(SalesOrder).filter(SalesOrder.status == "pending", SalesOrder.delivery_date < today).all()
    for o in at_risk:
        if o.id not in [d.id for d in delayed]:
            delayed.append(o)
    return DashboardStats(
        today_plan_count=len(today_plans),
        pending_orders_count=len(pending),
        completed_orders_count=completed,
        delayed_orders_count=len(delayed),
        today_plan=[_plan_to_dict(p) for p in today_plans],
        pending_orders=[_order_to_dict(o) for o in pending[:50]],
        delayed_orders=[_order_to_dict(o) for o in delayed[:20]],
    )
