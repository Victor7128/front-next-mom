"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem } from "@/app/components/Breadcrumb";

interface GradeData { id: number; number: number; bimester_id: number; }
interface SectionData { id: number; letter: string; grade_id: number; }

interface SmartAutoBreadcrumbProps {
  showSeccionesInsideSection?: boolean;
  className?: string;
  separator?: React.ReactNode;
  lastAsLink?: boolean;
}

function parse(segments: string[]) {
  // grado / :bimesterId / secciones / :gradeId / (sectionId?) / tail...
  const res: { bimesterId?: string; gradeId?: string; sectionId?: string; tail?: string[] } = {};
  if (segments.length >= 4 && segments[0] === "grado" && segments[2] === "secciones") {
    res.bimesterId = segments[1];
    res.gradeId = segments[3];
    if (segments.length >= 5) {
      const c = segments[4];
      if (/^[0-9]+$/.test(c)) {
        res.sectionId = c;
        if (segments.length > 5) res.tail = segments.slice(5);
      } else {
        res.tail = segments.slice(4);
      }
    }
  }
  return res;
}

export const SmartAutoBreadcrumb: React.FC<SmartAutoBreadcrumbProps> = ({
  showSeccionesInsideSection = true,
  className = "",
  separator = <span className="text-gray-400">/</span>,
  lastAsLink = true,
}) => {
  const pathname = usePathname() || "/";
  const rawSegments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const { bimesterId, gradeId, sectionId, tail } = useMemo(
    () => parse(rawSegments),
    [rawSegments]
  );

  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [sectionData, setSectionData] = useState<SectionData | null>(null);

  // Fetch data (client only, no SSR mismatch porque useEffect no corre en server)
  useEffect(() => {
    let active = true;
    if (gradeId) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => active && setGradeData(d))
        .catch(() => active && setGradeData(null));
    } else {
      setGradeData(null);
    }
    return () => { active = false; };
  }, [gradeId]);

  useEffect(() => {
    let active = true;
    if (sectionId) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => active && setSectionData(d))
        .catch(() => active && setSectionData(null));
    } else {
      setSectionData(null);
    }
    return () => { active = false; };
  }, [sectionId]);

  const items: BreadcrumbItem[] = useMemo(() => {
    // Construcción determinista
    const list: BreadcrumbItem[] = [];

    // Item 0: Inicio
    list.push({ key: "/", href: "/", label: "Inicio" });

    if (bimesterId) {
      const listHref = gradeId
        ? `/grado/${bimesterId}/secciones/${gradeId}`
        : `/grado/${bimesterId}`;
      list.push({
        key: `/grado/${bimesterId}`,
        href: listHref,
        label: `Bimestre ${bimesterId}`,
      });
    }

    if (bimesterId && gradeId && (showSeccionesInsideSection || !sectionId)) {
      list.push({
        key: `/grado/${bimesterId}/secciones`,
        href: `/grado/${bimesterId}/secciones/${gradeId}`,
        label: "Secciones",
      });
    }

    if (gradeId) {
      list.push({
        key: `/grado/${bimesterId}/secciones/${gradeId}`,
        href: `/grado/${bimesterId}/secciones/${gradeId}`,
        label: gradeData
          ? `Grado ${gradeData.number}°`
          : `Grado ${gradeId}°`, // placeholder antes del fetch
      });
    }

    if (sectionId) {
      list.push({
        key: `/grado/${bimesterId}/secciones/${gradeId}/${sectionId}`,
        href: `/grado/${bimesterId}/secciones/${gradeId}/${sectionId}`,
        label: sectionData
          ? `Sección ${sectionData.letter}`
          : `Sección ${sectionId}`,
      });
    }

    if (tail?.length) {
      let base = `/grado/${bimesterId}/secciones/${gradeId}`;
      if (sectionId) base += `/${sectionId}`;
      let running = base;
      tail.forEach(t => {
        running += `/${t}`;
        const nice = t
          .replace(/[-_]/g, " ")
          .replace(/^\w/, c => c.toUpperCase());
        list.push({
          key: running,
          href: running,
          label: nice === "Consolidado" ? "Consolidado" : nice,
        });
      });
    }

    return list;
  }, [bimesterId, gradeId, gradeData, sectionId, sectionData, tail, showSeccionesInsideSection]);

  return (
    <Breadcrumb
      items={items}
      className={className}
      separator={separator}
      lastAsLink={lastAsLink}
    />
  );
};