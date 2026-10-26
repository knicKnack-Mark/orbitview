
"use client";

import { useEffect } from "react";

export default function CursorEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    if (!finePointer.matches) return;

    let frame = 0;
    let mouseX = -500;
    let mouseY = -500;
    let currentX = mouseX;
    let currentY = mouseY;

    const cursor = document.createElement("div");
    cursor.className = "cursor-glow";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    const moveCursor = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!frame) {
        frame = requestAnimationFrame(animate);
      }
    };

    const animate = () => {
      currentX += (mouseX - currentX) * 0.16;
      currentY += (mouseY - currentY) * 0.16;

      cursor.style.transform =
        `translate3d(${currentX - 150}px, ${currentY - 150}px, 0)`;

      if (
        Math.abs(mouseX - currentX) > 0.5 ||
        Math.abs(mouseY - currentY) > 0.5
      ) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    };

    const handlePointerDown = () => {
      cursor.classList.add("cursor-glow-active");
    };

    const handlePointerUp = () => {
      cursor.classList.remove("cursor-glow-active");
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mouseup", handlePointerUp);

      if (frame) cancelAnimationFrame(frame);

      cursor.remove();
    };
  }, []);

  return null;
}
