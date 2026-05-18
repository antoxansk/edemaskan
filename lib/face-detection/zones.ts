import { ZONE_HEX, ZONE_LABELS } from "@/config/zone-coords";

export type ZoneKey =
  | "forehead"
  | "brows"
  | "periorbital"
  | "nasolabial"
  | "face_oval"
  | "lips_purse"
  | "chin"
  | "neck";

export type ZoneIndices =
  | number[]
  | { left: number[]; right: number[]; extra?: number[] };

export type ZoneDef = {
  label: string;
  color: string;
  indices: ZoneIndices;
};

// MediaPipe Face Mesh landmark indices per zone (§4 of spec)
export const FACE_ZONES: Record<ZoneKey, ZoneDef> = {
  face_oval: {
    label: ZONE_LABELS.face_oval,
    color: ZONE_HEX.face_oval,
    indices: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
    ],
  },

  forehead: {
    label: ZONE_LABELS.forehead,
    color: ZONE_HEX.forehead,
    indices: {
      left:  [10, 338, 297, 332, 284, 251, 389, 356],
      right: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
    },
  },

  brows: {
    label: ZONE_LABELS.brows,
    color: ZONE_HEX.brows,
    indices: {
      left:  [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
      right: [336, 296, 334, 293, 300, 285, 295, 282, 283, 276],
      extra: [9, 8, 168, 6, 197, 195, 5],  // glabella
    },
  },

  periorbital: {
    label: ZONE_LABELS.periorbital,
    color: ZONE_HEX.periorbital,
    indices: {
      left: [
        33, 7, 163, 144, 145, 153, 154, 155, 133,
        173, 157, 158, 159, 160, 161, 246,
      ],
      right: [
        362, 382, 381, 380, 374, 373, 390, 249, 263,
        466, 388, 387, 386, 385, 384, 398,
      ],
    },
  },

  nasolabial: {
    label: ZONE_LABELS.nasolabial,
    color: ZONE_HEX.nasolabial,
    indices: {
      left:  [129, 209, 49, 48, 64, 98, 97, 165, 92, 186, 57],
      right: [358, 429, 279, 278, 294, 327, 326, 391, 322, 410, 287],
    },
  },

  lips_purse: {
    label: ZONE_LABELS.lips_purse,
    color: ZONE_HEX.lips_purse,
    indices: {
      left:  [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
      right: [164, 393, 391, 322, 410, 287, 273, 335, 406],
    },
  },

  chin: {
    label: ZONE_LABELS.chin,
    color: ZONE_HEX.chin,
    indices: [
      61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
      287, 273, 335, 406, 313, 18, 83, 182, 106, 43, 57,
    ],
  },

  // Neck has no direct landmarks — computed geometrically in utils.ts
  neck: {
    label: ZONE_LABELS.neck,
    color: ZONE_HEX.neck,
    indices: [],  // placeholder — handled separately
  },
};

export const ZONE_ORDER: ZoneKey[] = [
  "face_oval",
  "forehead",
  "brows",
  "periorbital",
  "nasolabial",
  "lips_purse",
  "chin",
  "neck",
];
