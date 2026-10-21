# 🔮 Spell Academy

A spelling game for Singapore primary pupils. Cast spells by spelling words. Runs on Cloudflare Workers (static assets + API), D1 (database) and a Durable Object (duel arena).

```
wrangler.toml      Worker config, D1 + Durable Object bindings
schema.sql         D1 tables
src/worker.js      API, login, XP, analytics, DuelRoom Durable Object
public/index.html  The whole game client
```

## Deploy from your browser only (GitHub + Cloudflare dashboard)

You need a GitHub account and a Cloudflare account on the **Workers Paid plan** (Durable Objects need it).

### 1. Put the code on GitHub
1. On github.com, click **New repository**, name it `spell-academy`, keep it Private, create it.
2. Click **uploading an existing file**, drag in the *contents* of this folder (`wrangler.toml`, `schema.sql`, `README.md`, `src/`, `public/`) and commit.
   The `src` and `public` folders must sit at the top level of the repo.

### 2. Create the database
1. Cloudflare dashboard → **Storage & Databases → D1 SQL Database → Create database**. Name it `spell-academy`.
2. Open the database, copy its **Database ID**.
3. Open the **Console** tab, paste the whole contents of `schema.sql`, and run it. You should see 5 tables under **Tables**.
4. Back on GitHub, open `wrangler.toml`, click the pencil icon, replace `REPLACE_WITH_YOUR_D1_ID` with the ID, and commit.

### 3. Connect the repo to Workers
1. Dashboard → **Workers & Pages → Create → Import a repository** (Workers Builds).
2. Authorise GitHub, pick `spell-academy`.
3. Worker name must be `spell-academy` (matches `wrangler.toml`).
4. Leave Build command empty. Deploy command: `npx wrangler deploy`. Root directory: `/`.
5. Click **Save and Deploy**. The first deploy also creates the Durable Object class.

### 4. Add the two secrets
Worker → **Settings → Variables and Secrets → Add**, type **Secret**:
- `SECRET`: any long random string (signs login sessions)
- `ADMIN_KEY`: a password only you know (creates teacher accounts)

Then click **Deploy** so the secrets take effect.

### 5. First use
1. Open your `*.workers.dev` URL → **Teacher / Admin**.
2. Under *Admin: create teacher*, enter your admin key plus a username and password.
3. Log in as that teacher → **Create class**. Share the 6-letter class code.
4. Pupils enter their name and the class code. They are enrolled automatically the first time.
5. For duels, pupils in the same class (or anyone) type the same room code in **Duel Arena**.

Every push to GitHub redeploys automatically.

## Custom word lists
Teacher dashboard → **Upload word list**, one word per line:

```
necessary|It is {w} to wear a helmet when cycling.|One collar, two sleeves.
```
`{w}` marks where the word goes in the sentence. The hint is shown when a pupil gets it wrong. Custom lists are added to the built-in list for that class.

## Notes
- XP is calculated on the server from accuracy and speed. Levels follow `level = floor(sqrt(xp/50)) + 1`.
- Voice uses the browser's built-in speech (en-GB). Pupils should use Chrome, Edge or Safari with sound on.
- Duel spell checks currently run in the browser, so don't use duels for assessed marks.

## Troubleshooting
- **"Not found or not signed in"**: the secrets are missing; redo step 4 and redeploy.
- **Deploy fails on Durable Objects**: confirm the Workers Paid plan is active.
- **"Unknown class code"**: the teacher must create the class first.
- **Database errors**: check the ID in `wrangler.toml` and that `schema.sql` ran.
