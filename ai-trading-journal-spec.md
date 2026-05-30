# AI Trading Journal — Zadání pro programátora

> Inteligentní obchodní deník pro forex/krypto tradery — nezávislý na konkrétní strategii.
> Cíl: ne "další GPT wrapper", ale nástroj, který reálně zlepšuje edge tradera — přesná analytika + groundovaná AI interpretace + prémiový UX.

---

## 1. Tři principy, na kterých stojí kvalita (nepřekročitelné)

1. **AI nikdy nepočítá čísla.** Veškerá matematika (statistiky, metriky, agregace) se počítá deterministicky v kódu. AI dostává až hotová, ověřená čísla a *pouze je interpretuje, hledá vzory a kóčuje*. Tím se eliminují halucinace a každé tvrzení AI lze podložit konkrétním obchodem.
2. **App rozumí TVÉMU systému — nic není zadrátované natvrdo.** Uživatel si v nastavení definuje vlastní **setupy** (pojmenované obchodní vzory) a libovolné **tagy**. Deník pak segmentuje výsledky podle nich, takže funguje pro jakoukoliv strategii. Generický deník hází vše na hromadu — tenhle ne.
3. **Prémiový UX.** Moderní, futuristický design s kvalitními, plynulými animacemi (cíl 60 fps). Animace jsou účelové, ne dekorativní.

---

## 2. Tech stack

| Vrstva | Volba |
|---|---|
| Framework | **Next.js 16+** (App Router, React Server Components, Server Actions) |
| Jazyk | TypeScript (`strict: true`) |
| Databáze | **PostgreSQL** + **Prisma** ORM (alternativa: Drizzle) |
| AI | **OpenRouter API** (model konfigurovatelný přes env) |
| Grafy (cena/equity) | **lightweight-charts** (TradingView lib) |
| Grafy (distribuce/bary) | **Recharts** |
| Animace | **Motion** (Framer Motion) — spring-based, GPU-accelerated |
| Styling | **Tailwind CSS** + custom design tokeny |
| Validace | **Zod** (schémata sdílená klient ↔ server) |
| Auth | Režim A (single-user/lokální): bez auth · Režim B (multi-user): **Clerk** nebo Auth.js |
| Upload souborů | UploadThing / S3-kompatibilní storage (pro screenshoty grafů) |

**Poznámka k auth:** Data deníku jsou soukromá a per-user. Pro rychlý start doporučuju Režim A (single-user, žádný login), s čistou abstrakcí `userId`, aby šel kdykoli zapnout Režim B bez přepisování datové vrstvy.

---

## 3. Datový model (jádro celé appky)

Tohle je první věc, kterou postavit — vše ostatní na ní stojí. Klíčové je, že **setupy i pravidla jsou data, ne kód** — uživatel si je definuje sám.

