// Loyalty tier config + member seed + pure tier-derivation logic. Tier
// member-counts/points are never stored as hand-maintained counters —
// pages always derive them live from `members` (see AppData selectors).
import { CUSTOMERS } from "./people.js";
import { seededRandom, randInt, randRange } from "./ids.js";

export const TIERS = [
  { name: "Cellar Member",   mult: 1.0, thresholdSpend: 0 },
  { name: "Vintner's Circle", mult: 1.5, thresholdSpend: 500 },
  { name: "Estate Reserve",  mult: 2.0, thresholdSpend: 1000 },
  { name: "Grand Cru",       mult: 2.5, thresholdSpend: 3000 },
  { name: "Maison Noir",     mult: 3.0, thresholdSpend: 5000 },
];

export function deriveTierForSpend(spend, tiers = TIERS) {
  let current = tiers[0];
  for (const tier of tiers) {
    if (spend >= tier.thresholdSpend) current = tier;
  }
  return current;
}

export function generateMembers(now = new Date()) {
  const rand = seededRandom("loyalty-seed");
  return CUSTOMERS.map((c, i) => {
    const spend13mo = Math.round(randRange(rand, 40, 6200));
    const tier = deriveTierForSpend(spend13mo);
    const pointsBalance = Math.round(spend13mo * tier.mult * randRange(rand, 0.15, 0.4));
    const expiringInDays = i % 4 === 0 ? randInt(rand, 3, 45) : null;
    const joinedDaysAgo = randInt(rand, 20, 900);
    const lastOrderDaysAgo = randInt(rand, 0, 60);
    return {
      id: `mem_${i + 1}`,
      name: c.name,
      phone: c.phone,
      tier: tier.name,
      spend13mo,
      pointsBalance,
      coinsExpiringSoon: expiringInDays !== null,
      expiringInDays,
      joinedAt: new Date(now.getTime() - joinedDaysAgo * 86400000).toISOString(),
      lastOrderAt: new Date(now.getTime() - lastOrderDaysAgo * 86400000).toISOString(),
    };
  });
}

export function generateBroadcasts(now = new Date()) {
  const templates = [
    { name: "Weekend Wine Flash Sale", channel: "Email + SMS", audience: "All members" },
    { name: "Grand Cru Early Access", channel: "Email", audience: "Grand Cru & above" },
    { name: "Birthday Voucher Drop", channel: "SMS", audience: "Birthday this month" },
    { name: "Whisky Restock Alert", channel: "WhatsApp", audience: "Bourbon & Whisky buyers" },
    { name: "Referral Double Points", channel: "Email", audience: "All members" },
  ];
  return templates.map((t, i) => {
    const sentDaysAgo = i * 3 + 2;
    const sent = randIntStatic(400, 2400, i);
    return {
      id: `bc_${i + 1}`,
      ...t,
      status: i === 0 ? "scheduled" : "sent",
      sentAt: i === 0 ? null : new Date(now.getTime() - sentDaysAgo * 86400000).toISOString(),
      stats: i === 0 ? null : { sent, opened: Math.round(sent * 0.42), clicked: Math.round(sent * 0.11) },
    };
  });
}

function randIntStatic(min, max, seedOffset) {
  const rand = seededRandom(`broadcast-${seedOffset}`);
  return Math.round(min + rand() * (max - min));
}
