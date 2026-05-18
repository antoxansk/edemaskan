"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { generateNotification, randomDelay, type NotificationData } from "@/lib/social-proof/data";

const FIRST_DELAY_MS  = 15_000;
const SHOW_DURATION   = 5_000;
const MIN_INTERVAL_MS = 20_000;
const MAX_INTERVAL_MS = 60_000;

export function SocialProofToast() {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [visible, setVisible]           = useState(false);

  const lastShownRef    = useRef<NotificationData | null>(null);
  const showTimerRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimerRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isStoppedRef    = useRef(false);
  const isHoveredRef    = useRef(false);

  function clearAllTimers() {
    if (showTimerRef.current !== undefined) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current !== undefined) clearTimeout(hideTimerRef.current);
  }

  function hide() {
    setVisible(false);
    // Allow exit animation to complete before removing from DOM
    hideTimerRef.current = setTimeout(() => setNotification(null), 320);
  }

  function scheduleShow(delayMs: number) {
    showTimerRef.current = setTimeout(() => {
      if (isStoppedRef.current) return;
      const data = generateNotification(lastShownRef.current);
      lastShownRef.current = data;
      setNotification(data);
      // Tiny double-rAF so transition actually triggers after mount
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      scheduleHide();
    }, delayMs);
  }

  function scheduleHide() {
    hideTimerRef.current = setTimeout(() => {
      if (isHoveredRef.current) return; // Hover is pausing — skip auto-hide
      hide();
      if (!isStoppedRef.current) {
        scheduleShow(randomDelay(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
      }
    }, SHOW_DURATION);
  }

  useEffect(() => {
    // Stop when footer enters viewport
    const footer = document.querySelector("[data-landing-footer]");
    let footerObserver: IntersectionObserver | undefined;
    if (footer) {
      footerObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            isStoppedRef.current = true;
            clearAllTimers();
            hide();
          }
        },
        { threshold: 0.1 }
      );
      footerObserver.observe(footer);
    }

    // Pause timers when tab is hidden
    function onVisibilityChange() {
      if (document.hidden) {
        clearAllTimers();
      } else if (!isStoppedRef.current) {
        // Resume: re-schedule next show from scratch
        scheduleShow(randomDelay(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Start first notification after 15s
    scheduleShow(FIRST_DELAY_MS);

    return () => {
      isStoppedRef.current = true;
      clearAllTimers();
      footerObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMouseEnter() {
    isHoveredRef.current = true;
    clearTimeout(hideTimerRef.current);
  }

  function handleMouseLeave() {
    isHoveredRef.current = false;
    if (!visible || isStoppedRef.current) return;
    // Restart 5s hide timer from mouse-leave
    hideTimerRef.current = setTimeout(() => {
      hide();
      if (!isStoppedRef.current) {
        scheduleShow(randomDelay(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
      }
    }, SHOW_DURATION);
  }

  function handleDismiss() {
    clearAllTimers();
    hide();
    if (!isStoppedRef.current) {
      scheduleShow(randomDelay(MIN_INTERVAL_MS, MAX_INTERVAL_MS));
    }
  }

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position:   "fixed",
        bottom:     "80px",   // above StickyBottomCTA on mobile
        left:       "16px",
        zIndex:     50,
        width:      "280px",
        // Desktop: larger, closer to corner
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0) translateX(0)" : "translateY(16px) translateX(-8px)",
        transition: "opacity 300ms ease, transform 300ms ease",
        background: "#FFFFFF",
        border:     "1px solid #E5E7EB",
        borderRadius: "12px",
        boxShadow:  "0 10px 25px -5px rgba(0,0,0,0.10), 0 4px 6px -2px rgba(0,0,0,0.05)",
        padding:    "14px 16px",
      }}
      // On desktop: 320px wide, bottom 24px, left 24px
      className="sm:w-80 sm:bottom-6 sm:left-6"
    >
      <div className="flex items-start gap-3">
        {/* Pulsing green dot */}
        <span
          className="shrink-0 mt-1 rounded-full bg-emerald-500 animate-pulse"
          style={{ width: 10, height: 10 }}
          aria-hidden
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {notification.name} из {notification.city}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
            {notification.action}
          </p>
          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
        </div>

        <button
          onClick={handleDismiss}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors -mt-0.5 -mr-1"
          aria-label="Закрыть уведомление"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
