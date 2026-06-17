"use client";

import React, { memo } from "react";
import { ArrowUpRight, ExternalLink, Github } from "lucide-react";
import { TimelineItem, ProjectItem } from "../types";
import { isProjectLikeTimelineSubtitle } from "@/lib/experience-presentation";
import { saveScrollRestore, ScrollRestoreSection } from "@/lib/scroll-restore";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { IntentLink } from "./ui/IntentLink";
import { useLocale, useUiCopy } from "@/lib/LocaleProvider";

interface ExperienceCardProps {
  item: TimelineItem | ProjectItem;
  type?: "timeline" | "project";
  hideDate?: boolean;
  groupChildren?: Array<TimelineItem | ProjectItem>;
}

const MAX_TIMELINE_PREVIEW_POINTS = 3;
const GROUPED_CHILD_PREVIEW_POINTS = 2;

function getExperienceContextName(item: TimelineItem | ProjectItem) {
  return "company" in item ? item.company : item.name;
}

function getExperienceTechStack(item: TimelineItem | ProjectItem) {
  return item.expandedDetails?.techStack?.length
    ? item.expandedDetails.techStack
    : item.techTags;
}

function getExperienceContextLabel(
  item: TimelineItem | ProjectItem,
  locale: "zh" | "en",
) {
  const contextName = getExperienceContextName(item);
  return locale === "en"
    ? `Project / context: ${contextName}`
    : `项目名称/实践场景：${contextName}`;
}

function getExperienceTechStackLabel(
  item: TimelineItem | ProjectItem,
  locale: "zh" | "en",
) {
  const techStack = getExperienceTechStack(item);
  if (techStack.length === 0) return "";

  return locale === "en"
    ? `Tech stack: ${techStack.slice(0, 4).join(" / ")}`
    : `技术栈：${techStack.slice(0, 4).join(" / ")}`;
}

function normalizePreviewText(value?: string) {
  return value?.replace(/\r/g, "").replace(/\s+/g, " ").trim() ?? "";
}

function extractMarkdownListItems(value?: string) {
  if (!value) return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim());
}

