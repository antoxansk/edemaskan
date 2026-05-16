// Fixed ellipse coordinates for frontal face photo (viewBox 0-100 x 0-133)
// MVP: fixed coords for all users. v2: individual landmark detection.
export const ZONE_COORDS = {
  forehead:    { cx: 50, cy: 15, rx: 22, ry: 6 },
  brows:       { cx: 50, cy: 25, rx: 24, ry: 4 },
  periorbital: { cx: 50, cy: 32, rx: 26, ry: 5 },
  nasolabial:  { cx: 50, cy: 50, rx: 18, ry: 7 },
  face_oval:   { cx: 50, cy: 70, rx: 30, ry: 10 },
  lips_purse:  { cx: 50, cy: 62, rx: 12, ry: 5 },
  chin:        { cx: 50, cy: 80, rx: 14, ry: 5 },
  neck:        { cx: 50, cy: 92, rx: 24, ry: 5 },
} as const;

export type ZoneKey = keyof typeof ZONE_COORDS;

export const ZONE_LABELS: Record<ZoneKey, string> = {
  forehead:    "Лоб",
  brows:       "Брови",
  periorbital: "Периорбитальная зона",
  nasolabial:  "Носогубная зона",
  face_oval:   "Овал лица",
  lips_purse:  "Область губ",
  chin:        "Подбородок",
  neck:        "Шея",
};

// Hex colors matching @theme --zone-* variables (for rgba() fallback in SVG)
export const ZONE_HEX: Record<ZoneKey, string> = {
  forehead:    "#A8C9B9",
  brows:       "#B4D4C5",
  periorbital: "#F0D78A",
  nasolabial:  "#F0B5B5",
  face_oval:   "#A8C9E0",
  lips_purse:  "#D5B8E0",
  chin:        "#F0C9A8",
  neck:        "#A0CFC8",
};

export const ZONE_ORDER: ZoneKey[] = [
  "forehead", "brows", "periorbital", "nasolabial",
  "face_oval", "lips_purse", "chin", "neck",
];
