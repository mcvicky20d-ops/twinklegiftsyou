# TwinkleGiftsYou.in

Storefront and admin panel for **TwinkleGiftsYou** — handmade pencil art, customised mugs and
personalised photo frames.

Built on the stack from the brief: Next.js 16 (App Router, Server Components, Server Actions),
React 19, TypeScript, Tailwind CSS v4, PostgreSQL + Prisma, Auth.js, Cloudinary, Razorpay,
Resend, deployed on Vercel.

---

## What is in here

### Customer-facing

| Route | What it does |
| --- | --- |
| `/` | Hero, craft categories, featured products, custom-order call to action |
| `/products` | Catalogue with category filter, price sorting and search |
| `/products/[slug]` | Product page with personalisation box, reference-photo link, related items, `Product` JSON-LD |
| `/gallery` | Masonry gallery of finished work |
| `/about` | Story plus the four-step "how an order works" explainer |
| `/contact` | Enquiry form that writes to the database and emails you |
| `/cart`, `/checkout` | Cart (persisted in the browser) and checkout with Razorpay or pay-on-confirmation |
| `/orders/[orderNumber]` | Order confirmation, not indexed by search engines |
| `/sitemap.xml`, `/robots.txt` | Generated from live product data |

### Admin panel (`/admin`, sign in required)

- **Dashboard** — revenue collected, order count, active products, new enquiries, recent orders, low stock
- **Orders** — filter by status, open an order, update order and payment status, WhatsApp the customer
- **Products** — full create/edit/delete, images by upload or URL, featured and visibility toggles
- **Categories** — create, edit and delete inline
- **Gallery** — add and remove pieces shown on the public gallery
- **Enquiries** — read contact-form messages and move them through NEW → READ → REPLIED → CLOSED

---

## Getting started

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and AUTH_SECRET
npx auth secret           # generates AUTH_SECRET for you
npm run db:migrate        # creates the tables
npm run db:seed           # creates the admin user, 3 categories, 6 sample products
npm run dev
```

Open http://localhost:3000, and sign in at http://localhost:3000/login with the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

> Change the seeded admin password before going live.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed the admin user and sample catalogue |
| `npm run db:studio` | Browse the database in Prisma Studio |

---

## Is this totally free?

**The code and hosting are free. A custom domain is not, and payment processing takes a cut.**

| Piece | Free tier | What it costs later |
| --- | --- | --- |
| Vercel hosting | Yes — Hobby plan | Free unless the shop gets commercial-scale traffic. Vercel's Hobby plan is for non-commercial use, so a real shop should budget for Pro (~$20/month) |
| PostgreSQL | Yes — [Neon](https://neon.tech) or [Supabase](https://supabase.com) free tier | Free tiers pause when idle and cap storage; paid plans start around $19/month |
| Auth.js | Yes, always | Free — it runs inside your app |
| Cloudinary images | Yes — 25 credits/month | Plenty for a small catalogue |
| Resend email | Yes — 3,000 emails/month, 100/day | Free at this scale |
| Razorpay | No monthly fee | ~2% + GST per successful transaction |
| **Domain `twinklegiftsyou.in`** | **No** | Roughly ₹800–1,200/year from any registrar |

So: you can run the whole site on free tiers and pay only for the domain, and only start paying
Razorpay once you are actually taking money. The optional services degrade gracefully — leave
`RAZORPAY_*` blank and checkout runs in pay-on-confirmation mode; leave `RESEND_API_KEY` blank and
emails are skipped; leave the Cloudinary variables blank and the admin panel accepts pasted image
URLs instead of uploads. Only `DATABASE_URL` and `AUTH_SECRET` are actually required.

---

## Deploying to Vercel

1. Push this repository to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Create a free Postgres database (Neon or Supabase) and copy its connection string.
3. Add the environment variables from `.env.example` in **Project → Settings → Environment Variables**.
   At minimum: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
4. Deploy. The build runs `prisma generate` automatically.
5. Apply the schema once against the production database:
   ```bash
   DATABASE_URL="<production url>" npm run db:deploy
   DATABASE_URL="<production url>" npm run db:seed
   ```
6. Point `twinklegiftsyou.in` at the project under **Settings → Domains**, then set
   `NEXT_PUBLIC_SITE_URL=https://twinklegiftsyou.in`.

### Turning on the optional services

- **Cloudinary** — create an *unsigned* upload preset, then set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. Uploads go straight from the browser to Cloudinary, so
  no API secret is ever exposed.
- **Razorpay** — set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. The online-payment option appears
  at checkout automatically. Payment signatures are verified server-side before an order is marked paid.
- **Resend** — set `RESEND_API_KEY`, `RESEND_FROM` and `CONTACT_NOTIFY_EMAIL` for order
  confirmations and enquiry alerts.

---

## How it fits together

```
src/
├── app/
│   ├── (shop)/            Public storefront (own layout, header + footer)
│   ├── admin/             Admin panel, gated by the layout and by requireAdmin()
│   ├── actions/           Server Actions: orders, contact, admin CRUD, auth
│   ├── api/
│   │   ├── auth/          Auth.js route handlers
│   │   └── payments/      Razorpay order creation and signature verification
│   ├── sitemap.ts robots.ts
│   └── layout.tsx globals.css
├── components/
│   ├── site/              Storefront components (header, cart, checkout, product card)
│   ├── admin/             Admin components (nav, forms, image input)
│   └── ui/                Small shadcn-style primitives (button, input, card, badge)
├── lib/                   prisma, auth, mail, razorpay, cloudinary, pricing, utils, site config
└── proxy.ts               Redirects signed-out visitors away from /admin
prisma/
├── schema.prisma          Users, categories, products, orders, order items, enquiries, gallery
└── seed.ts                Admin user and starter catalogue
```

A few decisions worth knowing about:

- **Money is stored in paise as integers**, never floats, and formatted with `Intl.NumberFormat` as INR.
- **Checkout re-reads every price from the database.** Nothing the browser sends about price is trusted.
- **Order items copy the product title and price** at the time of the order, so past orders stay
  readable after a product is edited or deleted.
- **Auth uses JWT sessions** with hashed passwords (bcrypt). `proxy.ts` keeps signed-out visitors out
  of the admin shell; the real role check runs in the `/admin` layout and in `requireAdmin()` at the
  top of every admin action.
- **The cart lives in `localStorage`** behind `useSyncExternalStore`, so it survives refreshes and
  hydrates without a server/client mismatch.
