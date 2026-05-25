from typing import List
from sqlalchemy.orm import Session
from app.models.recommendation import Recommendation, RecommendationCategory
from app.models.prediction import RiskPrediction


def generate_recommendations(db: Session, pred: RiskPrediction) -> List[Recommendation]:
    recs = []

    def _rec(category, priority, title, description, steps, impact):
        return Recommendation(
            sme_id=pred.sme_id,
            prediction_id=pred.id,
            category=category,
            priority=priority,
            title=title,
            description=description,
            action_steps=steps,
            expected_impact=impact,
        )

    if pred.burn_rate and float(pred.burn_rate) > 0.8:
        recs.append(_rec(
            RecommendationCategory.EXPENSE, 1,
            "Reduce Operating Expenses",
            "Your expense ratio is high relative to inflows. Cutting non-critical costs will improve net cash flow.",
            "1. Audit all expenses by category\n2. Identify top 3 cost centres\n3. Negotiate supplier terms\n4. Eliminate or defer non-essential spend",
            "Potential 10-20% reduction in monthly outflows"
        ))

    if pred.cash_runway_days is not None and pred.cash_runway_days < 60:
        recs.append(_rec(
            RecommendationCategory.WORKING_CAPITAL, 1,
            "Improve Working Capital Position",
            "Your cash runway is short. Strengthening working capital will reduce liquidity risk.",
            "1. Accelerate invoice collection\n2. Offer early payment discounts to customers\n3. Extend supplier payment terms\n4. Explore short-term credit facility",
            "Extend cash runway by 30-60 days"
        ))

    if pred.revenue_volatility and float(pred.revenue_volatility) > 0.4:
        recs.append(_rec(
            RecommendationCategory.REVENUE, 2,
            "Stabilise Revenue Streams",
            "High revenue volatility creates unpredictable cash flow. Diversifying income sources reduces risk.",
            "1. Analyse top 5 customers and their purchase patterns\n2. Introduce retainer or subscription pricing\n3. Add complementary product/service lines\n4. Reduce reliance on single customers",
            "Reduce revenue volatility by 20-30%"
        ))

    if pred.inflow_trend and float(pred.inflow_trend) < 0:
        recs.append(_rec(
            RecommendationCategory.REVENUE, 1,
            "Reverse Revenue Decline",
            "Inflows have been declining. Targeted sales and marketing actions can reverse this trend.",
            "1. Identify lost customers and reasons\n2. Launch targeted promotions\n3. Expand to new customer segments\n4. Review pricing competitiveness",
            "Potential 15-25% revenue growth over 3 months"
        ))

    if pred.net_cash_flow and float(pred.net_cash_flow) > 0:
        recs.append(_rec(
            RecommendationCategory.GROWTH, 3,
            "Reinvest Positive Cash Flow",
            "You have positive net cash flow. Strategic reinvestment can accelerate growth.",
            "1. Identify highest-ROI investment opportunities\n2. Consider equipment or inventory expansion\n3. Invest in staff training\n4. Build a cash reserve buffer of 3 months expenses",
            "Sustainable long-term growth"
        ))

    db.add_all(recs)
    db.commit()
    return recs


def list_recommendations(db: Session, sme_id: int = None, skip=0, limit=100):
    q = db.query(Recommendation)
    if sme_id:
        q = q.filter(Recommendation.sme_id == sme_id)
    return q.order_by(Recommendation.priority, Recommendation.created_at.desc()).offset(skip).limit(limit).all()
