# AI Trading Journal — Zadání pro programátora

> Inteligentní obchodní deník pro forex/krypto tradery — nezávislý na konkrétní strategii.
> **Pozicování:** retail-first, **freemium**; prop-firm režim jako prémiový tier. AI kouč běží na **Claude API**.
> Cíl: ne "další GPT wrapper", ale nástroj, který reálně zlepšuje edge tradera — přesná analytika + groundovaný proaktivní AI kouč + prémiový UX.

---

## 1. Tři principy, na kterých stojí kvalita (nepřekročitelné)

1. **AI nikdy nepočítá čísla.** Veškerá matematika (statistiky, metriky, agregace) se počítá deterministicky v kódu. AI dostává až hotová, ověřená čísla a *pouze je interpretuje, hledá vzory a kóčuje*. Tím se eliminují halucinace a každé tvrzení AI lze podložit konkrétním obchodem.
2. **App rozumí TVÉMU systému — nic není zadrátované natvrdo.** Uživatel si v nastavení definuje vlastní **setupy** a libovolné **tagy**. Deník segmentuje výsledky podle nich → funguje pro jakoukoliv strategii.
3. **Prémiový UX.** Moderní, futuristický design s kvalitními, plynulými animacemi (cíl 60 fps). Animace jsou účelové, ne dekorativní.

---

## 2. Tech stack

| Vrstva | Volba |
|---|---|
| Framework | **Next.js 16+** (App Router, React Server Components, Server Actions) |
| Jazyk | TypeScript (`strict: true`) |
| Databáze | **PostgreSQL** + **Prisma** ORM |
| AI | **Anthropic Claude API** (Messages API) — model dle tieru/úkolu |
| Grafy (cena/equity) | **lightweight-charts** (TradingView lib) |
| Grafy (distribuce/bary) | **Recharts** |
| Animace | **Motion** (Framer Motion) — spring-based, GPU-accelerated |
| Styling | **Tailwind CSS** + custom design tokeny |
| Validace | **Zod** (schémata sdílená klient ↔ server) |
| Sdílitelné obrázky | **Satori / @vercel/og** (server-side render karet) |
| Auth | Režim A (single-user/lokální): bez auth · Režim B (multi-user): **Clerk** nebo Auth.js |
| Upload souborů | UploadThing / S3-kompatibilní storage |

**Auth poznámka:** Data jsou per-user. Pro rychlý start Režim A (žádný login), ale s čistou abstrakcí `userId`, aby šel kdykoli zapnout Režim B bez přepisu datové vrstvy.

---

## 3. Datový model (jádro celé appky)

Setupy, pravidla i prop challenge jsou **data, ne kód** — definuje si je uživatel.

```prisma
model Trade {
  id            String   @id @default(cuid())
  userId        String

  // --- Identifikace ---
  symbol        String                         // "EURUSD", "BTCUSD", "US30"...
  direction     Direction                      // LONG | SHORT
  status        TradeStatus  @default(CLOSED)

  // --- Exekuce ---
  entryPrice    Float
  exitPrice     Float?
  stopLoss      Float
  takeProfit    Float?
  positionSize  Float
  entryTime     DateTime
  exitTime      DateTime?

  // --- Risk & výsledek (počítá engine) ---
  riskAmount    Float
  riskPercent   Float?
  realizedPnl   Float?
  fees          Float    @default(0)
  rMultiple     Float?                         // realizedPnl / riskAmount

  // --- Kontext (definuje uživatel) ---
  setupId        String?
  setup          Setup?   @relation(fields: [setupId], references: [id])
  tags           String[]
  entryTimeframe String?                       // "1H", "15m", "5m"... volný text
  session        Session?                      // ASIA | LONDON | NEWYORK

  // --- Prop (volitelné napojení na challenge) ---
  propChallengeId String?
  propChallenge   PropChallenge? @relation(fields: [propChallengeId], references: [id])

  // --- MAE / MFE ---
  mae           Float?                         // v R
  mfe           Float?                         // v R

  // --- Dodržování pravidel (engine vyhodnotí dle UserSettings) ---
  followedRiskRule   Boolean?
  followedRRTarget   Boolean?
  withinDailyLimit   Boolean?
  movedStop          Boolean  @default(false)

  // --- Behaviorální / poznámky ---
  emotionState  EmotionState?
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
  name        String                          // "Breakout", "Pullback"...
  description String?
  color       String?
  trades      Trade[]
  @@unique([userId, name])
}

model UserSettings {
  id               String @id @default(cuid())
  userId           String @unique
  accountSize      Float?
  maxRiskPercent   Float  @default(1)
  targetRR         Float  @default(2)
  maxTradesPerDay  Int    @default(3)
  currency         String @default("USD")
  plan             Plan   @default(FREE)        // FREE | PRO | ELITE
}

model PropChallenge {
  id              String     @id @default(cuid())
  userId          String
  firmName        String                        // "FTMO", "MyFundedFX"...
  phase           String?                       // "Phase 1", "Funded"...
  accountSize     Float
  dailyLossLimit  Float                          // max ztráta za den
  maxLossLimit    Float                          // celkový max drawdown
  profitTarget    Float?                         // cíl pro postup
  minTradingDays  Int?
  startDate       DateTime
  status          PropStatus @default(ACTIVE)    // ACTIVE | PASSED | FAILED
  trades          Trade[]
}

model Screenshot {
  id        String  @id @default(cuid())
  tradeId   String
  url       String
  extracted Json?                               // metadata z AI vision
  trade     Trade   @relation(fields: [tradeId], references: [id], onDelete: Cascade)
}

enum Direction      { LONG SHORT }
enum TradeStatus    { OPEN CLOSED CANCELLED }
enum Session        { ASIA LONDON NEWYORK }
enum EmotionState   { CALM FOMO REVENGE TILT UNCERTAIN }
enum PropStatus     { ACTIVE PASSED FAILED }
enum Plan           { FREE PRO ELITE }
```

