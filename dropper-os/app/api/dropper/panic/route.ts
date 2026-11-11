/**
 * Dropper OS - Emergency Kill-Switch (Panic Mode)
 * File: dropper-os/app/api/dropper/panic/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { sseEventBus } from '@/lib/telemetry/sse-event-bus';

let isPanicModeActive = false;

export async function GET() {
  return NextResponse.json({ panicMode: isPanicModeActive });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const activate = body.active !== undefined ? body.active : !isPanicModeActive;

    isPanicModeActive = activate;

    sseEventBus.broadcast('panic', isPanicModeActive ? 'PANIC_ENGAGED' : 'PANIC_DISENGAGED', {
      panicMode: isPanicModeActive,
      timestamp: Date.now(),
      message: isPanicModeActive
        ? 'EMERGENCY KILL-SWITCH ENGAGED: Dynamic scripts paused, store operating in safe fallback mode.'
        : 'Safe mode disengaged: Full dynamic algorithmic engines restored.',
    });

    return NextResponse.json({
      success: true,
      panicMode: isPanicModeActive,
      message: isPanicModeActive ? 'Panic mode engaged' : 'Normal mode restored',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
