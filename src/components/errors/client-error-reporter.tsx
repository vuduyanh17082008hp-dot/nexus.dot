"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getBrowserInfo,
  getDeviceType,
  sanitizeErrorMessage,
  sanitizeStack,
} from "@/lib/client/device-info";

const REPORT_COOLDOWN_MS = 5000;

function reportError(
  payload: {
    source: "CLIENT";
    message: string;
    stack?: string;
    route: string;
    metadata?: Record<string, unknown>;
  },
  dedupeKey: string,
  lastReported: React.MutableRefObject<Map<string, number>>,
) {
  const now = Date.now();
  const last = lastReported.current.get(dedupeKey) ?? 0;
  if (now - last < REPORT_COOLDOWN_MS) return;
  lastReported.current.set(dedupeKey, now);

  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: payload.source,
      message: payload.message,
      stack: payload.stack,
      route: payload.route,
      browser: getBrowserInfo(),
      metadata: {
        ...payload.metadata,
        device: getDeviceType(),
      },
    }),
  }).catch(() => {
    /* avoid recursive error loops */
  });
}

export function ClientErrorReporter() {
  const pathname = usePathname();
  const lastReported = useRef(new Map<string, number>());

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = sanitizeErrorMessage(event.message || "Unknown client error");
      const stack = sanitizeStack(event.error?.stack);
      const dedupeKey = `${message}:${stack?.slice(0, 120) ?? ""}`;
      reportError(
        {
          source: "CLIENT",
          message,
          stack,
          route: pathname,
          metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
        },
        dedupeKey,
        lastReported,
      );
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = sanitizeErrorMessage(
        reason instanceof Error ? reason.message : String(reason ?? "Unhandled promise rejection"),
      );
      const stack = reason instanceof Error ? sanitizeStack(reason.stack) : undefined;
      const dedupeKey = `rejection:${message}:${stack?.slice(0, 120) ?? ""}`;
      reportError(
        { source: "CLIENT", message, stack, route: pathname },
        dedupeKey,
        lastReported,
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname]);

  return null;
}
