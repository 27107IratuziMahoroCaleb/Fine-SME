# FINE SME — Role Permission Matrix

Backend-enforced via `app/core/deps.py` → `require_roles()`.  
Frontend mirrors this in `src/config/roles.js` (nav/route visibility only).

## Roles

| Code | Display name |
|---|---|
| `admin` | Administrator |
| `lender` | Lender (bank, MFI, SACCO) |
| `sme_advisor` | SME Advisor / BDS Provider |
| `risk_analyst` | Risk Analyst |
| `program_manager` | Program Manager |

## Permissions

| Endpoint / Action | admin | lender | sme_advisor | risk_analyst | program_mgr |
|---|:---:|:---:|:---:|:---:|:---:|
| **SMEs** |
| Read SMEs (list, detail) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create / edit SME | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete SME | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Transactions** |
| Read transactions / summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add transaction (manual / bulk / CSV) | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Predictions** |
| Run prediction | ✓ | ✓ | ✗ | ✓ | ✗ |
| Read predictions / scorecard | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Alerts** |
| Read alerts | ✓ | ✓ | ✓ | ✓ | ✓ |
| Acknowledge alert | ✓ | ✓ | ✓ | ✓ | ✗ |
| Resolve alert | ✓ | ✓ | ✗ | ✓ | ✗ |
| **Recommendations** |
| Read recommendations | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update recommendation status | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Credit Assessment** |
| Generate credit assessment | ✓ | ✓ | ✗ | ✗ | ✗ |
| Read credit assessments | ✓ | ✓ | ✗ | ✓ | ✗ |
| **Sector Analytics** |
| All sector endpoints | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Portfolio** |
| Portfolio summary | ✓ | ✓ | ✓ | ✓ | ✓ |
| Portfolio watchlist / risk trend | ✓ | ✓ | ✗ | ✓ | ✓ |
| **Reports** |
| Generate / read reports | ✓ | ✓ | ✗ | ✓ | ✓ |
| **User Management** |
| List / activate / deactivate users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Update own profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Audit Logs** |
| Read audit trail | ✓ | ✗ | ✗ | ✗ | ✗ |

## How to change a permission

Open the relevant file in `backend/app/api/v1/endpoints/` and update the `require_roles(...)` call on that route.  
For routes that allow all authenticated users, `Depends(get_current_user)` is used (no role filter).

## Auth endpoints (public — no role required)

`POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`
