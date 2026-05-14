import type { PhotoSlot } from "@/components/scan/scan-provider";

function FrontalFace() {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Neck */}
      <rect x="47" y="118" width="26" height="22" rx="4" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Head */}
      <ellipse cx="60" cy="72" rx="44" ry="52" fill="#f7e4d8" stroke="#d4a896" strokeWidth="1.5" />
      {/* Hair */}
      <ellipse cx="60" cy="30" rx="44" ry="22" fill="#8b5e3c" />
      <rect x="16" y="22" width="88" height="18" fill="#8b5e3c" />
      {/* Ears */}
      <ellipse cx="17" cy="75" rx="6" ry="9" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      <ellipse cx="103" cy="75" rx="6" ry="9" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Eyebrows */}
      <path d="M34 61 Q42 57 50 61" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 61 Q78 57 86 61" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="42" cy="69" rx="9" ry="6" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <ellipse cx="78" cy="69" rx="9" ry="6" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <circle cx="42" cy="69" r="4" fill="#5a3020" />
      <circle cx="78" cy="69" r="4" fill="#5a3020" />
      {/* Nose */}
      <path d="M60 74 L56 88 Q60 91 64 88 L60 74" stroke="#c4917a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M49 100 Q60 108 71 100" stroke="#c07060" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ThreeQuarterLeft() {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Neck */}
      <rect x="42" y="118" width="24" height="22" rx="4" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Head - shifted left for 3/4 view */}
      <ellipse cx="55" cy="72" rx="38" ry="52" fill="#f7e4d8" stroke="#d4a896" strokeWidth="1.5" />
      {/* Hair */}
      <ellipse cx="55" cy="28" rx="40" ry="22" fill="#8b5e3c" />
      <rect x="15" y="20" width="80" height="20" fill="#8b5e3c" />
      {/* Ear - only right visible */}
      <ellipse cx="93" cy="75" rx="6" ry="9" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Eyebrows */}
      <path d="M30 61 Q38 57 46 60" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 60 Q68 56 77 59" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="37" cy="68" rx="7" ry="5.5" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <ellipse cx="68" cy="67" rx="9" ry="6" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <circle cx="37" cy="68" r="3.5" fill="#5a3020" />
      <circle cx="68" cy="67" r="4" fill="#5a3020" />
      {/* Nose - pointing left slightly */}
      <path d="M52 74 L47 87 Q51 90 56 88 L52 74" stroke="#c4917a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M40 99 Q52 107 66 99" stroke="#c07060" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Chin contour */}
      <path d="M18 95 Q30 120 54 122" stroke="#d4a896" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function ThreeQuarterRight() {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Neck */}
      <rect x="54" y="118" width="24" height="22" rx="4" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Head - shifted right for 3/4 view */}
      <ellipse cx="65" cy="72" rx="38" ry="52" fill="#f7e4d8" stroke="#d4a896" strokeWidth="1.5" />
      {/* Hair */}
      <ellipse cx="65" cy="28" rx="40" ry="22" fill="#8b5e3c" />
      <rect x="25" y="20" width="80" height="20" fill="#8b5e3c" />
      {/* Ear - only left visible */}
      <ellipse cx="27" cy="75" rx="6" ry="9" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Eyebrows */}
      <path d="M43 60 Q52 56 60 61" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M74 61 Q82 57 90 61" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="52" cy="67" rx="9" ry="6" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <ellipse cx="83" cy="68" rx="7" ry="5.5" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <circle cx="52" cy="67" r="4" fill="#5a3020" />
      <circle cx="83" cy="68" r="3.5" fill="#5a3020" />
      {/* Nose - pointing right slightly */}
      <path d="M68 74 L73 87 L68 88 L64 87 L68 74" stroke="#c4917a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M54 99 Q66 107 80 99" stroke="#c07060" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Chin contour */}
      <path d="M102 95 Q90 120 66 122" stroke="#d4a896" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function TiltedDown() {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Neck - more visible */}
      <rect x="44" y="122" width="32" height="22" rx="5" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Head - oval compressed vertically (head tilted) */}
      <ellipse cx="60" cy="75" rx="44" ry="48" fill="#f7e4d8" stroke="#d4a896" strokeWidth="1.5" />
      {/* Hair - more visible from top */}
      <ellipse cx="60" cy="32" rx="44" ry="26" fill="#8b5e3c" />
      {/* Ears */}
      <ellipse cx="17" cy="72" rx="6" ry="9" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      <ellipse cx="103" cy="72" rx="6" ry="9" fill="#f3d9c8" stroke="#d4a896" strokeWidth="1.2" />
      {/* Eyebrows - lower, chin tucked */}
      <path d="M34 68 Q42 64 50 68" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 68 Q78 64 86 68" stroke="#6b3a2a" strokeWidth="2" strokeLinecap="round" />
      {/* Eyes - looking down */}
      <ellipse cx="42" cy="75" rx="9" ry="5" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <ellipse cx="78" cy="75" rx="9" ry="5" fill="white" stroke="#6b3a2a" strokeWidth="1.2" />
      <circle cx="42" cy="76" r="3.5" fill="#5a3020" />
      <circle cx="78" cy="76" r="3.5" fill="#5a3020" />
      {/* Nose */}
      <path d="M60 80 L56 91 Q60 94 64 91 L60 80" stroke="#c4917a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Mouth - chin down, more forehead visible */}
      <path d="M49 103 Q60 110 71 103" stroke="#c07060" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<PhotoSlot, React.FC> = {
  frontal:             FrontalFace,
  three_quarter_left:  ThreeQuarterLeft,
  three_quarter_right: ThreeQuarterRight,
  tilted_down:         TiltedDown,
};

export function PhotoPoseIllustration({ slot }: { slot: PhotoSlot }) {
  const Illustration = ILLUSTRATIONS[slot];
  return <Illustration />;
}
