// Category -> visual identity for BottleArt, replacing hotlinked product photos.
// Colors are drawn from the Dark Professional Ops palette (styles.css tokens).
export const CATEGORY_COLORS = {
  "wine-champagne": { base: "#7A2338", accent: "#F2C078", shape: "wine",   label: "Wine & Champagne" },
  "bourbon-whisky": { base: "#8C5A1E", accent: "#F5B51C", shape: "spirit", label: "Bourbon & Whisky" },
  "gin-vodka":      { base: "#215D6E", accent: "#38BDF8", shape: "spirit", label: "Gin & Vodka" },
  "rum-tequila":    { base: "#7A4A14", accent: "#FB923C", shape: "spirit", label: "Rum & Tequila" },
  "brandy-cognac":  { base: "#5A2E12", accent: "#C8870A", shape: "spirit", label: "Brandy & Cognac" },
  "beer-cider":     { base: "#8A6D1E", accent: "#FFCD4D", shape: "beer",   label: "Beer & Cider" },
  "liqueur":        { base: "#5B2A6E", accent: "#C084FC", shape: "wine",   label: "Liqueur" },
  "mixers":         { base: "#2E6E4F", accent: "#10B981", shape: "can",   label: "Mixers & Other" },
};

export function colorsForCategory(category) {
  return CATEGORY_COLORS[category] || { base: "#334155", accent: "#94A3B8", shape: "box", label: "Other" };
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_COLORS);
