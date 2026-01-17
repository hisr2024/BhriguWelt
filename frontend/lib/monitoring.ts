/**
 * Production-Grade Monitoring Service
 * Supports multiple monitoring providers (Datadog, Sentry, Custom)
 * Provides comprehensive tracking for events, errors, and performance
 */

interface MonitoringConfig {
  enableDatadog?: boolean;
  enableSentry?: boolean;
  enableConsole?: boolean;
  environment?: string;
  serviceName?: string;
  version?: string;
}

interface EventProperties {
  [key: string]: any;
}

interface ErrorContext {
  [key: string]: any;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit?: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;
  private config: MonitoringConfig;
  private sessionId: string;
  private startTime: number;

  private constructor() {
    this.config = {
      enableDatadog: Boolean(
        process.env.NEXT_PUBLIC_DATADOG_APP_ID &&
          process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN
      ),
      enableSentry: true, // Already integrated
      enableConsole: process.env.NODE_ENV === 'development',
      environment: process.env.NODE_ENV || 'development',
      serviceName: 'bhriguwelt-frontend',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize monitoring services
   */
  init(customConfig?: Partial<MonitoringConfig>): void {
    if (this.initialized) return;

    if (typeof window === 'undefined') return; // Only run in browser

    this.config = { ...this.config, ...customConfig };

    try {
      // Initialize Datadog RUM if configured
      if (this.config.enableDatadog && this.isDatadogConfigured()) {
        this.initDatadog();
      }

      // Sentry is already initialized via @sentry/nextjs config
      if (this.config.enableSentry) {
        this.initSentryContext();
      }

      this.initialized = true;
      this.trackEvent('monitoring_initialized', {
        providers: {
          datadog: this.config.enableDatadog && this.isDatadogConfigured(),
          sentry: this.config.enableSentry,
        },
        version: this.config.version,
      });
    } catch (error) {
      console.error('Monitoring initialization failed:', error);
    }
  }

  /**
   * Check if Datadog is properly configured
   */
  private isDatadogConfigured(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_DATADOG_APP_ID &&
      process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN
    );
  }

  /**
   * Initialize Datadog RUM (if package is available)
   */
  private initDatadog(): void {
    // Initialize Datadog RUM if enabled
    if (this.config.enableConsole) {
      console.log('[Monitoring] Datadog RUM initialization starting');
    }

    try {
      import('@datadog/browser-rum').then(({ datadogRum }) => {
        datadogRum.init({
          applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID!,
          clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
          site: process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com',
          service: this.config.serviceName || 'bhriguwelt-frontend',
          env: this.config.environment || 'development',
          version: this.config.version || '1.0.0',
          sessionSampleRate: 100,
          sessionReplaySampleRate: process.env.NODE_ENV === 'production' ? 20 : 100,
          trackUserInteractions: true,
          trackResources: true,
          trackLongTasks: true,
          defaultPrivacyLevel: 'mask-user-input',
        });

        if (this.config.enableConsole) {
          console.log('[Monitoring] Datadog RUM initialized');
        }
      }).catch((error) => {
        console.warn('[Monitoring] Datadog initialization failed:', error);
      });
    } catch (error) {
      console.error('[Monitoring] Datadog initialization error:', error);
    }
  }

  /**
   * Initialize Sentry context
   */
  private initSentryContext(): void {
    try {
      // Sentry is already initialized via @sentry/nextjs
      // We just set additional context
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;
        Sentry.setContext('app', {
          version: this.config.version,
          environment: this.config.environment,
          sessionId: this.sessionId,
        });
      }
    } catch (error) {
      console.error('[Monitoring] Sentry context setup failed:', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: EventProperties): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.init();
    }

    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      environment: this.config.environment,
    };

    // Console logging for development
    if (this.config.enableConsole) {
      console.log(`[Event] ${eventName}`, enrichedProperties);
    }

    // Send to Datadog (if available)
    if (this.config.enableDatadog && typeof window !== 'undefined') {
      try {
        import('@datadog/browser-rum').then(({ datadogRum }) => {
          datadogRum.addAction(eventName, enrichedProperties);
        }).catch(() => {
          // Silently fail if Datadog is not available
        });
      } catch (error) {
        // Silently fail if Datadog is not available
      }
    }

    // Send to Sentry breadcrumb
    if (this.config.enableSentry && typeof window !== 'undefined') {
      try {
        if ((window as any).Sentry) {
          (window as any).Sentry.addBreadcrumb({
            category: 'custom-event',
            message: eventName,
            level: 'info',
            data: enrichedProperties,
          });
        }
      } catch (error) {
        // Silently fail
      }
    }