```prisma
model Trade {
  id            String   @id @default(cuid())
  userId        String                         // připraveno na multi-user

  // --- Identifikace ---
  symbol        String                         // "EURUSD", "BTCUSD", "US30"...
  direction     Direction                      // LONG | SHORT
  status        TradeStatus  @default(CLOSED)   // OPEN | CLOSED | CANCELLED

  // --- Exekuce ---
  entryPrice    Float
  exitPrice     Float?
  stopLoss      Float                          // plánovaný SL
  takeProfit    Float?                         // plánovaný TP
  positionSize  Float                          // velikost pozice (lots / units)
  entryTime     DateTime
  exitTime      DateTime?

  // --- Risk & výsledek (počítá engine, ne uživatel) ---
  riskAmount    Float                          // riskovaná částka v měně
  riskPercent   Float?                         // % z účtu
  realizedPnl   Float?                         // čistý výsledek v měně
  fees          Float    @default(0)
  rMultiple     Float?                         // realizedPnl / riskAmount (počítáno)

  // --- Kontext obchodu (definuje uživatel, nic natvrdo) ---
  setupId        String?                       // odkaz na vlastní setup uživatele
  setup          Setup?   @relation(fields: [setupId], references: [id])
  tags           String[]                      // libovolné vlastní tagy
  entryTimeframe String?                       // "1H", "15m", "5m"... volný text
  session        Session?                      // ASIA | LONDON | NEWYORK

  // --- MAE / MFE ---
  mae           Float?                         // max adverse excursion (v R)
  mfe           Float?                         // max favorable excursion (v R)

  // --- Dodržování pravidel (engine vyhodnotí dle UserSettings) ---
  followedRiskRule   Boolean?                  // risk <= maxRiskPercent?
  followedRRTarget   Boolean?                  // RR >= targetRR?
  withinDailyLimit   Boolean?                  // <= maxTradesPerDay?
  movedStop          Boolean  @default(false)  // posunul SL? (zadá uživatel)

  // --- Behaviorální / poznámky ---
  emotionState  EmotionState?                  // CALM | FOMO | REVENGE | TILT | UNCERTAIN
  notes         String?       @db.Text
  screenshots   Screenshot[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId, entryTime])
  @@index([userId, setupId])
}

model Setup {
  id          String  @id @default(cuid())
  userId      String
  name        String                          // "Breakout", "Pullback", "Range reversal"...
  description String?
  color       String?                          // pro odlišení v UI
  trades      Trade[]

  @@unique([userId, name])
}

model UserSettings {
  id               String @id @default(cuid())
  userId           String @unique
  accountSize      Float?
  maxRiskPercent   Float  @default(1)           // pravidlo: max risk na obchod
  targetRR         Float  @default(2)           // pravidlo: cílové RR
  maxTradesPerDay  Int    @default(3)           // pravidlo: max obchodů/den
  currency         String @default("USD")
}

model Screenshot {
  id        String  @id @default(cuid())
  tradeId   String
  url       String
  // metadata vytažená AI vision z grafu (volitelné)
  extracted Json?
  trade     Trade   @relation(fields: [tradeId], references: [id], onDelete: Cascade)
}

enum Direction      { LONG SHORT }
enum TradeStatus    { OPEN CLOSED CANCELLED }
enum Session        { ASIA LONDON NEWYORK }
enum EmotionState   { CALM FOMO REVENGE TILT UNCERTAIN }
```

---

## 4. Statistický engine (deterministický)

Modul `lib/stats/` — **čisté funkce**, vstup = `Trade[]`, výstup = spočítané metriky. Žádný LLM, žádný side effect. Pokryté unit testy.

**Základní metriky:**
- počet obchodů, výher, proher, **win rate**
- net PnL, gross profit, gross loss
- **profit factor** = `grossProfit / abs(grossLoss)`
- **expectancy** = `mean(rMultiple)` (průměrné R na obchod)
- průměrná výhra / ztráta (v R i v měně), největší výhra / ztráta
- nejdelší série výher / proher (streaks)

**Křivky a riziko:**
- **equity curve** = kumulativní PnL v čase
- **max drawdown** = největší pokles peak-to-trough na equity křivce
- průměrné **MAE / MFE** (kvalita umístění SL/TP)
- **R-multiple distribuce** (histogram)

**Segmentace (group-by) — sem patří reálná hodnota:**
- výkon podle **setupu** (uživatelem definovaného) a podle **tagů**
- výkon podle `session`, dne v týdnu, hodiny vstupu, `symbol`
- výkon podle `entryTimeframe`

**Dodržování pravidel:**
- % obchodů, kde byla dodržena jednotlivá pravidla (max risk %, cílové RR, denní limit, neposunul SL) — prahy z `UserSettings`
- **korelace porušení s PnL** — kolik stojí porušení každého pravidla

Příklad výstupu, který chce uživatel vidět:
> *"Setup 'Breakout' máš 64 % WR a 1,9R, ale 'Reversal' jen -0,3R → omez reversaly. Nejvíc vyděláváš v londýnské session."*

---

## 5. Moduly / obrazovky

Routovací struktura (App Router):

```
/                     → Dashboard
/calendar             → Kalendář profitů
/trades               → Seznam obchodů
/trades/new           → Nový obchod
/trades/[id]          → Detail / editace
/analytics            → Breakdowny, distribuce, equity
/insights             → AI analýza
/settings             → Setupy, pravidla, účet, model
```

