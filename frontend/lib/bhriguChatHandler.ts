import { interpretChart } from "@/lib/interpretChart";
import { generateNatalChart } from "@/lib/natal";
import { BirthDetailsInput, ChatContext } from "@/types/chat";
import { NatalChart } from "@/types/natal";

type HandlerInput = {
  message: string;
  chart?: NatalChart;
  context?: ChatContext;
};

type HandlerResponse = {
  reply: string;
  chart?: NatalChart;
  context?: ChatContext;
};

function hasCompleteBirthDetails(details?: BirthDetailsInput): details is BirthDetailsInput {
  return Boolean(
    details?.name?.trim() &&
      details.dateOfBirth?.trim() &&
      details.timeOfBirth?.trim() &&
      details.placeOfBirth?.trim()
  );
}

function buildReply({
  chart,
  userQuestion,
  isMinor,
  name,
}: {
  chart: NatalChart;
  userQuestion?: string;
  isMinor?: boolean;
  name?: string;
}) {
  const trimmedQuestion = userQuestion?.trim();
  const interpretation = interpretChart({ chart, userQuestion: trimmedQuestion, isMinor });
  const greeting = name ? `Thanks, ${name}.` : "Thanks for sharing your question.";
  const framing = isMinor
    ? "Here’s a gentle, reflective look at the chart, keeping everything open-ended:"
    : "Here’s a warm, reflective look at the chart (all symbolic, not fixed fate):";

  return `${greeting} ${framing}\n\n${interpretation}`.trim();
}

export async function bhriguChatHandler(input: HandlerInput): Promise<HandlerResponse> {
  const { message, chart, context } = input;
  const isMinor = context?.isMinor;

  if (chart) {
    const reply = buildReply({
      chart,
      userQuestion: message,
      isMinor,
      name: context?.birthDetails?.name,
    });
    return { reply, chart, context: { ...context, lastChart: chart } };
  }

  const birthDetails = context?.birthDetails;

  if (!hasCompleteBirthDetails(birthDetails)) {
    const reply =
      "I’m glad to help. Please share your name, date of birth (YYYY-MM-DD), time of birth (HH:mm), and place of birth so I can craft your chart.";
    return { reply, context };
  }

  try {
    const generatedChart = await generateNatalChart(birthDetails);
    const reply = buildReply({
      chart: generatedChart,
      userQuestion: message,
      isMinor,
      name: birthDetails.name,
    });
    return { reply, chart: generatedChart, context: { ...context, lastChart: generatedChart } };
  } catch {
    const reply =
      "I couldn’t process those birth details just yet. Could you double-check the format for name, date (YYYY-MM-DD), time (HH:mm), and place?";
    return { reply, context };
  }
}
