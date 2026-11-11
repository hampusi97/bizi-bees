/**
 * Dropper OS - Store Uptime & Latency Telemetry Monitor
 * File: dropper-os/lib/telemetry.ts
 */

import https from 'https';
import axios from 'axios';

export interface StoreTelemetry {
  storeId: string;
  name: string;
  domain: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  httpStatus: number;
  latencyMs: number;
  sslValid: boolean;
  timestamp: string;
}

export async function pingStoreEndpoint(storeId: string, name: string, domain: string): Promise<StoreTelemetry> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  const start = Date.now();

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: () => true, // Accept any status code to calculate latency
      httpsAgent: new https.Agent({
        rejectUnauthorized: true, // Validates SSL certificate
        keepAlive: false
      })
    });

    const latencyMs = Date.now() - start;
    const isHealthy = res.status >= 200 && res.status < 400;

    return {
      storeId,
      name,
      domain,
      status: isHealthy ? (latencyMs < 1200 ? 'ONLINE' : 'DEGRADED') : 'DEGRADED',
      httpStatus: res.status,
      latencyMs,
      sslValid: true,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    const isSslError = error?.code === 'CERT_HAS_EXPIRED' || error?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';

    return {
      storeId,
      name,
      domain,
      status: 'OFFLINE',
      httpStatus: error?.response?.status || 503,
      latencyMs: latencyMs > 8000 ? 8000 : latencyMs,
      sslValid: !isSslError,
      timestamp: new Date().toISOString()
    };
  }
}
