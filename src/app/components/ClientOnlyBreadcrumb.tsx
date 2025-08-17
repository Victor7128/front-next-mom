"use client";

import { useEffect, useState } from "react";
import React from "react";
import { AutoBreadcrumb } from "@/app/components/AutoBreadcrumb";

interface ClientOnlyBreadcrumbProps extends React.ComponentProps<typeof AutoBreadcrumb> {
  fallback?: React.ReactNode;
}

export const ClientOnlyBreadcrumb: React.FC<ClientOnlyBreadcrumbProps> = ({ fallback = null, ...rest }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <>{fallback}</>;
  return <AutoBreadcrumb {...rest} />;
};