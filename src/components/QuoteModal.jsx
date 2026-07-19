import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check, Send, FileText, Plus, Minus } from "lucide-react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import BottleArt from "./BottleArt.jsx";

// Staff build a quote (products + quantities) for the selected inbox contact
// and send it — this posts a summary message straight into that thread.
export default function QuoteModal({ threadId, customerName, onClose }) {
  const { state, actions } = useAppData();
  const products = state.inventory.items;
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [note, setNote] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [done, setDone] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search]);

  const lines = Object.values(cart);
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);

  function setQty(product, delta) {
    setCart((prev) => {
      const cur = prev[product.sku]?.qty || 0;
      const next = cur + delta;
      const copy = { ...prev };
      if (next <= 0) delete copy[product.sku];
      else copy[product.sku] = { product, qty: next };
      return copy;
    });
  }

  function send() {
    if (!lines.length) return;
    const itemsText = lines.map((l) => `${l.qty}× ${l.product.name}`).join(", ");
    const text = `📋 Quote sent — ${itemsText} · Total ${SGD(total)}${note.trim() ? ` — "${note.trim()}"` : ""}${validUntil ? ` (valid until ${validUntil})` : ""}`;
    actions.inbox.sendMessage(threadId, text);
    setDone(true);
    setTimeout(onClose, 1100);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,6,23,0.7)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 600, maxWidth: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--rule-strong)", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--rule-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--accent-soft)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-2)" }}>
              <FileText size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Build a quote</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>For {customerName || "customer"}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flexShrink: 0 }}><X size={14} /></button>
        </div>

        {done ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: "var(--positive-soft)", color: "var(--positive)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={26} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Quote sent</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{lines.length} item{lines.length > 1 ? "s" : ""} · {SGD(total)}</div>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 20px 8px" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }} />
                <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU or category…"
                  style={{ width: "100%", boxSizing: "border-box", background: "var(--bg)", border: "1px solid var(--rule-strong)", borderRadius: 8, color: "var(--ink)", fontSize: 13, padding: "9px 30px", outline: "none", fontFamily: "inherit" }} />
                {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 0, display: "flex" }}><X size={12} /></button>}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 8px", minHeight: 160 }}>
              {filtered.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 12, padding: "28px 0", textAlign: "center" }}>No products match</p>
              ) : filtered.map((p) => {
                const qty = cart[p.sku]?.qty || 0;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", marginBottom: 8, background: qty ? "var(--accent-soft)" : "var(--bg)", border: `1px solid ${qty ? "var(--accent)" : "var(--rule-strong)"}`, borderRadius: 10 }}>
                    <BottleArt category={p.category} seed={p.sku} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "ui-monospace, Menlo, monospace", marginTop: 2 }}>{p.sku} · {SGD(p.price)}</div>
                    </div>
                    {qty > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => setQty(p, -1)} className="icon-btn" style={{ width: 26, height: 26 }}><Minus size={13} /></button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", minWidth: 16, textAlign: "center" }}>{qty}</span>
                        <button onClick={() => setQty(p, +1)} className="icon-btn" style={{ width: 26, height: 26 }}><Plus size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setQty(p, +1)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--accent-2)", background: "transparent", border: "1px solid var(--accent)", borderRadius: 7, fontFamily: "inherit" }}>
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--rule-strong)", background: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-2)" }}>{SGD(total)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)…" style={{ flex: 2, boxSizing: "border-box", background: "var(--bg)", border: "1px solid var(--rule-strong)", borderRadius: 8, color: "var(--ink)", fontSize: 12.5, padding: "8px 12px", outline: "none", fontFamily: "inherit" }} />
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} title="Valid until" style={{ flex: 1, boxSizing: "border-box", background: "var(--bg)", border: "1px solid var(--rule-strong)", borderRadius: 8, color: "var(--ink)", fontSize: 12.5, padding: "8px 10px", outline: "none", fontFamily: "inherit" }} />
              </div>
              <button className="primary" onClick={send} disabled={!lines.length} style={{ width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13 }}>
                <Send size={14} /> {lines.length ? `Send Quote · ${SGD(total)}` : "Add items to quote"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
