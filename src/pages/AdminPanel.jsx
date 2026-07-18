import { useState, useMemo, useEffect } from "react";
import {
  Boxes,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  PlugZap,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Store,
  Layers,
  Globe,
  Link2} from "lucide-react";

// Off-screen decoy login fields. Browsers autofill saved credentials (e.g. the
// driver login) into the first username/password pair they find in a form —
// which was landing in the API-key inputs. These hidden decoys sit first in each
// credential form and absorb that autofill so the real fields stay clean.
// (Not display:none — browsers skip truly hidden fields.)
function AutofillGuard() {
  const hidden = { position: "absolute", height: 0, width: 0, opacity: 0, pointerEvents: "none", border: 0, padding: 0, margin: 0 };
  return (
    <div aria-hidden="true" style={{ position: "absolute", overflow: "hidden", width: 0, height: 0 }}>
      <input type="text" name="username" tabIndex={-1} autoComplete="username" style={hidden} />
      <input type="password" name="password" tabIndex={-1} autoComplete="current-password" style={hidden} />
    </div>
  );
}

export default function AdminPanel({ isDemo }) {
  // GoHighLevel / WiBiz Integration State
  const [form, setForm] = useState({ locationId: "", apiKey: "" });
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState("Idle");

  // WooCommerce Integration State
  const [wooForm, setWooForm] = useState({ storeUrl: "", consumerKey: "", consumerSecret: "" });
  const [showWooSecret, setShowWooSecret] = useState(false);
  const [wooStatus, setWooStatus] = useState("Idle");
  const [wooSyncStatus, setWooSyncStatus] = useState(null);
  const [mktSyncStatus, setMktSyncStatus] = useState(null);

  // Lazada Integration State
  const [lazadaForm, setLazadaForm] = useState({ sellerId: "", appKey: "", appSecret: "" });
  const [showLazadaSecret, setShowLazadaSecret] = useState(false);
  const [lazadaStatus, setLazadaStatus] = useState("Idle");
  const [lazadaAuthLink, setLazadaAuthLink] = useState("");

  // Shopee Integration State
  const [shopeeForm, setShopeeForm] = useState({ partnerId: "", partnerKey: "", shopId: "" });
  const [showShopeeSecret, setShowShopeeSecret] = useState(false);
  const [shopeeStatus, setShopeeStatus] = useState("Idle");
  const [shopeeAuthLink, setShopeeAuthLink] = useState("");
  const [authClientRef, setAuthClientRef] = useState("");
  const [connections, setConnections] = useState([]);
  const [connStatus, setConnStatus] = useState("");

  const [configured, setConfigured] = useState({
    ghl: false,
    woo: false,
    lazada: false,
    shopee: false
  });
  const [metadata, setMetadata] = useState(null);

  // Safety Validation Helpers
  const safe = useMemo(
    () => form.locationId.trim().length > 4 && (form.apiKey.trim().length > 8 || configured.ghl),
    [form, configured.ghl]
  );
  const wooSafe = useMemo(
    () => (wooForm.storeUrl.trim().startsWith("http") || configured.woo) && (wooForm.consumerKey.trim().startsWith("ck_") || configured.woo) && (wooForm.consumerSecret.trim().startsWith("cs_") || configured.woo),
    [wooForm, configured.woo]
  );
  const lazadaSafe = useMemo(
    () => (lazadaForm.appKey.trim().length > 2 || configured.lazada) && (lazadaForm.appSecret.trim().length > 2 || configured.lazada),
    [lazadaForm, configured.lazada]
  );
  const shopeeSafe = useMemo(
    () => (shopeeForm.partnerId.trim().length > 2 || configured.shopee) && (shopeeForm.partnerKey.trim().length > 2 || configured.shopee),
    [shopeeForm, configured.shopee]
  );
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateWoo = (key, value) => setWooForm((prev) => ({ ...prev, [key]: value }));
  const updateLazada = (key, value) => setLazadaForm((prev) => ({ ...prev, [key]: value }));
  const updateShopee = (key, value) => setShopeeForm((prev) => ({ ...prev, [key]: value }));

  // Load configuration on mount
  useEffect(() => {
    if (isDemo) {
      // Pre-fill with realistic mockup values in demo mode
      setForm({ locationId: "loc_beeva_production_wibiz", apiKey: "wibiz_pk_live_844512398457" });
      setWooForm({ storeUrl: "https://beeva.com.sg", consumerKey: "ck_7a9f8e4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d", consumerSecret: "" });
      setLazadaForm({ sellerId: "beeva_sg_lazada", appKey: "500123", appSecret: "" });
      setShopeeForm({ partnerId: "100256", shopId: "995812", partnerKey: "" });
      setConfigured({ ghl: true, woo: true, lazada: true, shopee: true });
      setConnections([
        {
          platform: "shopee",
          merchantId: "995812",
          shopId: "995812",
          clientRef: "Beeva SG",
          country: "SG",
          accessTokenExpiresAt: "2026-12-24T15:59:00.000Z",
          refreshTokenExpiresAt: "2027-06-24T15:59:00.000Z",
          connectedAt: "2026-06-29T02:14:00.000Z"
        }
      ]);
      return;
    }

    loadConnections();
    // Fetch existing integrations
    fetch("/api/admin/integration")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load integrations");
        return res.json();
      })
      .then((data) => {
        if (data.ghl) {
          setForm({ locationId: data.ghl.locationId || "", apiKey: "" });
        }
        if (data.woo) {
          setWooForm({ storeUrl: data.woo.storeUrl || "", consumerKey: "", consumerSecret: "" });
        }
        if (data.lazada) {
          setLazadaForm({ sellerId: data.lazada.sellerId || "", appKey: "", appSecret: "" });
        }
        if (data.shopee) {
          setShopeeForm({ partnerId: data.shopee.partnerId || "", shopId: data.shopee.shopId || "", partnerKey: "" });
        }
        setConfigured({
          ghl: Boolean(data.ghl),
          woo: Boolean(data.woo),
          lazada: Boolean(data.lazada),
          shopee: Boolean(data.shopee)
        });
      })
      .catch((err) => console.error("Error fetching admin configurations:", err.message));
  }, [isDemo]);

  async function loadConnections() {
    if (isDemo) return;
    setConnStatus("Loading connections...");
    try {
      const res = await fetch("/api/admin/marketplace-auth/connections");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load connections");
      setConnections(json.connections || []);
      setConnStatus("");
    } catch (err) {
      setConnStatus(err.message);
    }
  }

  // Save / Test Handlers
  async function saveIntegration(e) {
    e.preventDefault();
    setStatus("Saving...");
    if (isDemo) {
      setTimeout(() => {
        setStatus("Saved securely (Demo)");
        setMetadata({ saved: true, locationId: form.locationId, apiKey: "wibiz_pk_...8457", updatedAt: new Date().toISOString() });
        setForm((prev) => ({ ...prev, apiKey: "" }));
        setConfigured((prev) => ({ ...prev, ghl: true }));
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: form.locationId, apiKey: form.apiKey })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save GHL settings");
      setStatus("Saved securely");
      setMetadata(json);
      setForm((prev) => ({ ...prev, apiKey: "" }));
      setConfigured((prev) => ({ ...prev, ghl: true }));
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function testConnection() {
    setStatus("Testing...");
    if (isDemo) {
      setTimeout(() => {
        setStatus("Connected (Demo)");
        setMetadata({ connected: true, status: 200, locationId: form.locationId, source: "mock-demo" });
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/test");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Connection test failed");
      setStatus(json.connected ? "Connected" : "Saved, not verified");
      setMetadata(json);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function saveWooCommerce(e) {
    e.preventDefault();
    setWooStatus("Saving...");
    if (isDemo) {
      setTimeout(() => {
        setWooStatus("Saved securely (Demo)");
        setMetadata({ saved: true, storeUrl: wooForm.storeUrl, consumerKey: "ck_7a9f...2b1c", updatedAt: new Date().toISOString() });
        setWooForm((prev) => ({ ...prev, consumerKey: "", consumerSecret: "" }));
        setConfigured((prev) => ({ ...prev, woo: true }));
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/woocommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wooForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save WooCommerce settings");
      setWooStatus("Saved securely");
      setMetadata(json);
      setWooForm((prev) => ({ ...prev, consumerKey: "", consumerSecret: "" }));
      setConfigured((prev) => ({ ...prev, woo: true }));
    } catch (err) {
      setWooStatus(err.message);
    }
  }

  async function testWooConnection() {
    setWooStatus("Testing Sync...");
    if (isDemo) {
      setTimeout(() => {
        setWooStatus("Sync active (WooCommerce Connected)");
        setMetadata({ connected: true, status: 200, storeUrl: wooForm.storeUrl, source: "mock-demo" });
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/woocommerce/test");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync test failed");
      setWooStatus(json.connected ? "Sync active (WooCommerce Connected)" : "Saved, not verified");
      setMetadata(json);
    } catch (err) {
      setWooStatus(err.message);
    }
  }

  async function syncWooOrdersNow() {
    setWooSyncStatus("Syncing orders...");
    if (isDemo) {
      setTimeout(() => setWooSyncStatus("Synced 9 orders (0 skipped) · Demo"), 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/woocommerce/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      setWooSyncStatus(`Synced ${json.synced} orders (${json.skipped} skipped) · ${new Date(json.asOf).toLocaleTimeString()}`);
    } catch (err) {
      setWooSyncStatus(`Error: ${err.message}`);
    }
  }

  // Import the WooCommerce product catalog into inventory. prune=true also
  // removes products no longer in WooCommerce (clears the old demo catalog).
  async function syncWooProductsNow(prune = false) {
    if (prune && !confirm("Replace the Beeva catalog with WooCommerce?\n\nThis imports all WooCommerce products and DELETES any product not in WooCommerce (including the seeded demo items). Stock of existing products is preserved.")) return;
    setWooSyncStatus(prune ? "Replacing catalog from WooCommerce..." : "Importing products from WooCommerce...");
    if (isDemo) {
      setTimeout(() => setWooSyncStatus("Products synced (Demo)"), 600);
      return;
    }
    try {
      const res = await fetch(`/api/admin/integration/woocommerce/products${prune ? "?prune=true" : ""}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.detail || "Product sync failed");
      const parts = [`${json.inserted} added`, `${json.updated} updated`];
      if (json.pruned) parts.push(`${json.pruned} removed`);
      setWooSyncStatus(`Products: ${parts.join(" · ")} of ${json.total} in WooCommerce · ${new Date(json.asOf).toLocaleTimeString()}`);
    } catch (err) {
      setWooSyncStatus(`Error: ${err.message}`);
    }
  }

  async function syncMarketplaceNow() {
    setMktSyncStatus("Syncing marketplace orders...");
    if (isDemo) {
      setTimeout(() => setMktSyncStatus("Synced Lazada 4, Shopee 7 (Demo)"), 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/marketplace/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      const lz = json.lazada?.synced ?? 0;
      const sp = json.shopee?.synced ?? 0;
      setMktSyncStatus(`Synced Lazada ${lz}, Shopee ${sp} · ${new Date(json.asOf).toLocaleTimeString()}`);
    } catch (err) {
      setMktSyncStatus(`Error: ${err.message}`);
    }
  }

  // Push Beeva's authoritative stock to WooCommerce so the storefront can't oversell.
  async function pushWooStockNow() {
    setWooSyncStatus("Pushing stock to WooCommerce...");
    if (isDemo) {
      setTimeout(() => setWooSyncStatus("Stock pushed to WooCommerce (Demo)"), 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/woocommerce/stock-push", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.detail || "Stock push failed");
      setWooSyncStatus(`Stock pushed: ${json.pushed} of ${json.total} products · ${new Date(json.asOf).toLocaleTimeString()}`);
    } catch (err) {
      setWooSyncStatus(`Error: ${err.message}`);
    }
  }

  // Per-platform (lazada|shopee) catalog import → inventory + listing map.
  async function syncMarketplaceProducts(platform) {
    const label = platform[0].toUpperCase() + platform.slice(1);
    setMktSyncStatus(`Importing ${label} products...`);
    if (isDemo) {
      setTimeout(() => setMktSyncStatus(`${label} products synced (Demo)`), 600);
      return;
    }
    try {
      const res = await fetch(`/api/admin/integration/${platform}/products`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.detail || "Product sync failed");
      setMktSyncStatus(`${label} products: ${json.listings ?? 0} listings mapped · ${new Date(json.asOf).toLocaleTimeString()}`);
    } catch (err) {
      setMktSyncStatus(`Error: ${err.message}`);
    }
  }

  // Per-platform (lazada|shopee) authoritative stock push.
  async function pushMarketplaceStock(platform) {
    const label = platform[0].toUpperCase() + platform.slice(1);
    setMktSyncStatus(`Pushing stock to ${label}...`);
    if (isDemo) {
      setTimeout(() => setMktSyncStatus(`Stock pushed to ${label} (Demo)`), 600);
      return;
    }
    try {
      const res = await fetch(`/api/admin/integration/${platform}/stock-push`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.detail || "Stock push failed");
      setMktSyncStatus(`${label} stock pushed: ${json.pushed ?? 0} listings · ${new Date(json.asOf).toLocaleTimeString()}`);
    } catch (err) {
      setMktSyncStatus(`Error: ${err.message}`);
    }
  }

  async function saveLazada(e) {
    e.preventDefault();
    setLazadaStatus("Saving...");
    if (isDemo) {
      setTimeout(() => {
        setLazadaStatus("Saved securely (Demo)");
        setMetadata({ saved: true, sellerId: lazadaForm.sellerId, appKey: "app_...5001", updatedAt: new Date().toISOString() });
        setLazadaForm((prev) => ({ ...prev, appKey: "", appSecret: "" }));
        setConfigured((prev) => ({ ...prev, lazada: true }));
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/lazada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lazadaForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save Lazada settings");
      setLazadaStatus("Saved securely");
      setMetadata(json);
      setLazadaForm((prev) => ({ ...prev, appKey: "", appSecret: "" }));
      setConfigured((prev) => ({ ...prev, lazada: true }));
    } catch (err) {
      setLazadaStatus(err.message);
    }
  }

  async function testLazadaConnection() {
    setLazadaStatus("Testing Sync...");
    if (isDemo) {
      setTimeout(() => {
        setLazadaStatus("Sync active (Lazada API Connected)");
        setMetadata({ connected: true, status: 200, sellerId: lazadaForm.sellerId, source: "mock-demo" });
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/lazada/test");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lazada sync test failed");
      setLazadaStatus(json.connected ? "Sync active (Lazada API Connected)" : "Saved, not verified");
      setMetadata(json);
    } catch (err) {
      setLazadaStatus(err.message);
    }
  }

  async function generateMarketplaceAuthLink(platform) {
    const setter = platform === "lazada" ? setLazadaStatus : setShopeeStatus;
    const linkSetter = platform === "lazada" ? setLazadaAuthLink : setShopeeAuthLink;
    setter("Generating auth link...");
    linkSetter("");
    if (isDemo) {
      const demoUrl = platform === "lazada"
        ? "https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&client_id=demo"
        : "https://partner.shopeemobile.com/api/v2/shop/auth_partner?partner_id=demo&timestamp=demo&sign=demo";
      setTimeout(() => {
        linkSetter(demoUrl);
        setter("Auth link ready (Demo)");
        setMetadata({ platform, url: demoUrl, expiresInSeconds: platform === "shopee" ? 300 : 1800 });
      }, 500);
      return;
    }
    try {
      const res = await fetch("/api/admin/marketplace-auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          clientRef: authClientRef,
          country: platform === "lazada" ? "sg" : undefined
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to generate auth link");
      linkSetter(json.url);
      setter("Auth link ready");
      setMetadata(json);
    } catch (err) {
      setter(err.message);
    }
  }

  async function saveShopee(e) {
    e.preventDefault();
    setShopeeStatus("Saving...");
    if (isDemo) {
      setTimeout(() => {
        setShopeeStatus("Saved securely (Demo)");
        setMetadata({ saved: true, partnerId: shopeeForm.partnerId, shopId: shopeeForm.shopId, updatedAt: new Date().toISOString() });
        setShopeeForm((prev) => ({ ...prev, partnerKey: "" }));
        setConfigured((prev) => ({ ...prev, shopee: true }));
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/shopee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopeeForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to save Shopee settings");
      setShopeeStatus("Saved securely");
      setMetadata(json);
      setShopeeForm((prev) => ({ ...prev, partnerKey: "" }));
      setConfigured((prev) => ({ ...prev, shopee: true }));
    } catch (err) {
      setShopeeStatus(err.message);
    }
  }

  async function testShopeeConnection() {
    setShopeeStatus("Testing Sync...");
    if (isDemo) {
      setTimeout(() => {
        setShopeeStatus("Sync active (Shopee Connected)");
        setMetadata({ connected: true, status: 200, partnerId: shopeeForm.partnerId, shopId: shopeeForm.shopId, source: "mock-demo" });
      }, 600);
      return;
    }
    try {
      const res = await fetch("/api/admin/integration/shopee/test");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Shopee sync test failed");
      setShopeeStatus(json.connected ? "Sync active (Shopee Connected)" : "Saved, not verified");
      setMetadata(json);
    } catch (err) {
      setShopeeStatus(err.message);
    }
  }


  return (
    <section className="admin-layout">
      {/* Configuration column (left) */}
      <div className="admin-main" style={{ display: "grid", gap: "var(--sp-3)" }}>
        
        {/* GoHighLevel Card */}
        <article className="panel admin-card" id="ghl-config">
          <div className="panel-head">
            <div>
              <h2>GoHighLevel / WiBiz Integration</h2>
              <p>Store Beeva's Wibiz CRM backend credentials on the server only.</p>
            </div>
            <ShieldCheck size={24} style={{ color: "var(--honey)" }} />
          </div>
          <form onSubmit={saveIntegration} className="admin-form">
            <AutofillGuard />
            <label>
              <span>Location ID</span>
              <input
                value={form.locationId}
                onChange={(e) => update("locationId", e.target.value)}
                placeholder="loc_..."
                autoComplete="off"
              />
            </label>
            <label>
              <span>Private Integration API Key</span>
              <div className="secret-input">
                <input
                  type={showKey ? "text" : "password"}
                  value={form.apiKey}
                  onChange={(e) => update("apiKey", e.target.value)}
                  placeholder={configured.ghl ? "Saved key configured; paste a new key to rotate" : "Paste private key"}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label="Toggle key visibility"
                >
                  {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="admin-actions">
              <button className="primary" disabled={!safe} type="submit">
                <Save size={16} /> Save securely
              </button>
              <button type="button" onClick={testConnection}>
                <RefreshCw size={16} /> Test connection
              </button>
            </div>
            <div className="status-line">{status}</div>
          </form>
        </article>

        {/* WooCommerce Card */}
        <article className="panel admin-card" id="woo-config">
          <div className="panel-head">
            <div>
              <h2>WooCommerce Integration</h2>
              <p>Sync orders and stock directly with your WordPress website.</p>
            </div>
            <Boxes size={24} style={{ color: "var(--honey)" }} />
          </div>
          <form onSubmit={saveWooCommerce} className="admin-form">
            <AutofillGuard />
            <label>
              <span>WordPress Store URL</span>
              <input
                value={wooForm.storeUrl}
                onChange={(e) => updateWoo("storeUrl", e.target.value)}
                placeholder="https://beeva.com.sg"
                autoComplete="off"
              />
            </label>
            <label>
              <span>Consumer Key (CK)</span>
              <input
                value={wooForm.consumerKey}
                onChange={(e) => updateWoo("consumerKey", e.target.value)}
                placeholder={configured.woo ? "Saved key configured; paste a new key to rotate" : "ck_..."}
                autoComplete="off"
              />
            </label>
            <label>
              <span>Consumer Secret (CS)</span>
              <div className="secret-input">
                <input
                  type={showWooSecret ? "text" : "password"}
                  value={wooForm.consumerSecret}
                  onChange={(e) => updateWoo("consumerSecret", e.target.value)}
                  placeholder={configured.woo ? "Saved secret configured; paste a new secret to rotate" : "cs_..."}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowWooSecret((v) => !v)}
                  aria-label="Toggle secret visibility"
                >
                  {showWooSecret ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="admin-actions">
              <button className="primary" disabled={!wooSafe} type="submit">
                <Save size={16} /> Save securely
              </button>
              <button type="button" onClick={testWooConnection}>
                <RefreshCw size={16} /> Test Sync
              </button>
              <button type="button" onClick={syncWooOrdersNow} disabled={!configured.woo}>
                <Download size={16} /> Sync Orders Now
              </button>
              <button type="button" onClick={() => syncWooProductsNow(false)} disabled={!configured.woo}>
                <Boxes size={16} /> Sync Products
              </button>
              <button type="button" onClick={() => syncWooProductsNow(true)} disabled={!configured.woo}>
                <RefreshCw size={16} /> Replace Catalog
              </button>
              <button type="button" onClick={pushWooStockNow} disabled={!configured.woo}>
                <Layers size={16} /> Push Stock
              </button>
            </div>
            <div className="status-line">{wooStatus}</div>
            {wooSyncStatus && <div className="status-line" style={{ marginTop: "4px" }}>{wooSyncStatus}</div>}
          </form>
        </article>

        {/* Lazada Card */}
        <article className="panel admin-card" id="lazada-config">
          <div className="panel-head">
            <div>
              <h2>Lazada Integration</h2>
              <p>Pulls daily order reports and syncs seller fulfillment tasks automatically.</p>
            </div>
            <ShoppingBag size={24} style={{ color: "var(--honey)" }} />
          </div>
          <form onSubmit={saveLazada} className="admin-form">
            <AutofillGuard />
            <label>
              <span>Seller ID (optional, filled after auth)</span>
              <input
                value={lazadaForm.sellerId}
                onChange={(e) => updateLazada("sellerId", e.target.value)}
                placeholder="Optional legacy seller reference"
                autoComplete="off"
              />
            </label>
            <label>
              <span>API App Key</span>
              <input
                value={lazadaForm.appKey}
                onChange={(e) => updateLazada("appKey", e.target.value)}
                placeholder={configured.lazada ? "Saved app key configured; paste a new key to rotate" : "Lazada Developer App Key"}
                autoComplete="off"
              />
            </label>
            <label>
              <span>API App Secret</span>
              <div className="secret-input">
                <input
                  type={showLazadaSecret ? "text" : "password"}
                  value={lazadaForm.appSecret}
                  onChange={(e) => updateLazada("appSecret", e.target.value)}
                  placeholder={configured.lazada ? "Saved secret configured; paste a new secret to rotate" : "Lazada Developer Secret"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLazadaSecret((v) => !v)}
                  aria-label="Toggle secret visibility"
                >
                  {showLazadaSecret ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="admin-actions">
              <button className="primary" disabled={!lazadaSafe} type="submit">
                <Save size={16} /> Save securely
              </button>
              <button type="button" onClick={testLazadaConnection}>
                <RefreshCw size={16} /> Test Sync
              </button>
              <button type="button" onClick={() => generateMarketplaceAuthLink("lazada")} disabled={!configured.lazada}>
                <Link2 size={16} /> Generate Auth Link
              </button>
              <button type="button" onClick={syncMarketplaceNow}>
                <RefreshCw size={16} /> Sync Orders Now
              </button>
              <button type="button" onClick={() => syncMarketplaceProducts("lazada")} disabled={!configured.lazada}>
                <Boxes size={16} /> Sync Products
              </button>
              <button type="button" onClick={() => pushMarketplaceStock("lazada")} disabled={!configured.lazada}>
                <Layers size={16} /> Push Stock
              </button>
            </div>
            <div className="status-line">{lazadaStatus}</div>
            {mktSyncStatus && <div className="status-line" style={{ marginTop: "4px" }}>{mktSyncStatus}</div>}
            {lazadaAuthLink && (
              <label>
                <span>Client auth link</span>
                <input value={lazadaAuthLink} readOnly onFocus={(e) => e.target.select()} />
              </label>
            )}
          </form>
        </article>

        {/* Shopee Card */}
        <article className="panel admin-card" id="shopee-config">
          <div className="panel-head">
            <div>
              <h2>Shopee Integration</h2>
              <p>Configure Shopee Open API partner access to sync seller delivery pools.</p>
            </div>
            <Store size={24} style={{ color: "var(--honey)" }} />
          </div>
          <form onSubmit={saveShopee} className="admin-form">
            <AutofillGuard />
            <label>
              <span>Partner ID</span>
              <input
                value={shopeeForm.partnerId}
                onChange={(e) => updateShopee("partnerId", e.target.value)}
                placeholder="Shopee Developer Partner ID"
                autoComplete="off"
              />
            </label>
            <label>
              <span>Shop ID (optional, filled after auth)</span>
              <input
                value={shopeeForm.shopId}
                onChange={(e) => updateShopee("shopId", e.target.value)}
                placeholder="Optional legacy shop reference"
                autoComplete="off"
              />
            </label>
            <label>
              <span>Partner Key</span>
              <div className="secret-input">
                <input
                  type={showShopeeSecret ? "text" : "password"}
                  value={shopeeForm.partnerKey}
                  onChange={(e) => updateShopee("partnerKey", e.target.value)}
                  placeholder={configured.shopee ? "Saved partner key configured; paste a new key to rotate" : "Shopee Partner Secret Key"}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowShopeeSecret((v) => !v)}
                  aria-label="Toggle secret visibility"
                >
                  {showShopeeSecret ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="admin-actions">
              <button className="primary" disabled={!shopeeSafe} type="submit">
                <Save size={16} /> Save securely
              </button>
              <button type="button" onClick={testShopeeConnection}>
                <RefreshCw size={16} /> Test Sync
              </button>
              <button type="button" onClick={() => generateMarketplaceAuthLink("shopee")} disabled={!configured.shopee}>
                <Link2 size={16} /> Generate Auth Link
              </button>
              <button type="button" onClick={syncMarketplaceNow}>
                <RefreshCw size={16} /> Sync Orders Now
              </button>
              <button type="button" onClick={() => syncMarketplaceProducts("shopee")} disabled={!configured.shopee}>
                <Boxes size={16} /> Sync Products
              </button>
              <button type="button" onClick={() => pushMarketplaceStock("shopee")} disabled={!configured.shopee}>
                <Layers size={16} /> Push Stock
              </button>
            </div>
            <div className="status-line">{shopeeStatus}</div>
            {mktSyncStatus && <div className="status-line" style={{ marginTop: "4px" }}>{mktSyncStatus}</div>}
            {shopeeAuthLink && (
              <label>
                <span>Client auth link</span>
                <input value={shopeeAuthLink} readOnly onFocus={(e) => e.target.select()} />
              </label>
            )}
          </form>
        </article>

        {/* Connected Marketplaces — reflects saved OAuth connections from the live DB */}
        <article className="panel admin-card" id="marketplace-connections">
          <div className="panel-head">
            <div>
              <h2>Connected Marketplaces</h2>
              <p>Shops that completed OAuth authorization. Tokens are stored encrypted; this view reflects the live database.</p>
            </div>
            <PlugZap size={24} style={{ color: "var(--honey)" }} />
          </div>
          {connections.length === 0 ? (
            <div className="status-line">
              No marketplace connections yet. Generate an auth link above and complete the Shopee/Lazada
              authorization — the connected shop will appear here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {connections.map((c) => {
                const expMs = c.accessTokenExpiresAt ? new Date(c.accessTokenExpiresAt).getTime() : null;
                const active = expMs ? expMs > Date.now() : true;
                return (
                  <div
                    key={`${c.platform}-${c.merchantId}`}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 18px",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ textTransform: "capitalize", fontWeight: 700, color: "var(--cream)" }}>{c.platform}</span>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: active ? "#34d399" : "#f87171" }}>
                      {active ? "● Connected" : "● Token expired"}
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                      Shop ID: <b style={{ color: "var(--cream)" }}>{c.shopId || c.merchantId}</b>
                    </span>
                    {c.clientRef && (
                      <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                        Client: <b style={{ color: "var(--cream)" }}>{c.clientRef}</b>
                      </span>
                    )}
                    <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                      Connected: {c.connectedAt ? new Date(c.connectedAt).toLocaleString() : "—"}
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                      Token expires: {c.accessTokenExpiresAt ? new Date(c.accessTokenExpiresAt).toLocaleString() : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="admin-actions" style={{ marginTop: "12px" }}>
            <button type="button" onClick={loadConnections}>
              <RefreshCw size={16} /> Refresh connections
            </button>
          </div>
          {connStatus && <div className="status-line" style={{ marginTop: "6px" }}>{connStatus}</div>}
        </article>

      </div>

      {/* Safety info & JSON metadata output (right) */}
      <div className="admin-sidebar" style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Credential safety</h2>
              <p>How this build protects integration keys.</p>
            </div>
            <Lock size={24} />
          </div>
          <div className="safety-list">
            <div><KeyRound size={18} /><span>Keys are posted to the database/filesystem and never stored in active browser states.</span></div>
            <div><PlugZap size={18} /><span>Dashboard operations are proxied through server routes, keeping APIs whitelabelled.</span></div>
            <div><Boxes size={18} /><span>AES-256-GCM symmetric local encryption is utilized for local credentials.</span></div>
            <div><Download size={18} /><span>Sync processes run in backend workers to prevent UI blocking.</span></div>
          </div>
          {metadata && (
            <pre className="metadata">{JSON.stringify(metadata, null, 2)}</pre>
          )}
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Merchant auth</h2>
              <p>Optional label for the next generated client link.</p>
            </div>
            <Link2 size={24} />
          </div>
          <label className="admin-form">
            <span>Client reference</span>
            <input
              value={authClientRef}
              onChange={(e) => setAuthClientRef(e.target.value)}
              placeholder="Beeva, Castle Rock, or client name"
              autoComplete="off"
            />
          </label>
        </article>
      </div>
    </section>
  );
}
