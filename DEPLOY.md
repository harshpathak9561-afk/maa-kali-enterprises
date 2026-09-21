# Get a permanent public link (free)

Your preview links only work inside this Arena session. For a real link
like `https://maa-kali-enterprises.onrender.com` that anyone can open,
deploy the site once — it stays up 24/7. Easiest free option: **Render**.

## Option A — Full site incl. Control Panel (recommended)

1. Create a free account at **github.com** and **render.com** (log into Render with GitHub).
2. Put this `website` folder on GitHub:
   - GitHub > New repository > name it `maa-kali-site` > Create.
   - Upload all files from the `website` folder (drag & drop on the repo page).
3. In Render: **New +** > **Web Service** > select `maa-kali-site` > it auto-detects
   `render.yaml` > click **Create Web Service**.
4. Wait ~2 minutes. Render gives you a public URL — done! Your shop +
   Control Panel (`/admin.html`) both work there.

> Free-tier note: Render's free disk resets when the service restarts, so product
> edits/uploads may reset occasionally. Fine for demo/start; add a paid disk later
> (~$0.25/GB/month) to make everything permanent. Alternative Python hosts with the
> same one-command deploy: Railway, PythonAnywhere, Fly.io.

## Option B — Shop only, simplest hosting (Netlify / Vercel)

If you only need the storefront (no saving from the Control Panel):

1. Go to **app.netlify.com/drop** (free account).
2. Drag the whole `website` folder onto the page.
3. You instantly get a public link. The shop works fully (products, cart,
   demo checkout) using its built-in data.

## After deploying

- Shop: `https://YOUR-LINK/` · Control Panel: `https://YOUR-LINK/admin.html`
- To use your own domain later (e.g. `maakali.com`): buy it (~₹900/year from
  Hostinger/GoDaddy/Cloudflare) and connect it in Render/Netlify settings.
