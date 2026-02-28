"""Order consolidation: group by Product + Color, sum quantities."""
from collections import defaultdict
from datetime import date
from typing import List, Tuple

from sqlalchemy.orm import Session
from app.models import SalesOrder, ConsolidatedBatch, ProductionPlan
from app.schemas import ConsolidatedBatchResponse, SalesOrderResponse


def consolidate_orders(db: Session) -> List[ConsolidatedBatch]:
    """Group pending orders by product_name + color, create/update batches."""
    pending = (
        db.query(SalesOrder)
        .filter(SalesOrder.status == "pending", SalesOrder.consolidated_batch_id.is_(None))
        .order_by(SalesOrder.delivery_date)
        .all()
    )
    if not pending:
        return []

    groups: dict[Tuple[str, str], List[SalesOrder]] = defaultdict(list)
    for order in pending:
        groups[(order.product_name, order.color)].append(order)

    batches = []
    for (product_name, color), orders in groups.items():
        total = sum(o.quantity for o in orders)
        order_ids = ",".join(o.order_id for o in orders)
        batch = ConsolidatedBatch(
            product_name=product_name,
            color=color,
            total_quantity=total,
            order_ids=order_ids,
        )
        db.add(batch)
        db.flush()
        for order in orders:
            order.consolidated_batch_id = batch.id
        batches.append(batch)
    db.commit()
    for b in batches:
        db.refresh(b)
    return batches


def get_consolidated_batches(db: Session) -> List[ConsolidatedBatch]:
    return db.query(ConsolidatedBatch).order_by(ConsolidatedBatch.created_at.desc()).all()
