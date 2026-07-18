import { useEffect, useRef, useState } from "react";

// ─── Melvin's Stock Received portal ───────────────────────────────────────────
// One person, one job: log what came in from suppliers today. Designed like a
// warehouse goods-received docket — kraft paper, stamped dates, a stack of
// logged "slips" — not the dark Command Centre dashboard, since this is a
// single repeated task for one non-technical user, not a data console.
//
// Backend: additive on top of the channel-synced stock (see
// server/models/stockReceiptModel.js). Melvin never overwrites what
// WooCommerce/Shopee/Lazada report; his entries just add on top until someone
// removes the entry once BigSeller's own numbers catch up to the same delivery.

const GLOBAL_CSS = `
  .mvp {
    --mono: 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
    --sans: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    background: var(--kraft);
    color: var(--ink);
    font-family: var(--sans);
    min-height: 100vh;
  }
  /* Warm kraft-paper ledger, daylight */
  .mvp.light {
    --kraft:      #F0E6D2;
    --kraft-line: #D8C7A0;
    --card:       #FFFDF7;
    --ink:        #23301F;
    --ink-soft:   #6B6047;
    --ink-faint:  #6E644E;
    --honey:      #C8870A;
    --honey-2:    #F5B51C;
    --honey-soft: rgba(200,135,10,0.14);
    --honey-text: #785006;
    --bottle:     #1F3327;
    --red:        #B0402C;
    --red-soft:   rgba(176,64,44,0.12);
    --green:      #2E7D46;
  }
  /* Same ledger, night shift — dim warehouse lamp on kraft paper */
  .mvp.dark {
    --kraft:      #1B160E;
    --kraft-line: #3D3220;
    --card:       #241C12;
    --ink:        #F2E9D3;
    --ink-soft:   #C2B48C;
    --ink-faint:  #948864;
    --honey:      #F0A916;
    --honey-2:    #FFCB4D;
    --honey-soft: rgba(240,169,22,0.2);
    --honey-text: #F0A916;
    --bottle:     #8FBF9B;
    --red:        #E2705A;
    --red-soft:   rgba(226,112,90,0.1);
    --green:      #6FCB86;
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
  .mvp-signout:focus-visible { border-color: var(--red); color: var(--red); outline: none; }
  .mvp-signout:active { transform: translateY(1px); }

  .mvp-title { font-size: 24px; font-weight: 800; margin: 0 0 4px; color: var(--bottle); letter-spacing: -0.3px; }
  .mvp-sub { font-size: 14px; color: var(--ink-soft); margin: 0 0 22px; line-height: 1.5; }

  .mvp-card { background: var(--card); border: 1px solid var(--kraft-line); border-radius: 16px; padding: 20px 18px; box-shadow: 0 1px 0 rgba(35,48,31,0.03); margin-bottom: 18px; }

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
  .mvp-thumb { width: 40px; height: 40px; border-radius: 8px; background: var(--card); border: 1px solid var(--kraft-line); flex: 0 0 auto; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .mvp-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .mvp-result-name { font-size: 14.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
  .mvp-result-sub { font-size: 12px; color: var(--ink-faint); font-family: var(--mono); }

  .mvp-note { width: 100%; font-size: 15px; padding: 13px 14px; border-radius: 12px; border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink); font-family: inherit; }

  .mvp-submit {
    width: 100%; padding: 17px; border-radius: 14px; border: none; margin-top: 8px;
    background: var(--honey); color: #1B160E; font-size: 16.5px; font-weight: 800;
    letter-spacing: 0.3px; cursor: pointer; box-shadow: 0 2px 0 rgba(0,0,0,0.35);
  }
  .mvp-submit:active { transform: translateY(2px); box-shadow: none; }
  .mvp-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

  .mvp-status { text-align: center; font-size: 13.5px; margin-top: 10px; color: var(--red); }
  .mvp-status.ok { color: var(--green); }

  .mvp-section-label { font-size: 12px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--ink-faint); margin: 26px 0 12px; display: flex; align-items: center; gap: 10px; }
  .mvp-section-label::after { content: ""; flex: 1; height: 1px; background: var(--kraft-line); }

  .mvp-slip {
    background: var(--card); border: 1.5px solid var(--kraft-line); border-radius: 4px 4px 12px 12px;
    padding: 14px 16px 12px; margin-bottom: 10px; position: relative;
    animation: mvp-drop 0.35s ease-out;
  }
  .mvp-slip::before {
    content: ""; position: absolute; top: -1.5px; left: 14px; right: 14px; height: 6px;
    background: repeating-linear-gradient(90deg, var(--kraft) 0 8px, transparent 8px 14px);
    border-left: 1.5px solid var(--kraft-line); border-right: 1.5px solid var(--kraft-line);
  }
  .mvp-slip-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .mvp-slip-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14.5px; font-weight: 700; color: var(--ink); }
  .mvp-slip-qty { font-family: var(--mono); font-size: 18px; font-weight: 800; color: var(--green); white-space: nowrap; }
  .mvp-slip-meta { font-size: 12px; color: var(--ink-faint); margin-top: 4px; font-family: var(--mono); }
  .mvp-slip-note { font-size: 12.5px; color: var(--ink-soft); margin-top: 4px; font-style: italic; }
  .mvp-slip-actions { display: flex; gap: 8px; margin-top: 10px; }

  .mvp-slip-undo {
    font-size: 12px; font-weight: 700; color: var(--red);
    background: var(--red-soft); border: 1.5px solid transparent; border-radius: 8px;
    cursor: pointer; padding: 7px 12px; display: inline-flex; align-items: center;
    transition: background-color 0.15s, border-color 0.15s;
  }
  .mvp-slip-undo:hover { border-color: var(--red); }
  .mvp-slip-undo:focus-visible { border-color: var(--red); outline: none; }
  .mvp-slip-undo:active { transform: translateY(1px); }

  .mvp-slip-edit-btn {
    font-size: 12px; font-weight: 700; color: var(--bottle);
    background: var(--kraft); border: 1.5px solid transparent; border-radius: 8px;
    cursor: pointer; padding: 7px 12px; display: inline-flex; align-items: center;
    transition: background-color 0.15s, border-color 0.15s;
  }
  .mvp-slip-edit-btn:hover { border-color: var(--honey); }
  .mvp-slip-edit-btn:focus-visible { border-color: var(--honey); outline: none; }
  .mvp-slip-edit-btn:active { transform: translateY(1px); }

  /* qty edit sits inline where the "+12" badge was, so the field being
     edited doesn't visually relocate — only the note field and actions
     appear below as new content. */
  .mvp-slip-edit-qtygroup { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
  .mvp-slip-edit-qty {
    width: 46px; font-family: var(--mono); font-size: 16px; font-weight: 800; text-align: center;
    padding: 5px 2px; border-radius: 8px; border: 1.5px solid var(--honey); background: var(--kraft);
    color: var(--bottle);
  }
  .mvp-slip-edit-qty::-webkit-outer-spin-button, .mvp-slip-edit-qty::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .mvp-slip-edit-qty[type="number"] { -moz-appearance: textfield; }
  .mvp-slip-edit-qty:focus { outline: none; box-shadow: 0 0 0 3px var(--honey-soft); }

  .mvp-slip-edit { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .mvp-slip-edit-notelabel {
    font-size: 11px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase;
    color: var(--ink-faint);
  }
  .mvp-slip-edit-note {
    width: 100%; font-size: 14px; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink); font-family: inherit;
  }
  .mvp-slip-edit-note:focus { outline: none; border-color: var(--honey); }
  .mvp-slip-edit-actions { display: flex; gap: 8px; margin-top: 2px; }
  .mvp-slip-save {
    font-size: 12.5px; font-weight: 800; color: #1B160E; background: var(--honey);
    border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer;
  }
  .mvp-slip-save:disabled { opacity: 0.6; cursor: not-allowed; }
  .mvp-slip-cancel {
    font-size: 12.5px; font-weight: 700; color: var(--ink-soft); background: none;
    border: 1.5px solid var(--kraft-line); border-radius: 8px; padding: 8px 14px; cursor: pointer;
  }
  .mvp-slip-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

  .mvp-empty { text-align: center; padding: 30px 10px; color: var(--ink-faint); font-size: 13.5px; }

  .mvp-login-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .mvp-login-card { width: 100%; max-width: 340px; background: var(--card); border: 1px solid var(--kraft-line); border-radius: 20px; padding: 32px 26px; text-align: center; }
  .mvp-login-card b { display: block; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--honey-text); margin-bottom: 6px; }
  .mvp-login-title { font-size: 21px; font-weight: 800; color: var(--bottle); margin: 0 0 22px; }
  .mvp-login-card input:not([type="checkbox"]) {
    width: 100%; font-size: 18px; padding: 15px 16px; border-radius: 12px; text-align: center;
    border: 1.5px solid var(--kraft-line); background: var(--kraft); color: var(--ink); margin-bottom: 14px; outline: none; letter-spacing: 2px;
  }
  .mvp-login-card input:not([type="checkbox"]):focus { border-color: var(--honey); }
  .mvp-remember { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: var(--ink-soft); margin: -4px 0 16px; cursor: pointer; }
  .mvp-remember input { width: 16px; height: 16px; margin: 0; accent-color: var(--honey); cursor: pointer; }

  .mvp-headbtns { display: flex; align-items: center; gap: 14px; }
  .mvp-iconbtn {
    width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid var(--kraft-line);
    background: var(--card); color: var(--ink-soft); display: flex; align-items: center;
    justify-content: center; cursor: pointer; flex: 0 0 auto;
  }

  .mvp-cart { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .mvp-cart-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 12px; background: var(--kraft); border: 1.5px solid var(--kraft-line); }
  .mvp-cart-name { flex: 1; font-size: 14px; font-weight: 700; color: var(--ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mvp-cart-step { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
  .mvp-cart-stepbtn {
    width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid var(--kraft-line);
    background: var(--card); font-size: 15px; font-weight: 800; color: var(--bottle);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex: 0 0 auto; transition: border-color 0.15s;
  }
  .mvp-cart-stepbtn:hover, .mvp-cart-stepbtn:focus-visible { border-color: var(--honey); outline: none; }
  .mvp-cart-stepbtn:active { transform: scale(0.94); }
  .mvp-cart-qty {
    font-family: var(--mono); font-size: 15px; font-weight: 800; color: var(--bottle);
    width: 38px; text-align: center; border: 1.5px solid var(--kraft-line); border-radius: 8px;
    background: var(--card); padding: 5px 2px;
  }
  .mvp-cart-qty:focus { outline: none; border-color: var(--honey); box-shadow: 0 0 0 3px var(--honey-soft); }
  .mvp-cart-qty::-webkit-outer-spin-button, .mvp-cart-qty::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .mvp-cart-qty[type="number"] { -moz-appearance: textfield; }
  .mvp-cart-remove {
    width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid transparent;
    background: transparent; color: var(--red); font-size: 18px; line-height: 1;
    cursor: pointer; flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
    transition: background-color 0.15s, border-color 0.15s;
  }
  .mvp-cart-remove:hover { background: var(--red-soft); border-color: var(--red); }
  .mvp-cart-remove:focus-visible { background: var(--red-soft); border-color: var(--red); outline: none; }
  .mvp-cart-remove:active { transform: scale(0.94); }
  .mvp-cart-empty { font-size: 13px; color: var(--ink-faint); padding: 4px 2px; }

  .mvp-bulk-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
  .mvp-bulk-filebtn { display: inline-flex; align-items: center; padding: 10px 16px; border-radius: 10px; border: 1.5px dashed var(--kraft-line); background: var(--kraft); color: var(--ink-soft); font-size: 13.5px; font-weight: 700; cursor: pointer; }
  .mvp-bulk-filebtn:hover { border-color: var(--honey); color: var(--ink); }
  .mvp-bulk-preview { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; }
  .mvp-bulk-preview-row { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; padding: 6px 10px; border-radius: 8px; background: var(--kraft); font-family: var(--mono); }
  .mvp-bulk-preview-right { display: flex; align-items: center; gap: 8px; }
  .mvp-bulk-dup { font-family: var(--sans); font-size: 10.5px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; color: var(--honey-text); background: var(--honey-soft); border-radius: 6px; padding: 3px 6px; white-space: nowrap; }
  .mvp-bulk-results { margin-top: 14px; }
  .mvp-bulk-fail { font-size: 12.5px; color: var(--red); margin-top: 4px; }

  .mvp-modal-backdrop {
    position: fixed; inset: 0; background: rgba(15,10,5,0.5); z-index: 50;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .mvp-modal {
    width: 100%; max-width: 340px; background: var(--card); border: 1px solid var(--kraft-line);
    border-radius: 18px; padding: 26px 22px; text-align: center;
    box-shadow: 0 16px 48px rgba(0,0,0,0.3); animation: mvp-modal-in 0.15s ease-out;
  }
  .mvp-modal-title { font-size: 17px; font-weight: 800; color: var(--bottle); margin: 0 0 10px; }
  .mvp-modal-body { font-size: 13px; color: var(--ink-soft); line-height: 1.5; margin: 0 0 22px; }
  .mvp-modal-actions { display: flex; gap: 10px; }
  .mvp-modal-cancel {
    flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid var(--kraft-line);
    background: var(--kraft); color: var(--ink); font-weight: 700; font-size: 14px; cursor: pointer;
  }
  .mvp-modal-cancel:hover, .mvp-modal-cancel:focus-visible { border-color: var(--ink-soft); outline: none; }
  .mvp-modal-confirm {
    flex: 1; padding: 13px; border-radius: 12px; border: none;
    background: #B0402C; color: #FFF8F0; font-weight: 800; font-size: 14px; cursor: pointer;
  }
  .mvp-modal-confirm:hover, .mvp-modal-confirm:focus-visible { background: #99372A; outline: none; }
  .mvp-modal-confirm:active, .mvp-modal-cancel:active { transform: translateY(1px); }
  @keyframes mvp-modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .mvp-modal { animation: none; } }

  @keyframes mvp-drop { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .mvp-slip { animation: none; } }

  /* Tablet: same single-column flow, just more breathing room */
  @media (min-width: 640px) {
    .mvp-shell { max-width: 620px; padding: 32px 28px 70px; }
    .mvp-card { padding: 26px 26px; }
    .mvp-title { font-size: 27px; }
    .mvp-login-card { max-width: 380px; padding: 38px 32px; }
  }

  /* Desktop/web: entry form and history become side-by-side columns */
  @media (min-width: 980px) {
    .mvp-shell { max-width: 1080px; padding: 40px 32px 70px; }
    .mvp-layout { display: grid; grid-template-columns: minmax(0, 480px) minmax(0, 1fr); align-items: start; gap: 40px; }
    .mvp-history { position: sticky; top: 32px; max-height: calc(100vh - 64px); overflow-y: auto; padding-right: 4px; }
    .mvp-section-label { margin-top: 0; }
  }

  @media (min-width: 1280px) {
    .mvp-shell { max-width: 1200px; }
    .mvp-layout { grid-template-columns: minmax(0, 520px) minmax(0, 1fr); gap: 56px; }
  }
`;

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
}

