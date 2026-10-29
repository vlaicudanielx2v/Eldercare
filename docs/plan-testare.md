# Plan de testare – ElderCare

Responsabil: Iliuta Ovidiu (Tester)

## Tipuri de testare
1. **Teste automate (API):** `backend/tests/api.test.js` cu Jest și Supertest. Rulează local cu `npm test` și automat pe GitHub Actions, la fiecare Pull Request.
2. **Teste manuale (UI):** scenariile de mai jos, rulate în browser pe desktop și pe telefon.
3. **Accesibilitate:** Lighthouse din Chrome DevTools, cu scor țintă ≥ 90.

## Scenarii de test

| ID | Cerință | Scenariu | Tip | Rezultat așteptat | Rezultat obținut |
|---|---|---|---|---|---|
| T1 | UC1 | Login valid | automat | primește token, rol corect | |
| T2 | UC1 | Login cu parolă greșită | automat | 401, fără token | |
| T3 | UC1 | Blocare după 5 încercări | automat | 423, cont blocat 15 min | |
| T4 | UC2 | Adăugare medicament valid | automat + manual | apare în listă | |
| T5 | UC2 | Adăugare fără denumire | automat + manual | mesaj de validare | |
| T6 | UC3 | Confirmare doză | automat + manual | doza devine „luată” | |
| T7 | UC3, UC5 | Doză neconfirmată 30 min | automat | „ratată” + alertă la aparținător | |
| T8 | UC4 | Calcul aderență (8 din 10) | automat | 80% | |
| T9 | UC6 | Trimitere SOS | automat + manual | alertă în < 5 s | |
| T10 | UC6 | Anulare SOS | manual | nu se trimite alertă | |
| T11 | NF2 | Acces la vârstnicul altui aparținător | automat | 403 | |
| T12 | UC7 | Admin blochează un cont | automat | utilizatorul nu se mai poate loga | |
| T13 | NF4 | Accesibilitate Lighthouse | manual | scor ≥ 90 | |

Coloana „Rezultat obținut” se completează la rularea testelor (săptămânile S9–S11) și intră în **raportul de testare**.