---

## 4. Statistický engine (deterministický)

Modul `lib/stats/` — **čisté funkce**, vstup = `Trade[]`, výstup = metriky. Žádný LLM, žádný side effect. Pokryté unit testy.

**Základní:** počet obchodů, výhry/prohry, **win rate**, net/gross PnL, **profit factor** (`grossProfit / abs(grossLoss)`), **expectancy** (`mean(rMultiple)`), průměrná/největší výhra a ztráta, **streaks**.

**Křivky a riziko:** **equity curve** (kumulativní PnL), **max drawdown** (peak-to-trough), průměrné **MAE/MFE**, **R-multiple distribuce** (histogram).

**Segmentace (group-by) — sem patří reálná hodnota:**
- podle **setupu** a **tagů**, podle `session`, dne v týdnu, hodiny vstupu, `symbol`, `entryTimeframe`

**Dodržování pravidel:**
- % obchodů s dodrženým pravidlem (prahy z `UserSettings`) + **korelace porušení s PnL** (kolik tě stojí porušení každého pravidla)

Příklad výstupu pro uživatele:
> *"Setup 'Breakout' máš 64 % WR a 1,9R, ale 'Reversal' jen -0,3R → omez reversaly. Nejvíc vyděláváš v londýnské session."*

---

## 5. Moduly / obrazovky

```
/                     → Dashboard
/calendar             → Kalendář profitů
/trades               → Seznam obchodů
/trades/new           → Nový obchod
/trades/[id]          → Detail / editace
/analytics            → Breakdowny, distribuce, equity
/coach                → AI kouč (Pro+)
/prop                 → Prop-firm režim (Elite)
/settings             → Setupy, pravidla, prop challenge, účet
```

### 5.1 Dashboard (`/`)
KPI karty (net PnL, win rate, profit factor, expectancy, drawdown), zmenšená equity curve, poslední obchody, streak indikátor.
**Animace:** staggered reveal karet, **count-up** čísel, **draw-on** equity křivky.

### 5.2 Kalendář profitů (`/calendar`) — klíčová featura
- Měsíční grid, každý den obarvený podle **čistého PnL** (zelený/červený gradient, intenzita dle velikosti). V buňce P/L + počet obchodů.
- Postranní **týdenní souhrny**. **Klik na den** → obchody daného dne.
- Přepínač **měsíc / rok** (roční heatmapa stylu GitHub).
**Animace:** buňky staggered fade+scale-in, hover lift + glow barvy dne, plynulý přechod měsíců.

### 5.3 Deník obchodů (`/trades`, `/trades/new`, `/trades/[id]`)
- **Manuální zápis** (Zod, výběr setupu + tagů). **CSV import** (mapování exportu brokera/TradingView).
- **Screenshot grafu** + (volitelně) **AI vision**, co vytáhne kontext a předvyplní pole; uživatel jen potvrdí.
- Seznam = filtrovatelná tabulka (datum, symbol, setup, tagy, R, dodržení pravidel).

