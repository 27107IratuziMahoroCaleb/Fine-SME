from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.prediction import RiskPrediction, RiskLevel
from app.models.sme import SME


def generate_alerts_from_prediction(db: Session, pred: RiskPrediction) -> List[Alert]:
    alerts = []

    def _alert(alert_type, title, desc, severity, trigger, threshold, action):
        return Alert(
            sme_id=pred.sme_id,
            prediction_id=pred.id,
            alert_type=alert_type,
            title=title,
            description=desc,
            severity=severity,
            trigger_value=trigger,
            threshold_value=threshold,
            recommended_action=action,
        )

    if pred.burn_rate and float(pred.burn_rate) > 0.9:
        alerts.append(_alert(
            "high_burn_rate", "High Burn Rate Detected",
            f"Burn rate is {float(pred.burn_rate):.1%} — outflows are near or exceeding inflows.",
            AlertSeverity.HIGH, pred.burn_rate, 0.9,
            "Review and reduce non-essential expenses. Negotiate supplier payment terms."
        ))

    if pred.cash_runway_days is not None and pred.cash_runway_days < 30:
        alerts.append(_alert(
            "low_cash_runway", "Critical Cash Runway",
            f"Only {pred.cash_runway_days} days of cash runway remaining.",
            AlertSeverity.CRITICAL, pred.cash_runway_days, 30,
            "Seek emergency working capital. Accelerate receivables collection."
        ))

    if pred.revenue_volatility and float(pred.revenue_volatility) > 0.5:
        alerts.append(_alert(
            "high_revenue_volatility", "High Revenue Volatility",
            f"Revenue volatility is {float(pred.revenue_volatility):.1%} — cash flows are unpredictable.",
            AlertSeverity.MEDIUM, pred.revenue_volatility, 0.5,
            "Diversify customer base. Explore subscription or retainer revenue models."
        ))

    if pred.inflow_trend and float(pred.inflow_trend) < -0.15:
        alerts.append(_alert(
            "declining_inflows", "Declining Revenue Trend",
            f"Inflows have declined {abs(float(pred.inflow_trend)):.1%} over the past 6 months.",
            AlertSeverity.HIGH, pred.inflow_trend, -0.15,
            "Investigate root cause of revenue decline. Review pricing and sales strategy."
        ))

    if pred.overall_risk_level in (RiskLevel.CRITICAL,):
        alerts.append(_alert(
            "critical_risk", "Critical Sustainability Risk",
            "Overall financial sustainability is at critical risk level.",
            AlertSeverity.CRITICAL, pred.overall_risk_score, 75,
            "Immediate advisory intervention required. Consider debt restructuring."
        ))

    db.add_all(alerts)
    db.commit()
    return alerts


def list_alerts(db: Session, sme_id: int = None, status: AlertStatus = None, skip=0, limit=100):
    q = db.query(Alert)
    if sme_id:
        q = q.filter(Alert.sme_id == sme_id)
    if status:
        q = q.filter(Alert.status == status)
    return q.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


def acknowledge_alert(db: Session, alert_id: int, user_id: int) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
    return alert


def resolve_alert(db: Session, alert_id: int) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
    return alert
