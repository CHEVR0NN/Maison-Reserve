import { useEffect, useState } from "react";

// Broadcast SENDING + delivery/read analytics require a connected messaging
// channel (WhatsApp/Email), which isn't integrated yet — so those figures can't
// be shown as live. What IS real is the addressable audience, pulled live from
// the Beeva Coins Club. In demo mode (no auth) the illustrative campaign set below
// is shown instead.
const DEMO_CAMPAIGNS = [
  { dd: "14", mm: "Jun", name: "Father's Day Whisky Drop", seg: "General, Queen & Black Bee · past spirits buyers · 1,840 recipients", channels: ["wa", "em"], status: "Scheduled", statusClass: "sched" },
  { dd: "06", mm: "Jun", name: "66 Mid-Year Mega Sale - recap blast", seg: "all active members · cart abandoners priority · 3,610 recipients", channels: ["wa"], status: "Sent · 86% read", statusClass: "sent" },
  { dd: "10", mm: "Jun", name: "Euro 2026 Beer Bundles", seg: "beer & mixer buyers · West + East zones · 2,240 recipients", channels: ["wa", "em"], status: "Scheduled", statusClass: "sched" },
  { dd: "18", mm: "Jun", name: "Champagne & Bubbly Restock", seg: "Moet & bundle buyers · Queen + Black Bee · 410 recipients", channels: ["em"], status: "Draft", statusClass: "draft" },
  { dd: "02", mm: "Jun", name: "Tonic & Mixer Top-Up Reminder", seg: "repeat gin + tonic buyers · 45-day cycle · 720 recipients", channels: ["wa"], status: "Sent · 79% read", statusClass: "sent" }
];

export default function BroadcastsPage() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    fetch("/api/loyalty")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSummary(d))
      .catch(() => {});
  }, []);

  const fmtN = (n) => (n != null ? Math.round(n).toLocaleString("en-SG") : "—");
  const live = Boolean(summary);
  const highValue = summary ? (summary.tiers?.["Queen Bee"]?.members || 0) + (summary.tiers?.["Black Bee"]?.members || 0) : 0;

  return (
    <section className="panel active" id="broadcasts">
      <div className="panel-head">
        <div>
          <h2>Broadcasts</h2>
          <div className="sub">Audience segments pulled live from the Coins Club &middot; WhatsApp &amp; Email sending connect separately</div>
        </div>
        <div className="right-note">
          Addressable audience<br />
          <b>{live ? fmtN(summary.totalMembers) : "3,610"}</b> members
        </div>
      </div>

      <div className="bc-strip">
        {live ? (
          <>
            <div className="card bc-stat">
              <div className="l">Addressable Members</div>
              <div className="v">{fmtN(summary.totalMembers)}</div>
              <div className="s">Beeva Coins Club total</div>
            </div>
            <div className="card bc-stat">
              <div className="l">High-Value Segment</div>
              <div className="v honey">{fmtN(highValue)}</div>
              <div className="s">Queen + Black Bee</div>
            </div>
            <div className="card bc-stat">
              <div className="l">Coins Liability</div>
              <div className="v honey">S${fmtN(summary.liability)}</div>
              <div className="s">outstanding coin value</div>
            </div>
            <div className="card bc-stat">
              <div className="l">Expiring Soon</div>
              <div className="v">{fmtN(summary.expiring?.members || 0)}</div>
              <div className="s">{fmtN(summary.expiring?.coins || 0)} pts within 30 days &middot; prime win-back target</div>
            </div>
          </>
        ) : (
          <>
            <div className="card bc-stat"><div className="l">Messages Sent (7d)</div><div className="v">9,640</div><div className="s">WhatsApp 6,210 &middot; Email 3,430</div></div>
            <div className="card bc-stat"><div className="l">Read Rate</div><div className="v honey">71%</div><div className="s">WhatsApp 84% &middot; Email 41%</div></div>
            <div className="card bc-stat"><div className="l">Orders Attributed</div><div className="v">186</div><div className="s">from broadcast links this week</div></div>
            <div className="card bc-stat"><div className="l">Revenue Attributed</div><div className="v honey">S$31,720</div><div className="s">S$170 avg per attributed order</div></div>
          </>
        )}
      </div>

      <div className="section-label">Campaign Calendar</div>

      {live ? (
        <div className="callout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <div className="ct">
            Broadcast <b>sending and delivery/read analytics</b> activate once a WhatsApp or Email channel is connected in Admin. Until then, use the <b>live audience segments</b> above to plan who to target — the figures are real, from the Coins Club.
          </div>
        </div>
      ) : (
        <div className="camp-list">
          {DEMO_CAMPAIGNS.map((c, idx) => (
            <div className="camp" key={idx}>
              <div className="camp-date">
                <div className="dd">{c.dd}</div>
                <div className="mm">{c.mm}</div>
              </div>
              <div className="camp-main">
                <div className="nm">{c.name}</div>
                <div className="seg"><b>Segment:</b> {c.seg}</div>
              </div>
              <div className="camp-meta">
                <div className="chan-chips">
                  {c.channels.includes("wa") && (
                    <span className="cc wa">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.4A10 10 0 1012 2z" />
                      </svg>
                      WhatsApp
                    </span>
                  )}
                  {c.channels.includes("em") && <span className="cc em">Email</span>}
                </div>
                <span className={`bc-status ${c.statusClass}`}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
