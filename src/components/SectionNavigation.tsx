
"use client";

import { useEffect } from "react";

const SECTION_IDS = ["overview", "earth", "telemetry", "news"];

export default function SectionNavigation() {
  useEffect(() => {
    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (!visible.length) return;

        const activeId = visible[0].target.id;

        document.querySelectorAll<HTMLAnchorElement>(".nav-item").forEach(
          (link) => {
            const isActive =
              link.getAttribute("href") === `#${activeId}`;

            link.classList.toggle("is-active", isActive);

            if (isActive) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          }
        );
      },
      {
        rootMargin: "-15% 0px -60% 0px",
        threshold: [0, 0.15, 0.35, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return null;
}
