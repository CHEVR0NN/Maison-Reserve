import { useMemo, useState } from "react";
import { useAppData } from "../context/AppData.jsx";
import { useToast } from "./ui/ToastProvider.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
import BottleArt from "./BottleArt.jsx";

const CATEGORIES = {
  "wine-champagne": { label: "Wine & Champagne", cls: "wine" },
  "gin-vodka":      { label: "Gin & Vodka",      cls: "vodka" },
  "bourbon-whisky": { label: "Bourbon & Whisky", cls: "whisky" },
  "beer-cider":     { label: "Beer & Cider",     cls: "beer" },
  "liqueur":        { label: "Liqueur",          cls: "liqueur" },
  "rum-tequila":    { label: "Rum & Tequila",    cls: "rum" },
  "brandy-cognac":  { label: "Brandy & Cognac",  cls: "brandy" },
  "mixers":         { label: "Mixers",           cls: "mixers" }
};

const SORT_OPTS = [
  { value: "stock",    label: "Stock"    },
  { value: "price",    label: "Price"    },
  { value: "velocity", label: "Velocity" },
  { value: "name",     label: "Name"     },
];

const RESERVING_STATUSES = ["pending", "packed", "out_for_delivery"];

function stockStatus(item) {
  if (!item.minStock || item.minStock <= 0) return "healthy";
  if (item.stock <= item.minStock)          return "urgent";
  if (item.stock <= item.minStock * 2)      return "warn";
  return "healthy";
}

function daysLeft(item) {
  if (!item.velocity) return null;
  return Math.round(item.stock / item.velocity);
}

function CatPill({ category }) {
  const cat = CATEGORIES[category];
  if (!cat) return null;
  return <span className={`inv-cat ${cat.cls}`}>{cat.label}</span>;
}

function CategoryStrip({ inventory }) {
  return (
    <div className="inv-cat-strip">
      {Object.entries(CATEGORIES).map(([key, meta]) => {
        const items  = inventory.filter((p) => p.category === key);
        const urgent = items.filter((p) => stockStatus(p) === "urgent").length;
        const warn   = items.filter((p) => stockStatus(p) === "warn").length;
        const units  = items.reduce((s, p) => s + p.stock, 0);
        const avgVel = items.length
          ? (items.reduce((s, p) => s + (p.velocity || 0), 0) / items.length).toFixed(1)
          : "0";
        return (
          <div key={key} className={`inv-cat-card inv-cat-card-${meta.cls}`}>
            <span className="inv-cat-card-label">{meta.label}</span>
            <div className="inv-cat-card-stat">
              <b>{units}</b>
              <span>units in stock</span>
            </div>
            <div className="inv-cat-card-badges">
              {urgent > 0 && <span className="inv-cat-alert urgent">{urgent} restock</span>}
              {warn   > 0 && <span className="inv-cat-alert warn">{warn} low</span>}
              {!urgent && !warn && <span className="inv-cat-alert ok">All healthy</span>}
            </div>
            <span className="inv-cat-card-vel">{avgVel} avg units / day</span>
          </div>
        );
      })}
    </div>
  );
}

