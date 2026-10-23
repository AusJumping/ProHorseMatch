/** Exact opt-in only: never turn the static proposal into a production route. */
export function isStylePreviewRoute(sandboxFlag: unknown, pathname: string): boolean {
  return sandboxFlag === "true" && (pathname === "/style-preview" || pathname === "/style-preview/");
}

/** WCAG 2.x sRGB relative luminance; preview specimens use opaque hex colours. */
function luminance(hex: string): number {
  const channels = hex.replace("#", "").match(/.{2}/g)!.map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function previewContrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
