import { useEffect, useState } from "react";

const DEMO_MEMBERS = [
  { name: "Adrian Goh", tier: "Black Bee 3.0×", spend: "S$8,940", bal: "26,820", exp: "-" },
  { name: "Priya Nair", tier: "Queen Bee 2.5×", spend: "S$4,210", bal: "19,440", exp: "2,100 in 18d", warn: true },
  { name: "Marcus Lim", tier: "Queen Bee 2.5×", spend: "S$3,680", bal: "15,920", exp: "-" },
  { name: "Siti Rahman", tier: "General Bee 2.0×", spend: "S$2,140", bal: "11,200", exp: "980 in 24d", warn: true },
  { name: "Daniel Wong", tier: "General Bee 2.0×", spend: "S$1,920", bal: "9,640", exp: "-" },
  { name: "Joanne Tay", tier: "Soldier Bee 1.5×", spend: "S$880", bal: "5,280", exp: "640 in 11d", warn: true },
  { name: "Ravi Kumar", tier: "Soldier Bee 1.5×", spend: "S$640", bal: "3,840", exp: "-" },
  { name: "Balasubramaniam Prathap", tier: "Worker Bee 1.0×", spend: "S$238", bal: "238", exp: "-" },
  { name: "Lay - Laguna Park", tier: "Worker Bee 1.0×", spend: "S$182", bal: "182", exp: "-" },
  { name: "Chua Boon Gim", tier: "Worker Bee 1.0×", spend: "S$135", bal: "135", exp: "-" }
];

// Tier cards: presentation config + demo fallback counts. Live member counts and
// outstanding points come from summary.tiers[name] when authenticated.
const TIERS_UI = [
  { name: "Worker Bee",  cls: "worker",  mult: "1.0×", fill: "none",     stroke: "#5a4d28", mltColor: "#8C8266", thr: "Free join",      bday: "S$10 worth",  entry: "None",     raf: "Not eligible", demoM: "2,841", demoP: "412,300" },
  { name: "Soldier Bee", cls: "soldier", mult: "1.5×", fill: "none",     stroke: "#7a6a3a", mltColor: "#C9BFA6", thr: "S$500+ spend",   bday: "S$20 worth",  entry: "500 pts",  raf: "Not eligible", demoM: "684",   demoP: "298,140" },
  { name: "General Bee", cls: "general", mult: "2.0×", fill: "none",     stroke: "#C8870A", mltColor: "#F5B51C", thr: "S$1,000+ spend", bday: "S$50 worth",  entry: "1000 pts", raf: "0.25x mlt",    demoM: "227",   demoP: "241,860" },
  { name: "Queen Bee",   cls: "queen",   mult: "2.5×", fill: "#F5B51C",  stroke: "#FFCD4D", mltColor: "#1a1304", thr: "S$3,000+ spend", bday: "S$100 worth", entry: "3000 pts", raf: "0.5x mlt",     demoM: "63",    demoP: "128,420" },
  { name: "Black Bee",   cls: "black",   mult: "3.0×", fill: "#0c0a05",  stroke: "#FFCD4D", mltColor: "#FFCD4D", thr: "S$5,000+ spend", bday: "S$300 worth", entry: "5000 pts", raf: "0.75x mlt",    demoM: "19",    demoP: "47,720" }
];

const FeedIcon = ({ kind }) => {
  const common = { viewBox: "0 0 24 24", fill: "none", strokeWidth: 2 };
  if (kind === "heart")  return <svg {...common} stroke="#F5B51C"><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" /></svg>;
  if (kind === "clock")  return <svg {...common} stroke="#4FD08A"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (kind === "star")   return <svg {...common} stroke="#F5B51C"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.3 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8z" /></svg>;
  return <svg {...common} stroke="#4FD08A"><path d="M3 11l16-7v16L3 13z" /></svg>;
};

