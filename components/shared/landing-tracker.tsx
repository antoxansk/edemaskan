"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ymGoal } from "@/lib/ym";

export function LandingPageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const scenario = pathname.replace(/^\//, "");
    ymGoal("landing_view", { scenario });
  }, [pathname]);
  return null;
}
