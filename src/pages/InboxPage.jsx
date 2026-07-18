import { useEffect, useRef, useState } from "react";
import { Send, RefreshCw, MessageCircle, Phone, Mail, Instagram, Facebook, Search, X, Wifi, Sparkles, FileText } from "lucide-react";
import RecommendModal from "../components/RecommendModal.jsx";
import QuoteModal from "../components/QuoteModal.jsx";

// Map GHL raw type codes → { label, icon, color }
function getChannelMeta(raw = "") {
  const t = String(raw).toUpperCase();
  if (t.includes("SMS") || t.includes("PHONE"))      return { icon: <Phone size={11} />,       color: "#10b981", label: "SMS" };
  if (t.includes("EMAIL"))                            return { icon: <Mail size={11} />,         color: "#6366f1", label: "Email" };
  if (t.includes("INSTAGRAM"))                        return { icon: <Instagram size={11} />,    color: "#e879f9", label: "Instagram" };
  if (t.includes("FACEBOOK") || t.includes("FB"))    return { icon: <Facebook size={11} />,     color: "#3b82f6", label: "Facebook" };
  if (t.includes("LIVE_CHAT") || t.includes("CHAT")) return { icon: <Wifi size={11} />,         color: "#f59e0b", label: "Live Chat" };
  if (t.includes("WHATSAPP"))                        return { icon: <Phone size={11} />,        color: "#25d366", label: "WhatsApp" };
  if (raw)                                            return { icon: <MessageCircle size={11}/>, color: "var(--ink-3)",   label: "Direct" };
  return                                               { icon: <MessageCircle size={11}/>, color: "var(--ink-3)",   label: "Direct" };
}

function timeLabel(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);
  if (diffMins < 2)   return "Just now";
  if (diffMins < 60)  return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)   return `${diffDays}d`;
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

function fullTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-SG", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
  });
}

function dateSeparator(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
}

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
}

