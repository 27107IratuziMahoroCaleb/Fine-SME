"""
Seed script — realistic Rwanda SME data.
Run: python seed.py
"""
import random
import sys
import os
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User, UserRole, InstitutionType
from app.models.sme import SME, SMESize
from app.models.transaction import Transaction, TransactionType, TransactionSource
from app.services.prediction_service import run_prediction
from app.services.alert_service import generate_alerts_from_prediction
from app.services.recommendation_service import generate_recommendations

Base.metadata.create_all(bind=engine)
random.seed(42)

# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
USERS = [
    dict(full_name="Alice Uwimana",      email="alice@bk.rw",        role=UserRole.LENDER,          institution_type=InstitutionType.BANK,            organization="Bank of Kigali",       password="Password1!"),
    dict(full_name="Jean Habimana",      email="jean@unguka.rw",      role=UserRole.LENDER,          institution_type=InstitutionType.MICROFINANCE,     organization="Unguka Bank",           password="Password1!"),
    dict(full_name="Diane Mukamana",     email="diane@sme.rw",        role=UserRole.SME_ADVISOR,     institution_type=InstitutionType.DEVELOPMENT_PROGRAM, organization="RDB SME Program",    password="Password1!"),
    dict(full_name="Eric Niyonzima",     email="eric@sacco.rw",       role=UserRole.RISK_ANALYST,    institution_type=InstitutionType.SACCO,            organization="Umurenge SACCO",        password="Password1!"),
    dict(full_name="Grace Ineza",        email="grace@minecofin.rw",  role=UserRole.PROGRAM_MANAGER, institution_type=InstitutionType.DEVELOPMENT_PROGRAM, organization="MINECOFIN",         password="Password1!"),
]