### 5.1 Dashboard (`/`)
Rychlý přehled: klíčové KPI karty (net PnL, win rate, profit factor, expectancy, aktuální drawdown), zmenšená equity curve, posledních pár obchodů, "streak" indikátor.
**Animace:** staggered reveal karet při načtení, **count-up animace čísel** v KPI, equity křivka se "nakreslí" (draw-on).

### 5.2 Kalendář profitů (`/calendar`) — klíčová featura
- Měsíční grid. Každý den obarvený podle **čistého PnL** daného dne: zelený gradient = profit, červený = ztráta, **intenzita podle velikosti**. Neutrální/bez obchodů = tlumená buňka.
- V buňce: čistý P/L dne + počet obchodů.
- Postranní sloupec s **týdenními souhrny** (P/L za týden, počet obchodů, WR).
- **Klik na den** → rozbalí/zobrazí obchody daného dne.
- Přepínač **měsíc / rok** — roční pohled jako heatmapa (styl GitHub contributions).
**Animace:** buňky se při změně měsíce objeví staggered (fade + scale-in), hover buňku jemně zvedne + glow odpovídající barvě dne, plynulý přechod mezi měsíci.

### 5.3 Deník obchodů (`/trades`, `/trades/new`, `/trades/[id]`)
- **Manuální zápis** přes formulář (Zod validace, sdílené schéma); výběr vlastního setupu + tagů.
- **CSV import** — mapování sloupců z exportu brokera/TradingView na `Trade`.
- **Screenshot grafu** — upload + (volitelně) **AI vision**, která z grafu vytáhne kontext (symbol, směr, přibližné úrovně) a předvyplní pole. Uživatel jen potvrdí.
- Seznam = filtrovatelná/řaditelná tabulka (podle data, symbolu, setupu, tagů, R, dodržení pravidel).

### 5.4 Analytika (`/analytics`)
- **Equity curve** (lightweight-charts) s draw-on animací a gradient fill pod křivkou.
- **R-multiple distribuce** (histogram, Recharts).
- Breakdown panely: podle **setupu / tagů** / session / času / symbolu.
- **MAE/MFE scatter** — kde necháváš peníze na stole / jak hluboko jdeš do mínusu.

### 5.5 Dodržování pravidel & behaviorální úniky
Vlastní panel (může být součást Analytiky i Insights):
- Tracking pravidel definovaných uživatelem v nastavení (max risk %, cílové RR, max obchodů/den).
- Detekce vzorů: posouvání SL, **revenge trade** (vstup krátce po ztrátě), přeobchodování přes vlastní denní limit, předčasné zavírání winnerů (vysoké MFE vs malé realizované R).
- U každého úniku: kolik tě stál (dopad na PnL).

### 5.6 AI Insights (`/insights`)
Viz sekce 6.

### 5.7 Nastavení (`/settings`)
- Definice vlastních **setupů** (název, popis, barva) a správa tagů.
- **Pravidla:** velikost účtu, max risk %, cílové RR, max obchodů/den — tyhle prahy řídí vyhodnocování dodržování pravidel v celé appce.
- AI model (OpenRouter), měna.

---

## 6. AI vrstva — jak přesně funguje

**Tok:**
1. Uživatel zvolí období / filtr (např. "poslední měsíc", "jen setup Breakout") a klikne **Analyzovat**.
2. **Server** spočítá statistiky (sekce 4) pro daný výběr a sestaví **strukturovaný JSON**: agregované metriky + vzorek pozoruhodných obchodů (nej/nejhorší, porušená pravidla) — každý s `id`.
3. Tenhle JSON jde do LLM přes **OpenRouter** se system promptem v duchu:
   - *Jsi trading kouč. Uvažuj výhradně nad dodanými čísly. Nikdy nevymýšlej statistiky. Každý insight podlož konkrétním `tradeId` nebo konkrétní metrikou. Buď přímý a konkrétní.*
4. Výstup AI je **strukturovaný** (silné stránky / úniky / doporučení / flagnuté obchody), vykreslí se v UI s odkazy na reálné obchody.

**Grounding pravidlo:** UI nikdy nezobrazí číslo, které "řekla AI" — čísla pochází vždy ze statistického enginu. AI dodává jen text/interpretaci.

