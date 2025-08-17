"use client";

import React from "react";
import { LabelRegistryProvider } from "@/app/context/LabelRegistryContext";

export const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LabelRegistryProvider>
      {children}
    </LabelRegistryProvider>
  );
};