# ---------------------------------------------------------------------------
# SME definitions — (name, sector, sub, size, province, district, owner, phone, employees, profile)
# profile = (base_inflow, inflow_growth, burn_base, burn_volatility, description)
#   base_inflow   : average monthly inflow RWF
#   inflow_growth : monthly growth rate (0.02 = growing, -0.02 = declining)
#   burn_base     : ratio of outflows to inflows (0.5 = healthy, 0.95 = critical)
#   burn_volatility: standard deviation of monthly outflow ratio
# ---------------------------------------------------------------------------
SMES = [
    # ── LOW RISK (healthy, growing) ──────────────────────────────────────────
    dict(
        name="Kigali Fresh Organics", sector="Agriculture", sub_sector="Organic produce",
        size=SMESize.SMALL, province="Kigali", district="Gasabo",
        owner="Patrick Nzeyimana", phone="+250788100001", employees=18,
        base_inflow=4_500_000, growth=0.025, burn=0.52, vol=0.06,
        desc="Organic vegetable supplier to Kigali hotels and supermarkets.",
        established=date(2019, 3, 1),
    ),
    dict(
        name="TechHub Rwanda", sector="ICT", sub_sector="Software services",
        size=SMESize.SMALL, province="Kigali", district="Nyarugenge",
        owner="Claudine Ishimwe", phone="+250788100002", employees=12,
        base_inflow=8_200_000, growth=0.035, burn=0.48, vol=0.08,
        desc="Software development and IT consulting for local enterprises.",
        established=date(2020, 6, 15),
    ),
    dict(
        name="Muhanga Dairy Cooperative", sector="Agriculture", sub_sector="Dairy",
        size=SMESize.MEDIUM, province="Southern", district="Muhanga",
        owner="Théodore Uwayo", phone="+250788100003", employees=45,
        base_inflow=12_800_000, growth=0.018, burn=0.61, vol=0.07,
        desc="Milk collection, processing, and distribution across Southern Province.",
        established=date(2017, 1, 20),
    ),
    dict(
        name="Rubavu Beach Resort", sector="Tourism", sub_sector="Hospitality",
        size=SMESize.SMALL, province="Western", district="Rubavu",
        owner="Yvonne Mukeshimana", phone="+250788100004", employees=22,
        base_inflow=6_100_000, growth=0.02, burn=0.58, vol=0.18,
        desc="Lakeside lodge on Lake Kivu with conference facilities.",
        established=date(2018, 9, 1),
    ),
    # ── MEDIUM RISK ──────────────────────────────────────────────────────────
    dict(
        name="Kimironko Electronics", sector="Retail", sub_sector="Consumer electronics",
        size=SMESize.SMALL, province="Kigali", district="Gasabo",
        owner="Samuel Gasana", phone="+250788100005", employees=9,
        base_inflow=5_400_000, growth=0.005, burn=0.78, vol=0.12,
        desc="Mobile phones, accessories, and repair services in Kimironko market.",
        established=date(2018, 4, 10),
    ),
    dict(
        name="Musanze Potato Traders", sector="Agriculture", sub_sector="Potato trading",
        size=SMESize.MICRO, province="Northern", district="Musanze",
        owner="Felicien Nshimiyimana", phone="+250788100006", employees=5,
        base_inflow=1_900_000, growth=-0.005, burn=0.74, vol=0.20,
        desc="Wholesale potato trading between Musanze farmers and Kigali markets.",
        established=date(2020, 2, 14),
    ),
    dict(
        name="Bugesera Brick Works", sector="Manufacturing", sub_sector="Construction materials",
        size=SMESize.SMALL, province="Eastern", district="Bugesera",
        owner="Janvier Hakizimana", phone="+250788100007", employees=28,
        base_inflow=7_600_000, growth=0.008, burn=0.80, vol=0.10,
        desc="Interlocking bricks and roofing tiles for local construction sector.",
        established=date(2016, 7, 5),
    ),
    dict(
        name="Nyamirambo Fashion House", sector="Manufacturing", sub_sector="Garments & textiles",
        size=SMESize.SMALL, province="Kigali", district="Nyarugenge",
        owner="Aline Uwineza", phone="+250788100008", employees=15,
        base_inflow=3_200_000, growth=-0.012, burn=0.82, vol=0.14,
        desc="Tailoring and ready-to-wear clothing for the local and export market.",
        established=date(2019, 11, 1),
    ),
    dict(
        name="Huye Transport SARL", sector="Transport", sub_sector="Passenger transport",
        size=SMESize.SMALL, province="Southern", district="Huye",
        owner="Donat Bizimana", phone="+250788100009", employees=16,
        base_inflow=4_800_000, growth=0.003, burn=0.76, vol=0.09,
        desc="Mini-bus transport between Huye and Kigali.",
        established=date(2017, 5, 20),
    ),
    dict(
        name="Rwamagana Agro-Input Store", sector="Agriculture", sub_sector="Agro-inputs",
        size=SMESize.MICRO, province="Eastern", district="Rwamagana",
        owner="Esperance Mukamugema", phone="+250788100010", employees=4,
        base_inflow=2_300_000, growth=0.01, burn=0.77, vol=0.15,
        desc="Seeds, fertilisers, and pesticides for smallholder farmers.",
        established=date(2021, 3, 8),
    ),
    # ── HIGH RISK ─────────────────────────────────────────────────────────────
    dict(
        name="Gikondo Metal Fabricators", sector="Manufacturing", sub_sector="Metal works",
        size=SMESize.SMALL, province="Kigali", district="Kicukiro",
        owner="Mathieu Nkurunziza", phone="+250788100011", employees=20,
        base_inflow=5_900_000, growth=-0.025, burn=0.91, vol=0.13,
        desc="Custom metal fabrication and welding for construction projects.",
        established=date(2016, 2, 1),
    ),
    dict(
        name="Nyagatare Cattle Ranch", sector="Agriculture", sub_sector="Livestock",
        size=SMESize.MEDIUM, province="Eastern", district="Nyagatare",
        owner="Protais Uwimana", phone="+250788100012", employees=35,
        base_inflow=9_100_000, growth=-0.018, burn=0.89, vol=0.16,
        desc="Beef cattle raising and sale to Kigali abattoirs.",
        established=date(2015, 8, 12),
    ),
    dict(
        name="Kicukiro Bakery & Café", sector="Services", sub_sector="Food & beverage",
        size=SMESize.MICRO, province="Kigali", district="Kicukiro",
        owner="Solange Ntawukuliryayo", phone="+250788100013", employees=7,
        base_inflow=1_600_000, growth=-0.03, burn=0.93, vol=0.11,
        desc="Artisan bread and pastries for residential and office customers.",
        established=date(2021, 7, 15),
    ),
    dict(
        name="Rusizi Fishing Enterprise", sector="Agriculture", sub_sector="Fisheries",
        size=SMESize.SMALL, province="Western", district="Rusizi",
        owner="Celestin Habimana", phone="+250788100014", employees=14,
        base_inflow=3_400_000, growth=-0.02, burn=0.88, vol=0.22,
        desc="Lake Kivu tilapia fishing and distribution to Western Province markets.",
        established=date(2018, 1, 10),
    ),
    # ── CRITICAL RISK ─────────────────────────────────────────────────────────
    dict(
        name="Remera Printing Press", sector="Services", sub_sector="Printing & media",
        size=SMESize.MICRO, province="Kigali", district="Gasabo",
        owner="Innocent Ntagungira", phone="+250788100015", employees=6,
        base_inflow=1_400_000, growth=-0.045, burn=0.97, vol=0.10,
        desc="Commercial printing — flyers, banners, and branded materials.",
        established=date(2020, 4, 1),
    ),
    dict(
        name="Gisenyi Hardware Store", sector="Retail", sub_sector="Construction hardware",
        size=SMESize.SMALL, province="Western", district="Rubavu",
        owner="Jean-Claude Munyakazi", phone="+250788100016", employees=8,
        base_inflow=2_800_000, growth=-0.035, burn=0.96, vol=0.13,
        desc="Hardware, tools, and building materials retail.",
        established=date(2019, 9, 25),
    ),
    dict(
        name="Nyamata Craft & Souvenir", sector="Tourism", sub_sector="Handicrafts",
        size=SMESize.MICRO, province="Eastern", district="Bugesera",
        owner="Marie-Rose Umubyeyi", phone="+250788100017", employees=5,
        base_inflow=900_000, growth=-0.04, burn=0.98, vol=0.09,
        desc="Traditional Rwandan baskets and crafts for tourists and export.",
        established=date(2022, 1, 1),
    ),
]

