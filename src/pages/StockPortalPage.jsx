import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppData.jsx";
import { STOCK_CLERK } from "../mock/people.js";
import BottleArt from "../components/BottleArt.jsx";

// ─── Stock Received portal ───────────────────────────────────────────────────
// One person, one job: log what came in from suppliers today. Designed like a
// warehouse goods-received docket — kraft paper, stamped dates, a stack of
// logged "slips" — reskinned onto the shared design tokens so it still reads
// as part of the same product, just a lighter-weight single-task tool.

const GLOBAL_CSS = `
  .mvp {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    min-height: 100vh;
  }
  .mvp.dark, .mvp.light {
    --kraft: var(--bg); --kraft-line: var(--line-soft); --card: var(--surface);
    --ink: var(--cream); --ink-soft: var(--cream-dim); --ink-faint: var(--muted);
    --honey-soft: var(--amber-glow); --honey-text: var(--honey-2);
    --bottle: var(--honey-2); --red-soft: var(--red-bg);
  }
  .mvp * { box-sizing: border-box; }
  .mvp-shell { max-width: 480px; margin: 0 auto; padding: 22px 18px 60px; }
  .mvp-layout { display: flex; flex-direction: column; min-width: 0; }
  .mvp-main { min-width: 0; }
  .mvp-history { min-width: 0; }
  .mvp-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 22px; }
  .mvp-brand { display: flex; align-items: center; gap: 10px; }
  .mvp-brand .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--honey); }
  .mvp-brand b { font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-soft); }
  .mvp-signout {
    font-size: 12.5px; font-weight: 700; color: var(--ink-soft);
    background: var(--card); border: 1.5px solid var(--kraft-line); border-radius: 9px;
    cursor: pointer; padding: 7px 12px; transition: border-color 0.15s, color 0.15s;
  }
  .mvp-signout:hover { border-color: var(--red); color: var(--red); }
  .mvp-title { font-size: 24px; font-weight: 800; margin: 0 0 4px; color: var(--bottle); letter-spacing: -0.3px; }
  .mvp-sub { font-size: 14px; color: var(--ink-soft); margin: 0 0 22px; line-height: 1.5; }
  .mvp-card { background: var(--card); border: 1px solid var(--kraft-line); border-radius: 16px; padding: 20px 18px; margin-bottom: 18px; }
  .mvp-label { display: block; font-size: 13px; font-weight: 700; color: var(--bottle); margin: 0 0 8px; }
  .mvp-hint { font-size: 12.5px; color: var(--ink-faint); margin: -4px 0 10px; }
  .mvp-search { position: relative; margin-bottom: 4px; }
  .mvp-search input {
    width: 100%; font-size: 17px; padding: 14px 16px; border-radius: 12px;
    border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink);
    font-family: var(--sans); outline: none;
  }
  .mvp-search input:focus { border-color: var(--honey); background: var(--card); }
  .mvp-results { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
  .mvp-result {
    display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
    padding: 10px 12px; border-radius: 12px; border: 1.5px solid var(--kraft-line);
    background: var(--kraft); cursor: pointer; font-family: inherit;
  }
  .mvp-result:hover, .mvp-result:focus-visible { border-color: var(--honey); }
  .mvp-result-name { font-size: 14.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
  .mvp-result-sub { font-size: 12px; color: var(--ink-faint); font-family: var(--mono); }
  .mvp-note { width: 100%; font-size: 15px; padding: 13px 14px; border-radius: 12px; border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink); font-family: inherit; }
  .mvp-submit {
    width: 100%; padding: 17px; border-radius: 14px; border: none; margin-top: 8px;
    background: var(--honey); color: #15130F; font-size: 16.5px; font-weight: 800;
    letter-spacing: 0.3px; cursor: pointer;
  }
  .mvp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .mvp-status { text-align: center; font-size: 13.5px; margin-top: 10px; color: var(--red); }
  .mvp-status.ok { color: var(--green); }
  .mvp-section-label { font-size: 12px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--ink-faint); margin: 26px 0 12px; display: flex; align-items: center; gap: 10px; }
  .mvp-section-label::after { content: ""; flex: 1; height: 1px; background: var(--kraft-line); }
  .mvp-slip {
    background: var(--card); border: 1.5px solid var(--kraft-line); border-radius: 4px 4px 12px 12px;
    padding: 14px 16px 12px; margin-bottom: 10px; position: relative; animation: mvp-drop 0.35s ease-out;
  }
  .mvp-slip-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .mvp-slip-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14.5px; font-weight: 700; color: var(--ink); }
  .mvp-slip-qty { font-family: var(--mono); font-size: 18px; font-weight: 800; color: var(--green); white-space: nowrap; }
  .mvp-slip-meta { font-size: 12px; color: var(--ink-faint); margin-top: 4px; font-family: var(--mono); }
  .mvp-slip-note { font-size: 12.5px; color: var(--ink-soft); margin-top: 4px; font-style: italic; }
  .mvp-slip-actions { display: flex; gap: 8px; margin-top: 10px; }
  .mvp-slip-undo {
    font-size: 12px; font-weight: 700; color: var(--red); background: var(--red-soft);
    border: 1.5px solid transparent; border-radius: 8px; cursor: pointer; padding: 7px 12px;
  }
  .mvp-slip-undo:hover { border-color: var(--red); }
  .mvp-slip-edit-btn {
    font-size: 12px; font-weight: 700; color: var(--bottle); background: var(--kraft);
    border: 1.5px solid transparent; border-radius: 8px; cursor: pointer; padding: 7px 12px;
  }
  .mvp-slip-edit-btn:hover { border-color: var(--honey); }
  .mvp-slip-edit-qtygroup { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
  .mvp-slip-edit-qty {
    width: 46px; font-family: var(--mono); font-size: 16px; font-weight: 800; text-align: center;
    padding: 5px 2px; border-radius: 8px; border: 1.5px solid var(--honey); background: var(--kraft); color: var(--bottle);
  }
  .mvp-slip-edit { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .mvp-slip-edit-notelabel { font-size: 11px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; color: var(--ink-faint); }
  .mvp-slip-edit-note { width: 100%; font-size: 14px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink); font-family: inherit; }
  .mvp-slip-edit-note:focus { outline: none; border-color: var(--honey); }
  .mvp-slip-edit-actions { display: flex; gap: 8px; margin-top: 2px; }
  .mvp-slip-save { font-size: 12.5px; font-weight: 800; color: #15130F; background: var(--honey); border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
  .mvp-slip-cancel { font-size: 12.5px; font-weight: 700; color: var(--ink-soft); background: none; border: 1.5px solid var(--kraft-line); border-radius: 8px; padding: 8px 14px; cursor: pointer; }
  .mvp-empty { text-align: center; padding: 30px 10px; color: var(--ink-faint); font-size: 13.5px; }
  .mvp-login-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .mvp-login-card { width: 100%; max-width: 340px; background: var(--card); border: 1px solid var(--kraft-line); border-radius: 20px; padding: 32px 26px; text-align: center; }
  .mvp-login-card b { display: block; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--honey-text); margin-bottom: 6px; }
  .mvp-login-title { font-size: 21px; font-weight: 800; color: var(--bottle); margin: 0 0 22px; }
  .mvp-headbtns { display: flex; align-items: center; gap: 14px; }
  .mvp-iconbtn { width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid var(--kraft-line); background: var(--card); color: var(--ink-soft); display: flex; align-items: center; justify-content: center; cursor: pointer; flex: 0 0 auto; }
  .mvp-cart { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .mvp-cart-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 12px; background: var(--kraft); border: 1.5px solid var(--kraft-line); }
  .mvp-cart-name { flex: 1; font-size: 14px; font-weight: 700; color: var(--ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mvp-cart-step { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
  .mvp-cart-stepbtn { width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid var(--kraft-line); background: var(--card); font-size: 15px; font-weight: 800; color: var(--bottle); cursor: pointer; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
  .mvp-cart-stepbtn:hover { border-color: var(--honey); }
  .mvp-cart-qty { font-family: var(--mono); font-size: 15px; font-weight: 800; color: var(--bottle); width: 38px; text-align: center; border: 1.5px solid var(--kraft-line); border-radius: 8px; background: var(--card); padding: 5px 2px; }
  .mvp-cart-remove { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid transparent; background: transparent; color: var(--red); font-size: 18px; line-height: 1; cursor: pointer; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; }
  .mvp-cart-remove:hover { background: var(--red-soft); border-color: var(--red); }
  .mvp-cart-empty { font-size: 13px; color: var(--ink-faint); padding: 4px 2px; }
  .mvp-bulk-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
  .mvp-bulk-filebtn { display: inline-flex; align-items: center; padding: 10px 16px; border-radius: 10px; border: 1.5px dashed var(--kraft-line); background: var(--kraft); color: var(--ink-soft); font-size: 13.5px; font-weight: 700; cursor: pointer; }
  .mvp-bulk-filebtn:hover { border-color: var(--honey); color: var(--ink); }
  .mvp-bulk-filebtn:focus-within { outline: 2px solid var(--honey); outline-offset: 2px; }
  .mvp-bulk-preview { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; }
  .mvp-bulk-preview-row { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 6px 10px; border-radius: 8px; background: var(--kraft); font-family: var(--mono); }
  .mvp-bulk-preview-right { display: flex; align-items: center; gap: 8px; }
  .mvp-bulk-dup { font-family: var(--sans); font-size: 10.5px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; color: var(--honey-text); background: var(--honey-soft); border-radius: 6px; padding: 3px 6px; white-space: nowrap; }
  .mvp-bulk-results { margin-top: 14px; }
  .mvp-bulk-fail { font-size: 12.5px; color: var(--red); margin-top: 4px; }
  .mvp-modal-backdrop { position: fixed; inset: 0; background: rgba(16,11,4,0.6); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .mvp-modal { width: 100%; max-width: 340px; background: var(--card); border: 1px solid var(--kraft-line); border-radius: 18px; padding: 26px 22px; text-align: center; box-shadow: 0 16px 48px rgba(16,11,4,0.3); animation: mvp-modal-in 0.15s ease-out; }
  .mvp-modal-title { font-size: 17px; font-weight: 800; color: var(--bottle); margin: 0 0 10px; }
  .mvp-modal-body { font-size: 13px; color: var(--ink-soft); line-height: 1.5; margin: 0 0 22px; }
  .mvp-modal-actions { display: flex; gap: 10px; }
  .mvp-modal-cancel { flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink); font-weight: 700; font-size: 14px; cursor: pointer; }
  .mvp-modal-confirm { flex: 1; padding: 13px; border-radius: 12px; border: none; background: var(--red); color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; }
  @keyframes mvp-modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes mvp-drop { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
  @media (min-width: 640px) { .mvp-shell { max-width: 620px; padding: 32px 28px 70px; } .mvp-card { padding: 26px 26px; } .mvp-title { font-size: 27px; } .mvp-login-card { max-width: 380px; padding: 38px 32px; } }
  @media (min-width: 980px) {
    .mvp-shell { max-width: 1080px; padding: 40px 32px 70px; }
    .mvp-layout { display: grid; grid-template-columns: minmax(0, 480px) minmax(0, 1fr); align-items: start; gap: 40px; }
    .mvp-history { position: sticky; top: 32px; max-height: calc(100vh - 64px); overflow-y: auto; padding-right: 4px; }
    .mvp-section-label { margin-top: 0; }
  }
  @media (min-width: 1280px) { .mvp-shell { max-width: 1200px; } .mvp-layout { grid-template-columns: minmax(0, 520px) minmax(0, 1fr); gap: 56px; } }
`;

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
}