function getTimelinePreviewPoints(
  item: TimelineItem | ProjectItem,
  locale: "zh" | "en",
) {
  if (!("role" in item)) return [];

  const points: string[] = [];
  const seen = new Set<string>();
  const details = item.expandedDetails;

  const pushPoint = (value?: string) => {
    const normalized = normalizePreviewText(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    points.push(normalized);
  };

  pushPoint(getExperienceContextLabel(item, locale));
  pushPoint(getExperienceTechStackLabel(item, locale));

  item.keyOutcomes?.forEach(pushPoint);

  if (details) {
    const solutionPoints = extractMarkdownListItems(details.solution);

    if (
      points.length < MAX_TIMELINE_PREVIEW_POINTS &&
      solutionPoints.length > 0
    ) {
      solutionPoints.forEach(pushPoint);
    } else if (points.length < MAX_TIMELINE_PREVIEW_POINTS) {
      pushPoint(details.solution);
    }

    if (points.length < MAX_TIMELINE_PREVIEW_POINTS) {
      pushPoint(details.result);
    }
  }

  if (points.length < MAX_TIMELINE_PREVIEW_POINTS) {
    pushPoint(item.engineeringDepth?.[locale] ?? item.engineeringDepth?.zh);
    pushPoint(item.businessValue?.[locale] ?? item.businessValue?.zh);
    pushPoint(item.summary);
  }

  return points.slice(0, MAX_TIMELINE_PREVIEW_POINTS);
}

function getGroupChildTitle(item: TimelineItem | ProjectItem) {
  return getExperienceContextName(item);
}

function getGroupedChildPreviewPoints(
  item: TimelineItem | ProjectItem,
  locale: "zh" | "en",
) {
  const points = item.keyOutcomes?.filter(Boolean) ?? [];
  if (points.length > 0) {
    return points.slice(0, GROUPED_CHILD_PREVIEW_POINTS);
  }

  const fallbackPoints = getTimelinePreviewPoints(item, locale);
  if (fallbackPoints.length > 0) {
    return fallbackPoints.slice(0, GROUPED_CHILD_PREVIEW_POINTS);
  }

  return [item.summary].filter(Boolean);
}

export const ExperienceCard = memo(function ExperienceCard({
  item,
  type,
  hideDate = false,
  groupChildren = [],
}: ExperienceCardProps) {
  const { locale } = useLocale();
  const copy = useUiCopy();
  const title = "role" in item ? item.role : item.name;
  const subtitle = "company" in item ? item.company : "";
  const date = item.year;
  const isProjectCard =
    type === "project" || (type !== "timeline" && !("role" in item));
  const isTimelineCard = !isProjectCard;
  const isProjectLikeSubtitle =
    isTimelineCard && "role" in item && isProjectLikeTimelineSubtitle(item);
  const isGroupedItem = groupChildren.length > 0;

  const githubLink =
    item.link ||
    item.expandedDetails?.links?.find((l) =>
      l.label.toLowerCase().includes("github"),
    )?.url;
  const demoLink =
    "demoLink" in item && item.demoLink
      ? item.demoLink
      : item.expandedDetails?.links?.find(
          (l) => !l.label.toLowerCase().includes("github"),
        )?.url;
  const section: ScrollRestoreSection =
    type === "project"
      ? "projects"
      : type === "timeline"
        ? "experience"
        : "role" in item
          ? "experience"
          : "projects";

  const handleOpen = () => {
    if (typeof window === "undefined") return;
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    saveScrollRestore({
      path,
      y: window.scrollY,
      section,
      ts: Date.now(),
    });
  };

  return (
    <IntentLink
      href={`/experiences/${item.id}`}
      scroll={false}
      className="group block h-full"
      onClick={handleOpen}
    >
      <div
        className={`theme-card theme-card-interactive theme-card-launcher relative flex h-full flex-col overflow-hidden border-[rgba(148,163,184,0.16)] shadow-[0_14px_30px_rgba(15,23,42,0.055)] ${
          isTimelineCard
            ? "experience-timeline-card rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-4 md:p-5"
            : "experience-project-card rounded-[1.2rem] p-4 sm:rounded-[1.35rem] sm:p-4 md:p-5"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 bg-[linear-gradient(180deg,rgba(219,234,254,0.42),transparent)] opacity-90 ${
            isTimelineCard ? "h-[3.2rem]" : "h-[3.45rem]"
          }`}
        />

        <div
          className={`relative z-10 flex items-start justify-between border-b border-[color:var(--border-default)] ${
            isTimelineCard
              ? "experience-timeline-header mb-3.5 gap-3.5 pb-3 sm:mb-4 sm:pb-3.5"
              : "experience-card-header mb-3.5 gap-3.5 pb-3 sm:mb-4 sm:pb-3.5"
          }`}
        >
          <div className="min-w-0 flex-1 pr-2 sm:pr-4">
            <h3
              className={`theme-card-title transition-colors group-hover:text-[color:var(--brand-gold)] ${
                isTimelineCard
                  ? "experience-timeline-title text-[1rem] sm:text-[1.06rem]"
                  : "text-[1.02rem] sm:text-[1.08rem]"
              } break-words [overflow-wrap:anywhere]`}
            >
              {title}
            </h3>
            {subtitle ? (
              <p
                className={cn(
                  "mt-2 min-w-0 break-words [overflow-wrap:anywhere]",
                  isProjectLikeSubtitle
                    ? "experience-timeline-subtitle-prominent font-heading text-[0.9rem] font-semibold leading-tight tracking-[-0.01em] text-[color:var(--text-primary)] sm:text-[0.96rem]"
                    : "experience-timeline-subtitle-standard theme-card-kicker",
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 sm:flex-nowrap sm:gap-3">
            {!hideDate ? (
              <div className="theme-chip max-w-[8.75rem] whitespace-normal break-words px-2.5 py-1 text-right text-[11px] font-bold uppercase leading-[1.45] tracking-[0.08em] [overflow-wrap:anywhere] sm:max-w-none sm:text-[10px] sm:tracking-[0.2em]">
                {date}
              </div>
            ) : null}
            <div className="motion-chip flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(37,99,235,0.14)] bg-white/88 text-[color:var(--text-tertiary)] transition-colors duration-200 group-hover:border-[rgba(37,99,235,0.26)] group-hover:text-[color:var(--brand-gold)] sm:h-9 sm:w-9">
              <ArrowUpRight className="motion-arrow-shift h-4.5 w-4.5" />
            </div>
          </div>
        </div>

        <div
          className={`theme-card-body relative z-10 flex-grow text-[13px] leading-[1.74] sm:text-[14px] sm:leading-[1.82] ${
            isGroupedItem
              ? "mb-4 sm:mb-5"
              : isProjectCard
                ? "mb-4 min-h-[5.9rem] sm:mb-5 sm:min-h-[6.6rem]"
                : "experience-timeline-body mb-4 min-h-[6rem] sm:mb-5 sm:min-h-[6.8rem]"
          }`}
        >
          {isGroupedItem ? (
            <div className="space-y-4">
              <MarkdownRenderer
                inline
                className="experience-grouped-summary block min-w-0 break-words text-[13px] leading-[1.72] text-[color:var(--text-secondary)] [overflow-wrap:anywhere] sm:text-[14px] sm:leading-[1.82]"
              >
                {item.summary}
              </MarkdownRenderer>
              <div className="experience-grouped-grid">
                {groupChildren.map((child) => (
                  <div key={child.id} className="experience-grouped-child">
                    <div className="experience-grouped-child-header">
                      <div className="experience-grouped-child-title-row">
                        <span className="theme-title min-w-0 flex-1 break-words text-[0.95rem] font-semibold leading-6 text-[color:var(--text-primary)] sm:text-[1rem]">
                          {getGroupChildTitle(child)}
                        </span>
                        <span className="theme-copy-subtle shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em]">
                          {child.year}
                        </span>
                      </div>
                      <p className="experience-grouped-tech theme-copy-subtle break-words text-[12px] font-semibold leading-5 [overflow-wrap:anywhere] sm:text-[12.5px]">
                        {getExperienceContextLabel(child, locale)}
                      </p>
                      <p className="experience-grouped-tech theme-copy-subtle break-words text-[12px] font-semibold leading-5 [overflow-wrap:anywhere] sm:text-[12.5px]">
                        {getExperienceTechStackLabel(child, locale)}
                      </p>
                    </div>
                    <ul className="experience-grouped-points">
                      {getGroupedChildPreviewPoints(child, locale).map(
                        (point, childIndex) => (
                          <li
                            key={`${child.id}-grouped-point-${childIndex}`}
                            className="experience-grouped-point flex items-start"
                          >
                            <span
                              className="experience-grouped-bullet"
                              aria-hidden="true"
                            />
                            <MarkdownRenderer
                              inline
                              className="min-w-0 flex-1 break-words text-[13px] leading-[1.66] text-[color:var(--text-secondary)] [overflow-wrap:anywhere]"
                            >
                              {point}
                            </MarkdownRenderer>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : isTimelineCard ? (
            <ul className="experience-timeline-points space-y-1.5">
              {getTimelinePreviewPoints(item, locale).map((point, index) => (
                <li
                  key={`${item.id}-preview-${index}`}
                  className="experience-timeline-point flex items-start gap-1.5"
                >
                  <span className="mt-[0.15rem] shrink-0 text-[color:var(--text-secondary)]">
                    ·
                  </span>
                  <MarkdownRenderer inline className="min-w-0 flex-1">
                    {point}
                  </MarkdownRenderer>
                </li>
              ))}
            </ul>
          ) : (
            <MarkdownRenderer
              inline
              className="block min-w-0 break-words [overflow-wrap:anywhere]"
            >
              {item.summary}
            </MarkdownRenderer>
          )}
        </div>

        <div className="relative z-10 mt-auto border-t border-[color:var(--border-default)] pt-3 sm:pt-3.5">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
            <div
              className={`flex flex-wrap content-start gap-1.5 ${
                isTimelineCard ? "min-h-7 sm:min-h-8" : "min-h-8"
              }`}
            >
              {item.techTags?.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="theme-chip max-w-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-wider"
                >
                  {tag}
                </span>
              ))}
              {(item.techTags?.length || 0) > 3 ? (
                <span className="theme-chip px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-wider">
                  +{(item.techTags?.length || 0) - 3}
                </span>
              ) : null}
            </div>

            {githubLink || demoLink ? (
              <div className="flex min-h-8 items-start justify-start gap-1.5 opacity-80 transition-opacity group-hover:opacity-100 sm:min-h-9 sm:justify-end">
                {githubLink ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(githubLink, "_blank", "noopener,noreferrer");
                    }}
                    className="motion-chip flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[color:var(--text-tertiary)] transition-colors hover:border-[rgba(37,99,235,0.14)] hover:bg-[rgba(239,246,255,0.92)] hover:text-[color:var(--brand-gold)] sm:h-8 sm:w-8"
                    aria-label={copy.experience.githubAria}
                    title={copy.experience.githubTitle}
                  >
                    <Github
                      size={15}
                      strokeWidth={2}
                      className="motion-icon-float"
                    />
                  </button>
                ) : null}
                {demoLink ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(demoLink, "_blank", "noopener,noreferrer");
                    }}
                    className="motion-chip flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[color:var(--text-tertiary)] transition-colors hover:border-[rgba(37,99,235,0.14)] hover:bg-[rgba(239,246,255,0.92)] hover:text-[color:var(--brand-gold)] sm:h-8 sm:w-8"
                    aria-label={copy.experience.demoAria}
                    title={copy.experience.demoTitle}
                  >
                    <ExternalLink
                      size={15}
                      strokeWidth={2}
                      className="motion-icon-float"
                    />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </IntentLink>
  );
});
