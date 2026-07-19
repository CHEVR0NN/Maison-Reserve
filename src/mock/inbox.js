import { CUSTOMERS } from "./people.js";
import { seededRandom, randInt } from "./ids.js";

const OPENERS = [
  "Hi, is the Hennessy VSOP back in stock?",
  "Can I get a quote for a mixed case of red wine?",
  "Do you deliver to Sentosa on weekends?",
  "What's my current Reserve Points balance?",
  "Looking for a gift bundle under $150, any recommendations?",
  "My order MR-10241 hasn't arrived yet, any update?",
  "Do you carry Macallan 18yo?",
  "Can I change my delivery address for today's order?",
];

export function generateThreads(now = new Date()) {
  const rand = seededRandom("inbox-seed");
  return CUSTOMERS.slice(0, 14).map((c, i) => {
    const opener = OPENERS[i % OPENERS.length];
    const minutesAgo = randInt(rand, 4, 2600);
    const lastMessageAt = new Date(now.getTime() - minutesAgo * 60000).toISOString();
    const messages = [
      { id: `msg_${i}_1`, from: "customer", text: opener, at: lastMessageAt, attachments: [] },
    ];
    if (i % 3 !== 0) {
      messages.push({
        id: `msg_${i}_2`, from: "staff",
        text: "Thanks for reaching out — let me check that for you now.",
        at: new Date(new Date(lastMessageAt).getTime() + 4 * 60000).toISOString(),
        attachments: [],
      });
    }
    return {
      id: `thread_${i + 1}`,
      customerName: c.name,
      channel: i % 4 === 0 ? "WhatsApp" : i % 4 === 1 ? "Instagram" : "Web Chat",
      lastMessageAt: messages[messages.length - 1].at,
      unread: i % 3 === 0,
      messages,
    };
  }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}
