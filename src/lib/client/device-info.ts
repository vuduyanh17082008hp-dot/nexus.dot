"use client";

export function getBrowserInfo(): string {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.userAgent.slice(0, 200);
}

export function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function sanitizeErrorMessage(message: string, max = 500): string {
  return message.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

export function sanitizeStack(stack: string | undefined | null, max = 4000): string | undefined {
  if (!stack) return undefined;
  return stack.slice(0, max);
}