function avatarColor(name = "") {
  const palette = ["#6366f1","#8b5cf6","#f59e0b","#10b981","#3b82f6","#ef4444","#ec4899","#14b8a6"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [reply, setReply]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [cursor, setCursor]               = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError]                 = useState(null);
  const [sendError, setSendError]         = useState(null);
  const [search, setSearch]               = useState("");
  const [showRecommend, setShowRecommend] = useState(false);
  const [showQuote, setShowQuote]         = useState(false);
  const threadRef  = useRef(null);
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  async function loadConversations() {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setConversations(data.conversations || []);
      setCursor(data.nextCursor || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/inbox?startAfterDate=${encodeURIComponent(cursor)}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const incoming = data.conversations || [];
      setConversations(prev => {
        const seen = new Set(prev.map(c => c.id || c.conversationId));
        return [...prev, ...incoming.filter(c => !seen.has(c.id || c.conversationId))];
      });
      setCursor(data.nextCursor || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadMessages(conv) {
    const convId = conv?.id || conv?.conversationId;
    if (!convId) return;
    setSelected({ ...conv, _resolvedId: convId });
    setMessages([]);
    setLoadingThread(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/inbox/${convId}/messages`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      const msgs = data.messages;
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      setSendError(e.message);
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/inbox/${selected._resolvedId || selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim(), contactId: selected.contactId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setReply("");
      await loadMessages(selected);
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!selected) return;
    const timer = setInterval(() => {
      if (selectedRef.current) loadMessages(selectedRef.current);
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._resolvedId]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  }

  const filtered = conversations.filter(conv => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (conv.contactName || conv.fullName || "").toLowerCase();
    const last = String(conv.lastMessage || conv.lastMessageBody || "").toLowerCase();
    return name.includes(q) || last.includes(q);
  });

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

  const sortedMessages = [...messages].sort((a, b) =>
    new Date(a.dateAdded || a.createdAt || 0) - new Date(b.dateAdded || b.createdAt || 0)
  );
  const groupedMessages = [];
  let lastDate = null;
  for (const msg of sortedMessages) {
    const sep = dateSeparator(msg.dateAdded || msg.createdAt);
    if (sep && sep !== lastDate) {
      groupedMessages.push({ isSep: true, label: sep });
      lastDate = sep;
    }
    groupedMessages.push({ isSep: false, msg });
  }

  const selectedName    = selected ? (selected.contactName || selected.fullName || "Unknown") : "";
  const selectedChannel = selected
    ? getChannelMeta(selected.lastMessageType || selected.type || selected.channel)
    : { icon: null, color: "var(--ink-3)", label: "" };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 300, minWidth: 260, flexShrink: 0,
        display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--rule-strong)", background: "var(--surface)"
      }}>

        {/* Sidebar header */}
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--rule-strong)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Inbox</span>
              {unreadCount > 0 && (
                <span style={{
                  background: "#6366f1", color: "#fff", borderRadius: 99,
                  fontSize: 10, fontWeight: 700, padding: "1px 7px", lineHeight: "16px"
                }}>{unreadCount}</span>
              )}
            </div>
            <button className="icon-btn" onClick={loadConversations} disabled={loadingList} title="Refresh">
              <RefreshCw size={13} className={loadingList ? "spin" : ""} />
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <Search size={12} style={{
              position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
              color: "var(--ink-3)", pointerEvents: "none"
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or message…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "var(--bg)", border: "1px solid var(--rule-strong)",
                borderRadius: 6, color: "var(--ink-2)", fontSize: 12,
                padding: "7px 28px 7px 28px", outline: "none", fontFamily: "inherit"
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 0, display: "flex" }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loadingList ? (
            <div style={{ padding: "16px 14px" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, opacity: 0.35 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 4, marginBottom: 7, width: "55%" }} />
                    <div style={{ height: 9,  background: "var(--surface-2)", borderRadius: 4, width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: "16px 14px" }}>
              <p style={{ color: "var(--negative)", fontSize: 12, margin: "0 0 10px" }}>⚠ {error}</p>
              <button className="primary" onClick={loadConversations} style={{ fontSize: 11, padding: "5px 14px" }}>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ padding: "24px 14px", color: "var(--muted)", fontSize: 12, textAlign: "center" }}>
              {search ? "No results" : "No conversations yet"}
            </p>
          ) : filtered.map(conv => {
            const name     = conv.contactName || conv.fullName || "Unknown";
            const isActive = selected?._resolvedId === (conv.id || conv.conversationId);
            const hasUnread = conv.unreadCount > 0;
            const ch       = getChannelMeta(conv.lastMessageType || conv.type || conv.channel);
            return (
              <div
                key={conv.id || conv.conversationId}
                onClick={() => loadMessages(conv)}
                style={{
                  padding: "11px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--rule)",
                  background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
                  transition: "background 0.1s"
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: avatarColor(name),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "#fff"
                  }}>
                    {initials(name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 4 }}>
                      <span style={{
                        fontSize: 12, fontWeight: hasUnread ? 700 : 500,
                        color: hasUnread ? "var(--ink)" : "var(--ink-3)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>{name}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
                        {timeLabel(conv.lastMessageDate || conv.dateUpdated)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <span style={{ color: ch.color, display: "flex", flexShrink: 0, opacity: 0.8 }}>{ch.icon}</span>
                      <span style={{
                        fontSize: 11, color: hasUnread ? "var(--ink-3)" : "var(--muted)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1
                      }}>
                        {String(conv.lastMessage || conv.lastMessageBody || "—")}
                      </span>
                      {hasUnread && (
                        <span style={{
                          flexShrink: 0, minWidth: 18, textAlign: "center",
                          background: "#6366f1", color: "#fff",
                          borderRadius: 99, fontSize: 10, padding: "1px 5px", fontWeight: 700
                        }}>{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {cursor && !loadingList && (
            <div style={{ padding: "12px 14px", textAlign: "center" }}>
              <button
                className="primary"
                onClick={loadMore}
                disabled={loadingMore}
                style={{ fontSize: 11, padding: "6px 16px" }}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Thread ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--rule-strong)" }}>
            <MessageCircle size={40} strokeWidth={1.2} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div style={{
              padding: "12px 20px", borderBottom: "1px solid var(--rule-strong)",
              background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: avatarColor(selectedName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff"
                }}>
                  {initials(selectedName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ color: selectedChannel.color, display: "flex" }}>{selectedChannel.icon}</span>
                    <span style={{ color: selectedChannel.color, fontWeight: 500 }}>{selectedChannel.label}</span>
                    {selected.email && <><span>·</span><span style={{ color: "var(--ink-3)" }}>{selected.email}</span></>}
                    {selected.phone && <><span>·</span><span style={{ color: "var(--ink-3)" }}>{selected.phone}</span></>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setShowRecommend(true)}
                  title="Recommend a product"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: "var(--accent-2)", background: "var(--accent-soft)",
                    border: "1px solid var(--accent)", borderRadius: 7, fontFamily: "inherit"
                  }}
                >
                  <Sparkles size={13} /> Recommend
                </button>
                <button
                  onClick={() => setShowQuote(true)}
                  title="Build a quote"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: "var(--accent-2)", background: "var(--accent-soft)",
                    border: "1px solid var(--accent)", borderRadius: 7, fontFamily: "inherit"
                  }}
                >
                  <FileText size={13} /> Quote
                </button>
                <button
                  className="icon-btn"
                  onClick={() => loadMessages(selected)}
                  disabled={loadingThread}
                  title="Refresh"
                >
                  <RefreshCw size={13} className={loadingThread ? "spin" : ""} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={threadRef}
              style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 3 }}
            >
              {loadingThread ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: i % 2 ? "flex-end" : "flex-start" }}>
                      <div style={{ height: 34, borderRadius: 12, background: "var(--surface-2)", width: `${100 + (i * 47) % 120}px` }} />
                    </div>
                  ))}
                </div>
              ) : groupedMessages.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>No messages yet</p>
                </div>
              ) : groupedMessages.map((item, i) => {
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
                const isOut = msg.direction === "outbound";
                const rawBody = msg.body || msg.message || msg.text || "";
                const body = typeof rawBody === "string" ? rawBody : "";
                if (!body) return null;
                return (
                  <div key={msg.id || i} style={{ display: "flex", justifyContent: isOut ? "flex-end" : "flex-start", marginBottom: 1 }}>
                    <div
                      title={fullTime(msg.dateAdded || msg.createdAt)}
                      style={{
                        maxWidth: "68%",
                        padding: "9px 14px",
                        borderRadius: isOut ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isOut ? "#6366f1" : "var(--surface-2)",
                        color: isOut ? "#fff" : "var(--ink-2)",
                        fontSize: 13, lineHeight: 1.55, wordBreak: "break-word"
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap" }}>{body}</div>
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: isOut ? "right" : "left" }}>
                        {timeLabel(msg.dateAdded || msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply box */}
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--rule-strong)", background: "var(--surface)" }}>
              {sendError && (
                <div style={{
                  marginBottom: 10, padding: "8px 12px", borderRadius: 6,
                  background: "var(--negative-soft)", border: "1px solid var(--negative)",
                  fontSize: 12, color: "var(--negative)", display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <span>{sendError}</span>
                  <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", color: "var(--negative)", cursor: "pointer", padding: 0, display: "flex" }}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a reply…"
                  rows={3}
                  style={{
                    flex: 1, background: "var(--bg)",
                    border: "1px solid var(--rule-strong)",
                    borderRadius: 8, color: "var(--ink)", fontSize: 13,
                    padding: "9px 12px", resize: "none", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5
                  }}
                />
                <button
                  className="primary"
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  style={{ height: 44, padding: "0 18px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexShrink: 0 }}
                >
                  <Send size={13} />
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>Enter to send · Shift+Enter for new line</span>
                {reply.length > 0 && (
                  <span style={{ fontSize: 10, color: reply.length > 160 ? "#f59e0b" : "var(--muted)" }}>
                    {reply.length} chars
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showRecommend && selected && (
        <RecommendModal
          contact={{
            contactId: selected.contactId,
            name:      selectedName,
            email:     selected.email,
            phone:     selected.phone
          }}
          onClose={() => setShowRecommend(false)}
        />
      )}

      {showQuote && selected && (
        <QuoteModal
          contact={{
            contactId: selected.contactId,
            name:      selectedName,
            email:     selected.email,
            phone:     selected.phone
          }}
          onClose={() => setShowQuote(false)}
        />
      )}
    </div>
  );
}