# Transaction categories
INFLOW_CATS = ["sales", "service_fees", "contract_payment", "advance_payment", "loan_disbursement", "grant"]
OUTFLOW_CATS = ["rent", "payroll", "utilities", "supplies_purchases", "loan_repayment", "transport", "marketing", "equipment_maintenance", "taxes"]


def months_back(n: int) -> date:
    today = date.today()
    month = today.month - n
    year = today.year + month // 12
    month = month % 12 or 12
    return date(year, month, 1)


def gen_transactions(sme_id: int, profile: dict) -> list[Transaction]:
    txns = []
    base = profile["base_inflow"]
    growth = profile["growth"]
    burn = profile["burn"]
    vol = profile["vol"]

    for m in range(17, -1, -1):  # 18 months back → now
        period_start = months_back(m)
        month_growth = (1 + growth) ** (17 - m)
        monthly_inflow = base * month_growth

        # 2–5 inflow transactions per month
        n_in = random.randint(2, 5)
        split = sorted(random.random() for _ in range(n_in - 1))
        split = [0] + split + [1]
        for i in range(n_in):
            share = split[i + 1] - split[i]
            amount = round(monthly_inflow * share * random.uniform(0.85, 1.15))
            if amount <= 0:
                continue
            day = random.randint(1, 28)
            txns.append(Transaction(
                sme_id=sme_id,
                date=period_start.replace(day=day),
                type=TransactionType.INFLOW,
                category=random.choice(INFLOW_CATS[:3]),
                amount=Decimal(str(amount)),
                source=random.choice([TransactionSource.BANK, TransactionSource.MOBILE_MONEY, TransactionSource.POS]),
                description=f"Income - {period_start.strftime('%b %Y')}",
            ))

        # 2–4 outflow transactions per month
        burn_ratio = max(0.1, min(1.2, random.gauss(burn, vol)))
        monthly_outflow = monthly_inflow * burn_ratio
        n_out = random.randint(2, 4)
        split = sorted(random.random() for _ in range(n_out - 1))
        split = [0] + split + [1]
        for i in range(n_out):
            share = split[i + 1] - split[i]
            amount = round(monthly_outflow * share * random.uniform(0.85, 1.15))
            if amount <= 0:
                continue
            day = random.randint(1, 28)
            txns.append(Transaction(
                sme_id=sme_id,
                date=period_start.replace(day=day),
                type=TransactionType.OUTFLOW,
                category=random.choice(OUTFLOW_CATS),
                amount=Decimal(str(amount)),
                source=TransactionSource.BANK,
                description=f"Expense - {period_start.strftime('%b %Y')}",
            ))

    return txns