function formatDateLabel(iso) {
  // received_on comes back as either "YYYY-MM-DD" or a full ISO datetime
  // (Postgres DATE columns are serialized as Date objects by pg, which
  // JSON-stringify to "2026-07-06T00:00:00.000Z") — take just the date part.
  const dateOnly = String(iso).slice(0, 10);
  const d = new Date(`${dateOnly}T00:00:00+08:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Singapore" });
}

// Quote-aware CSV line splitter — handles commas/newlines inside quoted
// fields (e.g. a note like "Delivered, but 2 boxes damaged").
function splitCSVLines(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

// Whatever CSV Melvin already has (a supplier packing list, a marketplace
// export, a spreadsheet he made himself) gets read as-is — we hunt for
// recognisable column names instead of demanding a specific template.
const COLUMN_ALIASES = {
  sku:  ["sku", "itemcode", "productcode", "code", "itemno", "itemnumber", "productid", "barcode", "upc"],
  name: ["name", "productname", "product", "description", "item", "itemname", "title"],
  qty:  ["qty", "quantity", "units", "unit", "count", "amount", "received", "qtyreceived", "receivedqty", "stockreceived"],
  note: ["note", "notes", "remark", "remarks", "comment", "comments", "memo"]
};

function normalizeHeaderCell(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Substring match (not exact) so headers like "Quantity Received" or
// "Item Code" — worded however the source system happens to word them —
// still resolve, not just a bare "qty" or "sku".
function findColumn(normalizedHeader, aliases) {
  for (const alias of aliases) {
    const idx = normalizedHeader.findIndex((h) => h.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Row identity is resolved server-side against inventory (sku or exact name)
// so a typo fails that one row instead of silently matching the wrong product.
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

  const rows = lines.slice(1)
    .filter((cols) => cols.some((c) => c.trim() !== ""))
    .map((cols) => ({
      sku: idxSku !== -1 ? (cols[idxSku] || "").trim() : "",
      name: idxName !== -1 ? (cols[idxName] || "").trim() : "",
      qty: (cols[idxQty] || "").trim(),
      note: idxNote !== -1 ? (cols[idxNote] || "").trim() : ""
    }));
  if (!rows.length) throw new Error("No data rows found in that file");
  return rows;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong");
  return json;
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="mvp-iconbtn" onClick={onToggle} aria-label="Toggle theme">
      {theme === "dark"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  );
}

// ─── Login (password only) ────────────────────────────────────────────────────
function MelvinLogin({ onLogin, theme, onToggleTheme }) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const json = await apiFetch("/api/auth/melvin-login", { method: "POST", body: JSON.stringify({ password, remember }) });
      onLogin(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`mvp ${theme}`}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "fixed", top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className="mvp-login-shell">
        <div className="mvp-login-card">
          <b>Beeva</b>
          <div className="mvp-login-title">Stock Received</div>
          <form onSubmit={submit}>
            <input
              type="password"
              inputMode="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              autoComplete="current-password"
            />
            <label className="mvp-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember this device for 30 days
            </label>
            <button className="mvp-submit" type="submit" disabled={loading || !password}>
              {loading ? "Checking…" : "Open"}
            </button>
            {error && <div className="mvp-status">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main portal ───────────────────────────────────────────────────────────────
function MelvinPortal({ onLogout, theme, onToggleTheme }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]); // [{ sku, name, img, qty }] — one delivery, many products
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [receipts, setReceipts] = useState(null);
  const searchTimer = useRef(null);

  const [bulkRows, setBulkRows] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (confirmDeleteId === null) return;
    const onKey = (e) => { if (e.key === "Escape") setConfirmDeleteId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDeleteId]);

  function loadReceipts() {
    apiFetch("/api/melvin/receipts").then((d) => setReceipts(d.receipts || [])).catch(() => setReceipts([]));
  }

  useEffect(() => { loadReceipts(); }, []);

  // Nothing here is saved until submit — a refresh/close mid-delivery would
  // silently drop the cart, a parsed CSV, or an in-progress edit.
  useEffect(() => {
    const hasUnsavedWork = cart.length > 0 || bulkRows.length > 0 || editingId !== null;
    if (!hasUnsavedWork) return;
    const warnBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [cart.length, bulkRows.length, editingId]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(() => {
      apiFetch(`/api/melvin/products?q=${encodeURIComponent(query)}`).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  // Sum of today's already-logged qty for a sku — used to warn before a
  // second entry for the same product on the same day (usually a double
  // scan/typo, not an intentional second delivery).
  function loggedTodayQty(sku) {
    const today = todayISO();
    return (receipts || [])
      .filter((r) => r.sku === sku && r.received_on === today)
      .reduce((sum, r) => sum + Number(r.qty), 0);
  }

  // Adding a product already in the cart just bumps its quantity, rather than
  // creating a second row for the same item.
  function addToCart(product) {
    const alreadyInCart = cart.some((it) => it.sku === product.sku);
    if (!alreadyInCart) {
      const already = loggedTodayQty(product.sku);
      if (already > 0 && !confirm(`${product.name} was already logged today (+${already}). Add another entry anyway?`)) {
        setQuery("");
        setResults([]);
        return;
      }
    }
    setCart((prev) => {
      const existing = prev.find((it) => it.sku === product.sku);
      if (existing) return prev.map((it) => it.sku === product.sku ? { ...it, qty: (Number(it.qty) || 0) + 1 } : it);
      return [...prev, { sku: product.sku, name: product.name, img: product.img, qty: 1 }];
    });
    setQuery("");
    setResults([]);
  }

  function adjustCartQty(sku, delta) {
    setCart((prev) => prev.map((it) => it.sku === sku ? { ...it, qty: Math.max(1, (Number(it.qty) || 0) + delta) } : it));
  }

  // Typing replaces the value outright (inputs auto-select on focus), so an
  // empty/partial value is allowed transiently while the user is mid-edit —
  // it's clamped back to a valid qty on blur, and again defensively at submit.
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

  function removeFromCart(sku) {
    setCart((prev) => prev.filter((it) => it.sku !== sku));
  }

  // Best-effort match against the recently-logged list (sku or exact name) —
  // a heads-up in the preview, not a block, since the row's product isn't
  // resolved against inventory until the server processes the import.
  function loggedTodayRow(row) {
    const today = todayISO();
    const sku = (row.sku || "").trim().toLowerCase();
    const name = (row.name || "").trim().toLowerCase();
    if (!sku && !name) return false;
    return (receipts || []).some((r) =>
      r.received_on === today &&
      ((sku && r.sku?.toLowerCase() === sku) || (name && r.product_name?.toLowerCase() === name))
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (!cart.length) { setStatus({ ok: false, text: "Add at least one product first" }); return; }
    setSaving(true);
    setStatus(null);
    const receivedOn = todayISO();
    const outcomes = await Promise.allSettled(cart.map((item) =>
      apiFetch("/api/melvin/receipts", {
        method: "POST",
        body: JSON.stringify({ sku: item.sku, productName: item.name, qty: Number(item.qty) || 1, receivedOn, note })
      })
    ));
    const failed = outcomes.filter((o) => o.status === "rejected");
    const succeeded = outcomes.length - failed.length;
    if (failed.length) {
      setStatus({ ok: false, text: `Logged ${succeeded} of ${outcomes.length}. ${failed.length} failed — try those again.` });
      setCart((prev) => prev.filter((_, i) => outcomes[i].status === "rejected"));
    } else {
      setStatus({ ok: true, text: `Logged ${succeeded} product${succeeded === 1 ? "" : "s"} for today` });
      setCart([]);
      setNote("");
    }
    loadReceipts();
    setSaving(false);
  }

  function requestDelete(id) {
    setConfirmDeleteId(id);
  }

  function cancelDelete() {
    setConfirmDeleteId(null);
  }

  async function confirmDelete() {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await apiFetch(`/api/melvin/receipts/${id}`, { method: "DELETE" });
      loadReceipts();
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setEditQty(String(r.qty));
    setEditNote(r.note || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function adjustEditQty(delta) {
    setEditQty((prev) => {
      const n = parseInt(prev, 10);
      return String(Math.max(1, (Number.isFinite(n) ? n : 0) + delta));
    });
  }

  async function saveEdit(id) {
    const quantity = parseInt(editQty, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setStatus({ ok: false, text: "Quantity must be a positive number" });
      return;
    }
    setEditSaving(true);
    try {
      await apiFetch(`/api/melvin/receipts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ qty: quantity, note: editNote })
      });
      setEditingId(null);
      loadReceipts();
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setEditSaving(false);
    }
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-chosen after a fix
    if (!file) return;
    setBulkResults(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setBulkRows(parseStockCSV(String(reader.result || "")));
        setBulkError("");
      } catch (err) {
        setBulkRows([]);
        setBulkError(err.message);
      }
    };
    reader.onerror = () => setBulkError("Couldn't read that file");
    reader.readAsText(file);
  }

  async function submitBulk(e) {
    e.preventDefault();
    if (!bulkRows.length || bulkSaving) return;
    setBulkSaving(true);
    setBulkResults(null);
    try {
      const json = await apiFetch("/api/melvin/receipts/bulk", {
        method: "POST",
        body: JSON.stringify({ rows: bulkRows, receivedOn: todayISO(), note: bulkNote })
      });
      setBulkResults(json);
      if (json.failed) {
        const failedLines = new Set(json.results.filter((r) => !r.ok).map((r) => r.line));
        setBulkRows((prev) => prev.filter((_, i) => failedLines.has(i + 2)));
      } else {
        setBulkRows([]);
        setBulkNote("");
      }
      loadReceipts();
    } catch (err) {
      setBulkResults({ imported: 0, failed: bulkRows.length, results: [{ line: "-", ok: false, error: err.message }] });
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div className={`mvp ${theme}`}>
      <style>{GLOBAL_CSS}</style>
      <div className="mvp-shell">
        <div className="mvp-head">
          <div className="mvp-brand"><span className="dot" /><b>Beeva &middot; Stock Received</b></div>
          <div className="mvp-headbtns">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button className="mvp-signout" onClick={onLogout}>Sign out</button>
          </div>
        </div>

        <div className="mvp-layout">
        <div className="mvp-main">
        <h1 className="mvp-title">What came in today?</h1>
        <p className="mvp-sub">Add every product from this delivery, then log it all in one go. It adds straight to Beeva&rsquo;s stock count, nothing else to update.</p>

        <form className="mvp-card" onSubmit={submit}>
          <label className="mvp-label">Add a product</label>
          <div className="mvp-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a product name…"
              autoComplete="off"
            />
            {results.length > 0 && (
              <div className="mvp-results">
                {results.map((r) => (
                  <button type="button" key={r.id} className="mvp-result" onClick={() => addToCart(r)}>
                    <div className="mvp-thumb">{r.img ? <img src={r.img} alt="" /> : "🍾"}</div>
                    <div>
                      <div className="mvp-result-name">{r.name}</div>
                      <div className="mvp-result-sub">{r.stock} in stock now</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="mvp-label" style={{ marginTop: 20 }}>
            This delivery{cart.length > 0 ? ` (${cart.length} product${cart.length === 1 ? "" : "s"})` : ""}
          </label>
          {cart.length === 0 ? (
            <div className="mvp-cart-empty">Nothing added yet — search above and tap a product.</div>
          ) : (
            <div className="mvp-cart">
              {cart.map((item) => (
                <div className="mvp-cart-row" key={item.sku}>
                  <div className="mvp-thumb">{item.img ? <img src={item.img} alt="" /> : "🍾"}</div>
                  <div className="mvp-cart-name">{item.name}</div>
                  <div className="mvp-cart-step">
                    <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustCartQty(item.sku, -1)} aria-label="Fewer">&minus;</button>
                    <input
                      className="mvp-cart-qty"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={item.qty}
                      onChange={(e) => setCartQty(item.sku, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => blurCartQty(item.sku)}
                      aria-label={`Quantity for ${item.name}`}
                    />
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
            <label className="mvp-bulk-filebtn">
              Choose CSV file
              <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} hidden />
            </label>
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
                      {loggedTodayRow(r) && <span className="mvp-bulk-dup" title="A product with this SKU/name was already logged today">already today</span>}
                      {r.qty || "—"}
                    </span>
                  </div>
                ))}
              </div>

              <label className="mvp-label" style={{ marginTop: 16 }}>Note <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optional, applies to rows without their own note)</span></label>
              <input className="mvp-note" value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder="e.g. from ABC Distributors" />

              <button className="mvp-submit" type="submit" disabled={bulkSaving} style={{ marginTop: 18 }}>
                {bulkSaving ? "Importing…" : `Import ${bulkRows.length} row${bulkRows.length === 1 ? "" : "s"}`}
              </button>
            </form>
          )}

          {bulkResults && (
            <div className="mvp-bulk-results">
              <div className={`mvp-status${bulkResults.failed ? "" : " ok"}`}>
                Imported {bulkResults.imported} of {bulkResults.imported + bulkResults.failed}
                {bulkResults.failed ? " — fix the rows below and re-import" : ""}
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
          {receipts === null && <div className="mvp-empty">Loading…</div>}
          {receipts && receipts.length === 0 && <div className="mvp-empty">Nothing logged yet. Once you log a delivery, it shows up here.</div>}
          {receipts && receipts.map((r) => (
            <div className="mvp-slip" key={r.id}>
              <div className="mvp-slip-top">
                <div className="mvp-slip-name">{r.product_name || r.sku}</div>
                {editingId === r.id ? (
                  <div className="mvp-slip-edit-qtygroup">
                    <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustEditQty(-1)} aria-label="Fewer">&minus;</button>
                    <input
                      className="mvp-slip-edit-qty"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); saveEdit(r.id); }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      aria-label="Quantity"
                      autoFocus
                    />
                    <button type="button" className="mvp-cart-stepbtn" onClick={() => adjustEditQty(1)} aria-label="More">+</button>
                  </div>
                ) : (
                  <div className="mvp-slip-qty">+{r.qty}</div>
                )}
              </div>
              <div className="mvp-slip-meta">{formatDateLabel(r.received_on)}{r.added_by ? ` · ${r.added_by}` : ""}</div>

              {editingId === r.id ? (
                <form
                  className="mvp-slip-edit"
                  onSubmit={(e) => { e.preventDefault(); saveEdit(r.id); }}
                  onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                >
                  <label className="mvp-slip-edit-notelabel" htmlFor={`edit-note-${r.id}`}>Note</label>
                  <input
                    id={`edit-note-${r.id}`}
                    className="mvp-slip-edit-note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="e.g. from ABC Distributors"
                  />
                  <div className="mvp-slip-edit-actions">
                    <button type="submit" className="mvp-slip-save" disabled={editSaving}>
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" className="mvp-slip-cancel" onClick={cancelEdit} disabled={editSaving}>Cancel</button>
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
          <div className="mvp-modal" role="alertdialog" aria-modal="true" aria-labelledby="mvp-modal-title" onClick={(e) => e.stopPropagation()}>
            <div id="mvp-modal-title" className="mvp-modal-title">Remove this entry?</div>
            <p className="mvp-modal-body">This only removes Melvin&rsquo;s logged entry — it won&rsquo;t affect what WooCommerce/Shopee/Lazada already report.</p>
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
export default function MelvinStockPortalPage() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("mvp-theme") || "light");

  useEffect(() => {
    const prev = document.title;
    document.title = "Beeva | Stock Received";
    return () => { document.title = prev; };
  }, []);

  // Point the installable-app manifest at this portal's own (start_url,
  // icon, name) while it's open, so "Add to Home Screen" installs Melvin's
  // portal specifically rather than whatever the shared app manifest points
  // to. Reverted on unmount so other portals get their own manifest back.
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    const prevHref = link?.getAttribute("href");
    if (link) link.setAttribute("href", "/stock-manifest.json");

    const metaTitle = document.createElement("meta");
    metaTitle.name = "apple-mobile-web-app-title";
    metaTitle.content = "Stock Received";
    document.head.appendChild(metaTitle);

    const metaCapable = document.createElement("meta");
    metaCapable.name = "apple-mobile-web-app-capable";
    metaCapable.content = "yes";
    document.head.appendChild(metaCapable);

    return () => {
      if (link && prevHref) link.setAttribute("href", prevHref);
      metaTitle.remove();
      metaCapable.remove();
    };
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("mvp-theme", next);
      return next;
    });
  }

  useEffect(() => {
    apiFetch("/api/auth/melvin-me")
      .then((j) => { if (j.role === "melvin") setSession(j); })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/melvin-logout", { method: "POST" });
    setSession(null);
  }

  if (!checked) return <div className={`mvp ${theme}`}><style>{GLOBAL_CSS}</style><div className="mvp-login-shell">Loading…</div></div>;
  if (!session) return <MelvinLogin onLogin={setSession} theme={theme} onToggleTheme={toggleTheme} />;
  return <MelvinPortal onLogout={logout} theme={theme} onToggleTheme={toggleTheme} />;
}
