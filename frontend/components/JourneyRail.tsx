'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type JourneyStep = {
  label: string;
  href: string;
  description: string;
  matchers?: string[];
};

const STEPS: JourneyStep[] = [
  {
    label: "Birth Input",
    href: "/experience#birth",
    description: "Collect accurate birth details with inline guardrails.",
    matchers: ["/", "/experience"],
  },
  {
    label: "Chart",
    href: "/experience#chart",
    description: "Preview the twelve-house wheel and placements.",
    matchers: ["/experience"],
  },
  {
    label: "Interpretations",
    href: "/experience#dashboard",
    description: "Swipe through the dashboard cards with tooltips.",
    matchers: ["/experience", "/interpretations"],
  },
  {
    label: "Horoscopes",
    href: "/horoscope",
    description: "Read calm guidance and Śaka-ready summaries.",
  },
  {
    label: "Past-Life",
    href: "/past-life",
    description: "Trace karmic arcs with soft narrative cards.",
  },
  {
    label: "Future",
    href: "/future",
    description: "Follow the dasha and transit timeline with remedies.",
  },
  {
    label: "Matchmaking",
    href: "/matchmaking",
    description: "Pair guna balance with lifestyle-friendly rituals.",
  },
];

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export default function JourneyRail() {
  const pathname = usePathname();
  const [hash, setHash] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("bhrigu-journey-progress");
    const storedCollapsed = localStorage.getItem("bhrigu-journey-collapsed");
    if (stored) setCompletedSteps(JSON.parse(stored));
    if (storedCollapsed) setCollapsed(storedCollapsed === "true");

    const handleHashChange = () => setHash(window.location.hash || "");
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const normalizedPath = normalizePath(pathname || "/");

  const activeIndex = useMemo(() => {
    return STEPS.findIndex((step) => {
      const url = new URL(step.href, "http://placeholder.local");
      const stepPath = normalizePath(url.pathname);
      const matchesPath = normalizedPath === stepPath || normalizedPath.startsWith(stepPath);
      const matchesHash = url.hash && hash && url.hash === hash && normalizedPath === stepPath;
      const matchesCustom = step.matchers?.some((matcher) => normalizedPath.startsWith(normalizePath(matcher)));
      return matchesHash || matchesPath || Boolean(matchesCustom);
    });
  }, [hash, normalizedPath]);

  const resolvedIndex = activeIndex === -1 ? 0 : activeIndex;

  useEffect(() => {
    const currentLabel = STEPS[resolvedIndex]?.label;
    if (!currentLabel || typeof window === "undefined") return;
    setCompletedSteps((prev) => {
      if (prev.includes(currentLabel)) return prev;
      const next = [...prev, currentLabel];
      localStorage.setItem("bhrigu-journey-progress", JSON.stringify(next));
      return next;
    });
  }, [resolvedIndex]);

  const completedCount = Math.max(completedSteps.length, resolvedIndex + 1);
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhrigu-journey-collapsed", String(next));
    }
  };

  return (
    <aside
      className={`journey-rail journey-rail--persistent ${collapsed ? "is-collapsed" : ""}`}
      aria-label="Experience progress rail"
    >
      <div className="journey-rail__header">
        <div>
          <p className="eyebrow">Guided wizard</p>
          <h4>Birth → Matchmaking</h4>
          <p className="microcopy">Progress follows you across pages.</p>
        </div>
        <button type="button" className="ghost-button" onClick={toggleCollapsed} aria-pressed={collapsed}>
          {collapsed ? "Expand" : "Hide"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="journey-rail__progress" aria-live="polite">
            <div className="journey-rail__progress-bar" style={{ width: `${progressPercent}%` }} />
            <span className="journey-rail__progress-label">{progressPercent}% of the flow touched</span>
          </div>

          <ol className="journey-rail__list" aria-label="Experience steps">
            {STEPS.map((step, index) => {
              const isActive = index === resolvedIndex;
              const isComplete = completedSteps.includes(step.label) || index < resolvedIndex;
              return (
                <li key={step.label} className={`journey-rail__item ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}>
                  <Link href={step.href} className="journey-rail__link">
                    <span className="pill" aria-hidden>
                      {isComplete ? "✓" : index + 1}
                    </span>
                    <div>
                      <div className="journey-rail__label">{step.label}</div>
                      <p className="microcopy">{step.description}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </aside>
  );
}
