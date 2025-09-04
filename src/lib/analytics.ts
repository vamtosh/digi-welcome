import { AnalyticsEvent } from './types';

interface AnalyticsData {
  [key: string]: any;
}

class Analytics {
  track(event: AnalyticsEvent, data?: AnalyticsData) {
    console.log(`📊 Analytics: ${event}`, data || {});
    
    // In a real app, this would send to your analytics provider
    // e.g., Mixpanel, Amplitude, Google Analytics
    
    // Store locally for demo purposes
    const events = JSON.parse(localStorage.getItem('analytics-events') || '[]');
    events.push({
      event,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
    });
    localStorage.setItem('analytics-events', JSON.stringify(events));
  }

  private getSessionId(): string {
    const stored = localStorage.getItem('onboarding-session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.state?.sessionId || 'unknown';
      } catch {
        return 'unknown';
      }
    }
    return 'unknown';
  }

  // Helper method to get all events for debugging
  getEvents() {
    return JSON.parse(localStorage.getItem('analytics-events') || '[]');
  }

  clearEvents() {
    localStorage.removeItem('analytics-events');
  }
}

export const analytics = new Analytics();