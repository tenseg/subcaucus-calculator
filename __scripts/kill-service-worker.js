// see https://blog.hackages.io/migrating-a-service-worker-from-an-old-domain-to-your-new-domain-69236418051c

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', () => {
	self.registration.unregister();
});
