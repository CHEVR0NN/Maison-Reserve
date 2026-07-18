export function generateChannels(now = new Date()) {
  return [
    {
      id: "own-site", label: "Maison Reserve — Own Site", status: "connected",
      lastSyncAt: new Date(now.getTime() - 6 * 60000).toISOString(),
      metrics: { ordersToday: 18, revenueToday: 2140, syncHealth: "healthy" },
    },
    {
      id: "lazada", label: "Lazada", status: "connected",
      lastSyncAt: new Date(now.getTime() - 22 * 60000).toISOString(),
      metrics: { ordersToday: 9, revenueToday: 860, syncHealth: "healthy" },
    },
    {
      id: "shopee", label: "Shopee", status: "attention",
      lastSyncAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      metrics: { ordersToday: 4, revenueToday: 310, syncHealth: "delayed" },
    },
  ];
}
