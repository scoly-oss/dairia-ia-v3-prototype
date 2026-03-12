import { buildUrl } from './apiConfig';
import { BaseService } from './baseService';

class NotificationService extends BaseService {
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSubscribing = false;

  protected baseUrl = buildUrl('notifications');

  private async fetchWithNotificationService<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
      const result = await super.fetchWithAuth<T>(path, options);
      return result as T;
    } catch (error) {
      console.error('Notification service fetch error:', error);
      throw error;
    }
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Ce navigateur ne supporte pas les notifications.');
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Ce navigateur ne supporte pas les notifications.');
    }
    return await Notification.requestPermission();
  }

  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker non supporté par ce navigateur.');
    }

    try {
      // S'assurer qu'on a la permission avant de continuer
      const permission = await this.getPermissionStatus();
      if (permission !== 'granted') {
        throw new Error('Permission de notification non accordée');
      }

      // Si on n'a pas la clé VAPID, on ne peut pas continuer
      if (!this.vapidPublicKey) {
        throw new Error('Clé VAPID manquante');
      }

      // Vérifier si le service worker est déjà enregistré
      const existingRegistration = await navigator.serviceWorker.getRegistration('/service-worker.js');
      if (existingRegistration) {
        this.swRegistration = existingRegistration;
        console.log('Service Worker déjà enregistré');
      } else {
        // Enregistrer le nouveau service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        // Attendre que le Service Worker soit activé
        if (registration.installing) {
          console.log('Service Worker en cours d\'installation...');
          await new Promise<void>((resolve) => {
            registration.installing?.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') {
                console.log('Service Worker activé');
                resolve();
              }
            });
          });
        }
        
        this.swRegistration = registration;
        console.log('Service Worker enregistré avec succès');
      }

      // Attendre un court instant pour s'assurer que le Service Worker est bien activé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Souscrire aux notifications push
      await this.subscribeToPushNotifications();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      throw error;
    }
  }

  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker non enregistré');
    }

    // Éviter les souscriptions multiples simultanées
    if (this.isSubscribing) {
      console.log('Souscription déjà en cours...');
      return;
    }

    this.isSubscribing = true;

    try {
      // Vérifier s'il existe déjà une souscription dans le navigateur
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Désinscription de l\'ancienne souscription du navigateur...');
        await existingSubscription.unsubscribe();
      }

      // Créer une nouvelle souscription
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!)
      });

      console.log('Souscription créée:', subscription);

      // Envoyer la souscription au serveur avec le token d'authentification
      await this.fetchWithNotificationService<void>('subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });

      console.log('Souscription enregistrée sur le serveur');
    } catch (error) {
      console.error('Erreur lors de la souscription aux notifications push:', error);
      throw error;
    } finally {
      this.isSubscribing = false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker non enregistré');
    }

    const defaultOptions: NotificationOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    };

    await this.swRegistration.showNotification(title, defaultOptions);
  }
}

export const notificationService = new NotificationService();