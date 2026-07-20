// Category -> visual identity for BottleArt, replacing hotlinked product photos.
// Colors are drawn from the Maison Reserve palette (styles.css tokens) — warm
// oak/amber/cabernet family instead of an arbitrary rainbow, so the catalog
// reads as one material world while staying scannable category-to-category.
export const CATEGORY_COLORS = {
  "wine-champagne": { base: "#4E1B29", accent: "#D98BA5", shape: "wine",   label: "Wine & Champagne" },
  "bourbon-whisky": { base: "#6B4419", accent: "#E8B85A", shape: "spirit", label: "Bourbon & Whisky" },
  "gin-vodka":      { base: "#3E5C46", accent: "#9DBF94", shape: "spirit", label: "Gin & Vodka" },
  "rum-tequila":    { base: "#7A4114", accent: "#E3954A", shape: "spirit", label: "Rum & Tequila" },
  "brandy-cognac":  { base: "#5A3312", accent: "#C8870A", shape: "spirit", label: "Brandy & Cognac" },
  "beer-cider":     { base: "#7A5A1E", accent: "#E8B85A", shape: "beer",   label: "Beer & Cider" },
  "liqueur":        { base: "#5B2A54", accent: "#C77FB0", shape: "wine",   label: "Liqueur" },
  "mixers":         { base: "#2E5E4F", accent: "#7FBFA0", shape: "can",   label: "Mixers & Other" },
};

export function colorsForCategory(category) {
  return CATEGORY_COLORS[category] || { base: "#3A342A", accent: "#8E8064", shape: "box", label: "Other" };
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_COLORS);