### 5.4 Analytika (`/analytics`)
- **Equity curve** (lightweight-charts, draw-on + gradient fill), **R-multiple distribuce**, breakdowny (setup/tagy/session/čas/symbol), **MAE/MFE scatter**.

### 5.5 Dodržování pravidel & behaviorální úniky
- Tracking uživatelských pravidel + detekce vzorů: posouvání SL, **revenge trade**, přeobchodování přes denní limit, předčasné zavírání winnerů (vysoké MFE vs malé R). U každého úniku: dopad na PnL.

### 5.6 AI kouč (`/coach`, Pro+)
Viz sekce 6. UI: panel s nejnovější per-trade analýzou, **týdenní review**, chat "zeptej se na svoje obchody".

### 5.7 Prop-firm režim (`/prop`, Elite)
- Předdefinované **rule sety** prop firem (FTMO, MyFundedFX, …) + vlastní.
- **Real-time tracking** z přiřazených obchodů: dnešní PnL vs **denní loss limit**, celkový drawdown vs **max loss**, progress vs **profit target**, počet obchodních dní.
- **Alerty před prasknutím** (např. při 80 % denního limitu) — hlavní důvod, proč si to prop trader zaplatí.
- "Challenge progress" dashboard (kolik zbývá k cíli / k limitu).

### 5.8 Sdílitelné karty (growth)
- One-tap export hezké karty (měsíční kalendář / equity / klíčové staty) jako **obrázek** ke sdílení (X, Discord, IG).
- Decentní watermark s názvem appky (i ve free) = akviziční kanál.
- Render server-side (Satori / @vercel/og) pro konzistentní vzhled.

### 5.9 Nastavení (`/settings`)
- Vlastní **setupy** + tagy.
- **Pravidla:** velikost účtu, max risk %, cílové RR, max obchodů/den.
- **Prop challenge(y):** firma, fáze, limity, cíl.
- AI / měna / plán.

---

## 6. AI kouč — jak funguje (Claude API)

**Provider:** Anthropic **Claude API** (Messages API, `https://api.anthropic.com/v1/messages`). Volání **jen server-side**, klíč nikdy do klienta. Docs: https://docs.claude.com/en/api/overview

**Proaktivní, ne reaktivní** (přesně ten rozdíl proti konkurenci, jejíž AI je mělká a jen odpovídá na dotazy):

1. **Po každém uzavřeném obchodu** — rychlá analýza levným modelem (**`claude-haiku-4-5-20251001`**): okamžitě flagne porušení pravidla nebo behaviorální vzor (revenge, mimo plán).
2. **Týdenní performance review** — silnější model (**`claude-sonnet-4-6`**, pro max hloubku **`claude-opus-4-8`**): souhrn výkonu, top úniky, konkrétní doporučení, flagnuté obchody. Ideálně přes **Batch API** (async, levnější).
3. **On-demand chat** — "zeptej se na svoje obchody"; do kontextu se vždy přiloží aktuální spočítané staty (stateless — plná historie + staty v každém requestu, vzor z NOVY).

**Vstup do modelu** = vždy deterministicky spočítané staty + vzorek obchodů (každý s `id`). **Grounding:** AI nepočítá čísla, jen interpretuje a každý insight podkládá `tradeId`. UI nikdy nezobrazí číslo "od AI".

