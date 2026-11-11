import { NextResponse } from 'next/server';


const STORES_TO_MONITOR = [
  { name: 'Luma Clinical', url: 'https://bizibees-store.myshopify.com' },
  { name: 'CraveLab Chocolate', url: 'https://cravelab.vercel.app' },
  { name: 'Aura Sculpt Apparel', url: 'https://aurasculpt.vercel.app' }
];

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const results = [];

  for (const store of STORES_TO_MONITOR) {
    const startTime = Date.now();
    try {
      const res = await fetch(`${store.url}/cart.json`, { cache: 'no-store' });
      const latency = Date.now() - startTime;
      
      if (res.ok) {
        results.push({ store: store.name, status: 'HEALTHY', latency: `${latency}ms` });
      } else {
        results.push({ store: store.name, status: 'DEGRADED', code: res.status });
      }
    } catch (err: any) {
      results.push({ store: store.name, status: 'DOWN', error: err?.message || 'Network error' });
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    engine: 'Vercel Autonomous Healer v3.2',
    fleet_status: results
  });
}
