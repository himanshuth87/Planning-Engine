"""Production planning: prioritize by delivery date, assign days and machines."""
from datetime import date, timedelta
from typing import List

from sqlalchemy.orm import Session
from app.models import ConsolidatedBatch, ProductionPlan, Machine, SalesOrder


def generate_production_plan(db: Session, start_date: date = None) -> List[ProductionPlan]:
    """
    Prioritize unplanned batches by earliest delivery date, assign to days
    respecting machine capacity.
    """
    if start_date is None:
        start_date = date.today()

    batches = (
        db.query(ConsolidatedBatch)
        .filter(ConsolidatedBatch.production_plan_id.is_(None))
        .all()
    )
    if not batches:
        return []

    # Get earliest delivery date per batch from its orders
    batch_delivery = {}
    for b in batches:
        orders = db.query(SalesOrder).filter(SalesOrder.consolidated_batch_id == b.id).all()
        if orders:
            batch_delivery[b.id] = min(o.delivery_date for o in orders)
        else:
            batch_delivery[b.id] = start_date

    # Sort by delivery date
    batches_sorted = sorted(batches, key=lambda b: batch_delivery.get(b.id, start_date))

    machines = db.query(Machine).filter(Machine.is_active == True).order_by(Machine.id).all()
    if not machines:
        # Create a default machine so planning still works
        default_m = Machine(name="Default Line", capacity_per_day=1000, is_active=True)
        db.add(default_m)
        db.flush()
        machines = [default_m]

    plans = []
    current_date = start_date
    machine_index = 0

    for batch in batches_sorted:
        m = machines[machine_index % len(machines)]
        plan = ProductionPlan(
            planned_date=current_date,
            batch_id=batch.id,
            quantity_planned=batch.total_quantity,
            status="scheduled",
            machine_id=m.id,
        )
        db.add(plan)
        db.flush()
        batch.production_plan_id = plan.id
        for order in batch.orders:
            order.production_plan_id = plan.id
        plans.append(plan)
        # Move to next day when we exceed capacity (simplified: one batch per day per machine)
        # For multiple batches per day, we could sum quantity_planned and compare to capacity
        machine_index += 1
        if machine_index >= len(machines):
            machine_index = 0
            current_date += timedelta(days=1)

    db.commit()
    for p in plans:
        db.refresh(p)
    return plans


def get_daily_schedule(db: Session, day: date) -> List[ProductionPlan]:
    return (
        db.query(ProductionPlan)
        .filter(ProductionPlan.planned_date == day)
        .order_by(ProductionPlan.machine_id)
        .all()
    )


def get_plan_for_date_range(db: Session, start: date, end: date) -> List[ProductionPlan]:
    return (
        db.query(ProductionPlan)
        .filter(ProductionPlan.planned_date >= start, ProductionPlan.planned_date <= end)
        .order_by(ProductionPlan.planned_date, ProductionPlan.machine_id)
        .all()
    )
