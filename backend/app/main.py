from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine

# ensure new models are registered with Base before create_all
import app.models.report_schedule  # noqa: F401

_scheduler = BackgroundScheduler()


def _run_due_schedules():
    from app.models.report import Report
    from app.models.report_schedule import ReportSchedule, ScheduleFrequency
    from app.api.v1.endpoints.reports import _build_report, _next_run

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due = db.query(ReportSchedule).filter(
            ReportSchedule.is_active == True,
            ReportSchedule.next_run_at <= now,
        ).all()
        for s in due:
            try:
                data = _build_report(db, s.report_type, {"sme_id": s.sme_id})
                report = Report(
                    title=f"[Scheduled] {s.report_type.value.replace('_', ' ').title()} Report",
                    report_type=s.report_type,
                    generated_by=s.created_by,
                    parameters={"sme_id": s.sme_id, "scheduled": True},
                    data=data,
                )
                db.add(report)
                s.next_run_at = _next_run(s.frequency)
                db.commit()
            except Exception:
                db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _scheduler.add_job(_run_due_schedules, "interval", minutes=15, id="report_scheduler")
    _scheduler.start()
    yield
    _scheduler.shutdown(wait=False)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health():
    return {"status": "ok", "project": settings.PROJECT_NAME}