**Konverzace:** volitelně chat režim ("zeptej se na svoje obchody"), kde se do kontextu vždy přiloží aktuální spočítané staty (stateless — plná historie + staty v každém requestu).

---

## 7. Design & animace (futuristický, prémiový)

Cílem je něco, co vypadá jako produkt z roku 2027 — **ne generický AI dashboard**.

**Aesthetic direction:** tmavé futuristické rozhraní s atmosférou a hloubkou. Žádné klišé (žádné fialové gradienty na bílé, žádný Inter/Roboto). Doporučení:
- **Typografie:** výrazný, charakterní display font na čísla/nadpisy (např. monospace/technický grotesk pro "trading terminal" pocit) + čistý čitelný body font. Velká, sebevědomá čísla — metriky jsou hrdinové.
- **Barvy:** dominantní tmavé pozadí (deep navy / near-black) s ostrými akcenty — profit/loss jako primární barevný jazyk (sytá zelená vs červená/magenta), jeden cool akcent (cyan/electric) pro UI prvky. CSS proměnné pro vše.
- **Hloubka:** vrstvené průhlednosti (glass panely), jemný noise/grain overlay, gradient glow za klíčovými prvky, dramatické ale jemné stíny. Atmosféra, ne ploché plochy.
- **Layout:** přehledný, terminálovsky strukturovaný, generózní negativní prostor kolem klíčových metrik.

**Motion (Motion / Framer Motion):**
- **Účelové, ne dekorativní.** Jeden dobře zorchestrovaný page-load se staggered reveal dělá víc než deset rozházených mikrointerakcí.
- Konkrétně: staggered entrance karet, **count-up** animace čísel, **draw-on** equity křivky, fade+scale-in buněk kalendáře, plynulé route transitions, hover micro-interakce (lift + glow), skeleton/shimmer loadery.
- **Spring-based** easing (přirozený pohyb), animovat **jen `transform` a `opacity`** (GPU, 60 fps).
- Respektovat `prefers-reduced-motion` (přístupnost) — animace se degradují gracefully.
- Konzistentní "motion language" napříč celou appkou (stejné easingy, doby trvání).

---

## 8. Pořadí implementace (milníky)

- **M1 — Fundament:** datový model + DB + migrace, CRUD obchodů (manuální zápis), vlastní setupy + nastavení pravidel, Zod schémata. *Bez tohohle nejede nic.*
- **M2 — Stats engine:** `lib/stats/` čisté funkce + unit testy. Žádné UI, jen ověřená čísla.
- **M3 — Dashboard + Analytika:** vykreslení reálných metrik, equity curve, distribuce.
- **M4 — Kalendář profitů:** měsíční/roční pohled, klik na den.
- **M5 — AI vrstva:** Insights nad spočítanými staty, grounding, OpenRouter.
- **M6 — Polish:** screenshot upload + AI vision, CSV import, finální motion design, responsivita.

Doporučení: M1–M2 udělat opravdu pečlivě (schéma + správnost statů), zbytek se na tom postaví rychle.

---

## 9. Env proměnné

```env
DATABASE_URL=postgres://...
OPENROUTER_API_KEY=...
AI_MODEL=...                      # např. nvidia/nemotron... nebo jiný model
NEXT_PUBLIC_SITE_URL=...
# Režim B (multi-user):
# CLERK_SECRET_KEY=...
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# Storage pro screenshoty:
# UPLOADTHING_TOKEN=...  (nebo S3 přístup)
```

---

## 10. Nefunkční požadavky

- **Výkon:** animace 60 fps, server-rendered data tam, kde to jde (RSC), žádné zbytečné client bundly.
- **Bezpečnost:** data per-`userId`, validace vstupů Zod na serveru, API klíče jen server-side (nikdy do klienta).
- **Správnost:** statistický engine pokrytý testy — chybná matika = zničená důvěra v celý nástroj.
- **Responsivita:** plně funkční na desktopu i mobilu (kalendář a tabulky degradují do mobilního layoutu).
- **Přístupnost:** `prefers-reduced-motion`, kontrasty, klávesová ovladatelnost formulářů.
