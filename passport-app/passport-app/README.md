# Proof Sheet — Passport Photo Layout Maker

## Run locally
npm install
npm run dev        # http://localhost:3000

## Deploy (free)
1. Push this folder to a new GitHub repo.
2. Go to vercel.com → New Project → import the repo → Deploy.
   (Next.js is auto-detected, zero config needed.)

## Add real ads
Edit components/AdSlot.tsx — replace the placeholder div with your
AdSense <ins class="adsbygoogle"> embed once your AdSense account is approved.

## Notes
- No login, no backend, no database — everything (including autosave)
  runs in the visitor's own browser via IndexedDB. Photos never leave their device.
- DPI, page size, gaps etc. live in lib/layout.ts and lib/store.ts.
