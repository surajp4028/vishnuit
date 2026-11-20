/** Colour option helpers shared by the product form, product page, cards and shop filters. */
export const COLOR_HEX: Record<string, string> = {
  black: "#111111", white: "#ffffff", offwhite: "#f4f1ea", "off white": "#f4f1ea", ivory: "#f6f1e1", cream: "#f5ecd7", beige: "#e8dcc4",
  red: "#d32f2f", maroon: "#7f1d1d", wine: "#722f37", rust: "#b7410e", orange: "#f97316", peach: "#ffcba4", coral: "#ff7f50",
  pink: "#ec4899", "baby pink": "#f8c8dc", blush: "#f4c2c2", rani: "#e0115f", magenta: "#d0006f", purple: "#7c3aed", lavender: "#c4b5fd",
  blue: "#2563eb", "sky blue": "#7dd3fc", navy: "#1e2a5a", "navy blue": "#1e2a5a", teal: "#0d9488", turquoise: "#2dd4bf",
  green: "#16a34a", olive: "#6b7d3a", sage: "#9caf88", mint: "#a7f3d0", "bottle green": "#0b4d2c",
  yellow: "#facc15", mustard: "#d4a017", gold: "#d4a017", silver: "#c0c0c0", grey: "#9ca3af", gray: "#9ca3af", charcoal: "#36454f",
  brown: "#7c4a21", tan: "#d2b48c", khaki: "#c3b091", camel: "#c19a6b", indigo: "#4338ca", denim: "#4a6fa5",
};
export const isColourOption = (name: string) => /colou?r|shade/i.test(name);
export const guessHex = (value: string) => COLOR_HEX[value.trim().toLowerCase()] ?? null;
export const hexFor = (value: string, swatches?: Record<string, string> | null) => swatches?.[value] ?? guessHex(value);
/** Light colours need a visible border on white backgrounds. */
export const isLight = (hex: string) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 200; };