**Structured output:** prompt na čisté JSON (`strengths`, `leaks`, `recommendations`, `flaggedTradeIds`), bezpečně parsovat (stripni ```json fence). Tenhle vzor znáš z NOVY.

**Šetření tokenů (drží marži):** **prompt caching** na systémový prompt kouče + uživatelova pravidla/setupy (opakují se v každém volání). Levný model na rutinu (per-trade), drahý jen na týdenní hloubku, hromadné reviews přes Batch API.

---

## 7. Monetizace & business model

**Pozicování:** retail-first (široká cílovka aktivních traderů), **prop-firm režim jako prémiový tier**. Freemium.

**Tiery:**
- **Free** — manuální zápis, základní staty, kalendář (omezená historie, např. 30 dní / strop obchodů), **sdílitelné karty** (s watermarkem = growth). AI: 1 ukázková analýza.
- **Pro (~$15–25/měs, roční billing)** — neomezeně obchodů i historie, **proaktivní AI kouč**, plná analytika, R-multiple distribuce, MAE/MFE, CSV import.
- **Elite / Prop (~$35–45/měs)** — vše z Pro + **prop-firm režim** (rule sety, real-time tracking, alerty), broker auto-sync, nejhlubší behaviorální AI, priorita.

**Gating AI:** Kouč běží na placeném Claude API → tokeny stojí peníze. Proto AI jen Pro+; free max 1 ochutnávka. Tím se drží marže (viz sekce 6 — náklady).

**Growth smyčka:** sdílitelné karty s watermarkem → tradeři je postují na X/Discord → levná akvizice. Free tier = vstupní bod (přímá konkurence free plán nemá).

**Vedlejší příjmy:** affiliate prop firem a brokerů (tučné programy), white-label pro trading komunity/edukátory (recurring, vyšší ACV), volitelný lifetime deal při launchi (rychlá hotovost + proti subscription únavě).

---

## 8. Design & animace (futuristický, prémiový)

Cíl: produkt, co vypadá jako z roku 2027 — **ne generický AI dashboard**.

**Aesthetic:** tmavé futuristické rozhraní s atmosférou a hloubkou. Žádná klišé (žádné fialové gradienty na bílé, žádný Inter/Roboto).
- **Typografie:** výrazný charakterní display font na čísla/nadpisy (monospace/technický grotesk = "trading terminal") + čistý body font. Velká sebevědomá čísla — metriky jsou hrdinové.
- **Barvy:** dominantní tmavé pozadí (deep navy / near-black), profit/loss jako primární barevný jazyk (sytá zelená vs červená/magenta), jeden cool akcent (cyan/electric). CSS proměnné pro vše.
- **Hloubka:** glass panely, jemný noise/grain, gradient glow za klíčovými prvky, jemné dramatické stíny. Atmosféra, ne ploché plochy.
- **Layout:** terminálovsky strukturovaný, generózní negativní prostor kolem klíčových metrik.

**Motion (Motion / Framer Motion):**
- **Účelové, ne dekorativní.** Jeden zorchestrovaný page-load se staggered reveal > deset rozházených mikrointerakcí.
- Konkrétně: staggered entrance karet, **count-up** čísel, **draw-on** equity křivky, fade+scale-in buněk kalendáře, plynulé route transitions, hover lift+glow, skeleton/shimmer loadery.
- **Spring-based** easing, animovat **jen `transform` a `opacity`** (GPU, 60 fps).
- Respektovat `prefers-reduced-motion`. Konzistentní "motion language" (stejné easingy/doby).

---

## 9. Pořadí implementace (milníky)

- **M1 — Fundament:** datový model + DB + migrace, CRUD obchodů, vlastní setupy + nastavení pravidel, Zod schémata. *Bez tohohle nejede nic.*
- **M2 — Stats engine:** `lib/stats/` čisté funkce + unit testy.
- **M3 — Dashboard + Analytika:** reálné metriky, equity curve, distribuce.
- **M4 — Kalendář profitů + sdílitelné karty:** klíčová featura + brzká akviziční smyčka.
- **M5 — AI kouč (Claude API):** per-trade poznámky + týdenní review + grounding + structured output.
- **M6 — Prop-firm režim + broker auto-sync:** rule sety, real-time tracking, alerty (prémiový tier).
- **M7 — Polish:** screenshot→vision, CSV import, finální motion, mobile.

M1–M2 udělat opravdu pečlivě (schéma + správnost statů) — zbytek se na tom postaví rychle.

---

## 10. Env proměnné

```env
DATABASE_URL=postgres://...
ANTHROPIC_API_KEY=...
CLAUDE_MODEL_FAST=claude-haiku-4-5-20251001     # per-trade poznámky
CLAUDE_MODEL_DEEP=claude-sonnet-4-6             # týdenní review (nebo claude-opus-4-8)
NEXT_PUBLIC_SITE_URL=...
# Režim B (multi-user):
# CLERK_SECRET_KEY=...
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# Storage pro screenshoty:
# UPLOADTHING_TOKEN=...
```

---

## 11. Nefunkční požadavky

- **Výkon:** animace 60 fps, server-rendered data (RSC) tam, kde to jde, žádné zbytečné client bundly.
- **Bezpečnost:** data per-`userId`, validace Zod na serveru, API klíče jen server-side.
- **Správnost:** stats engine pokrytý testy — chybná matika = zničená důvěra.
- **AI náklady:** levný model na rutinu, prompt caching, Batch API; AI jen v placených tierech.
- **Responsivita:** plně funkční desktop i mobil (kalendář a tabulky degradují do mobilního layoutu).
- **Přístupnost:** `prefers-reduced-motion`, kontrasty, klávesová ovladatelnost formulářů.
