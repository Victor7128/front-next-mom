"use client";

import React from "react";
import { SmartAutoBreadcrumb } from "@/app/components/SmartAutoBreadcrumb";

export const SiteHeader: React.FC = () => (
  <header className="w-full border-b border-indigo-200 bg-white/70 backdrop-blur-lg px-4 py-4 flex flex-col gap-2 shadow-sm sticky top-0 z-40">
    <nav className="flex items-center gap-4">
      <div className="flex-1">
        <SmartAutoBreadcrumb className="text-xs sm:text-sm text-indigo-800 font-medium" />
      </div>
      {/* Puedes agregar aquí logo, avatar, o acciones rápidas si lo deseas */}
    </nav>
  </header>
);