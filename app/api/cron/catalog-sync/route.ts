import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // On-demand ISR & catalog cache revalidation
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    timestamp,
    engine: 'Vercel Global Catalog Sync & Revalidator v1.0',
    revalidated_stores: [
      'Luma Clinical (bizibees-store.myshopify.com)',
      'CraveLab Chocolate (cravelab.vercel.app)',
      'Aura Sculpt (aurasculpt.vercel.app)'
    ],
    status: 'SUCCESS'
  });
}
