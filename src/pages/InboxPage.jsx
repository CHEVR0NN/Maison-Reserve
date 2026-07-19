import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Phone, Mail, Search, X, Sparkles, FileText } from "lucide-react";
import RecommendModal from "../components/RecommendModal.jsx";
import QuoteModal from "../components/QuoteModal.jsx";
import { useAppData } from "../context/AppData.jsx";

const CHANNEL_META = {
  WhatsApp: { icon: <Phone size={11} />, color: "#25d366" },
  Instagram: { icon: <MessageCircle size={11} />, color: "#e879f9" },
  "Web Chat": { icon: <Mail size={11} />, color: "#6366f1" },
};

function timeLabel(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMins = Math.floor((Date.now() - d) / 60000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

function dateSeparator(iso) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
}

function initials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
}

function avatarColor(name = "") {
  const palette = ["#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#14b8a6"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

export default function InboxPage() {
  const { state, actions } = useAppData();
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [showRecommend, setShowRecommend] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const threadRef = useRef(null);

  const threads = state.inbox.threads;
  const selected = threads.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [selected?.messages?.length]);

  function openThread(thread) {
    setSelectedId(thread.id);
    if (thread.unread) actions.inbox.markRead(thread.id);
  }

  function sendReply() {
    if (!reply.trim() || !selected) return;
    actions.inbox.sendMessage(selected.id, reply.trim());
    setReply("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  }

  const filtered = threads.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const last = t.messages[t.messages.length - 1]?.text || "";
    return t.customerName.toLowerCase().includes(q) || last.toLowerCase().includes(q);
  });

  const unreadCount = threads.filter((t) => t.unread).length;

  const groupedMessages = [];
  let lastDate = null;
  (selected?.messages || []).forEach((msg) => {
    const sep = dateSeparator(msg.at);
    if (sep !== lastDate) { groupedMessages.push({ isSep: true, label: sep }); lastDate = sep; }
    groupedMessages.push({ isSep: false, msg });
  });

  const selectedChannel = selected ? (CHANNEL_META[selected.channel] || { icon: <MessageCircle size={11} />, color: "var(--ink-3)" }) : null;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--bg)" }}>
      <aside style={{ width: 300, minWidth: 260, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--rule-strong)", background: "var(--surface)" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--rule-strong)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Inbox</span>
            {unreadCount > 0 && <span style={{ background: "#6366f1", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px", lineHeight: "16px" }}>{unreadCount}</span>}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or message…"
              style={{ width: "100%", boxSizing: "border-box", background: "var(--bg)", border: "1px solid var(--rule-strong)", borderRadius: 6, color: "var(--ink-2)", fontSize: 12, padding: "7px 28px", outline: "none", fontFamily: "inherit" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 0, display: "flex" }}><X size={11} /></button>}
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "24px 14px", color: "var(--muted)", fontSize: 12, textAlign: "center" }}>{search ? "No results" : "No conversations yet"}</p>
          ) : filtered.map((t) => {
            const isActive = selectedId === t.id;
            const last = t.messages[t.messages.length - 1];
            const ch = CHANNEL_META[t.channel] || { icon: <MessageCircle size={11} />, color: "var(--ink-3)" };
            return (
              <div key={t.id} onClick={() => openThread(t)} style={{
                padding: "11px 14px", cursor: "pointer", borderBottom: "1px solid var(--rule)",
                background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
                borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent", transition: "background 0.1s",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: avatarColor(t.customerName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                    {initials(t.customerName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: t.unread ? 700 : 500, color: t.unread ? "var(--ink)" : "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.customerName}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{timeLabel(t.lastMessageAt)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <span style={{ color: ch.color, display: "flex", flexShrink: 0, opacity: 0.8 }}>{ch.icon}</span>
                      <span style={{ fontSize: 11, color: t.unread ? "var(--ink-3)" : "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{last?.text || "—"}</span>
                      {t.unread && <span style={{ flexShrink: 0, minWidth: 8, height: 8, borderRadius: 99, background: "#6366f1" }} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--rule-strong)" }}>
            <MessageCircle size={40} strokeWidth={1.2} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Select a conversation</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--rule-strong)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: avatarColor(selected.customerName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {initials(selected.customerName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.customerName}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ color: selectedChannel.color, display: "flex" }}>{selectedChannel.icon}</span>
                    <span style={{ color: selectedChannel.color, fontWeight: 500 }}>{selected.channel}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setShowRecommend(true)} title="Recommend a product" style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--accent-2)", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 7, fontFamily: "inherit" }}>
                  <Sparkles size={13} /> Recommend
                </button>
                <button onClick={() => setShowQuote(true)} title="Build a quote" style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--accent-2)", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 7, fontFamily: "inherit" }}>
                  <FileText size={13} /> Quote
                </button>
              </div>
            </div>

            <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 3 }}>
              {groupedMessages.map((item, i) => {
                if (item.isSep) {
                  return (
                    <div key={`s${i}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 8px" }}>
                      <div style={{ flex: 1, height: 1, background: "var(--rule-strong)" }} />
                      <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{item.label}</span>
                      <div style={{ flex: 1, height: 1, background: "var(--rule-strong)" }} />
                    </div>
                  );
                }
                const msg = item.msg;
                const isOut = msg.from === "staff";
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isOut ? "flex-end" : "flex-start", marginBottom: 1 }}>
                    <div title={new Date(msg.at).toLocaleString("en-SG")} style={{ maxWidth: "68%", padding: "9px 14px", borderRadius: isOut ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isOut ? "#6366f1" : "var(--surface-2)", color: isOut ? "#fff" : "var(--ink-2)", fontSize: 13, lineHeight: 1.55, wordBreak: "break-word" }}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: isOut ? "right" : "left" }}>{timeLabel(msg.at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--rule-strong)", background: "var(--surface)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Write a reply…" rows={3}
                  style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--rule-strong)", borderRadius: 8, color: "var(--ink)", fontSize: 13, padding: "9px 12px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }}
                />
                <button className="primary" onClick={sendReply} disabled={!reply.trim()} style={{ height: 44, padding: "0 18px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexShrink: 0 }}>
                  <Send size={13} /> Send
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "var(--muted)" }}>Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        )}
      </div>

      {showRecommend && selected && <RecommendModal threadId={selected.id} customerName={selected.customerName} onClose={() => setShowRecommend(false)} />}
      {showQuote && selected && <QuoteModal threadId={selected.id} customerName={selected.customerName} onClose={() => setShowQuote(false)} />}
    </div>
  );
}
