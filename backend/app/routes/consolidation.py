"""Consolidation API: group orders by Product + Color."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ConsolidatedBatch, SalesOrder, ProductionPlan
from app.schemas import ConsolidatedBatchResponse
from app.services.consolidation import consolidate_orders, get_consolidated_batches

router = APIRouter(prefix="/consolidation", tags=["consolidation"])


@router.delete("/reset")
def reset_consolidation(db: Session = Depends(get_db)):
    # Unlink SalesOrders from batches and plans
    db.query(SalesOrder).update({
        SalesOrder.consolidated_batch_id: None,
        SalesOrder.production_plan_id: None
    }, synchronize_session=False)
    # Delete all Production Plans (since they rely on batches)
    db.query(ProductionPlan).delete(synchronize_session=False)
    # Delete all Consolidated Batches
    db.query(ConsolidatedBatch).delete(synchronize_session=False)
    db.commit()
    return {"ok": True}


@router.post("/run", response_model=List[ConsolidatedBatchResponse])
def run_consolidation(db: Session = Depends(get_db)):
    batches = consolidate_orders(db)
    return batches


@router.get("/batches", response_model=List[ConsolidatedBatchResponse])
def list_batches(db: Session = Depends(get_db)):
    return get_consolidated_batches(db)