export default function LoyaltyPage() {
  const [summary, setSummary] = useState(null);
  const [filterTier, setFilterTier] = useState(null);
  const [sortCol, setSortCol] = useState("bal");
  const [sortAsc, setSortAsc] = useState(false);
  useEffect(() => {
    fetch("/api/loyalty")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSummary(d))
      .catch(() => {});
  }, []);

  const fmtN = (n) => (n != null ? Math.round(n).toLocaleString("en-SG") : "—");
  const tierStat = (name) => summary?.tiers?.[name] || null;

  const members = summary?.members?.length
    ? summary.members.map((m) => ({
        name:  m.name,
        tier:  `${m.tier.name} ${m.tier.mult.toFixed(1)}×`,
        spend: `S$${fmtN(m.spend)}`,
        bal:   fmtN(m.balance),
        exp:   m.coinsExpiringSoon > 0 ? `${fmtN(m.coinsExpiringSoon)} in ${m.expiringInDays}d` : "-",
        warn:  m.coinsExpiringSoon > 0
      }))
    : DEMO_MEMBERS;

  const liability = summary ? `S$${fmtN(summary.liability)}` : "S$11,284";

  const TIER_RANK = { "Worker Bee": 1, "Soldier Bee": 2, "General Bee": 3, "Queen Bee": 4, "Black Bee": 5 };
  const parseNum = (s) => parseFloat(String(s).replace(/[S$,]/g, "")) || 0;
  const parseExp = (s) => { const m = String(s).match(/[\d,]+/); return m ? parseFloat(m[0].replace(/,/g, "")) : 0; };
  const tierRank = (t) => TIER_RANK[Object.keys(TIER_RANK).find((k) => t.startsWith(k))] || 0;

  const filtered = filterTier ? members.filter((m) => m.tier.startsWith(filterTier)) : members;
  const visibleMembers = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortCol === "name")  { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else if (sortCol === "tier")  { av = tierRank(a.tier); bv = tierRank(b.tier); }
    else if (sortCol === "spend") { av = parseNum(a.spend); bv = parseNum(b.spend); }
    else if (sortCol === "bal")   { av = parseNum(a.bal);   bv = parseNum(b.bal); }
    else if (sortCol === "exp")   { av = parseExp(a.exp);   bv = parseExp(b.exp); }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  // RAF tracker — real this-month referrals when authenticated.
  const raf     = summary?.referrals;
  const rafN    = raf ? raf.count : 41;
  const rafCoins = raf ? fmtN(raf.coins) : "1,025";
  const rafPct  = raf ? Math.min(100, Math.round((raf.count / 60) * 100)) : 68;

  // Automation feed — derived from real signals when authenticated.
  const feed = [];
  if (summary) {
    if (summary.birthdays7d > 0)
      feed.push({ icon: "heart", t: <><b>Birthday vouchers</b> credited to {summary.birthdays7d} member{summary.birthdays7d === 1 ? "" : "s"}</>, m: "Last 7 days · automatic coin credit" });
    if (summary.expiring?.members > 0)
      feed.push({ icon: "clock", t: <><b>Expiry warning</b> — {summary.expiring.members} member{summary.expiring.members === 1 ? "" : "s"} with coins expiring soon</>, m: `${fmtN(summary.expiring.coins)} pts at risk within 30 days` });
    if (summary.referrals?.count > 0)
      feed.push({ icon: "star", t: <><b>Refer-a-Friend</b> — {summary.referrals.count} successful referral{summary.referrals.count === 1 ? "" : "s"} this month</>, m: `${fmtN(summary.referrals.coins)} coins awarded` });
    if (summary.totalPending > 0)
      feed.push({ icon: "send", t: <><b>{fmtN(summary.totalPending)} coins pending</b> review or auto-credit</>, m: "Credited on review or after the 14-day grace window" });
  }

  return (
    <section className="panel active" id="loyalty">
      <div className="panel-head">
        <div>
          <h2>Beeva Coins Club</h2>
          <div className="sub">1 point per SGD 1 &times; tier multiplier &middot; 100 points = SGD 1 &middot; points expire 24 months, month-end</div>
        </div>
        <div className="right-note">
          Total points liability<br />
          <b>{liability}</b> outstanding
        </div>
      </div>

      <div className="tier-grid">
        {TIERS_UI.map((t) => {
          const stat = tierStat(t.name);
          return (
            <div
              className={`tier-card ${t.cls}${filterTier === t.name ? " tier-card-active" : ""}`}
              key={t.name}
              onClick={() => setFilterTier(filterTier === t.name ? null : t.name)}
              style={{ cursor: "pointer" }}
            >
              <div className="tier-hex">
                <svg viewBox="0 0 46 52">
                  <path d="M23 1 L45 14 L45 38 L23 51 L1 38 L1 14 Z" fill={t.fill} stroke={t.stroke} strokeWidth="2" />
                </svg>
                <span className="mlt" style={{ color: t.mltColor }}>{t.mult}</span>
              </div>
              <div className="tn">{t.name}</div>
              <div className="thr">{t.thr}</div>
              <div className="mc">{summary ? fmtN(stat?.members || 0) : t.demoM}</div>
              <div className="mcl">members</div>
              <div className="pts">{summary ? `${fmtN(stat?.points || 0)} pts` : `${t.demoP} pts`}</div>

              <div className="tier-details" style={{ marginTop: "12px", borderTop: "1px solid var(--line-soft)", paddingTop: "8px", textAlign: "left", fontSize: "10.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span className="dim">Bday Voucher:</span>
                  <span className="strong" style={{ color: "var(--cream)" }}>{t.bday}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span className="dim">Entry Reward:</span>
                  <span className="strong" style={{ color: "var(--cream)" }}>{t.entry}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="dim">RAF Bonus:</span>
                  <span className="strong" style={{ color: "var(--cream)" }}>{t.raf}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="loy-label">
        <span>Members{filterTier ? ` · ${filterTier}` : ""}</span>
        <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{visibleMembers.length}</span>
        <span className="loy-sort-badge">
          {{ name: "Name", tier: "Tier", spend: "Spend", bal: "Points", exp: "Expiring" }[sortCol]}
          {" "}{sortAsc ? "↑" : "↓"}
        </span>
        {filterTier && (
          <button className="fchip" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setFilterTier(null)}>
            Clear ×
          </button>
        )}
      </div>

      <div className="loy-grid">
        <div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    { key: "name",  label: "Member"       },
                    { key: "tier",  label: "Tier"          },
                    { key: "spend", label: "13-mo Spend"   },
                    { key: "bal",   label: "Points Bal"    },
                    { key: "exp",   label: "Expiring Soon" },
                  ].map(({ key, label }) => {
                    const isActive = sortCol === key;
                    return (
                      <th
                        key={key}
                        className={`loy-th${isActive ? " loy-th-active" : ""}`}
                        onClick={() => sortCol === key ? setSortAsc(!sortAsc) : (setSortCol(key), setSortAsc(false))}
                        title={`Sort by ${label}`}
                      >
                        <span className="loy-th-inner">
                          {label}
                          <span className={`sort-ico${isActive ? " sort-ico-on" : ""}`}>
                            {isActive
                              ? sortAsc
                                ? <svg viewBox="0 0 8 10" width="8" height="9"><path d="M4 1L8 8H0Z" fill="currentColor"/></svg>
                                : <svg viewBox="0 0 8 10" width="8" height="9"><path d="M4 9L8 2H0Z" fill="currentColor"/></svg>
                              : <svg viewBox="0 0 8 12" width="8" height="10"><path d="M4 1L7.5 5.5H0.5Z M4 11L7.5 6.5H0.5Z" fill="currentColor"/></svg>
                            }
                          </span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((m, idx) => {
                  let pillStyle = { background: "rgba(200,170,80,0.12)", color: "#C9BFA6" };
                  if (m.tier.includes("Black")) {
                    pillStyle = { background: "#0c0a05", color: "#FFCD4D", border: "1px solid #4a4030" };
                  } else if (m.tier.includes("Queen")) {
                    pillStyle = { background: "rgba(245,181,28,0.12)", color: "#F5B51C" };
                  } else if (m.tier.includes("General")) {
                    pillStyle = { background: "rgba(245,181,28,0.10)", color: "#F5B51C" };
                  }

                  return (
                    <tr key={idx}>
                      <td><span className="strong">{m.name}</span></td>
                      <td><span className="pill" style={pillStyle}>{m.tier}</span></td>
                      <td className="mono">{m.spend}</td>
                      <td className="mono" style={{ color: "var(--honey-2)" }}>{m.bal}</td>
                      <td>
                        {m.warn
                          ? <span style={{ color: "var(--orange)", fontFamily: "var(--mono)", fontSize: "12px" }}>{m.exp}</span>
                          : <span className="dim">{m.exp}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="raf-card card">
            <div className="rh">Refer-a-Friend Tracker</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>"Share the Buzz" referral programme, this month</div>
            <div className="raf-stat">
              <span className="n">{rafN}</span>
              <span className="l">successful referrals</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--serif)", fontSize: "18px", color: "var(--cream)" }}>{rafCoins}</span>
              <span className="l">coins awarded</span>
            </div>
            <div className="raf-bar">
              <i style={{ width: `${rafPct}%` }} />
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
              {rafPct}% to the 60-referral monthly milestone
            </div>
          </div>
        </div>

        <div className="card auto-feed">
          <div className="af-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4FD08A" strokeWidth="2" style={{ width: "18px", height: "18px" }}>
              <path d="M4 4v6h6M20 20v-6h-6" />
              <path d="M20 9a8 8 0 00-14-3M4 15a8 8 0 0014 3" />
            </svg>
            Automation Feed
          </div>

          {summary ? (
            feed.length === 0
              ? <div className="af-row"><div className="af-main"><div className="m">No recent automation activity</div></div></div>
              : feed.map((f, idx) => (
                  <div className="af-row" key={idx}>
                    <div className={`af-ico ${f.icon === "heart" || f.icon === "star" ? "honey" : ""}`}><FeedIcon kind={f.icon} /></div>
                    <div className="af-main">
                      <div className="t">{f.t}</div>
                      <div className="m">{f.m}</div>
                    </div>
                  </div>
                ))
          ) : (
            <>
              <div className="af-row">
                <div className="af-ico honey"><FeedIcon kind="heart" /></div>
                <div className="af-main"><div className="t"><b>Birthday voucher</b> sent to 4 members</div><div className="m">Today, 6:30 AM &middot; S$5 coin credit each &middot; WhatsApp</div></div>
              </div>
              <div className="af-row">
                <div className="af-ico"><FeedIcon kind="clock" /></div>
                <div className="af-main"><div className="t"><b>60-day expiry warning</b> queued for 12 members</div><div className="m">Sends 8 Jun &middot; total 18,200 pts at risk &middot; Email + WhatsApp</div></div>
              </div>
              <div className="af-row">
                <div className="af-ico honey"><FeedIcon kind="star" /></div>
                <div className="af-main"><div className="t"><b>Tier upgrade</b> - 2 members reached Queen Bee</div><div className="m">Yesterday &middot; auto welcome + 2.5&times; multiplier applied</div></div>
              </div>
              <div className="af-row">
                <div className="af-ico"><FeedIcon kind="send" /></div>
                <div className="af-main"><div className="t"><b>Win-back nudge</b> sent to 23 lapsed members</div><div className="m">No order in 90 days &middot; double-coin offer &middot; WhatsApp</div></div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
