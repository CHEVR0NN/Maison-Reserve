import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check, Send, Sparkles } from "lucide-react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import BottleArt from "./BottleArt.jsx";

export default function RecommendModal({ threadId, customerName, onClose }) {
  const { state, actions } = useAppData();
  const products = state.inventory.items;
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [note, setNote] = useState("");
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

  function send() {
    if (!picked) return;
    const text = `✨ Recommended: ${picked.name} (${SGD(picked.price)})${note.trim() ? ` — "${note.trim()}"` : ""}`;
    actions.inbox.sendMessage(threadId, text);
    setDone(true);
    setTimeout(onClose, 1100);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(16,11,4,0.7)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", maxHeight: "86vh", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--rule-strong)", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--rule-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--accent-soft)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-2)" }}>
              <Sparkles size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Recommend a product</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>To {customerName || "customer"}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ flexShrink: 0 }}><X size={14} /></button>
        </div>

        {done ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px", background: "var(--positive-soft)", color: "var(--positive)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={26} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Recommendation sent</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{picked?.name}</div>
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

            <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 8px", minHeight: 180 }}>
              {filtered.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 12, padding: "28px 0", textAlign: "center" }}>No products match</p>
              ) : filtered.map((p) => {
                const isPicked = picked?.sku === p.sku;
                return (
                  <button key={p.id} onClick={() => setPicked(p)} style={{
                    width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", marginBottom: 8, background: isPicked ? "var(--accent-soft)" : "var(--bg)",
                    border: `1px solid ${isPicked ? "var(--accent)" : "var(--rule-strong)"}`, borderRadius: 10, transition: "border-color .1s, background .1s",
                  }}>
                    <BottleArt category={p.category} seed={p.sku} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "ui-monospace, Menlo, monospace", marginTop: 2 }}>{p.sku} · {p.category}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-2)", flexShrink: 0 }}>{SGD(p.price)}</div>
                    {isPicked && <Check size={15} style={{ color: "var(--accent-2)", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--rule-strong)", background: "var(--surface)" }}>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a short note for the customer (optional)…"
                style={{ width: "100%", boxSizing: "border-box", marginBottom: 10, background: "var(--bg)", border: "1px solid var(--rule-strong)", borderRadius: 8, color: "var(--ink)", fontSize: 12.5, padding: "8px 12px", outline: "none", fontFamily: "inherit" }} />
              <button className="primary block" onClick={send} disabled={!picked}>
                <Send size={14} /> {picked ? `Recommend ${picked.name.length > 26 ? picked.name.slice(0, 26) + "…" : picked.name}` : "Select a product"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
