# CreatorHub AI

AI-native marketplace connecting AI content creators with brands and agencies.

**Tagline:** Discover AI creators. Build better campaigns.

## Demo logins

Password for all demo accounts: `DemoPass123!`

| Role | Email |
| --- | --- |
| Brand (Apex Athletics) | `apex@creatorhub.ai` |
| Brand (Lumen Beauty) | `lumen@creatorhub.ai` |
| Brand (Northstar Agency) | `northstar@creatorhub.ai` |
| Creator (Maya Chen — product film) | `maya@creatorhub.ai` |
| Creator (Arjun Mehta) | `arjun@creatorhub.ai` |

## Run locally

Requires Node 22+ and PostgreSQL on port 5432 (Docker or the bundled embedded Postgres helper).

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
npm install
npm install --prefix server
npm install --prefix client
node scripts/ensure-postgres.mjs
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:4000/api/health

Optional: set `OPENAI_API_KEY` in `.env`. Without a key, the AI Brief Builder uses a realistic demo fallback.

## Demo path

1. Login as `apex@creatorhub.ai`
2. Open **AI Brief Builder**, generate from the sneaker prompt, save
3. **Find creators** with AI Video + Product Advertisement + Runway + commercial use
4. Open the top match, view portfolio and trust signals
5. Shortlist → Send brief
6. Logout, login as `maya@creatorhub.ai`, accept the engagement
