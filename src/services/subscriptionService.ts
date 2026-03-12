import { BaseService } from './baseService';
import { buildUrl } from './apiConfig';

export interface SubscriptionStatus {
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    canAccess: boolean;
    daysRemaining: number | null;
    needsPaymentSetup?: boolean;
    cancelAtPeriodEnd?: boolean;
    cancelAt?: string | null;
    pastDueSince?: string | null;
    graceRemainingDays?: number | null;
}

interface CheckoutSessionResponse {
    status: string;
    data: {
        sessionId: string;
        url: string;
    };
}

interface PortalSessionResponse {
    status: string;
    data: {
        url: string;
    };
}

interface SubscriptionStatusResponse {
    status: string;
    data: SubscriptionStatus;
}

/**
 * Service for subscription management
 */
class SubscriptionService extends BaseService {
    protected baseUrl = buildUrl('subscription');

    /**
     * Get current subscription status
     */
    async getSubscriptionStatus(): Promise<SubscriptionStatus> {
        const response = await this.fetchWithAuth<SubscriptionStatusResponse>('/status');
        if (!response?.data) {
            throw new Error('Failed to fetch subscription status');
        }
        return response.data;
    }

    /**
     * Create a Stripe Checkout session for subscription
     */
    async createCheckoutSession(): Promise<string> {
        const successUrl = `${window.location.origin}/subscription?success=true`;
        const cancelUrl = `${window.location.origin}/subscription?canceled=true`;

        const response = await this.fetchWithAuth<CheckoutSessionResponse>('/checkout', {
            method: 'POST',
            body: JSON.stringify({ successUrl, cancelUrl }),
        });

        if (!response?.data?.url) {
            throw new Error('Failed to create checkout session');
        }

        return response.data.url;
    }

    /**
     * Create a trial Checkout session with 7 days trial period
     * This is used after signup to collect payment information
     */
    async createTrialCheckoutSession(): Promise<string> {
        const successUrl = `${window.location.origin}/chat?trial_started=true`;
        const cancelUrl = `${window.location.origin}/setup-payment?canceled=true`;

        const response = await this.fetchWithAuth<CheckoutSessionResponse>('/trial-checkout', {
            method: 'POST',
            body: JSON.stringify({ successUrl, cancelUrl }),
        });

        if (!response?.data?.url) {
            throw new Error('Failed to create trial checkout session');
        }

        return response.data.url;
    }

    /**
     * Create a Customer Portal session for managing subscription
     */
    async createPortalSession(): Promise<string> {
        const returnUrl = `${window.location.origin}/subscription`;

        const response = await this.fetchWithAuth<PortalSessionResponse>('/portal', {
            method: 'POST',
            body: JSON.stringify({ returnUrl }),
        });

        if (!response?.data?.url) {
            throw new Error('Failed to create portal session');
        }

        return response.data.url;
    }

    /**
     * Redirect to Stripe Checkout
     */
    async redirectToCheckout(): Promise<void> {
        const url = await this.createCheckoutSession();
        window.location.href = url;
    }

    /**
     * Open Customer Portal in a new tab (for invoices, subscription management)
     */
    async redirectToPortal(): Promise<void> {
        const url = await this.createPortalSession();
        window.open(url, '_blank');
    }

    /**
     * Redirect to trial Checkout (for new signups)
     */
    async redirectToTrialCheckout(): Promise<void> {
        console.log('[SubscriptionService] Creating trial checkout session...');
        const url = await this.createTrialCheckoutSession();
        console.log('[SubscriptionService] Got checkout URL:', url);
        if (!url) {
            throw new Error('No checkout URL returned from server');
        }
        console.log('[SubscriptionService] Redirecting to Stripe...');
        window.location.href = url;
    }
}

export const subscriptionService = new SubscriptionService();
