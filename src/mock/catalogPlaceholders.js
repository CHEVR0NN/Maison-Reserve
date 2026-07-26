// Category -> visual identity for BottleArt, replacing hotlinked product photos.
// Colors are drawn from the Maison Reserve palette family (styles.css tokens)
// instead of an arbitrary rainbow, so the catalog reads as one material world
// while staying scannable category-to-category. Wine and liqueur are kept out
// of claret's and plum's hue ranges specifically — claret is budgeted to four
// exact roles app-wide (see DESIGN.md) and plum was rejected as a direction.
export const CATEGORY_COLORS = {
  "wine-champagne": { base: "#242C38", accent: "#8B99B8", shape: "wine",   label: "Wine & Champagne" },
  "bourbon-whisky": { base: "#6B4419", accent: "#E8B85A", shape: "spirit", label: "Bourbon & Whisky" },
  "gin-vodka":      { base: "#3E5C46", accent: "#9DBF94", shape: "spirit", label: "Gin & Vodka" },
  "rum-tequila":    { base: "#7A4114", accent: "#E3954A", shape: "spirit", label: "Rum & Tequila" },
  "brandy-cognac":  { base: "#5A3312", accent: "#C8870A", shape: "spirit", label: "Brandy & Cognac" },
  "beer-cider":     { base: "#7A5A1E", accent: "#E8B85A", shape: "beer",   label: "Beer & Cider" },
  "liqueur":        { base: "#5C2E24", accent: "#D98F6E", shape: "wine",   label: "Liqueur" },
  "mixers":         { base: "#2E5E4F", accent: "#7FBFA0", shape: "can",   label: "Mixers & Other" },
};

export function colorsForCategory(category) {
  return CATEGORY_COLORS[category] || { base: "#3A342A", accent: "#8E8064", shape: "box", label: "Other" };
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_COLORS);
