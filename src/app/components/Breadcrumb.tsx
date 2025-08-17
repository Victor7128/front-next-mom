"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  key: string;
  href?: string;
  label: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  lastAsLink?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = "",
  separator = <span className="mx-1 text-gray-400">/</span>,
  lastAsLink = false,
}) => {
  if (!items || !items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="inline-flex items-center flex-wrap gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const content =
            (!isLast || (isLast && lastAsLink)) && item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">
                {item.label}
              </span>
            );

          return (
            <li key={item.key} className="inline-flex items-center">
              {idx > 0 && <span>{separator}</span>}
              {content}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};