# Beeva Command Center

Premium Beeva command center for owned-channel growth, Wibiz automation visibility, social/AI bot operations, and admin-managed integration credentials.

## Local Development

```bash
npm install
npm run dev
```

Run the API server in another terminal when testing real integration endpoints:

```bash
$env:ADMIN_SECRET="change-me"
npm start
```

## Railway

Railway should run:

```bash
npm install
npm run build
npm start
```

Set these Railway variables:

```bash
ADMIN_SECRET=strong-secret-used-for-encryption-and-fallback-admin
SESSION_SECRET=strong-random-session-signing-secret
MARKETPLACE_AUTH_STATE_SECRET=strong-random-marketplace-state-secret
PUBLIC_BASE_URL=https://your-live-domain
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-admin-login-password
STAFF_USERNAME=team
STAFF_PASSWORD=strong-staff-login-password
```

Optional initial integration values:

```bash
WIBIZ_LOCATION_ID=your-location-id
WIBIZ_PRIVATE_API_KEY=your-private-integration-key
LAZADA_APP_KEY=your-lazada-app-key
LAZADA_APP_SECRET=your-lazada-app-secret
SHOPEE_PARTNER_ID=your-shopee-partner-id
SHOPEE_PARTNER_KEY=your-shopee-partner-key
```

Routes:

- `/demo` keeps the public demo view with sample metrics.
- `/` is the internal connected view and requires staff/admin login.
- Admin users can open the Admin tab to save or test integration credentials.
- Admin users can generate Lazada/Shopee merchant authorization links from saved developer credentials. See `docs/MARKETPLACE_AUTH_GUIDE.md`.

Client-facing UI uses Wibiz wording. Credentials are submitted only to the server and are not exposed to the browser.
