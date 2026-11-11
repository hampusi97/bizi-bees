import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Extract Edge Geolocation tokens from Vercel Global Network
  const geo = (request as any).geo || {};
  const region = geo.region || request.headers.get('x-vercel-ip-country-region') || 'US';
  const city = geo.city || request.headers.get('x-vercel-ip-city') || '';

  let localizedAnnouncement = 'FAST US TRACKED DISPATCH: Ships in 24h from our Utah hub | 60-Day Trial Guarantee';

  if (region === 'UT' || city?.toLowerCase() === 'provo' || city?.toLowerCase() === 'salt lake city') {
    localizedAnnouncement = 'UTAH LOCAL PRIORITY: Order in the next 2 hours for same-day dispatch from our Provo logistics hub!';
  } else if (['CA', 'NV', 'AZ', 'OR', 'WA', 'ID'].includes(region)) {
    localizedAnnouncement = `WEST COAST PRIORITY: Fast 2-Day Delivery to ${region} via USPS Priority | Dispatches Tomorrow!`;
  } else if (['NY', 'FL', 'TX', 'IL', 'PA', 'NC', 'GA'].includes(region)) {
    localizedAnnouncement = `FAST US DISPATCH: Fully Insured Express Transit to ${region} | 60-Day Risk-Free Trial`;
  }

  // Inject localized headers for storefront rendering (ensure strict ByteString / ISO-8859-1 compliance)
  const safeRegion = String(region).replace(/[^\x20-\x7E]/g, '');
  const safeAnnouncement = localizedAnnouncement.replace(/[^\x20-\x7E]/g, '');
  response.headers.set('x-luma-geo-region', safeRegion || 'US');
  response.headers.set('x-luma-geo-announcement', safeAnnouncement);

  return response;
}
