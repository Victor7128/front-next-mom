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
      fetch(`http://127.0.0.1:8000/sections/${sectionId}`)
        .then(r => r.json())
        .then(setSection)
        .catch(() => setSection(null));
  }, [sectionId]);

  useEffect(() => {
    if (gradeId)
      fetch(`http://127.0.0.1:8000/grades/${gradeId}`)
        .then(r => r.json())
        .then(setGrade)
        .catch(() => setGrade(null));
  }, [gradeId]);

  useEffect(() => {
    if (grade && grade.bimester_id)
      fetch(`http://127.0.0.1:8000/bimesters/${grade.bimester_id}`)
        .then(r => r.json())
        .then(setBimester)
        .catch(() => setBimester(null));
  }, [grade]);

  useEffect(() => {
    if (sessionId)
      fetch(`http://127.0.0.1:8000/sessions/${sessionId}`)
        .then(r => r.json())
        .then(setSession)
        .catch(() => setSession(null));
  }, [sessionId]);

  // Cargar productos de la sesión
  useEffect(() => {
    if (sessionId)
      fetch(`http://127.0.0.1:8000/sessions/${sessionId}/products`)
        .then(r => r.json())
        .then(setProducts)
        .catch(() => setProducts([]));
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-white py-12 px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {session?.title ?? ""}
        </h1>
        <div className="text-gray-700 mb-2">
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

      {/* Tarjeta de producto */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-700 mb-2">Producto(s) a evaluar</h2>
        {products.length === 0 ? (
          <div className="text-gray-500 italic">No hay productos registrados para esta sesión.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map(product => (
              <li key={product.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <span className="font-semibold text-gray-800 text-lg">{product.name || `Producto ${product.number}`}</span>
                </div>
                {product.description && (
                  <div className="text-gray-600 mt-2">{product.description}</div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link
            href={`/grado/${bimesterId}/secciones/${gradeId}/${sectionId}/sesiones/${sessionId}/productos`}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition text-sm font-bold no-underline"
          >
            Gestionar productos
          </Link>
        </div>
      </div>

      {/* Tarjetas de navegación */}
      <ul className="flex flex-col sm:flex-row gap-8 justify-center items-center">
        {cards.map(card => (
          <Link
            key={card.key}
            href={card.href(bimesterId, gradeId, sectionId, sessionId)}
            className="w-full sm:w-64 bg-white border border-gray-300 rounded-xl shadow-md p-8 flex flex-col items-center transition hover:scale-105 hover:shadow-lg cursor-pointer no-underline"
            aria-label={`Ir a ${card.label} de la sesión`}
          >
            <span className="mb-4 text-4xl">{card.icon}</span>
            <span className="text-xl font-semibold text-gray-900">{card.label}</span>
          </Link>
        ))}
      </ul>
    </main>
  );
}