"use client";

import React from "react";
import Link from "next/link";
import { Crown, Trophy, Layers, ClipboardCheck } from "lucide-react";

export type ActiveLeagueKey = "sultanlar" | "1-lig" | "2-lig" | "volleybox" | "altyapi";

interface LeagueSwitcherProps {
  activeLeague: ActiveLeagueKey;
  className?: string;
}

export const LeagueSwitcher: React.FC<LeagueSwitcherProps> = ({
  activeLeague,
  className = "",
}) => {
  const leagues: {
    key: ActiveLeagueKey;
    label: string;
    sublabel: string;
    href: string;
    title: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      key: "sultanlar",
      label: "Sultanlar Ligi",
      sublabel: "14 Kulüp",
      href: "/sultanlar-ligi",
      title: "Vodafone Sultanlar Ligi — Canlı Puan Durumu, Fikstür & Sonuçlar",
      icon: <Crown size={13} className="text-amber-400 shrink-0" />,
      activeClass:
        "bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-rose-600/20 text-amber-200 border border-amber-400/50 shadow-glow-amber",
    },
    {
      key: "1-lig",
      label: "Kadınlar 1. Lig",
      sublabel: "A & B Grubu",
      href: "/kadinlar-1-ligi",
      title: "Arabica Coffee House Kadınlar Voleybol 1. Ligi (A & B Grubu) — Puan Durumu & Fikstür",
      icon: <Trophy size={13} className="text-rose-400 shrink-0" />,
      activeClass:
        "bg-gradient-to-r from-rose-600/25 via-red-500/15 to-amber-500/20 text-rose-200 border border-rose-400/50 shadow-glow-red",
    },
    {
      key: "2-lig",
      label: "Kadınlar 2. Lig",
      sublabel: "16 Grup",
      href: "/kadinlar-2-ligi",
      title: "Uzman Posta Kadınlar 2. Ligi (16 Grup) — Puan Durumu & Fikstür",
      icon: <Layers size={13} className="text-fuchsia-400 shrink-0" />,
      activeClass:
        "bg-gradient-to-r from-fuchsia-600/25 via-purple-500/15 to-amber-500/15 text-fuchsia-200 border border-fuchsia-400/50 shadow-xs",
    },
    {
      key: "volleybox",
      label: "Volleybox",
      sublabel: "Giriş",
      href: "/volleybox",
      title: "TVF → Volleybox Maç Giriş & Eşleştirme Kokpiti",
      icon: <ClipboardCheck size={13} className="text-emerald-400 shrink-0" />,
      activeClass:
        "bg-gradient-to-r from-emerald-600/25 via-teal-500/15 to-amber-500/15 text-emerald-200 border border-emerald-400/50 shadow-xs",
    },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-surface-muted/95 border border-line/90 text-xs font-semibold shadow-inner ${className}`}
      role="group"
      aria-label="Pro Voleybol 3'lü Lig Sekme Barı"
    >
      {leagues.map((item) => {
        const isActive = activeLeague === item.key;
        if (isActive) {
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold tracking-tight whitespace-nowrap cursor-default transition-all ${item.activeClass}`}
            >
              {item.icon}
              <span>{item.label}</span>
              <span className="hidden xl:inline-block text-[10px] font-mono opacity-80 pl-1 border-l border-current/25">
                {item.sublabel}
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch={false}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ink-2 hover:text-white hover:bg-surface-raised/80 border border-transparent hover:border-line/70 transition-all whitespace-nowrap"
            title={item.title}
          >
            {item.icon}
            <span>{item.label}</span>
            <span className="hidden xl:inline-block text-[10px] font-mono text-ink-3">
              {item.sublabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