function formatDateLabel(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00+08:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Singapore" });
}

function splitCSVLines(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); field = ""; rows.push(row); row = []; }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

const COLUMN_ALIASES = {
  sku: ["sku", "itemcode", "productcode", "code", "itemno", "itemnumber", "productid", "barcode", "upc"],
  name: ["name", "productname", "product", "description", "item", "itemname", "title"],
  qty: ["qty", "quantity", "units", "unit", "count", "amount", "received", "qtyreceived", "receivedqty", "stockreceived"],
  note: ["note", "notes", "remark", "remarks", "comment", "comments", "memo"],
};

function normalizeHeaderCell(h) { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function findColumn(normalizedHeader, aliases) {
  for (const alias of aliases) { const idx = normalizedHeader.findIndex((h) => h.includes(alias)); if (idx !== -1) return idx; }
  return -1;
}

function parseStockCSV(text) {
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const lines = splitCSVLines(clean);
  if (lines.length < 2) throw new Error("File needs a header row plus at least one product row");
  const header = lines[0].map(normalizeHeaderCell);
  const idxSku = findColumn(header, COLUMN_ALIASES.sku);
  const idxName = findColumn(header, COLUMN_ALIASES.name);
  const idxQty = findColumn(header, COLUMN_ALIASES.qty);
  const idxNote = findColumn(header, COLUMN_ALIASES.note);
  if (idxSku === -1 && idxName === -1) throw new Error("Couldn't find a product name or SKU column in that file");
  if (idxQty === -1) throw new Error("Couldn't find a quantity column in that file");
  const rows = lines.slice(1).filter((cols) => cols.some((c) => c.trim() !== "")).map((cols) => ({
    sku: idxSku !== -1 ? (cols[idxSku] || "").trim() : "",
    name: idxName !== -1 ? (cols[idxName] || "").trim() : "",
    qty: (cols[idxQty] || "").trim(),
    note: idxNote !== -1 ? (cols[idxNote] || "").trim() : "",
  }));
  if (!rows.length) throw new Error("No data rows found in that file");
  return rows;
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="mvp-iconbtn" onClick={onToggle} aria-label="Toggle theme">
      {theme === "dark"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
    </button>
  );
}

function EnterDemoScreen({ onEnter, theme, onToggleTheme }) {
  return (
    <div className={`mvp ${theme}`}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "fixed", top: 16, right: 16 }}><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <div className="mvp-login-shell">
        <div className="mvp-login-card">
          <b>Maison Reserve</b>
          <div className="mvp-login-title">Stock Received</div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>Portfolio demo — {STOCK_CLERK.name}'s stock-receiving desk</p>
          <button className="mvp-submit" onClick={onEnter}>Enter Demo</button>
        </div>
      </div>
    </div>
  );
}

