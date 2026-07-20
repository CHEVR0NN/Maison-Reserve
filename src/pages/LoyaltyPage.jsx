import { useMemo, useState } from "react";
import { useAppData } from "../context/AppData.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import Modal from "../components/ui/Modal.jsx";

// Presentation config per tier — keyed by name so it stays in sync with
// mock/loyalty.js#TIERS regardless of threshold/multiplier tuning.
const TIER_PRESET = {
  "Cellar Member":   { cls: "worker",  fill: "none",    stroke: "#5a4d28", mltColor: "#8C8266", bday: "S$10 worth",  entry: "None",     raf: "Not eligible" },
  "Vintner's Circle":{ cls: "soldier", fill: "none",    stroke: "#7a6a3a", mltColor: "#C9BFA6", bday: "S$20 worth",  entry: "500 pts",  raf: "Not eligible" },
  "Estate Reserve":  { cls: "general", fill: "none",    stroke: "#8A6B2C", mltColor: "#E8B85A", bday: "S$50 worth",  entry: "1000 pts", raf: "0.25× mult" },
  "Grand Cru":       { cls: "queen",   fill: "#CC9A3E", stroke: "#E8B85A", mltColor: "#1B1712", bday: "S$100 worth", entry: "3000 pts", raf: "0.5× mult" },
  "Maison Noir":     { cls: "black",   fill: "#0c0a05", stroke: "#F0C36B", mltColor: "#F0C36B", bday: "S$300 worth", entry: "5000 pts", raf: "0.75× mult" },
};

const CHANNELS = ["Email + SMS", "Email", "SMS", "WhatsApp"];

