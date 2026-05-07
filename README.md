# QuickBook

Production-ready doctor appointment booking for Shopify storefronts.

## Project Structure

```txt
quickbook/
├── backend/              Node.js, Express, MongoDB, OTP, slots, bookings
├── frontend/             Shopify storefront booking widget
├── admin-dashboard/      React admin dashboard
└── shopify-extension/    Liquid app block, snippet, theme assets
```

## Local Installation

```bash
npm install
```

Copy environment files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
copy admin-dashboard\.env.example admin-dashboard\.env
```

Start MongoDB locally, then run:

```bash
npm run dev
```

Backend: `http://localhost:5000`  
Storefront widget preview: `http://localhost:5174`  
Admin dashboard: `http://localhost:5173`

## Environment Variables

`backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickbook
JWT_SECRET=replace-with-a-long-secret
ADMIN_EMAIL=admin@quickbook.local
ADMIN_PASSWORD=change-me
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174
PUBLIC_API_URL=http://localhost:5000

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="QuickBook <your-gmail@gmail.com>"
ADMIN_NOTIFY_EMAIL=clinic@example.com
```

`frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

`admin-dashboard/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

## Gmail SMTP Setup

1. Enable 2-step verification in your Google account.
2. Create an App Password for Mail.
3. Put the Gmail address in `SMTP_USER`.
4. Put the app password in `SMTP_PASS`.
5. Set `EMAIL_FROM` and `ADMIN_NOTIFY_EMAIL`.

For local testing without email, add:

```env
EMAIL_DISABLED=true
```

## Admin Login

On first backend start, the API creates the admin user from:

```env
ADMIN_EMAIL=admin@quickbook.local
ADMIN_PASSWORD=change-me
```

Use those credentials at `http://localhost:5173`.

## Shopify Integration (via GitHub/jsDelivr)

For high-speed, free hosting without Netlify/Vercel limits, use **jsDelivr** which serves files directly from this repository.

### 1. Liquid Snippet (Add to Shopify Custom Liquid)

```liquid
<!-- QuickBook Widget Styling -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Shubhamsinghjs/quickbook@main/docs/quickbook-widget.css">

<!-- Mounting Point -->
<div id="quickbook-widget" style="min-height: 200px;"></div>

<!-- Configuration -->
<script>
  window.QUICKBOOK_API_URL = "https://quickbook-backend-8hcm.onrender.com/api";
  window.QUICKBOOK_MOUNT_ID = "quickbook-widget";
</script>

<!-- Widget Logic -->
<script src="https://cdn.jsdelivr.net/gh/Shubhamsinghjs/quickbook@main/docs/quickbook-widget.iife.js" defer></script>
```

---

## Admin & Email Management

### Security & Debug Panel
Logged-in admins can now test the email configuration directly from the **Security & Debug** section at the top of the dashboard. This helps verify if your Gmail SMTP settings are correct without making a real booking.

### Gmail SMTP Setup
1. Enable **2-Step Verification** in your Google Account.
2. Go to **Security > App Passwords**.
3. Create an app password for "Mail".
4. Update `SMTP_USER` with your email and `SMTP_PASS` with the 16-character app password.
5. Set `EMAIL_FROM` to match your `SMTP_USER`.

---

## Deployment (GitHub Pages)

The `docs` folder is configured for GitHub Pages. 
1. Go to **Repo Settings > Pages**.
2. Select **Branch: main** and **Folder: /docs**.
3. Your admin dashboard will be live at `https://shubhamsinghjs.github.io/quickbook/admin`.
4. Your widget files will be live at `https://shubhamsinghjs.github.io/quickbook/quickbook-widget.iife.js`.

## API Routes

- `POST /api/auth/login`
- `GET /api/doctors`
- `GET /api/doctors/admin/all`
- `POST /api/doctors`
- `PUT /api/doctors/:id`
- `DELETE /api/doctors/:id`
- `GET /api/availability/:doctorId`
- `PUT /api/availability/:doctorId`
- `GET /api/slots/:doctorId?from=YYYY-MM-DD&days=14`
- `POST /api/slots/lock`
- `POST /api/otp/send`
- `POST /api/otp/verify`
- `GET /api/bookings/stats`
- `POST /api/bookings`
- `GET /api/bookings`
- `PATCH /api/bookings/:id/status`

## Business Rules

- Email OTP only.
- OTP expires after 5 minutes.
- Slot locks expire after 10 minutes.
- Double booking is prevented with active locks and booking uniqueness.
- Payment type is COD only: `Pay at Clinic`.
- Booking confirmation email goes to the user.
- New booking alert email goes to the admin.
