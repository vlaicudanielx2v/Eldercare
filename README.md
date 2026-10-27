# ElderCare

Aplicație web de suport pentru persoanele vârstnice: remindere pentru medicamente, confirmarea dozelor, alerte pentru aparținători și buton SOS.

Proiect realizat la disciplina **Managementul Proiectelor Software (MPS)**, Facultatea de Automatică, Calculatoare și Electronică.

## Echipa

| Membru | Rol | Responsabil de |
|---|---|---|
| [Vlaicu Daniel Nicolae] | Project Manager | README, `docs/` (SRS, task-uri), șabloane `.github/` |
| [Gherman Corneliu] | Tech Lead + Backend Developer | `backend/src/` |
| [Miloseski Luka] | Frontend Developer | `frontend/` |
| [Iliuta Ovidiu] | Tester (QA) | `backend/tests/`, `docs/plan-testare.md`, `.github/workflows/` (CI) |

## Funcționalități

- **Vârstnic:** vede medicamentele zilei, confirmă doza cu butonul „Am luat”, trimite alertă SOS.
- **Aparținător:** își creează cont, adaugă vârstnici, gestionează medicamentele, vede istoricul și aderența, primește alerte.
- **Administrator:** vede statistici, blochează sau șterge conturi.

## Tehnologii

| Parte | Tehnologie |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express (API REST) |
| Bază de date | SQLite (better-sqlite3) |
| Autentificare | JWT + parole criptate cu bcrypt |
| Teste | Jest + Supertest |
| CI | GitHub Actions |

## Cum se rulează

Aveți nevoie de **Node.js 20 sau mai nou** (https://nodejs.org).

**1. Backend** (într-un terminal):
```bash
cd backend
npm install
npm run dev
```
API-ul pornește pe http://localhost:4000.

**2. Frontend** (în alt terminal):
```bash
cd frontend
npm install
npm run dev
```
Deschideți http://localhost:5173.

**3. Teste:**
```bash
cd backend
npm test
```

### Cont de administrator implicit
- e-mail: `admin@eldercare.ro`
- parolă: `admin123`

### Scenariu de demo
1. Creați un cont de aparținător („Înregistrează-te ca aparținător”).
2. Adăugați un vârstnic, cu e-mail și PIN de 4 cifre.
3. Intrați pe vârstnic și adăugați un medicament cu ora curentă (de exemplu `14:05`).
4. Ieșiți și intrați cu e-mailul și PIN-ul vârstnicului. Apare cardul cu butonul **Am luat**.
5. Apăsați **SOS**, apoi intrați din nou ca aparținător. Apare alerta.

## Structura proiectului

```
eldercare/
├── backend/
│   ├── src/
│   │   ├── app.js              # configurare Express
│   │   ├── server.js           # pornire server + verificare doze la fiecare minut
│   │   ├── db.js               # baza de date SQLite
│   │   ├── middleware/auth.js  # JWT, roluri, verificare acces
│   │   ├── routes/             # auth, caregiver, elder, admin
│   │   ├── services/doses.js   # generare doze, doze ratate, aderență
│   │   └── utils/time.js
│   └── tests/api.test.js       # testele T1–T12
├── frontend/
│   └── src/
│       ├── App.jsx, api.js, styles.css
│       └── pages/              # Login, ElderHome, CaregiverDashboard, ElderDetails, AdminPanel
├── docs/                       # SRS, plan de testare, lista de task-uri
└── .github/                    # CI, șabloane pentru Issues și Pull Requests
```

## Flux de lucru Git

- `main` conține versiunea stabilă, care se prezintă la demo.
- `dev` este ramura de integrare.
- Pentru fiecare task se lucrează pe `feature/<nume>`, apoi se face Pull Request în `dev`. Alt membru face review, apoi se face merge.
