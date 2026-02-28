"""Consolidation API: group orders by Product + Color."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ConsolidatedBatch
from app.schemas import ConsolidatedBatchResponse
from app.services.consolidation import consolidate_orders, get_consolidated_batches

router = APIRouter(prefix="/consolidation", tags=["consolidation"])


@router.post("/run", response_model=List[ConsolidatedBatchResponse])
def run_consolidation(db: Session = Depends(get_db)):
    batches = consolidate_orders(db)
    return batches


@router.get("/batches", response_model=List[ConsolidatedBatchResponse])
def list_batches(db: Session = Depends(get_db)):
    return get_consolidated_batches(db)