    // Store in local analytics (privacy-first)
    this.storeLocalEvent(eventName, enrichedProperties);
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: ErrorContext): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.init();
    }

    const enrichedContext = {
      ...context,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      environment: this.config.environment,
    };

    // Console logging
    if (this.config.enableConsole) {
      console.error(`[Error] ${error.message}`, { error, context: enrichedContext });
    }

    // Send to Datadog (if available)
    if (this.config.enableDatadog && typeof window !== 'undefined') {
      try {
        // TODO: Uncomment when @datadog/browser-rum is installed
        // const { datadogRum } = await import('@datadog/browser-rum');
        // datadogRum.addError(error, enrichedContext);
      } catch (e) {
        // Silently fail
      }
    }

    // Send to Sentry
    if (this.config.enableSentry && typeof window !== 'undefined') {
      try {
        if ((window as any).Sentry) {
          (window as any).Sentry.captureException(error, {
            extra: enrichedContext,
          });
        }
      } catch (e) {
        // Silently fail
      }
    }

    // Store locally
    this.storeLocalEvent('error', {
      message: error.message,
      stack: error.stack,
      ...enrichedContext,
    });
  }

  /**
   * Track a performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.init();
    }

    const enrichedMetric = {
      ...metric,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    // Console logging
    if (this.config.enableConsole) {
      console.log(
        `[Performance] ${metric.name}: ${metric.value}${metric.unit || ''}`,
        metric.tags
      );
    }

    // Send to Datadog (if available)
    if (this.config.enableDatadog && typeof window !== 'undefined') {
      try {
        // TODO: Uncomment when @datadog/browser-rum is installed
        // const { datadogRum } = await import('@datadog/browser-rum');
        // datadogRum.addTiming(metric.name, metric.value);
      } catch (error) {
        // Silently fail
      }
    }

    // Track as custom event
    this.trackEvent('performance_metric', enrichedMetric);
  }

  /**
   * Store event in local analytics (privacy-first)
   */
  private storeLocalEvent(eventName: string, properties: any): void {
    try {
      // Import local analytics if available
      import('./analytics')
        .then((module) => {
          if (module.trackEvent) {
            module.trackEvent(
              'custom',
              'app',
              eventName,
              {
                metadata: properties,
              }
            );
          }
        })
        .catch(() => {
          // Local analytics not available, skip
        });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Start a performance trace
   */
  startPerformanceTrace(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance({
        name,
        value: Math.round(duration),
        unit: 'ms',
      });
    };
  }

  /**
   * Track user journey step
   */
  trackUserJourney(step: string, metadata?: Record<string, any>): void {
    this.trackEvent('user_journey', {
      step,
      ...metadata,
    });
  }

  /**
   * Track profile creation
   */
  trackProfileCreation(
    duration: number,
    success: boolean,
    retryCount: number,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('profile_creation_attempted', {
      duration,
      success,
      retryCount,
      ...metadata,
    });
  }

  /**
   * Track prediction generation
   */
  trackPredictionGeneration(
    category: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('prediction_generated', {
      category,
      duration,
      success,
      ...metadata,
    });
  }

  /**
   * Track export action
   */
  trackExport(
    action: 'pdf' | 'share' | 'print',
    category: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('content_exported', {
      action,
      category,
      ...metadata,
    });
  }

  /**
   * Track API call
   */
  trackApiCall(
    endpoint: string,
    duration: number,
    success: boolean,
    statusCode?: number,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('api_call', {
      endpoint,
      duration,
      success,
      statusCode,
      ...metadata,
    });
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata?: Record<string, any>): void {
    this.trackEvent('page_view', {
      page,
      ...metadata,
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, target: string, metadata?: Record<string, any>): void {
    this.trackEvent('user_engagement', {
      action,
      target,
      ...metadata,
    });
  }

  /**
   * Track React error boundary errors
   */
  trackReactError(error: Error, errorInfo: any): void {
    this.trackError(error, {
      type: 'react_error',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.trackEvent('memory_usage', {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
      });
    }
  }

  /**
   * Track network information
   */
  trackNetworkInfo(): void {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      this.trackEvent('network_info', {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      });
    }
  }

  /**
   * Get session information
   */
  getSessionInfo(): {
    sessionId: string;
    duration: number;
    startTime: number;
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      startTime: this.startTime,
    };
  }
}

// Singleton instance
const monitoringService = MonitoringService.getInstance();

// Export convenience functions
export const trackEvent = (eventName: string, properties?: EventProperties) =>
  monitoringService.trackEvent(eventName, properties);

export const trackError = (error: Error, context?: ErrorContext) =>
  monitoringService.trackError(error, context);

export const trackPerformance = (metric: PerformanceMetric) =>
  monitoringService.trackPerformance(metric);

export const startPerformanceTrace = (name: string) =>
  monitoringService.startPerformanceTrace(name);

export const trackUserJourney = (step: string, metadata?: Record<string, any>) =>
  monitoringService.trackUserJourney(step, metadata);

export const trackProfileCreation = (
  duration: number,
  success: boolean,
  retryCount: number,
  metadata?: Record<string, any>
) => monitoringService.trackProfileCreation(duration, success, retryCount, metadata);

export const trackPredictionGeneration = (
  category: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, any>
) => monitoringService.trackPredictionGeneration(category, duration, success, metadata);

export const trackExport = (
  action: 'pdf' | 'share' | 'print',
  category: string,
  metadata?: Record<string, any>
) => monitoringService.trackExport(action, category, metadata);

// Initialize monitoring on import (browser only)
if (typeof window !== 'undefined') {
  monitoringService.init();
}

export default monitoringService;
