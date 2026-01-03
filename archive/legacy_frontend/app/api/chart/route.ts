import { NextResponse } from "next/server";

import { interpretChart } from "@/lib/interpretChart";
import { generateNatalChart } from "@/lib/natal";

interface ChartRequestBody {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  question?: string;
  is_minor?: boolean;
}

function sanitizePayload(payload: ChartRequestBody | undefined) {
  return {
    hasName: Boolean(payload?.name?.trim()),
    hasDate: Boolean(payload?.birth_date),
    hasTime: Boolean(payload?.birth_time),
    hasPlace: Boolean(payload?.birth_place?.trim()),
  };
}

export async function POST(request: Request) {
  let body: ChartRequestBody | undefined;

  try {
    body = (await request.json()) as ChartRequestBody;
  } catch (error) {
    console.error("/api/chart invalid JSON", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body?.name?.trim();
  const birth_date = body?.birth_date;
  const birth_time = body?.birth_time;
  const birth_place = body?.birth_place?.trim();

  if (!name || !birth_date || !birth_time || !birth_place) {
    return NextResponse.json({ error: "Missing birth details" }, { status: 400 });
  }

  try {
    const chart = await generateNatalChart({
      name,
      dateOfBirth: birth_date,
      timeOfBirth: birth_time,
      placeOfBirth: birth_place,
    });

    const interpretation = interpretChart({
      chart,
      userQuestion: body?.question,
      isMinor: body?.is_minor,
    });

    return NextResponse.json({
      ...chart,
      interpretation,
      interpretation_hi: null,
      karmic_epoch: chart.metadata.calendar.gregorian,
    });
  } catch (error) {
    console.error("/api/chart failed", { ...sanitizePayload(body), error });
    return NextResponse.json({ error: "Unable to generate chart" }, { status: 500 });
  }
}
