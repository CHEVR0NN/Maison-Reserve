import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Phone, Mail, Search, X, Sparkles, FileText } from "lucide-react";
import RecommendModal from "../components/RecommendModal.jsx";
import QuoteModal from "../components/QuoteModal.jsx";
import { useAppData } from "../context/AppData.jsx";

const CHANNEL_META = {
  WhatsApp: { icon: <Phone size={11} />, color: "#25d366" },
  Instagram: { icon: <MessageCircle size={11} />, color: "#C77FB0" },
  "Web Chat": { icon: <Mail size={11} />, color: "var(--cabernet-2)" },
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
  const palette = ["#FFC300", "#7C2C40", "#283B6B", "#703525", "#C9960A", "#6E6553", "#A6455C", "#4A5A3E"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

function ThreadAvatar({ name, size = 36 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: avatarColor(name), color: "#fff", fontSize: size > 36 ? 13 : 12, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
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
    <div className="inbox-shell">
      <aside className="inbox-list-pane">
        <div className="inbox-list-head">
          <div className="inbox-list-title-row">
            <span className="inbox-list-title">Inbox</span>
            {unreadCount > 0 && <span className="inbox-unread-badge">{unreadCount}</span>}
          </div>
          <div className="inbox-search-wrap">
            <Search size={12} className="inbox-search-icon" />
            <input
              className="inbox-search-input"
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or message…"
              aria-label="Search conversations"
            />
            {search && (
              <button type="button" className="inbox-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="inbox-thread-scroll">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={28} strokeWidth={1.3} />
              <b>{search ? "No matching conversations" : "No conversations yet"}</b>
              <span>{search ? `Nothing matches "${search}" — try a different name or keyword.` : "New customer messages will show up here as they come in."}</span>
            </div>
          ) : filtered.map((t) => {
            const isActive = selectedId === t.id;
            const last = t.messages[t.messages.length - 1];
            const ch = CHANNEL_META[t.channel] || { icon: <MessageCircle size={11} />, color: "var(--ink-3)" };
            return (
              <button
                type="button"
                key={t.id}
                className={`inbox-thread-row${isActive ? " active" : ""}`}
                onClick={() => openThread(t)}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="inbox-thread-body">
                  <ThreadAvatar name={t.customerName} />
                  <div className="inbox-thread-main">
                    <div className="inbox-thread-top-row">
                      <span className={`inbox-thread-name${t.unread ? " unread" : ""}`}>{t.customerName}</span>
                      <span className="inbox-thread-time">{timeLabel(t.lastMessageAt)}</span>
                    </div>
                    <div className="inbox-thread-preview-row">
                      <span className="inbox-thread-channel-icon" style={{ color: ch.color }}>{ch.icon}</span>
                      <span className={`inbox-thread-preview${t.unread ? " unread" : ""}`}>{last?.text || "—"}</span>
                      {t.unread && <span className="inbox-unread-dot" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="inbox-thread-pane">
        {!selected ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <MessageCircle size={40} strokeWidth={1.2} />
            <b>Select a conversation</b>
            <span>Pick a thread from the list to view messages and reply.</span>
          </div>
        ) : (
          <>
            <div className="inbox-header">
              <div className="inbox-header-id">
                <ThreadAvatar name={selected.customerName} size={38} />
                <div style={{ minWidth: 0 }}>
                  <div className="inbox-header-name">{selected.customerName}</div>
                  <div className="inbox-header-channel">
                    <span style={{ color: selectedChannel.color }}>{selectedChannel.icon}</span>
                    <span style={{ color: selectedChannel.color, fontWeight: 500 }}>{selected.channel}</span>
                  </div>
                </div>
              </div>
              <div className="inbox-header-actions">
                <button type="button" className="inbox-action-btn" onClick={() => setShowRecommend(true)} title="Recommend a product">
                  <Sparkles size={13} /> Recommend
                </button>
                <button type="button" className="inbox-action-btn" onClick={() => setShowQuote(true)} title="Build a quote">
                  <FileText size={13} /> Quote
                </button>
              </div>
            </div>

            <div ref={threadRef} className="inbox-messages">
              {groupedMessages.map((item, i) => {
                if (item.isSep) {
                  return (
                    <div key={`s${i}`} className="inbox-date-sep">
                      <div className="inbox-date-sep-line" />
                      <span className="inbox-date-sep-label">{item.label}</span>
                      <div className="inbox-date-sep-line" />
                    </div>
                  );
                }
                const msg = item.msg;
                const isOut = msg.from === "staff";
                return (
                  <div key={msg.id} className={`inbox-msg-row ${isOut ? "out" : "in"}`}>
                    <div title={new Date(msg.at).toLocaleString("en-SG")} className={`inbox-bubble${isOut ? " out" : ""}`}>
                      <div className="inbox-bubble-text">{msg.text}</div>
                      <div className="inbox-bubble-time">{timeLabel(msg.at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="inbox-composer">
              <div className="inbox-composer-row">
                <textarea
                  className="inbox-textarea"
                  value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Write a reply…" rows={3}
                  aria-label="Reply message"
                />
                <button className="primary" onClick={sendReply} disabled={!reply.trim()} style={{ height: 44, flexShrink: 0 }}>
                  <Send size={13} /> Send
                </button>
              </div>
              <div className="inbox-composer-hint">Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        )}
      </div>

      {showRecommend && selected && <RecommendModal threadId={selected.id} customerName={selected.customerName} onClose={() => setShowRecommend(false)} />}
      {showQuote && selected && <QuoteModal threadId={selected.id} customerName={selected.customerName} onClose={() => setShowQuote(false)} />}
    </div>
  );
}
