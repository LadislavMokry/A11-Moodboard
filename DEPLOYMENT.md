# Moodeight - Deployment Guide

This guide covers deploying the Moodeight application to Cloudflare Pages.

## Prerequisites

- Cloudflare account
- Supabase project with database and Edge Functions deployed
- GitHub repository with your code
- Wrangler CLI installed (`npm install -g wrangler`)

## Environment Variables

The application requires the following environment variables:

### Client-side (VITE_ prefix - exposed to browser)
- `VITE_SUPABASE_URL` - Your Supabase project URL
  - Get from: Supabase Dashboard → Project Settings → API → Project URL
  - Example: `https://jqjkdfbgrtdlkkfwavyq.supabase.co`

- `VITE_SUPABASE_ANON_KEY` - Supabase publishable key (starts with `sb_publishable_`)
  - Get from: Supabase Dashboard → Project Settings → API → Publishable Key
  - Safe for browser use with RLS policies

- `VITE_SHOWCASE_BOARD_ID` - UUID of the board to display on the homepage
  - Optional: Set to a board's ID to show it on the marketing homepage
  - Example: `b4532b22-b6de-4602-ba73-824c562a2c72`

### Server-side (Pages Functions only - NOT exposed to browser)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase secret key (starts with `sb_secret_`)
  - Get from: Supabase Dashboard → Project Settings → API → Secret Key
  - **CRITICAL**: Never expose this in client-side code
  - Used only in Cloudflare Pages Functions for server-side operations

## Cloudflare Pages Setup

### Step 1: Create Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (default)

### Step 2: Set Environment Variables

In your Cloudflare Pages project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables for **Production**:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_your-key-here`
   - `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_your-key-here` (encrypt as secret)
   - `VITE_SHOWCASE_BOARD_ID` = `your-board-uuid` (optional)

3. **Important**: Mark `SUPABASE_SERVICE_ROLE_KEY` as **Encrypted** (secret)
4. Repeat for **Preview** environment if needed

### Step 3: Configure Custom Domain (Optional)

1. Go to **Custom domains** in your Pages project
2. Add your domain (e.g., `moodeight.com`)
3. Follow DNS setup instructions
4. SSL certificate will be automatically provisioned

### Step 4: Update Google OAuth Redirect URLs

After deployment, update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your production domain to **Authorized JavaScript origins**:
   - `https://your-domain.pages.dev`
   - `https://your-custom-domain.com` (if using custom domain)

5. Update in Supabase Dashboard → Authentication → Providers → Google:
   - Add the same URLs to redirect URLs

## Local Development with Wrangler

To test Pages Functions locally:

```bash
# 1. Build the app first
npm run build

# 2. Create .dev.vars file (copy from .dev.vars.example)
cp .dev.vars.example .dev.vars

# 3. Fill in your actual values in .dev.vars
# VITE_SUPABASE_URL=https://...
# SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
# VITE_SUPABASE_ANON_KEY=sb_publishable_...

# 4. Run Wrangler dev server
npm run wrangler:dev
```

This will serve your built app with Pages Functions at `http://localhost:8788`

## Deployment Methods

### Method 1: GitHub Actions (Automatic)

Push to `main` branch triggers automatic deployment via `.github/workflows/deploy.yml`

**Setup**:
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN` - Create at Cloudflare Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template
   - `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare Dashboard → Workers & Pages → Account ID (right sidebar)

### Method 2: Wrangler CLI (Manual)

Deploy from your local machine:

```bash
# Deploy to production
npm run deploy

# Deploy to preview environment
npm run deploy:preview
```

**First-time setup**:
```bash
# Login to Cloudflare
wrangler login

# Deploy
npm run deploy
```

### Method 3: Cloudflare Dashboard (Git Push)

Simply push to `main` branch - Cloudflare will automatically build and deploy.

## Post-Deployment Verification

After deployment, verify:

1. **App loads**: Visit your production URL
2. **Authentication works**: Sign in with Google
3. **Create board**: Test board creation and image uploads
4. **Public sharing**: Create a public board link and test in incognito
5. **OG meta tags**: Share a public board link on Twitter/Discord/Slack and verify preview image shows
6. **OG images**: Test `/api/og/:shareToken.png` endpoint returns correct image

### Testing OG Meta Tags

```bash
# Fetch a public board URL and check meta tags
curl https://your-domain.com/b/some-share-token | grep "og:image"
```

Should return:
```html
<meta property="og:image" content="https://your-domain.com/api/og/some-share-token.png">
```

## Troubleshooting

### Pages Functions not working
- Verify `functions/` directory is in the repository root
- Check Cloudflare Pages build logs for errors
- Ensure `wrangler.toml` has correct `pages_build_output_dir = "dist"`

### Environment variables not available
- Client-side vars must have `VITE_` prefix
- Server-side vars (Pages Functions) access via `env.VAR_NAME`
- Re-deploy after adding new environment variables

### OG images not showing
- Test the endpoint directly: `https://your-domain.com/api/og/:shareToken.png`
- Check Network tab for CORS errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Cloudflare

### Build failures
- Run `npm run build` locally to reproduce
- Check for TypeScript errors
- Ensure all dependencies are in `package.json`

## Rollback

If deployment fails or has issues:

1. Go to Cloudflare Pages → Deployments
2. Find a previous working deployment
3. Click **...** → **Rollback to this deployment**

## Monitoring

Cloudflare provides:
- **Analytics**: Traffic, bandwidth, requests (Workers & Pages → your project → Analytics)
- **Logs**: Real-time function logs (Workers & Pages → your project → Logs)
- **Deployment history**: All deployments with commit info

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is marked as encrypted/secret in Cloudflare
- [ ] `.dev.vars` is in `.gitignore` (already configured)
- [ ] No secrets in source code
- [ ] RLS policies enabled on all Supabase tables
- [ ] Google OAuth redirect URLs updated for production domain
- [ ] Storage bucket policies configured (public read, owner write)

## Performance

Cloudflare Pages provides:
- **Global CDN**: Assets served from 200+ edge locations
- **HTTP/3**: Automatic HTTP/3 support
- **Smart caching**: Static assets cached at edge
- **Brotli compression**: Automatic compression

Expected performance:
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Lighthouse Score**: 90+

---

For questions or issues, refer to:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase Docs](https://supabase.com/docs)
