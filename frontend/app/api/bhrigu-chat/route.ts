import { NextResponse } from "next/server";

import { bhriguChatHandler } from "@/lib/bhriguChatHandler";
import { fetchProfileSession, sendChatMessage, upsertProfile } from "@/lib/api";
import { ChatContext } from "@/types/chat";
import { NatalChart } from "@/types/natal";

type ChatRequestBody = {
  message?: string;
  chart?: NatalChart;
  context?: ChatContext;
  userId?: string;
  profileId?: number;
  sessionKey?: string;
};

type ProfilePayload = {
  full_name?: string;
  date_of_birth?: string;
  time_of_birth?: string;
  place_of_birth?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
};

function profileFromChart(chart?: NatalChart): ProfilePayload | undefined {
  if (!chart?.metadata) return undefined;
  return {
    full_name: chart.metadata.name,
    date_of_birth: chart.metadata.date_of_birth,
    time_of_birth: chart.metadata.time_of_birth,
    place_of_birth: chart.metadata.place_of_birth,
    timezone: chart.metadata.timezone,
    metadata: { last_chart: chart },
  };
}

function profileFromContext(context?: ChatContext): ProfilePayload | undefined {
  if (!context?.birthDetails) return undefined;
  return {
    full_name: context.birthDetails.name,
    date_of_birth: context.birthDetails.dateOfBirth,
    time_of_birth: context.birthDetails.timeOfBirth,
    place_of_birth: context.birthDetails.placeOfBirth,
  };
}

function mergeProfileData(chart?: NatalChart, context?: ChatContext): ProfilePayload | undefined {
  return {
    ...(profileFromContext(context) || {}),
    ...(profileFromChart(chart) || {}),
  };
}

function sanitizePayload(payload: ChatRequestBody | undefined) {
  return {
    hasMessage: Boolean(payload?.message?.trim()),
    hasChart: Boolean(payload?.chart),
    hasContext: Boolean(payload?.context),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const sessionKey = searchParams.get("session_key") || "default";

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const payload = await fetchProfileSession(userId, sessionKey);
    return NextResponse.json({ ...payload, session_key: sessionKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach backend";
    return NextResponse.json({ error: message, session_key: sessionKey }, { status: 502 });
  }
}

export async function POST(request: Request) {
  let body: ChatRequestBody | undefined;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch (error) {
    console.error("/api/bhrigu-chat invalid JSON", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const sessionKey = body?.sessionKey || "default";
  const profilePayload = mergeProfileData(body.chart, body.context);

  try {
    const profileMeta = profilePayload
      ? await upsertProfile(
          {
            ...profilePayload,
            user_id: body.userId,
          },
          sessionKey,
        )
      : undefined;

    const resolvedUserId = body.userId || profileMeta?.user_id;

    const backendResponse = await sendChatMessage({
      message,
      user_id: resolvedUserId,
      profile_id: body.profileId || profileMeta?.id,
      session_id: sessionKey,
      profile: profilePayload,
    });

    return NextResponse.json({
      ...backendResponse,
      profile_id: body.profileId || profileMeta?.id,
      user_id: resolvedUserId,
      session_key: sessionKey,
    });
  } catch (error) {
    console.error("/api/bhrigu-chat backend unavailable, using local handler", {
      ...sanitizePayload(body),
      error,
    });
  }

  const fallback = await bhriguChatHandler({ message, chart: body.chart, context: body.context });
  return NextResponse.json({ ...fallback, fallback: true, session_key: sessionKey });
}
