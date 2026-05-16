export function useHaptics() {
  const buzz = (pattern: number | number[] = 12) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };
  return { buzz };
}
