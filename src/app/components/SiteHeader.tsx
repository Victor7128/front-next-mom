"use client";

import React from "react";
import { SmartAutoBreadcrumb } from "@/app/components/SmartAutoBreadcrumb";

export const SiteHeader: React.FC = () => (
  <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur px-4 py-3 flex flex-col gap-2">
    <SmartAutoBreadcrumb className="text-xs sm:text-sm" />
  </header>
);