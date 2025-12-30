import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChartLine,
  Clock,
  Compass,
  Flame,
  Heart,
  MessageCircle,
  Moon,
  Sparkles,
  Stars,
  Wand2,
} from "lucide-react";

export type EngineField = {
  name: string;
  label: string;
  type: "text" | "email" | "date" | "time" | "select" | "number" | "textarea";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helper?: string;
};

export type EngineResult = {
  title: string;
  summary: string;
  highlights: Array<{ label: string; value: string }>;
  nextSteps: string[];
};

export type EngineConfig = {
  slug: string;
  title: string;
  description: string;
  cardDescription: string;
  features: string[];
  icon: LucideIcon;
  formTitle: string;
  formDescription: string;
  fields: EngineField[];
  resultTitle: string;
  resultSummary: string;
  resultHighlights: Array<{ label: string; value: string }>;
  nextSteps: string[];
  accent: string;
};

export const engineConfigs: EngineConfig[] = [
  {
    slug: "horoscope",
    title: "Horoscope",
    description: "Refined natal insights with precise timing and calm guidance.",
    cardDescription: "Birth-chart intelligence that stays crisp and readable.",
    features: ["Birth map", "Dasha focus", "Remedy cues"],
    icon: Moon,
    formTitle: "Build your horoscope profile",
    formDescription: "Capture the essentials for a complete reading.",
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true, placeholder: "Your name" },
      { name: "birthDate", label: "Birth date", type: "date", required: true },
      { name: "birthTime", label: "Birth time", type: "time", required: true },
      { name: "birthCity", label: "Birth city", type: "text", required: true, placeholder: "City" },
    ],
    resultTitle: "Your core horoscope snapshot",
    resultSummary: "Balanced chart energy with strong lunar emphasis and a supportive Jupiter cycle.",
    resultHighlights: [
      { label: "Ruling themes", value: "Growth, alignment, emotional clarity" },
      { label: "Peak window", value: "12 Aug · 4 Sep" },
      { label: "Support", value: "Meditation · mantra · water rituals" },
    ],
    nextSteps: ["Review your 90-day dasha window", "Lock daily remedies", "Share the profile"],
    accent: "from-indigo-500/30 to-cyan-500/30",
  },
  {
    slug: "past-life",
    title: "Past Life",
    description: "Karmic patterns, soul contracts, and restorative focus areas.",
    cardDescription: "A gentle look into karmic memory and release points.",
    features: ["Karmic themes", "Soul contracts", "Healing focus"],
    icon: Flame,
    formTitle: "Unlock karmic insights",
    formDescription: "Provide the key timeline anchors for a past-life reading.",
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true, placeholder: "Your name" },
      { name: "birthDate", label: "Birth date", type: "date", required: true },
      { name: "focus", label: "Current life focus", type: "text", required: true, placeholder: "Relationship, career, health" },
      { name: "notes", label: "Extra notes", type: "textarea", placeholder: "Share any recurring patterns" },
    ],
    resultTitle: "Past-life narrative focus",
    resultSummary: "A protector role with strong healing vows, now surfacing for closure and balance.",
    resultHighlights: [
      { label: "Recurring motif", value: "Guardian archetype" },
      { label: "Lesson", value: "Releasing control gracefully" },
      { label: "Healing path", value: "Breathwork · water elements" },
    ],
    nextSteps: ["Record a grounding ritual", "Log recurring dreams", "Align with a mentor"],
    accent: "from-orange-500/25 to-pink-500/25",
  },
  {
    slug: "future",
    title: "Future",
    description: "Forward-looking predictions mapped to cycles and milestones.",
    cardDescription: "Smooth, focused predictions with milestone clarity.",
    features: ["Milestones", "Opportunity windows", "Risk alerts"],
    icon: Sparkles,
    formTitle: "Forecast timeline",
    formDescription: "Select your prediction horizon and focus area.",
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true, placeholder: "Your name" },
      { name: "focus", label: "Focus area", type: "select", required: true, options: ["Career", "Relationships", "Health", "Finance"] },
      { name: "range", label: "Time range (months)", type: "number", required: true, placeholder: "6" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
    ],
    resultTitle: "Future outlook",
    resultSummary: "Momentum rises after the second lunar cycle with a strong partnership catalyst.",
    resultHighlights: [
      { label: "Momentum", value: "Rising from Week 6" },
      { label: "Opportunity", value: "Strategic collaboration" },
      { label: "Caution", value: "Guard energy in Week 9" },
    ],
    nextSteps: ["Schedule a strategy review", "Set protective routines", "Capture goals"],
    accent: "from-emerald-500/25 to-sky-500/25",
  },
  {
    slug: "matchmaking",
    title: "Matchmaking",
    description: "Compatibility scoring with dosha balance and remedies.",
    cardDescription: "Sharp compatibility scores with clear remedy guidance.",
    features: ["Dosha balance", "Partner alignment", "Remedy guide"],
    icon: Heart,
    formTitle: "Partner compatibility",
    formDescription: "Enter both profiles for a precise match score.",
    fields: [
      { name: "primaryName", label: "Partner A name", type: "text", required: true, placeholder: "Partner A" },
      { name: "secondaryName", label: "Partner B name", type: "text", required: true, placeholder: "Partner B" },
      { name: "primaryBirthDate", label: "Partner A birth date", type: "date", required: true },
      { name: "secondaryBirthDate", label: "Partner B birth date", type: "date", required: true },
    ],
    resultTitle: "Compatibility overview",
    resultSummary: "Strong emotional harmony with a balanced remedy path.",
    resultHighlights: [
      { label: "Compatibility", value: "82 / 100" },
      { label: "Dosha", value: "Mild Mangal focus" },
      { label: "Alignment", value: "Shared values and ritual flow" },
    ],
    nextSteps: ["Review shared rituals", "Book a deeper match reading", "Save the report"],
    accent: "from-rose-500/25 to-fuchsia-500/25",
  },
  {
    slug: "calendar",
    title: "Calendar",
    description: "Śaka calendar highlights, tithi markers, and daily guidance.",
    cardDescription: "Daily alignment with śaka conversions and rituals.",
    features: ["Tithi mapping", "Festival highlights", "Daily rituals"],
    icon: CalendarDays,
    formTitle: "Daily alignment",
    formDescription: "Select the day and the type of focus needed.",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "location", label: "Location", type: "text", required: true, placeholder: "City" },
      { name: "focus", label: "Focus", type: "select", required: true, options: ["Career", "Love", "Health", "Spiritual"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional intent" },
    ],
    resultTitle: "Calendar insight",
    resultSummary: "A restorative tithi with balanced energy for decisive actions.",
    resultHighlights: [
      { label: "Tithi", value: "Shukla Dashami" },
      { label: "Lucky window", value: "08:20 - 10:05" },
      { label: "Recommended", value: "Prayer, planning, new commitments" },
    ],
    nextSteps: ["Add to reminders", "Schedule rituals", "Share the alignment"],
    accent: "from-teal-500/25 to-indigo-500/25",
  },
  {
    slug: "timeline",
    title: "Timeline",
    description: "Life chapters mapped into a polished timeline view.",
    cardDescription: "Milestone tracking with clear narrative arcs.",
    features: ["Life chapters", "Key transits", "Milestone alerts"],
    icon: Clock,
    formTitle: "Timeline mapping",
    formDescription: "Define the timeline horizon and focus.",
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "birthDate", label: "Birth date", type: "date", required: true },
      { name: "horizon", label: "Horizon (years)", type: "number", required: true, placeholder: "5" },
      { name: "focus", label: "Focus", type: "select", required: true, options: ["Career", "Family", "Wealth", "Spiritual"] },
    ],
    resultTitle: "Timeline highlights",
    resultSummary: "Two major shifts with a soft landing in the third quarter.",
    resultHighlights: [
      { label: "Major shifts", value: "2" },
      { label: "Primary theme", value: "Expansion & mentorship" },
      { label: "Next checkpoint", value: "Q3 — 12 Oct" },
    ],
    nextSteps: ["Export to calendar", "Set milestone alerts", "Request mentor review"],
    accent: "from-blue-500/25 to-violet-500/25",
  },
  {
    slug: "varshaphal",
    title: "Varshaphal",
    description: "Yearly solar return guidance with refined focus points.",
    cardDescription: "Annual guidance with strong actionable cues.",
    features: ["Solar return", "Year themes", "Priority chart"],
    icon: Stars,
    formTitle: "Annual chart focus",
    formDescription: "Input the year and personal focus area.",
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "birthDate", label: "Birth date", type: "date", required: true },
      { name: "year", label: "Year", type: "number", required: true, placeholder: "2025" },
      { name: "intent", label: "Intent", type: "text", required: true, placeholder: "Career growth" },
    ],
    resultTitle: "Varshaphal overview",
    resultSummary: "Growth through structured learning and selective collaborations.",
    resultHighlights: [
      { label: "Year tone", value: "Disciplined expansion" },
      { label: "Opportunity", value: "Q2 partnership" },
      { label: "Caution", value: "Energy management" },
    ],
    nextSteps: ["Plan quarterly reviews", "Lock annual rituals", "Share the plan"],
    accent: "from-amber-500/25 to-orange-500/25",
  },
  {
    slug: "transits",
    title: "Transits",
    description: "Live planetary transits and the cleanest actionable guidance.",
    cardDescription: "Live motion tracking for daily decisions.",
    features: ["Transit alerts", "Daily impact", "Remedy cues"],
    icon: Activity,
    formTitle: "Transit snapshot",
    formDescription: "Capture your location and intent for the transit report.",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "location", label: "Location", type: "text", required: true, placeholder: "City" },
      { name: "intent", label: "Intent", type: "text", required: true, placeholder: "Focus area" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
    ],
    resultTitle: "Transit digest",
    resultSummary: "Strong Mercury alignment favors communication and clear choices.",
    resultHighlights: [
      { label: "Dominant transit", value: "Mercury trine" },
      { label: "Energy", value: "High clarity" },
      { label: "Action", value: "Negotiate and decide" },
    ],
    nextSteps: ["Subscribe to transit alerts", "Plan key meetings", "Save daily snapshot"],
    accent: "from-sky-500/25 to-purple-500/25",
  },
  {
    slug: "core-wisdom",
    title: "Core Wisdom",
    description: "Bhrigu Samhita teachings distilled into sharp guidance.",
    cardDescription: "Library-backed answers with ritual direction.",
    features: ["Wisdom archive", "Remedy lists", "Focused guidance"],
    icon: Wand2,
    formTitle: "Ask the wisdom vault",
    formDescription: "Submit the topic and desired depth.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true, placeholder: "Career, love, purpose" },
      { name: "depth", label: "Depth", type: "select", required: true, options: ["Quick", "Balanced", "Deep"] },
      { name: "tone", label: "Tone", type: "select", required: true, options: ["Gentle", "Direct", "Structured"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Optional context" },
    ],
    resultTitle: "Wisdom response",
    resultSummary: "Focus on disciplined intention and clear communication to unlock steady progress.",
    resultHighlights: [
      { label: "Core message", value: "Alignment through consistency" },
      { label: "Practice", value: "Morning intention ritual" },
      { label: "Avoid", value: "Overcommitting" },
    ],
    nextSteps: ["Save to your vault", "Share with a mentor", "Create reminders"],
    accent: "from-purple-500/25 to-indigo-500/25",
  },
  {
    slug: "chat",
    title: "Chat",
    description: "Conversational astrology guidance with live context.",
    cardDescription: "Live chat guidance with structured prompts.",
    features: ["Live answers", "Context-aware", "Follow-up prompts"],
    icon: MessageCircle,
    formTitle: "Start a new chat",
    formDescription: "Set the tone and topic for the conversation.",
    fields: [
      { name: "topic", label: "Topic", type: "text", required: true, placeholder: "Ask a question" },
      { name: "tone", label: "Tone", type: "select", required: true, options: ["Calm", "Direct", "Compassionate"] },
      { name: "focus", label: "Focus area", type: "select", required: true, options: ["Career", "Love", "Family", "Spiritual"] },
      { name: "email", label: "Email", type: "email", placeholder: "Optional follow-up" },
    ],
    resultTitle: "Chat highlights",
    resultSummary: "You are stepping into a cycle of structured growth with support around relationships.",
    resultHighlights: [
      { label: "Tone", value: "Grounded and supportive" },
      { label: "Priority", value: "Communication clarity" },
      { label: "Next", value: "Ask for a 30-day focus" },
    ],
    nextSteps: ["Open live chat", "Save the prompt", "Share with advisor"],
    accent: "from-cyan-500/25 to-indigo-500/25",
  },
  {
    slug: "dashboard",
    title: "Dashboard",
    description: "All engines, alerts, and saved reports in one place.",
    cardDescription: "Mission control for every astrology workflow.",
    features: ["Recent reports", "Quick actions", "Alerts overview"],
    icon: Compass,
    formTitle: "Personal dashboard setup",
    formDescription: "Update your workspace preferences.",
    fields: [
      { name: "fullName", label: "Name", type: "text", required: true },
      { name: "timezone", label: "Timezone", type: "select", required: true, options: ["IST", "UTC", "EST", "PST"] },
      { name: "dailyGoal", label: "Daily focus", type: "text", required: true, placeholder: "Clarity, growth" },
      { name: "email", label: "Email", type: "email", required: true },
    ],
    resultTitle: "Dashboard alignment",
    resultSummary: "Your workspace is focused on clarity with daily reminders enabled.",
    resultHighlights: [
      { label: "Next review", value: "Tomorrow · 8:00 AM" },
      { label: "Alerts", value: "3 active" },
      { label: "Saved reports", value: "12" },
    ],
    nextSteps: ["Sync reminders", "Set weekly review", "Invite collaborators"],
    accent: "from-slate-500/25 to-indigo-500/25",
  },
  {
    slug: "alerts",
    title: "Alerts",
    description: "Transit alerts and daily pings with smart filters.",
    cardDescription: "Precision alerts for transits and milestones.",
    features: ["Transit pings", "Priority filters", "Quiet hours"],
    icon: Bell,
    formTitle: "Alert settings",
    formDescription: "Tune the frequency and priority levels.",
    fields: [
      { name: "priority", label: "Priority", type: "select", required: true, options: ["Critical", "Balanced", "Gentle"] },
      { name: "frequency", label: "Frequency", type: "select", required: true, options: ["Real-time", "Daily", "Weekly"] },
      { name: "quietHours", label: "Quiet hours", type: "text", required: true, placeholder: "22:00 - 06:00" },
      { name: "email", label: "Email", type: "email", required: true },
    ],
    resultTitle: "Alert signal",
    resultSummary: "Balanced alerts with quiet hours enabled and priority transits highlighted.",
    resultHighlights: [
      { label: "Priority", value: "Balanced" },
      { label: "Next alert", value: "Tonight · 21:10" },
      { label: "Channels", value: "Push, email" },
    ],
    nextSteps: ["Enable push notifications", "Add special dates", "Save alert preset"],
    accent: "from-fuchsia-500/25 to-rose-500/25",
  },
  {
    slug: "analytics",
    title: "Analytics",
    description: "Insight dashboards, pattern tracking, and growth metrics.",
    cardDescription: "Performance analytics for your astrological journey.",
    features: ["Trend tracking", "Engagement", "Outcome signals"],
    icon: ChartLine,
    formTitle: "Analytics filter",
    formDescription: "Select the window and metric to review.",
    fields: [
      { name: "metric", label: "Metric", type: "select", required: true, options: ["Engagement", "Milestones", "Consistency", "Remedies"] },
      { name: "range", label: "Range", type: "select", required: true, options: ["7 days", "30 days", "90 days"] },
      { name: "goal", label: "Goal", type: "text", required: true, placeholder: "Focus outcome" },
      { name: "email", label: "Email", type: "email", required: true },
    ],
    resultTitle: "Analytics overview",
    resultSummary: "Consistency is rising with a strong focus on remedies this month.",
    resultHighlights: [
      { label: "Engagement", value: "+18%" },
      { label: "Top focus", value: "Remedy adherence" },
      { label: "Next goal", value: "Weekly reflection" },
    ],
    nextSteps: ["Export the report", "Schedule insights review", "Share with advisor"],
    accent: "from-emerald-500/25 to-teal-500/25",
  },
];

export const engineCards = engineConfigs.map((engine) => ({
  slug: engine.slug,
  title: engine.title,
  description: engine.cardDescription,
  features: engine.features,
  icon: engine.icon,
  accent: engine.accent,
}));

export const engineBySlug = engineConfigs.reduce<Record<string, EngineConfig>>((acc, engine) => {
  acc[engine.slug] = engine;
  return acc;
}, {});
