/* eslint-disable no-restricted-globals */

// Version du cache
const CACHE_NAME = 'dairia-ai-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  // On n'essaie plus de mettre en cache les fichiers statiques car cela peut causer des erreurs
  // si les chemins ne sont pas corrects sur Render
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  // Prendre le contrôle immédiatement
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              return caches.delete(name);
            })
        );
      })
    ])
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    
    const options = {
      body: data.options?.body || 'Nouvelle notification',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options)
    );
  } catch (error) {
    console.error('Service Worker: Error processing push event:', error);
  }
});

// Gestion du clic sur une notification
self.addEventListener('notificationclick', (event) => {  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((windowClients) => {
        // Vérifier si une fenêtre est déjà ouverte
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si aucune fenêtre n'est ouverte, en ouvrir une nouvelle
        return clients.openWindow(urlToOpen);
      })
    );
  }
});
