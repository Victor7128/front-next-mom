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
  separator = (
    <span className="mx-1 text-indigo-300" aria-hidden="true">
      <svg
        className="inline w-3 h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 20 20"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l5 5m0-5l-5 5" />
      </svg>
    </span>
  ),
  lastAsLink = false,
}) => {
  if (!items || !items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`${className} select-none`}>
      <ol className="inline-flex items-center flex-wrap gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const content =
            (!isLast || (isLast && lastAsLink)) && item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 transition-colors font-medium underline underline-offset-2"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-indigo-950 font-bold">
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