function StockPortal({ onExit, theme, onToggleTheme }) {
  const { state, actions } = useAppData();
  const inventory = state.inventory.items;
  const receipts = state.stock.receipts;

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const [bulkRows, setBulkRows] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkResults, setBulkResults] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [editNote, setEditNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (confirmDeleteId === null) return;
    const onKey = (e) => { if (e.key === "Escape") setConfirmDeleteId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDeleteId]);

  const results = query.trim()
    ? inventory.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  function loggedTodayQty(sku) {
    const today = todayISO();
    return receipts.filter((r) => r.sku === sku && r.receivedOn === today).reduce((sum, r) => sum + r.qty, 0);
  }

  function addToCart(product) {
    const alreadyInCart = cart.some((it) => it.sku === product.sku);
    if (!alreadyInCart) {
      const already = loggedTodayQty(product.sku);
      if (already > 0 && !confirm(`${product.name} was already logged today (+${already}). Add another entry anyway?`)) {
        setQuery(""); return;
      }
    }
    setCart((prev) => {
      const existing = prev.find((it) => it.sku === product.sku);
      if (existing) return prev.map((it) => it.sku === product.sku ? { ...it, qty: it.qty + 1 } : it);
      return [...prev, { sku: product.sku, name: product.name, category: product.category, qty: 1 }];
    });
    setQuery("");
  }

  function adjustCartQty(sku, delta) {
    setCart((prev) => prev.map((it) => it.sku === sku ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  }
  function setCartQty(sku, raw) {
    setCart((prev) => prev.map((it) => {
      if (it.sku !== sku) return it;
      if (raw === "") return { ...it, qty: "" };
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? { ...it, qty: n } : it;
    }));
  }
  function blurCartQty(sku) {
    setCart((prev) => prev.map((it) => it.sku === sku && (it.qty === "" || Number(it.qty) < 1) ? { ...it, qty: 1 } : it));
  }
  function removeFromCart(sku) { setCart((prev) => prev.filter((it) => it.sku !== sku)); }

  function loggedTodayRow(row) {
    const today = todayISO();
    const sku = (row.sku || "").trim().toLowerCase();
    const name = (row.name || "").trim().toLowerCase();
    if (!sku && !name) return false;
    return receipts.some((r) => r.receivedOn === today && ((sku && r.sku?.toLowerCase() === sku) || (name && r.productName?.toLowerCase() === name)));
  }

  function submit(e) {
    e.preventDefault();
    if (!cart.length) { setStatus({ ok: false, text: "Add at least one product first" }); return; }
    setSaving(true);
    const receivedOn = todayISO();
    cart.forEach((item) => {
      const qty = Number(item.qty) || 1;
      actions.stock.addReceipt({ sku: item.sku, productName: item.name, qty, receivedOn, note, addedBy: STOCK_CLERK.name });
      const product = inventory.find((p) => p.sku === item.sku);
      if (product) actions.inventory.adjustStock(product.id, qty);
    });
    setStatus({ ok: true, text: `Logged ${cart.length} product${cart.length === 1 ? "" : "s"} for today` });
    setCart([]); setNote(""); setSaving(false);
  }

  function requestDelete(id) { setConfirmDeleteId(id); }
  function cancelDelete() { setConfirmDeleteId(null); }
  function confirmDelete() {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const receipt = receipts.find((r) => r.id === id);
    if (receipt) {
      const product = inventory.find((p) => p.sku === receipt.sku);
      if (product) actions.inventory.adjustStock(product.id, -receipt.qty);
    }
    actions.stock.removeReceipt(id);
  }

  function startEdit(r) { setEditingId(r.id); setEditQty(String(r.qty)); setEditNote(r.note || ""); }
  function cancelEdit() { setEditingId(null); }
  function adjustEditQty(delta) { setEditQty((prev) => { const n = parseInt(prev, 10); return String(Math.max(1, (Number.isFinite(n) ? n : 0) + delta)); }); }
  function saveEdit(id) {
    const quantity = parseInt(editQty, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) { setStatus({ ok: false, text: "Quantity must be a positive number" }); return; }
    const receipt = receipts.find((r) => r.id === id);
    if (receipt) {
      const delta = quantity - receipt.qty;
      const product = inventory.find((p) => p.sku === receipt.sku);
      if (product && delta !== 0) actions.inventory.adjustStock(product.id, delta);
    }
    actions.stock.updateReceipt(id, { qty: quantity, note: editNote });
    setEditingId(null);
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBulkResults(null);
    const reader = new FileReader();
    reader.onload = () => {
      try { setBulkRows(parseStockCSV(String(reader.result || ""))); setBulkError(""); }
      catch (err) { setBulkRows([]); setBulkError(err.message); }
    };
    reader.onerror = () => setBulkError("Couldn't read that file");
    reader.readAsText(file);
  }

  function submitBulk(e) {
    e.preventDefault();
    if (!bulkRows.length) return;
    const receivedOn = todayISO();
    const results = [];
    bulkRows.forEach((row, i) => {
      const qty = parseInt(row.qty, 10);
      const product = inventory.find((p) =>
        (row.sku && p.sku.toLowerCase() === row.sku.toLowerCase()) ||
        (row.name && p.name.toLowerCase() === row.name.toLowerCase())
      );
      if (!product) { results.push({ line: i + 2, ok: false, error: "No matching product found", product: row.sku || row.name }); return; }
      if (!Number.isFinite(qty) || qty <= 0) { results.push({ line: i + 2, ok: false, error: "Invalid quantity", product: product.name }); return; }
      actions.stock.addReceipt({ sku: product.sku, productName: product.name, qty, receivedOn, note: row.note || bulkNote, addedBy: STOCK_CLERK.name });
      actions.inventory.adjustStock(product.id, qty);
      results.push({ line: i + 2, ok: true });
    });
    const failed = results.filter((r) => !r.ok).length;
    setBulkResults({ imported: results.length - failed, failed, results });
    if (failed) {
      const failedLines = new Set(results.filter((r) => !r.ok).map((r) => r.line));
      setBulkRows((prev) => prev.filter((_, i) => failedLines.has(i + 2)));
    } else { setBulkRows([]); setBulkNote(""); }
  }

  return (
    <div className={`mvp ${theme}`}>
      <style>{GLOBAL_CSS}</style>
      <div className="mvp-shell">
        <div className="mvp-head">
          <div className="mvp-brand"><span className="dot" /><b>Maison Reserve &middot; Stock Received</b></div>
          <div className="mvp-headbtns">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button className="mvp-signout" onClick={onExit}>Exit demo</button>
          </div>
        </div>

        <div className="mvp-layout">
          <div className="mvp-main">
            <h1 className="mvp-title">What came in today?</h1>
            <p className="mvp-sub">Add every product from this delivery, then log it all in one go. It adds straight to Maison Reserve&rsquo;s stock count, nothing else to update.</p>

            <form className="mvp-card" onSubmit={submit}>
              <label className="mvp-label">Add a product</label>
              <div className="mvp-search">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a product name…" autoComplete="off" />
                {results.length > 0 && (
                  <div className="mvp-results">
                    {results.map((r) => (
                      <button type="button" key={r.id} className="mvp-result" onClick={() => addToCart(r)}>
                        <BottleArt category={r.category} seed={r.sku} size={40} />
                        <div>
                          <div className="mvp-result-name">{r.name}</div>
                          <div className="mvp-result-sub">{r.stock} in stock now</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="mvp-label" style={{ marginTop: 20 }}>This delivery{cart.length > 0 ? ` (${cart.length} product${cart.length === 1 ? "" : "s"})` : ""}</label>
              {cart.length === 0 ? (
                <div className="mvp-cart-empty">Nothing added yet — search above and tap a product.</div>
              ) : (
                <div className="mvp-cart">
                  {cart.map((item) => (
                    <div className="mvp-cart-row" key={item.sku}>
                      <BottleArt category={item.category} seed={item.sku} size={36} />
                      <div className="mvp-cart-name">{item.name}</div>
                      <div className="mvp-cart-step">
                        <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustCartQty(item.sku, -1)} aria-label="Fewer">&minus;</button>
                        <input className="mvp-cart-qty" type="number" inputMode="numeric" min="1" value={item.qty} onChange={(e) => setCartQty(item.sku, e.target.value)} onFocus={(e) => e.target.select()} onBlur={() => blurCartQty(item.sku)} aria-label={`Quantity for ${item.name}`} />
                        <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustCartQty(item.sku, 1)} aria-label="More">+</button>
                      </div>
                      <button type="button" className="mvp-cart-remove" onClick={() => removeFromCart(item.sku)} aria-label="Remove">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              <label className="mvp-label" style={{ marginTop: 20 }}>Note <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optional, applies to all)</span></label>
              <input className="mvp-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. from ABC Distributors" />

              <button className="mvp-submit" type="submit" disabled={saving || !cart.length} style={{ marginTop: 22 }}>
                {saving ? "Logging…" : `Log this delivery${cart.length ? ` (${cart.length})` : ""}`}
              </button>
              {status && <div className={`mvp-status${status.ok ? " ok" : ""}`}>{status.text}</div>}
            </form>

            <div className="mvp-card">
              <label className="mvp-label">Bulk import (CSV)</label>
              <p className="mvp-hint">Upload any delivery CSV you already have — we&rsquo;ll work out which column is the product and which is the quantity.</p>
              <div className="mvp-bulk-row">
                <label className="mvp-bulk-filebtn">Choose CSV file<input type="file" accept=".csv,text/csv" className="sr-only-input" onChange={handleCsvFile} /></label>
              </div>
              {bulkError && <div className="mvp-status">{bulkError}</div>}
              {bulkRows.length > 0 && (
                <form onSubmit={submitBulk}>
                  <div className="mvp-hint" style={{ marginTop: 12 }}>{bulkRows.length} row{bulkRows.length === 1 ? "" : "s"} ready to import</div>
                  <div className="mvp-bulk-preview">
                    {bulkRows.map((r, i) => (
                      <div className="mvp-bulk-preview-row" key={i}>
                        <span>{r.sku || r.name || "missing product"}</span>
                        <span className="mvp-bulk-preview-right">
                          {loggedTodayRow(r) && <span className="mvp-bulk-dup">already today</span>}
                          {r.qty || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <label className="mvp-label" style={{ marginTop: 16 }}>Note <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optional, applies to rows without their own note)</span></label>
                  <input className="mvp-note" value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder="e.g. from ABC Distributors" />
                  <button className="mvp-submit" type="submit" style={{ marginTop: 18 }}>Import {bulkRows.length} row{bulkRows.length === 1 ? "" : "s"}</button>
                </form>
              )}
              {bulkResults && (
                <div className="mvp-bulk-results">
                  <div className={`mvp-status${bulkResults.failed ? "" : " ok"}`}>
                    Imported {bulkResults.imported} of {bulkResults.imported + bulkResults.failed}{bulkResults.failed ? " — fix the rows below and re-import" : ""}
                  </div>
                  {bulkResults.results.filter((r) => !r.ok).map((r, i) => (
                    <div className="mvp-bulk-fail" key={i}>Row {r.line}{r.product ? ` (${r.product})` : ""}: {r.error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mvp-history">
            <div className="mvp-section-label">Recently logged</div>
            {receipts.length === 0 && <div className="mvp-empty">Nothing logged yet. Once you log a delivery, it shows up here.</div>}
            {receipts.map((r) => (
              <div className="mvp-slip" key={r.id}>
                <div className="mvp-slip-top">
                  <div className="mvp-slip-name">{r.productName || r.sku}</div>
                  {editingId === r.id ? (
                    <div className="mvp-slip-edit-qtygroup">
                      <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustEditQty(-1)} aria-label="Fewer">&minus;</button>
                      <input className="mvp-slip-edit-qty" type="number" inputMode="numeric" min="1" value={editQty} onChange={(e) => setEditQty(e.target.value)} onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(r.id); } if (e.key === "Escape") cancelEdit(); }} aria-label="Quantity" autoFocus />
                      <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustEditQty(1)} aria-label="More">+</button>
                    </div>
                  ) : <div className="mvp-slip-qty">+{r.qty}</div>}
                </div>
                <div className="mvp-slip-meta">{formatDateLabel(r.receivedOn)}{r.addedBy ? ` · ${r.addedBy}` : ""}</div>
                {editingId === r.id ? (
                  <form className="mvp-slip-edit" onSubmit={(e) => { e.preventDefault(); saveEdit(r.id); }} onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}>
                    <label className="mvp-slip-edit-notelabel" htmlFor={`edit-note-${r.id}`}>Note</label>
                    <input id={`edit-note-${r.id}`} className="mvp-slip-edit-note" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="e.g. from ABC Distributors" />
                    <div className="mvp-slip-edit-actions">
                      <button type="submit" className="mvp-slip-save">Save</button>
                      <button type="button" className="mvp-slip-cancel" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {r.note && <div className="mvp-slip-note">{r.note}</div>}
                    <div className="mvp-slip-actions">
                      <button type="button" className="mvp-slip-edit-btn" onClick={() => startEdit(r)}>Edit</button>
                      <button type="button" className="mvp-slip-undo" onClick={() => requestDelete(r.id)}>Remove</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirmDeleteId !== null && (
        <div className="mvp-modal-backdrop" onClick={cancelDelete}>
          <div className="mvp-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mvp-modal-title">Remove this entry?</div>
            <p className="mvp-modal-body">This removes the logged entry and reverses the stock increase it made.</p>
            <div className="mvp-modal-actions">
              <button type="button" className="mvp-modal-cancel" onClick={cancelDelete}>Cancel</button>
              <button type="button" className="mvp-modal-confirm" onClick={confirmDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function StockPortalPage() {
  const { state, actions } = useAppData();
  const [entered, setEntered] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const prev = document.title;
    document.title = "Maison Reserve | Stock Received";
    return () => { document.title = prev; };
  }, []);

  // Point the installable-app manifest at this portal's own (start_url, icon,
  // name) while it's open, so "Add to Home Screen" installs this portal
  // specifically. Reverted on unmount.
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    const prevHref = link?.getAttribute("href");
    if (link) link.setAttribute("href", "/stock-manifest.json");
    return () => { if (link && prevHref) link.setAttribute("href", prevHref); };
  }, []);

  function enter() { setEntered(true); actions.session.enterDemo("stock"); }
  function exit() { actions.session.exitDemo(); setEntered(false); }

  if (!entered || state.session.role !== "stock") {
    return <EnterDemoScreen onEnter={enter} theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />;
  }
  return <StockPortal onExit={exit} theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />;
}
