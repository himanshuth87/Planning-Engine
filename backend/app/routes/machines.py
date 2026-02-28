"""Machines and capacity API."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Machine
from app.schemas import MachineCreate, MachineResponse

router = APIRouter(prefix="/machines", tags=["machines"])


@router.get("/", response_model=List[MachineResponse])
def list_machines(db: Session = Depends(get_db)):
    return db.query(Machine).filter(Machine.is_active == True).all()


@router.post("/", response_model=MachineResponse)
def create_machine(data: MachineCreate, db: Session = Depends(get_db)):
    m = Machine(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/{machine_id}", response_model=MachineResponse)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    return m


@router.patch("/{machine_id}")
def update_machine(
    machine_id: int,
    name: str | None = None,
    capacity_per_day: int | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    if name is not None:
        m.name = name
    if capacity_per_day is not None:
        m.capacity_per_day = capacity_per_day
    if is_active is not None:
        m.is_active = is_active
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{machine_id}")
def delete_machine(machine_id: int, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    m.is_active = False
    db.commit()
    return {"ok": True}
