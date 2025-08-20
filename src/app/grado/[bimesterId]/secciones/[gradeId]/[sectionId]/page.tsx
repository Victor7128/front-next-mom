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

function toRoman(num: number): string {
  if (isNaN(num) || num <= 0) return "";
  const romans = [
    ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
    ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
    ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]
  ];
  let res = "";
  for (const [letter, n] of romans) {
    const value = Number(n);
    while (num >= value) {
      res += letter;
      num -= value;
    }
  }
  return res;
}

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
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}`)
        .then(res => res.json())
        .then(setSection)
        .catch(() => setSection(null));
    }
  }, [sectionId]);

  useEffect(() => {
    if (gradeId) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}`)
        .then(res => res.json())
        .then(setGrade)
        .catch(() => setGrade(null));
    }
  }, [gradeId]);

  // Para mostrar el título: III Bimestre 3° C
  function getHeaderTitle() {
    const bimRoman = toRoman(Number(bimesterId));
    const gradoNumero = grade ? grade.number : "";
    const letter = section ? section.letter : "";
    if (bimRoman && gradoNumero && letter) return `${bimRoman} Bimestre ${gradoNumero}° ${letter}`;
    if (bimRoman && gradoNumero) return `${bimRoman} Bimestre ${gradoNumero}°`;
    if (bimRoman) return `${bimRoman} Bimestre`;
    return "Sección";
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-xl mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-3 text-center sm:text-left">
          {getHeaderTitle()}
        </h1>
        {/* Si quieres una línea secundaria con info detallada, puedes dejar esto:
        <div className="text-gray-700 text-lg text-center sm:text-left">
          {grade && (
            <span className="mr-4">
              Grado: <b>{grade.number}°</b>
            </span>
          )}
          {bimesterId && (
            <span>
              Bimestre: <b>{toRoman(Number(bimesterId))}</b>
            </span>
          )}
        </div>
        */}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-7 w-full max-w-2xl">
        {cards.map(card => (
          <li key={card.key}>
            <Link
              href={card.href(bimesterId, gradeId, sectionId)}
              className="h-full rounded-2xl bg-white/90 border border-indigo-200 shadow-sm p-8 flex flex-col items-center text-center transition-all hover:shadow-xl hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer no-underline focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label={`Ir a ${card.label} de la sección`}
            >
              {card.icon && <span className="mb-4">{card.icon}</span>}
              <span className="text-xl font-semibold text-indigo-800">{card.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}