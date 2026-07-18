// Presence-only service worker — satisfies the browser's installability
// requirement for the driver portal PWA. No caching: every request still
// hits the network so drivers always get the current build.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
