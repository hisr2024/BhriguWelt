import { NextResponse } from 'next/server';

import type { ChartData } from '@/lib/api/predictions';
import { generateFutureLivesPrediction } from '@/lib/engines/futureLivesEngine';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      birth_data?: ChartData;
      use_ai?: boolean;
      mode?: 'offline' | 'online' | 'hybrid';
      language?: string;
    };
    const clientOnline = request.headers.get('x-client-online');
    const isOffline = clientOnline?.toLowerCase() === 'false' || clientOnline === '0';

    if (!body?.birth_data) {
      return NextResponse.json(
        { error: 'Missing birth_data', success: false },
        { status: 400 }
      );
    }

    const result = await generateFutureLivesPrediction(body.birth_data, {
      useAI: isOffline ? false : body.use_ai ?? true,
      mode: isOffline ? 'offline' : body.mode ?? 'offline',
      language: body.language ?? 'en',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
