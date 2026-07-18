import { colorsForCategory } from "../mock/catalogPlaceholders.js";
import { seededRandom, randRange } from "../mock/ids.js";

// Deterministic per-product placeholder art — replaces hotlinked photography.
// Silhouette is picked by category, color pair by category, and a tiny seeded
// rotation/shade variation keeps same-category products from looking stamped.
function Silhouette({ shape, fill, accent }) {
  switch (shape) {
    case "wine":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path d="M20 4h8v8c0 3 3 4 3 9v21a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V21c0-5 3-6 3-9V4z" fill={fill} />
          <rect x="19" y="4" width="10" height="4" fill={accent} />
        </svg>
      );
    case "beer":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path d="M17 6h14l1 6-2 3v27a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V15l-2-3 1-6z" fill={fill} />
          <rect x="17" y="6" width="14" height="4" fill={accent} />
        </svg>
      );
    case "can":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect x="14" y="8" width="20" height="34" rx="3" fill={fill} />
          <rect x="14" y="8" width="20" height="6" rx="3" fill={accent} />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <rect x="10" y="14" width="28" height="26" rx="2" fill={fill} />
          <rect x="10" y="14" width="28" height="8" fill={accent} />
        </svg>
      );
    default: // spirit
      return (
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <path d="M21 4h6v6l4 4v27a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V14l4-4V4z" fill={fill} />
          <rect x="19" y="14" width="10" height="9" fill={accent} opacity="0.9" />
        </svg>
      );
  }
}

export default function BottleArt({ category, seed, size = 44 }) {
  const { base, accent, shape } = colorsForCategory(category);
  const rand = seededRandom(seed || category || "x");
  const rotate = randRange(rand, -6, 6);
  return (
    <div className="bottle-art" style={{ width: size, height: size, background: `linear-gradient(160deg, ${base}22, ${base}0d)` }}>
      <div style={{ width: size * 0.72, height: size * 0.72, transform: `rotate(${rotate.toFixed(1)}deg)` }}>
        <Silhouette shape={shape} fill={base} accent={accent} />
      </div>
    </div>
  );
}
