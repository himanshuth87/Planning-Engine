from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routes import orders, consolidation, production, raw_materials, machines, dashboard

app = FastAPI(title="Production Planning Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router, prefix=settings.API_PREFIX)
app.include_router(consolidation.router, prefix=settings.API_PREFIX)
app.include_router(production.router, prefix=settings.API_PREFIX)
app.include_router(raw_materials.router, prefix=settings.API_PREFIX)
app.include_router(machines.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Production Planning API", "docs": "/docs"}
