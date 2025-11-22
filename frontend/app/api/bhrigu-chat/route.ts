import { NextResponse } from "next/server";

import { bhriguChatHandler } from "@/lib/bhriguChatHandler";
import { ChatContext } from "@/types/chat";
import { NatalChart } from "@/types/natal";

type ChatRequestPayload = {
  message?: string;
  chart?: NatalChart;
  context?: ChatContext;
};

type ChatLogDetails = {
  hasBirthDetails: boolean;
  hasChart: boolean;
  hasMessage: boolean;
  error?: string;
};

function sanitizeForLog(payload: ChatRequestPayload | undefined): ChatLogDetails {
  const hasBirthDetails = Boolean(payload?.context?.birthDetails);
  return {
    hasBirthDetails,
    hasChart: Boolean(payload?.chart),
    hasMessage: typeof payload?.message === "string" && payload.message.trim().length > 0,
  };
}

export async function POST(request: Request) {
  let payload: ChatRequestPayload | undefined;

  try {
    payload = (await request.json()) as ChatRequestPayload;
  } catch (error) {
    console.error("/api/bhrigu-chat invalid JSON", sanitizeForLog(payload));
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = payload?.message?.trim();
  const { chart, context } = payload ?? {};

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const response = await bhriguChatHandler({ message, chart, context });
    return NextResponse.json(response);
  } catch (error) {
    const logDetails = sanitizeForLog(payload);
    logDetails.error = error instanceof Error ? error.message : "Unknown error";
    console.error("/api/bhrigu-chat failed", logDetails);
    return NextResponse.json(
      { error: "Unable to process chat request" },
      { status: 500 }
    );
  }
}
