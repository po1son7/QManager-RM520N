// =============================================================================
// device-modem-image.ts — Modem hero image selection by AT+CGMM / model string
// =============================================================================

/** Quectel RG50xQ series: RG501Q, RG502Q, RG500Q, … (RG50 + one digit + Q). */
export function isRg50xQSeries(model: string | null | undefined): boolean {
  if (!model?.trim()) return false;
  return /RG50\dQ/i.test(model.trim());
}

export const RG50XQ_MODEM_IMAGE_PATH = "/modem-rg50xq.png";

export interface ModemHeroImage {
  src: string;
  alt: string;
  /** Product photo vs generic SVG — slightly different chrome */
  variant: "photo" | "generic";
}

export function modemHeroImage(model: string | null | undefined): ModemHeroImage {
  const m = model?.trim() || "";
  if (isRg50xQSeries(m)) {
    return {
      src: RG50XQ_MODEM_IMAGE_PATH,
      alt: `${m}（Quectel RG50xQ 系列）`,
      variant: "photo",
    };
  }
  return {
    src: "/device-icon.svg",
    alt: m ? `${m} 模组` : "模组",
    variant: "generic",
  };
}