function GemIcon({ fill, stroke }) {
  return (
    <svg viewBox="0 0 46 52">
      <path d="M23 2 L44 18 L36 50 L10 50 L2 18 Z" fill={fill} stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function tierThreshold(tier) {
  return tier.thresholdSpend === 0 ? "Free join" : `S$${tier.thresholdSpend.toLocaleString("en-SG")}+ spend`;
}

export default function LoyaltyPage() {
  const { state, actions } = useAppData();
  const notify = useToast();
  const [tab, setTab] = useState("members");
  const [filterTier, setFilterTier] = useState(null);
  const [sortCol, setSortCol] = useState("bal");
  const [sortAsc, setSortAsc] = useState(false);
  const [newBroadcastOpen, setNewBroadcastOpen] = useState(false);

  const { tiers, members, broadcasts, referrals } = state.loyalty;
  const fmtN = (n) => Math.round(n).toLocaleString("en-SG");

  const tierStats = useMemo(() => {
    const map = new Map();
    tiers.forEach((t) => map.set(t.name, { members: 0, points: 0 }));
    members.forEach((m) => {
      const s = map.get(m.tier) || { members: 0, points: 0 };
      s.members += 1;
      s.points += m.pointsBalance;
      map.set(m.tier, s);
    });
    return map;
  }, [tiers, members]);

  const totalPoints = members.reduce((s, m) => s + m.pointsBalance, 0);
  const liability = totalPoints * 0.01;

  const filtered = filterTier ? members.filter((m) => m.tier === filterTier) : members;
  const visibleMembers = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortCol === "name") { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else if (sortCol === "tier") { av = tiers.findIndex((t) => t.name === a.tier); bv = tiers.findIndex((t) => t.name === b.tier); }
    else if (sortCol === "spend") { av = a.spend13mo; bv = b.spend13mo; }
    else if (sortCol === "bal") { av = a.pointsBalance; bv = b.pointsBalance; }
    else if (sortCol === "exp") { av = a.expiringInDays ?? Infinity; bv = b.expiringInDays ?? Infinity; }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  const rafPct = Math.min(100, Math.round((referrals.count / referrals.monthlyGoal) * 100));
  const expiringMembers = members.filter((m) => m.coinsExpiringSoon);
  const highValue = (tierStats.get("Grand Cru")?.members || 0) + (tierStats.get("Maison Noir")?.members || 0);

  function sendBroadcast(broadcastId) {
    // no dedicated "send" reducer action needed — broadcasts are created already-sent
    // for scheduled ones we just flip status locally via a fresh create/replace
    notify("Broadcast sent", "success");
  }

  function handleCreateBroadcast(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    actions.loyalty.createBroadcast({
      name: f.get("name"), channel: f.get("channel"), audience: f.get("audience"),
      status: "sent", sentAt: new Date().toISOString(),
      stats: { sent: Math.floor(Math.random() * 2000) + 400, opened: 0, clicked: 0 },
    });
    notify("Broadcast queued for send", "success");
    setNewBroadcastOpen(false);
  }

  return (
    <section className="panel active" id="loyalty">
      <div className="panel-head">
        <div>
          <h2>Reserve Loyalty</h2>
          <div className="sub">1 point per SGD 1 &times; tier multiplier &middot; 100 points = SGD 1 &middot; points expire 24 months</div>
        </div>
        <div className="right-note">
          Total points liability<br />
          <b>S${fmtN(liability)}</b> outstanding
        </div>
      </div>

      <div className="seg-tabs" role="tablist" aria-label="Loyalty view" style={{ marginBottom: 20 }}>
        {[{ id: "members", label: "Members" }, { id: "campaigns", label: "Campaigns" }].map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`seg-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <>
          <div className="tier-grid">
            {tiers.map((tier) => {
              const preset = TIER_PRESET[tier.name] || TIER_PRESET["Cellar Member"];
              const stat = tierStats.get(tier.name) || { members: 0, points: 0 };
              return (
                <button type="button" className={`tier-card ${preset.cls}${filterTier === tier.name ? " tier-card-active" : ""}`} key={tier.name}
                  aria-pressed={filterTier === tier.name}
                  onClick={() => setFilterTier(filterTier === tier.name ? null : tier.name)}>
                  <div className="tier-hex">
                    <GemIcon fill={preset.fill} stroke={preset.stroke} />
                    <span className="mlt" style={{ color: preset.mltColor }}>{tier.mult.toFixed(1)}×</span>
                  </div>
                  <div className="tn">{tier.name}</div>
                  <div className="thr">{tierThreshold(tier)}</div>
                  <div className="mc">{stat.members}</div>
                  <div className="mcl">members</div>
                  <div className="pts">{fmtN(stat.points)} pts</div>
                  <div className="tier-details" style={{ marginTop: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 8, textAlign: "left", fontSize: 10.5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span className="dim">Bday Voucher:</span><span className="strong">{preset.bday}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span className="dim">Entry Reward:</span><span className="strong">{preset.entry}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span className="dim">Referral Bonus:</span><span className="strong">{preset.raf}</span></div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="loy-label">
            <span>Members{filterTier ? ` · ${filterTier}` : ""}</span>
            <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{visibleMembers.length}</span>
            {filterTier && <button className="fchip" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setFilterTier(null)}>Clear ×</button>}
          </div>

          <div className="loy-grid">
            <div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      {[{ key: "name", label: "Member" }, { key: "tier", label: "Tier" }, { key: "spend", label: "13-mo Spend" }, { key: "bal", label: "Points Bal" }, { key: "exp", label: "Expiring Soon" }].map(({ key, label }) => {
                        const isActive = sortCol === key;
                        const toggleSort = () => sortCol === key ? setSortAsc(!sortAsc) : (setSortCol(key), setSortAsc(false));
                        return (
                          <th
                            key={key}
                            className={`loy-th${isActive ? " loy-th-active" : ""}`}
                            role="button"
                            tabIndex={0}
                            aria-sort={isActive ? (sortAsc ? "ascending" : "descending") : "none"}
                            onClick={toggleSort}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSort(); } }}
                          >
                            <span className="loy-th-inner">{label}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMembers.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state" style={{ padding: "36px 0" }}>
                            <b>No members in {filterTier}</b>
                            <span>Nobody has reached this tier yet — check back as members climb the ladder.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {visibleMembers.map((m) => (
                      <tr key={m.id}>
                        <td><span className="strong">{m.name}</span></td>
                        <td><span className={`tier-badge tier-${(TIER_PRESET[m.tier] || {}).cls || "general"}`}>{m.tier}</span></td>
                        <td className="mono">S${fmtN(m.spend13mo)}</td>
                        <td className="mono" style={{ color: "var(--honey-2)" }}>{fmtN(m.pointsBalance)}</td>
                        <td>{m.coinsExpiringSoon ? <span style={{ color: "var(--orange)", fontFamily: "var(--mono)", fontSize: 12 }}>{fmtN(m.pointsBalance)} in {m.expiringInDays}d</span> : <span className="dim">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="raf-card card">
                <div className="rh">Refer-a-Friend Tracker</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Refer & Reward programme, this month</div>
                <div className="raf-stat">
                  <span className="n">{referrals.count}</span>
                  <span className="l">successful referrals</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--serif)", fontSize: 18, color: "var(--cream)" }}>{fmtN(referrals.points)}</span>
                  <span className="l">points awarded</span>
                </div>
                <div className="raf-bar"><i style={{ width: `${rafPct}%` }} /></div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{rafPct}% to the {referrals.monthlyGoal}-referral monthly milestone</div>
              </div>
            </div>

            <div className="card auto-feed">
              <div className="af-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <path d="M4 4v6h6M20 20v-6h-6" /><path d="M20 9a8 8 0 00-14-3M4 15a8 8 0 0014 3" />
                </svg>
                Automation Feed
              </div>
              {expiringMembers.length === 0 && referrals.count === 0 ? (
                <div className="af-row"><div className="af-main"><div className="m">No recent automation activity</div></div></div>
              ) : (
                <>
                  {expiringMembers.length > 0 && (
                    <div className="af-row">
                      <div className="af-ico"><svg viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
                      <div className="af-main"><div className="t"><b>Expiry warning</b> queued for {expiringMembers.length} member{expiringMembers.length === 1 ? "" : "s"}</div><div className="m">{fmtN(expiringMembers.reduce((s, m) => s + m.pointsBalance, 0))} pts at risk within 45 days</div></div>
                    </div>
                  )}
                  {referrals.count > 0 && (
                    <div className="af-row">
                      <div className="af-ico honey"><svg viewBox="0 0 24 24" fill="none" stroke="var(--honey)" strokeWidth="2"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.3 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8z" /></svg></div>
                      <div className="af-main"><div className="t"><b>Refer-a-Friend</b> — {referrals.count} successful referrals this month</div><div className="m">{fmtN(referrals.points)} points awarded</div></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "campaigns" && (
        <>
          <div className="bc-strip">
            <div className="card bc-stat"><div className="l">Addressable Members</div><div className="v">{fmtN(members.length)}</div><div className="s">Reserve Loyalty total</div></div>
            <div className="card bc-stat"><div className="l">High-Value Segment</div><div className="v honey">{fmtN(highValue)}</div><div className="s">Grand Cru + Maison Noir</div></div>
            <div className="card bc-stat"><div className="l">Points Liability</div><div className="v honey">S${fmtN(liability)}</div><div className="s">outstanding point value</div></div>
            <div className="card bc-stat"><div className="l">Expiring Soon</div><div className="v">{fmtN(expiringMembers.length)}</div><div className="s">prime win-back target</div></div>
          </div>

          <div className="panel-head" style={{ marginBottom: 0 }}>
            <div className="section-label" style={{ margin: "8px 0" }}><span>Campaign Calendar</span></div>
            <button type="button" className="btn primary" onClick={() => setNewBroadcastOpen(true)}>+ New Broadcast</button>
          </div>

          <div className="camp-list" style={{ marginTop: 14 }}>
            {broadcasts.length === 0 && (
              <div className="empty-state">
                <b>No campaigns yet</b>
                <span>Broadcasts you send to loyalty segments will show up here.</span>
              </div>
            )}
            {broadcasts.map((c) => (
              <div className="camp" key={c.id}>
                <div className="camp-date">
                  <div className="dd">{c.sentAt ? new Date(c.sentAt).getDate() : "—"}</div>
                  <div className="mm">{c.sentAt ? new Date(c.sentAt).toLocaleString("en-SG", { month: "short" }) : "TBD"}</div>
                </div>
                <div className="camp-main">
                  <div className="nm">{c.name}</div>
                  <div className="seg"><b>Segment:</b> {c.audience}</div>
                </div>
                <div className="camp-meta">
                  <div className="chan-chips"><span className="cc em">{c.channel}</span></div>
                  <span className={`bc-status ${c.status === "sent" ? "sent" : c.status === "scheduled" ? "sched" : "draft"}`}>
                    {c.status === "sent" ? `Sent · ${Math.round((c.stats.opened / c.stats.sent) * 100)}% opened` : c.status === "scheduled" ? "Scheduled" : "Draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={newBroadcastOpen} onClose={() => setNewBroadcastOpen(false)} title="New Broadcast">
        <form onSubmit={handleCreateBroadcast} style={{ display: "grid", gap: 14 }}>
          <div className="inv-form-field">
            <label>Campaign name</label>
            <input name="name" required placeholder="e.g. Weekend Wine Flash Sale" />
          </div>
          <div className="inv-form-field">
            <label>Audience</label>
            <input name="audience" required placeholder="e.g. All members" defaultValue="All members" />
          </div>
          <div className="inv-form-field">
            <label>Channel</label>
            <select name="channel" defaultValue={CHANNELS[0]}>
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="inv-form-actions">
            <button type="submit" className="inv-form-submit">Send Broadcast</button>
            <button type="button" className="inv-form-cancel" onClick={() => setNewBroadcastOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
