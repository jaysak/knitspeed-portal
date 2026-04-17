# Deploy Knitspeed Portal from Your Phone

Total time: **~15–20 min** first time, **~5 min** if you've deployed before.

You will end up with a live URL like `knitspeed-portal-yourname.vercel.app` you can text to Gift, Bank, and Fern.

---

## What you have in this folder

```
knitspeed-deploy/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── StockPortal.jsx    ← the actual portal
    ├── main.jsx
    └── index.css
```

Don't edit these. Just upload the whole folder as-is.

---

## Step 1 · Create a GitHub account (skip if you have one)

1. Open `github.com` in your phone browser
2. Tap **"Sign up"** — email + password, 2 minutes
3. Verify your email

---

## Step 2 · Create a new repo and upload the files

1. On `github.com`, tap the **`+`** icon top right → **"New repository"**
2. Repository name: `knitspeed-portal`
3. Set it to **Public** (required for free Vercel deploys)
4. Leave everything else default, tap **"Create repository"**

5. On the new empty repo page, look for **"uploading an existing file"** link (it's in the quick-setup section). Tap it.
6. Tap **"choose your files"**
7. Select **every file and folder** from the `knitspeed-deploy/` folder you downloaded. On iOS/Android Files app you can tap-hold the first file, then tap the rest to multi-select.
   - **Important:** upload the *contents* of `knitspeed-deploy/`, not the folder itself. You want `package.json` at the root of your repo, not nested inside another folder.
8. Scroll down, tap **"Commit changes"**

You should now see `index.html`, `package.json`, `src/`, etc. listed at the top level of your repo.

---

## Step 3 · Deploy to Vercel

1. Open `vercel.com` in your phone browser
2. Tap **"Sign Up"** → choose **"Continue with GitHub"** → authorize
3. Once signed in, tap **"Add New..."** → **"Project"**
4. Find `knitspeed-portal` in your repo list, tap **"Import"**
5. On the configure screen:
   - Framework Preset: Vercel should auto-detect **"Vite"** ✓
   - Build settings: leave as default
   - Environment variables: leave empty
6. Tap **"Deploy"**

Wait about **60–90 seconds**. You'll see build logs scrolling. When it's done you'll see 🎉 and a preview.

7. Tap **"Continue to Dashboard"** or the preview URL

Your live URL is shown at the top. It'll look like:
`knitspeed-portal-abc123.vercel.app`

Tap it to open. The portal should load. Test the role switcher, tap around.

---

## Step 4 · Share with your team

Copy the URL and paste it into the LINE group chat, or text Gift/Bank/Fern directly.

**What they see:** the full portal. They can switch roles using the button in the top-right header (`แบงค์/Fern` vs `Gift`) to see each side.

**What it does NOT do yet:**
- No login — anyone with the link has access. For a private test this is fine; just don't post the link publicly.
- No real data persistence — if Gift "adds stock" on the admin page, nothing saves. It's a clickable mockup. Jay, we'll wire real persistence next session if the feedback is positive.
- No notifications to LINE yet.

---

## Step 5 · How to iterate later

Every time you (or anyone) pushes a change to the GitHub repo, Vercel automatically rebuilds and the URL updates in ~90 seconds. So next session when we make v0.4 changes, you either:
- Upload the updated `StockPortal.jsx` to GitHub (tap the file in your repo → pencil icon → paste new content → commit), OR
- We make the changes and I'll give you a single updated file to swap in.

The URL stays the same. Gift just refreshes her browser.

---

## If something breaks

**Build failed on Vercel?**
- Check that you uploaded all files including the `src/` folder. Missing `src/main.jsx` is the most common mistake.
- Check `package.json` is at the top level of the repo, not inside a nested folder.

**Page is blank?**
- Hard-refresh on phone: close the tab, reopen. Or use a different browser.
- Check Vercel's Deployments tab and look for red "Failed" status.

**Want a custom domain like `stock.knitspeed.co`?**
- Vercel supports this for free. Project Settings → Domains → Add. You'll need to own the domain and change its DNS. Can do this later.

---

Good luck. Once you have the URL live, text me in our next session with "here's the deployed URL, and here's feedback from Gift/Bank/Fern" and we'll iterate.
