/**
 * Shopify API Client with Exponential Backoff Throttling Defense
 * Repo: bizi-bees /lib/shopify-client.ts
 * 
 * Safety Guards:
 * - Detects HTTP 429 (Too Many Requests / Rate Limited) & 5xx Gateway errors
 * - Exponential backoff with jitter & respects standard 'Retry-After' headers
 * - GraphQL and REST query wrappers for fail-safe e-commerce operations
 */

export interface ShopifyClientConfig {
  shopUrl?: string;
  accessToken?: string;
  apiVersion?: string;
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: any[]; extensions?: any }>;
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export class ShopifyClient {
  private shopUrl: string;
  private accessToken: string;
  private apiVersion: string;
  private maxRetries: number;
  private initialDelayMs: number;
  private maxDelayMs: number;

  constructor(config: ShopifyClientConfig = {}) {
    this.shopUrl = (config.shopUrl || process.env.SHOPIFY_SHOP_URL || 'bizibees-store.myshopify.com').replace(/^https?:\/\//, '');
    this.accessToken = config.accessToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
    this.apiVersion = config.apiVersion || process.env.SHOPIFY_API_VERSION || '2024-04';
    this.maxRetries = config.maxRetries ?? 5;
    this.initialDelayMs = config.initialDelayMs ?? 500;
    this.maxDelayMs = config.maxDelayMs ?? 10000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes a fetch request with exponential backoff on HTTP 429 / 5xx
   */
  public async fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
    try {
      const response = await fetch(url, init);

      // Handle Throttling (HTTP 429 Too Many Requests) or Transient Gateway Errors (502, 503, 504)
      if (response.status === 429 || (response.status >= 502 && response.status <= 504)) {
        if (attempt >= this.maxRetries) {
          console.error(`🚨 [Shopify API Error] Max retries (${this.maxRetries}) exhausted for ${url}. Status: ${response.status}`);
          return response;
        }

        // Check for Shopify's 'Retry-After' header (in seconds)
        const retryAfterHeader = response.headers.get('Retry-After');
        let delayMs: number;

        if (retryAfterHeader) {
          const seconds = parseFloat(retryAfterHeader);
          delayMs = !isNaN(seconds) ? Math.ceil(seconds * 1000) : this.initialDelayMs * Math.pow(2, attempt);
        } else {
          // Calculate exponential backoff with full jitter to avoid thundering herd
          const exponential = this.initialDelayMs * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * (this.initialDelayMs / 2));
          delayMs = Math.min(exponential + jitter, this.maxDelayMs);
        }

        console.warn(
          `⚠️ [Shopify Throttled 429] Rate limit reached. Retrying attempt ${attempt + 1}/${this.maxRetries} after ${delayMs}ms backoff...`
        );

        await this.sleep(delayMs);
        return this.fetchWithRetry(url, init, attempt + 1);
      }

      return response;
    } catch (networkError: any) {
      // Handle network connection drops / transient fetch aborts
      if (attempt < this.maxRetries) {
        const delayMs = Math.min(this.initialDelayMs * Math.pow(2, attempt), this.maxDelayMs);
        console.warn(`⚠️ [Network Issue] ${networkError.message}. Retrying in ${delayMs}ms (Attempt ${attempt + 1}/${this.maxRetries})...`);
        await this.sleep(delayMs);
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      throw networkError;
    }
  }

  /**
   * Executes a GraphQL query/mutation with automatic throttling defense
   */
  public async query<T = any>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<GraphQLResponse<T>> {
    const endpoint = `https://${this.shopUrl}/admin/api/${this.apiVersion}/graphql.json`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.accessToken) {
      headers['X-Shopify-Access-Token'] = this.accessToken;
    }

    const response = await this.fetchWithRetry(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify GraphQL Request Failed (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    // Handle GraphQL-level throttling extension notices
    if (json.extensions?.cost?.throttleStatus) {
      const { currentlyAvailable, restoreRate } = json.extensions.cost.throttleStatus;
      if (currentlyAvailable < 50) {
        console.info(`ℹ️ [Shopify Rate Budget Low] ${currentlyAvailable} points available. Restore rate: ${restoreRate}/sec.`);
      }
    }

    if (json.errors && json.errors.length > 0) {
      console.warn('⚠️ [Shopify GraphQL Warnings/Errors]:', json.errors.map(e => e.message).join(' | '));
    }

    return json;
  }

  /**
   * Executes a REST API request with automatic throttling defense
   */
  public async rest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const sanitizedPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `https://${this.shopUrl}/admin/api/${this.apiVersion}/${sanitizedPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers['X-Shopify-Access-Token'] = this.accessToken;
    }

    const response = await this.fetchWithRetry(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify REST Request Failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}

// Export default singleton instance & helper
export const shopify = new ShopifyClient();
export const fetchWithRetry = (url: string, init: RequestInit, attempt = 0) => shopify.fetchWithRetry(url, init, attempt);
export default shopify;