function FormField({ label, children, full }) {
  return (
    <div className={`inv-form-field${full ? " full-col" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = isNaN(vals[i]) || vals[i] === "" ? vals[i] : parseFloat(vals[i]); });
    return obj;
  });
}

export default function InventoryPanel() {
  const { state, actions } = useAppData();
  const notify = useToast();
  const inventory = state.inventory.items;

  const [view, setView]             = useState("list");
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [sortBy, setSortBy]         = useState("stock");
  const [sortAsc, setSortAsc]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [uploadMsg, setUploadMsg]   = useState(null);
  const [adjustMsg, setAdjustMsg]   = useState(null);
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reservedBySku = useMemo(() => {
    const map = new Map();
    state.orders.items
      .filter((o) => RESERVING_STATUSES.includes(o.status))
      .forEach((o) => o.lines.forEach((l) => map.set(l.sku, (map.get(l.sku) || 0) + l.qty)));
    return map;
  }, [state.orders.items]);

  const movements = useMemo(() => {
    return state.orders.items
      .filter((o) => o.status === "delivered")
      .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
      .slice(0, 10)
      .flatMap((o) => o.lines.map((l) => ({ at: o.deliveredAt, sku: l.sku, name: l.name, qty: l.qty, kind: "deduct", source: o.channel })));
  }, [state.orders.items]);

  const displayed = [...inventory]
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
        (!filterCat || p.category === filterCat)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      return sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
    });

  const restockCount = inventory.filter((p) => stockStatus(p) === "urgent").length;

  function handleAdd(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const item = {
      id: f.get("sku"),
      name:          f.get("name"),
      sku:           f.get("sku"),
      category:      f.get("category"),
      price:         parseFloat(f.get("price"))         || 0,
      originalPrice: parseFloat(f.get("originalPrice")) || 0,
      stock:         parseInt(f.get("stock"))           || 0,
      minStock:      parseInt(f.get("minStock"))        || 0,
      velocity:      parseFloat(f.get("velocity"))      || 0,
      supplier:      f.get("supplier") || "Maison Reserve",
    };
    actions.inventory.add(item);
    notify(`${item.name} added to inventory`, "success");
    setView("list");
  }

  function handleUpdate(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const patch = {
      name:          f.get("name"),
      sku:           f.get("sku"),
      category:      f.get("category"),
      price:         parseFloat(f.get("price"))         || 0,
      originalPrice: parseFloat(f.get("originalPrice")) || 0,
      stock:         parseInt(f.get("stock"))           || 0,
      minStock:      parseInt(f.get("minStock"))        || 0,
      velocity:      parseFloat(f.get("velocity"))      || 0,
      supplier:      f.get("supplier") || "Maison Reserve",
    };
    actions.inventory.update(editItem.id, patch);
    notify(`${patch.name} updated`, "success");
    setEditItem(null);
    setView("list");
  }

  function confirmDelete() {
    actions.inventory.remove(deleteTarget.id);
    notify(`${deleteTarget.name} removed from inventory`, "success");
    setDeleteTarget(null);
  }

  function handleCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsv(ev.target.result).map((obj, i) => ({
          id: obj.sku || `BULK${Date.now()}${i}`,
          supplier: obj.supplier || "Maison Reserve",
          ...obj,
        }));
        actions.inventory.bulkImport(rows);
        setUploadMsg({ ok: true, text: `${rows.length} product${rows.length !== 1 ? "s" : ""} imported` });
        setTimeout(() => { setView("list"); setUploadMsg(null); }, 1500);
      } catch (err) {
        setUploadMsg({ ok: false, text: `Import failed: ${err.message}` });
      }
    };
    reader.readAsText(file);
  }

  function handleStockCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdjustBusy(true);
    setAdjustMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const iSku   = headers.indexOf("sku");
        const iDelta = headers.findIndex((h) => h === "delta_qty" || h === "delta" || h === "qty");
        if (iSku < 0 || iDelta < 0) throw new Error("CSV must have 'sku' and 'delta_qty' columns");

        const bySku = new Map(inventory.map((p) => [String(p.sku).toLowerCase(), p]));
        let applied = 0;
        const notFound = [];
        lines.slice(1).forEach((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const sku = vals[iSku] || "";
          const delta = parseInt(vals[iDelta], 10);
          if (!sku || !Number.isFinite(delta) || delta === 0) return;
          const product = bySku.get(sku.toLowerCase());
          if (!product) { notFound.push(sku); return; }
          actions.inventory.adjustStock(product.id, delta);
          applied++;
        });
        const parts = [`${applied} adjustment${applied !== 1 ? "s" : ""} applied`];
        if (notFound.length) parts.push(`${notFound.length} SKU${notFound.length !== 1 ? "s" : ""} not found`);
        setAdjustMsg({ ok: notFound.length === 0, text: parts.join(" · "), notFound });
      } catch (err) {
        setAdjustMsg({ ok: false, text: `Import failed: ${err.message}` });
      } finally {
        setAdjustBusy(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function handleExport() {
    const headers = ["id", "name", "sku", "category", "price", "originalPrice", "stock", "minStock", "velocity", "supplier"];
    const csv = [
      headers.join(","),
      ...inventory.map((p) =>
        headers.map((h) => {
          const v = p[h] ?? "";
          return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
        }).join(",")
      ),
    ].join("\n");
    Object.assign(document.createElement("a"), {
      href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `maison-reserve-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
    }).click();
  }

  // ── List ───────────────────────────────────────────────────────────────────
  if (view === "list") {
    function coverBar(c) {
      if (c === null) return <span className="mono">&mdash;</span>;
      const pct = Math.min(100, Math.round((c / 14) * 100));
      const col = c < 2 ? "var(--red)" : c < 5 ? "var(--orange)" : "var(--green)";
      return (
        <>
          <span className="barmini">
            <i style={{ width: `${pct}%`, background: col }} />
          </span>
          <span className="mono">{c.toFixed(1)}d</span>
        </>
      );
    }

    return (
      <article className="panel active" id="inventory">
        <div className="panel-head">
          <div>
            <h2>Stock Ledger</h2>
            <div className="sub">One pool serves all storefronts &middot; deductions post automatically as orders are delivered</div>
          </div>
          <div className="right-note">
            <b>{restockCount} critical / low</b><br />
            everything else in cover
          </div>
        </div>

        <CategoryStrip inventory={inventory} />

        <div className="inv-grid">
          <div>
            <div className="toolbar" style={{ marginBottom: "16px" }}>
              <div className="search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
                <input
                  placeholder="Search SKU or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="chip-row">
                <select className="fchip" style={{ background: "var(--surface)", border: "1px solid var(--line)" }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                  <option value="">All categories</option>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select className="fchip" style={{ background: "var(--surface)", border: "1px solid var(--line)" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
                </select>
                <button className="fchip" onClick={() => setSortAsc((v) => !v)}>
                  {sortAsc ? "Sort: Asc" : "Sort: Desc"}
                </button>
                <button className="fchip on" onClick={() => { setEditItem(null); setView("add"); }}>
                  + Add Product
                </button>
                <button className="fchip" onClick={() => setView("bulk-upload")}>
                  Bulk Upload
                </button>
                <button className="fchip" onClick={() => { setAdjustMsg(null); setView("stock-adjust"); }}>
                  Stock Adjustment
                </button>
                <button className="fchip" onClick={handleExport}>
                  Export CSV
                </button>
              </div>
            </div>

            <div className="tbl-wrap inv-tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>On Hand</th>
                    <th>Reserved</th>
                    <th>Reorder</th>
                    <th>Days Cover</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                        No products match your filters
                      </td>
                    </tr>
                  )}
                  {displayed.map((item) => {
                    const status = stockStatus(item);
                    const isUrgent = status === "urgent";
                    const isWarn = status === "warn";
                    const pillClass = isUrgent ? "crit" : isWarn ? "low" : "ok";
                    const pillText = isUrgent ? "CRITICAL" : isWarn ? "LOW" : "OK";
                    const reserved = reservedBySku.get(item.sku) || 0;
                    const days = daysLeft(item);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="inv-prod">
                            <BottleArt category={item.category} seed={item.sku} size={36} />
                            <div className="inv-prod-info">
                              <b>{item.name}</b>
                              <span>{item.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td><CatPill category={item.category} /></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button className="inv-adj" onClick={() => actions.inventory.adjustStock(item.id, -1)}>&minus;</button>
                            <span className="mono">{item.stock}</span>
                            <button className="inv-adj" onClick={() => actions.inventory.adjustStock(item.id, 1)}>+</button>
                          </div>
                        </td>
                        <td className="mono dim">{reserved}</td>
                        <td className="mono dim">{item.minStock}</td>
                        <td>{coverBar(days)}</td>
                        <td>
                          <span className={`pill ${pillClass}`}>{pillText}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="fchip"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => { setEditItem(item); setView("edit"); }}
                            >
                              Edit
                            </button>
                            <button
                              className="fchip"
                              style={{ padding: "4px 8px", fontSize: "11px", borderColor: "var(--red)" }}
                              onClick={() => setDeleteTarget(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="card ledger-feed">
              <div className="lf-head">
                <div className="hl">Auto-Deduction Log</div>
                <div className="live"><span className="dot g"></span>LIVE</div>
              </div>
              <div>
                {movements.length === 0 && (
                  <div className="lf-row"><div className="lf-main"><span className="so">No automatic deductions yet today</span></div></div>
                )}
                {movements.map((m, idx) => {
                  const t = new Date(m.at).toLocaleTimeString("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div className="lf-row" key={idx}>
                      <div className="lf-time">{t}</div>
                      <div className="lf-main">
                        <b>{m.sku}</b> <span className="so">&middot; delivered via {m.source} &middot; {m.name}</span>
                      </div>
                      <div className="lf-delta minus">-{m.qty}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="callout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
              <div className="ct">
                Incoming stock from supplier invoices is entered <b>once</b>. Everything downstream — reservations,
                available counts and days-of-cover — updates <b>automatically</b> as orders move through the pipeline.
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete product"
          message={deleteTarget ? `Remove "${deleteTarget.name}" from inventory? This can't be undone.` : ""}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </article>
    );
  }

  // ── Add / Edit ─────────────────────────────────────────────────────────────
  if (view === "add" || view === "edit") {
    const isEdit = view === "edit";
    const d = editItem || {};

    return (
      <article className="panel">
        <div className="panel-head">
          <div>
            <h2>{isEdit ? "Edit product" : "Add product"}</h2>
            <p>{isEdit ? `Editing — ${d.name}` : "New SKU to inventory"}</p>
          </div>
          <button className="inv-btn inv-btn-back" onClick={() => { setView("list"); setEditItem(null); }}>
            ← Back
          </button>
        </div>

        <form onSubmit={isEdit ? handleUpdate : handleAdd}>
          <div className="inv-form-panel">
            <FormField label="Product name *" full>
              <input type="text" name="name" defaultValue={d.name} required placeholder="e.g. Hennessy VSOP 700ml" />
            </FormField>
            <FormField label="SKU *">
              <input type="text" name="sku" defaultValue={d.sku} required placeholder="e.g. BC001" disabled={isEdit} />
            </FormField>
            <FormField label="Category *">
              <select name="category" defaultValue={d.category} required>
                <option value="">Select…</option>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Sale price (SGD) *">
              <input type="number" name="price" defaultValue={d.price} step="0.01" min="0" required placeholder="88.69" />
            </FormField>
            <FormField label="Original price (SGD)">
              <input type="number" name="originalPrice" defaultValue={d.originalPrice} step="0.01" min="0" placeholder="150.00" />
            </FormField>
            <FormField label="Stock (units) *">
              <input type="number" name="stock" defaultValue={d.stock} min="0" required placeholder="24" />
            </FormField>
            <FormField label="Min stock alert *">
              <input type="number" name="minStock" defaultValue={d.minStock} min="0" required placeholder="6" />
            </FormField>
            <FormField label="Daily velocity (units/day)">
              <input type="number" name="velocity" defaultValue={d.velocity} step="0.1" min="0" placeholder="0.0" />
            </FormField>
            <FormField label="Supplier" full>
              <input type="text" name="supplier" defaultValue={d.supplier || "Maison Reserve"} placeholder="Maison Reserve" />
            </FormField>
          </div>

          <div className="inv-form-actions" style={{ marginTop: 24 }}>
            <button type="submit" className="inv-form-submit">
              {isEdit ? "Save changes" : "Add to inventory"}
            </button>
            <button type="button" className="inv-form-cancel" onClick={() => { setView("list"); setEditItem(null); }}>
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  // ── Bulk upload ────────────────────────────────────────────────────────────
  if (view === "bulk-upload") {
    return (
      <article className="panel">
        <div className="panel-head">
          <div>
            <h2>Bulk upload</h2>
            <p>Import products via CSV</p>
          </div>
          <button className="inv-btn inv-btn-back" onClick={() => { setView("list"); setUploadMsg(null); }}>
            ← Back
          </button>
        </div>

        <div style={{ display: "grid", gap: 20, maxWidth: 540 }}>
          <label>
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
            <div className="inv-drop-zone">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <b>Click to choose a CSV file</b>
              <span>or drag and drop here</span>
            </div>
          </label>

          {uploadMsg && (
            <div className={uploadMsg.ok ? "inv-upload-success" : "inv-upload-error"}>
              {uploadMsg.text}
            </div>
          )}

          <div className="inv-csv-hint">
            <h4>Expected columns</h4>
            <code className="inv-csv-code">name,sku,category,price,original_price,stock,min_stock,velocity,supplier</code>
          </div>

          <div className="inv-csv-hint">
            <h4>Example row</h4>
            <code className="inv-csv-code">Jack Daniel's No.7 700ml,JD-001,bourbon-whisky,52.89,89.00,35,10,9.2,Maison Reserve</code>
          </div>
        </div>
      </article>
    );
  }

  // ── Daily stock adjustment ──────────────────────────────────────────────────
  if (view === "stock-adjust") {
    return (
      <article className="panel">
        <div className="panel-head">
          <div>
            <h2>Daily stock adjustment</h2>
            <p>Reconcile direct sales — upload a CSV of stock changes by SKU</p>
          </div>
          <button className="inv-btn inv-btn-back" onClick={() => { setView("list"); setAdjustMsg(null); }}>
            ← Back
          </button>
        </div>

        <div style={{ display: "grid", gap: 20, maxWidth: 540 }}>
          <label>
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleStockCSV} disabled={adjustBusy} />
            <div className="inv-drop-zone">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <b>{adjustBusy ? "Applying adjustments…" : "Click to choose a CSV file"}</b>
              <span>{adjustBusy ? "please wait" : "or drag and drop here"}</span>
            </div>
          </label>

          {adjustMsg && (
            <div className={adjustMsg.ok ? "inv-upload-success" : "inv-upload-error"}>
              {adjustMsg.text}
              {adjustMsg.notFound?.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12 }}>Not found: {adjustMsg.notFound.join(", ")}</div>
              )}
            </div>
          )}

          <div className="inv-csv-hint">
            <h4>Expected columns</h4>
            <code className="inv-csv-code">sku,delta_qty,note</code>
            <p>
              Negative <b>delta_qty</b> deducts, positive adds stock received.
              Rows are matched to products by <b>SKU</b>.
            </p>
          </div>
        </div>
      </article>
    );
  }

  return null;
}
