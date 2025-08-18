"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLabelRegistry } from "@/app/context/LabelRegistryContext";

function isNumericId(segment: string) {
  return /^[0-9]+$/.test(segment);
}

interface FetchResult {
  label: string;
  extra?: Record<string,string>;
}

async function resolveSegment(segment: string): Promise<FetchResult | null> {
  // 1. Sección
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${segment}`);
    if (r.ok) {
      const data = await r.json();
      return { label: `Sección ${data.letter ?? segment}` };
    }
  } catch {}
  // 2. Grado
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${segment}`);
    if (r.ok) {
      const data = await r.json();
      const extra: Record<string,string> = {};
      if (data.bimester_id) {
        extra[String(data.bimester_id)] = `Bimestre ${data.bimester_id}`;
      }
      return {
        label: `Grado ${data.number ?? segment}°`,
        extra
      };
    }
  } catch {}
  return null;
}

export function useAutoLabelResolver() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const { getLabel, setLabel, setMany } = useLabelRegistry();
  const [isResolving, setIsResolving] = useState(false);
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const targets = segments.filter(
      s => isNumericId(s) && !getLabel(s) && !inFlight.current.has(s)
    );
    if (!targets.length) return;

    setIsResolving(true);
    (async () => {
      await Promise.all(targets.map(async seg => {
        inFlight.current.add(seg);
        try {
          const res = await resolveSegment(seg);
          if (res && !cancelled) {
            setLabel(seg, res.label);
            if (res.extra && Object.keys(res.extra).length) {
              setMany(res.extra);
            }
          }
        } finally {
          inFlight.current.delete(seg);
        }
      }));
      if (!cancelled) setIsResolving(false);
    })();

    return () => { cancelled = true; };
  }, [segments, getLabel, setLabel, setMany]);

  const labelResolver = useCallback(
    (segment: string) => getLabel(segment),
    [getLabel]
  );

  return { labelResolver, isResolving };
}