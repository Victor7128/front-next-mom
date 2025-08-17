"use client";

import React from "react";
import { Breadcrumb, BreadcrumbItem } from "@/app/components/Breadcrumb";
import { useAutoLabelResolver } from "@/app/hooks/useAutoLabelResolver";

/**
 * Props extra: puedes pasar cualquier prop del Breadcrumb
 * más una opción showLoadingIndicator para mostrar un puntito si está resolviendo.
 */
interface AutoBreadcrumbProps extends React.ComponentProps<typeof Breadcrumb> {
  showLoadingIndicator?: boolean;
  loadingIndicator?: React.ReactNode;
}

export const AutoBreadcrumb: React.FC<AutoBreadcrumbProps> = ({
  showLoadingIndicator = true,
  loadingIndicator = <span className="animate-pulse text-xs text-gray-400 ml-2">…</span>,
  ...rest
}) => {
  const { labelResolver, isResolving } = useAutoLabelResolver();

  return (
    <div className="flex items-center">
      <Breadcrumb
        labelResolver={labelResolver}
        {...rest}
      />
      {showLoadingIndicator && isResolving && loadingIndicator}
    </div>
  );
};