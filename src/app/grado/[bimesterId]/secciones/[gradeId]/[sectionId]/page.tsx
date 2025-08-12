"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

type CardDef = {
  key: string;
  label: string;
  href: (bimesterId: string, gradeId: string, sectionId: string) => string;
  icon?: React.ReactNode;
};

const cards: CardDef[] = [
  {
    key: "alumnos",
    label: "Alumnos",
    href: (b, g, s) => `/grado/${b}/secciones/${g}/${s}/alumnos`,
  },
  {
    key: "sesiones",
    label: "Sesiones",
    href: (b, g, s) => `/grado/${b}/secciones/${g}/${s}/sesiones`,
  },
  {
    key: "consolidado",
    label: "Consolidado",
    href: (b, g, s) => `/grado/${b}/secciones/${g}/${s}/consolidado`,
  },
];

type Section = {
  id: number;
  grade_id: number;
  letter: string;
};

type Grade = {
  id: number;
  bimester_id: number;
  number: number;
};

export default function SeccionMenuPage() {
  const params = useParams();
  const bimesterId = params?.bimesterId as string;
  const gradeId = params?.gradeId as string;
  const sectionId = params?.sectionId as string;

  const [section, setSection] = useState<Section | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);

  // Cargar datos de sección y grado
  useEffect(() => {
    if (sectionId) {
      fetch(`http://127.0.0.1:8000/sections/${sectionId}`)
        .then(res => res.json())
        .then(setSection)
        .catch(() => setSection(null));
    }
  }, [sectionId]);

  useEffect(() => {
    if (gradeId) {
      fetch(`http://127.0.0.1:8000/grades/${gradeId}`)
        .then(res => res.json())
        .then(setGrade)
        .catch(() => setGrade(null));
    }
  }, [gradeId]);

  return (
    <main className="min-h-screen bg-white py-12 px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Opciones de la Sección {section ? section.letter : "?"}
        </h1>
        <div className="text-gray-700">
          {grade && (
            <span className="mr-4">
              Grado: <b>{grade.number}°</b>
            </span>
          )}
          {bimesterId && (
            <span>
              Bimestre: <b>{bimesterId}</b>
            </span>
          )}
        </div>
      </div>
      <ul className="flex flex-col sm:flex-row gap-8 justify-center items-center">
        {cards.map(card => (
          <Link
            key={card.key}
            href={card.href(bimesterId, gradeId, sectionId)}
            className="w-full sm:w-64 bg-white border border-gray-300 rounded-xl shadow-md p-8 flex flex-col items-center transition hover:scale-105 hover:shadow-lg cursor-pointer no-underline"
            aria-label={`Ir a ${card.label} de la sección`}
          >
            {card.icon && <span className="mb-4">{card.icon}</span>}
            <span className="text-xl font-semibold text-gray-900">{card.label}</span>
          </Link>
        ))}
      </ul>
    </main>
  );
}