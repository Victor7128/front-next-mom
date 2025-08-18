"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Params = {
  bimesterId: string;
  gradeId: string;
  sectionId: string;
  sessionId: string;
};

type Bimester = { id: number; name: string; };
type Grade = { id: number; bimester_id: number; number: number; };
type Section = { id: number; grade_id: number; letter: string; };
type Session = { id: number; section_id: number; number: number; title: string; date?: string };
type Product = { id: number; session_id: number; number: number; name?: string | null; description?: string | null; };

// Nuevo orden: Producto, Competencias, Evaluación
const cards = [
  {
    key: "productos",
    label: "Producto",
    href: (b: string, g: string, s: string, sessionId: string) => `/grado/${b}/secciones/${g}/${s}/sesiones/${sessionId}/productos`,
    icon: "📝",
  },
  {
    key: "competencias",
    label: "Competencias",
    href: (b: string, g: string, s: string, sessionId: string) => `/grado/${b}/secciones/${g}/${s}/sesiones/${sessionId}/competencias`,
    icon: "🏆",
  },
  {
    key: "evaluacion",
    label: "Evaluación",
    href: (b: string, g: string, s: string, sessionId: string) => `/grado/${b}/secciones/${g}/${s}/sesiones/${sessionId}/evaluacion`,
    icon: "📊",
  },
];

export default function DetalleSesionPage() {
  const params = useParams() as Params;
  const bimesterId = params?.bimesterId;
  const gradeId = params?.gradeId;
  const sectionId = params?.sectionId;
  const sessionId = params?.sessionId;

  const [bimester, setBimester] = useState<Bimester | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Cargar datos
  useEffect(() => {
    if (sectionId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}`)
        .then(r => r.json())
        .then(setSection)
        .catch(() => setSection(null));
  }, [sectionId]);

  useEffect(() => {
    if (gradeId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}`)
        .then(r => r.json())
        .then(setGrade)
        .catch(() => setGrade(null));
  }, [gradeId]);

  useEffect(() => {
    if (grade && grade.bimester_id)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bimesters/${grade.bimester_id}`)
        .then(r => r.json())
        .then(setBimester)
        .catch(() => setBimester(null));
  }, [grade]);

  useEffect(() => {
    if (sessionId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}`)
        .then(r => r.json())
        .then(setSession)
        .catch(() => setSession(null));
  }, [sessionId]);

  // Cargar productos de la sesión
  useEffect(() => {
    if (sessionId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/products`)
        .then(r => r.json())
        .then(setProducts)
        .catch(() => setProducts([]));
  }, [sessionId]);

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      <div className="w-full max-w-2xl mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-3 text-center sm:text-left">
          {session?.title ?? ""}
        </h1>
        <div className="text-gray-700 text-lg text-center sm:text-left mb-2">
          {session?.date && (
            <span className="mr-4">
              Fecha: <b>{session.date.slice(0, 10)}</b>
            </span>
          )}
          {section && (
            <span className="mr-4">
              Sección: <b>{section.letter}</b>
            </span>
          )}
          {grade && (
            <span className="mr-4">
              Grado: <b>{grade.number}°</b>
            </span>
          )}
          {bimester && (
            <span>
              Bimestre: <b>{bimester.name}</b>
            </span>
          )}
        </div>
      </div>

      {/* Tarjetas de navegación */}
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-7 w-full max-w-2xl">
        {cards.map(card => (
          <li key={card.key}>
            <Link
              href={card.href(bimesterId, gradeId, sectionId, sessionId)}
              className="h-full rounded-2xl bg-white/90 border border-indigo-200 shadow-sm p-10 flex flex-col items-center text-center transition-all hover:shadow-xl hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer no-underline focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label={`Ir a ${card.label} de la sesión`}
            >
              <span className="mb-4 text-5xl">{card.icon}</span>
              <span className="text-xl font-semibold text-indigo-800">{card.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}