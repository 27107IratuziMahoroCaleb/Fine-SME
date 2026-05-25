from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, smes, transactions, predictions, alerts, recommendations, credit, sector, portfolio, reports, audit, engagements

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(smes.router)
api_router.include_router(transactions.router)
api_router.include_router(predictions.router)
api_router.include_router(alerts.router)
api_router.include_router(recommendations.router)
api_router.include_router(credit.router)
api_router.include_router(sector.router)
api_router.include_router(portfolio.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(engagements.router)