def main():
    db = SessionLocal()
    try:
        print("=" * 55)
        print("  FINE SME — Seed Script")
        print("=" * 55)

        # ── Users ──────────────────────────────────────────────
        print("\n[1/4] Creating users...")
        admin = db.query(User).filter(User.email == "admin@finesme.com").first()
        if not admin:
            admin = User(
                full_name="System Administrator", email="admin@finesme.com",
                role=UserRole.ADMIN, hashed_password=hash_password("admin1234"), is_active=True,
            )
            db.add(admin); db.commit(); db.refresh(admin)

        for u in USERS:
            if not db.query(User).filter(User.email == u["email"]).first():
                db.add(User(
                    full_name=u["full_name"], email=u["email"], role=u["role"],
                    institution_type=u["institution_type"], organization=u["organization"],
                    phone=u.get("phone"), hashed_password=hash_password(u["password"]), is_active=True,
                ))
        db.commit()
        total_users = db.query(User).count()
        print(f"   OK  {total_users} users in database")

        # ── SMEs & Transactions ────────────────────────────────
        print("\n[2/4] Creating SMEs and transactions...")
        sme_records = []
        for s in SMES:
            existing = db.query(SME).filter(SME.name == s["name"]).first()
            if existing:
                sme_records.append(existing)
                print(f"   ~  {s['name']} (already exists)")
                continue

            sme = SME(
                name=s["name"], sector=s["sector"], sub_sector=s["sub_sector"],
                size=s["size"], location_province=s["province"], location_district=s["district"],
                owner_name=s["owner"], owner_phone=s["phone"], employee_count=s["employees"],
                description=s["desc"], established_date=s["established"],
                created_by=admin.id,
            )
            db.add(sme); db.commit(); db.refresh(sme)

            profile = dict(base_inflow=s["base_inflow"], growth=s["growth"], burn=s["burn"], vol=s["vol"])
            txns = gen_transactions(sme.id, profile)
            db.add_all(txns); db.commit()

            sme_records.append(sme)
            print(f"   OK  {sme.name} — {len(txns)} transactions")

        # ── Predictions, Alerts, Recommendations ──────────────
        print("\n[3/4] Running predictions, alerts & recommendations...")
        for sme in sme_records:
            pred = run_prediction(db, sme.id)
            if pred:
                generate_alerts_from_prediction(db, pred)
                generate_recommendations(db, pred)
                risk = pred.overall_risk_level.value if pred.overall_risk_level else "?"
                score = float(pred.overall_risk_score or 0)
                print(f"   OK  {sme.name[:38]:<38}  score={score:5.1f}  [{risk.upper()}]")
            else:
                print(f"   !  {sme.name} — insufficient data for prediction")

        # ── Summary ───────────────────────────────────────────
        print("\n[4/4] Database summary")
        from app.models.transaction import Transaction
        from app.models.prediction import RiskPrediction
        from app.models.alert import Alert
        from app.models.recommendation import Recommendation

        print(f"   Users          : {db.query(User).count()}")
        print(f"   SMEs           : {db.query(SME).count()}")
        print(f"   Transactions   : {db.query(Transaction).count()}")
        print(f"   Predictions    : {db.query(RiskPrediction).count()}")
        print(f"   Alerts         : {db.query(Alert).count()}")
        print(f"   Recommendations: {db.query(Recommendation).count()}")
        print("\n  Done. Open http://localhost:5173 to explore.\n")

    finally:
        db.close()


if __name__ == "__main__":
    main()

