"use client";

import React from "react";
import { Crown } from "lucide-react";

interface BrandLogoProps {
  className?: string;
  variant?: "full" | "mark" | "compact";
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  variant = "full",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
      title="Pro Voleybol — Türkiye Profesyonel Voleybol Ligleri (Sultanlar Ligi, 1. Lig & 2. Lig)"
    >
      {/* Royal Gold & Crimson Emblem Mark */}
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-700 p-[1.5px] shadow-glow-amber transition-transform duration-300 group-hover:scale-105">
        <div className="w-full h-full rounded-[10px] bg-[#120E1A] flex items-center justify-center">
          <Crown size={18} className="text-amber-400 drop-shadow" />
        </div>
      </div>

      {/* Typography */}
      {variant !== "mark" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-[#181002] border border-amber-300/60 font-display font-extrabold text-xs sm:text-[13px] tracking-wider uppercase px-2 py-0.5 rounded-md shadow-xs">
              PRO
            </span>
            <span className="text-white text-base sm:text-lg font-black tracking-tight font-sans">
              VOLEYBOL
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
