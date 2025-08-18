"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { useLabelRegistry } from "@/app/context/LabelRegistryContext";

type Section = { id: number; grade_id: number; letter: string };
type Grade = { id: number; bimester_id: number; number: number };

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-1 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7m5-4v4M9 7V3m6 4V3" />
  </svg>
);

export default function SeccionesPage() {
  const params = useParams();
  const router = useRouter();
  const bimesterId = params?.bimesterId as string;
  const gradeId = params?.gradeId as string;

  const { setMany, getLabel } = useLabelRegistry();

  const [sections, setSections] = useState<Section[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [adding, setAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!gradeId) return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}/sections`)
      .then(r => r.json())
      .then(setSections)
      .catch(() => setSections([]));

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}`)
      .then(r => r.json())
      .then(setGrade)
      .catch(() => setGrade(null));
  }, [gradeId]);

  useEffect(() => {
    if (bimesterId && gradeId) {
      setMany({
        [bimesterId]: `Bimestre ${bimesterId}`,
        [gradeId]: grade ? `Grado ${grade.number}°` : `Grado ${gradeId}`
      });
    }
  }, [bimesterId, gradeId, grade, setMany]);

  const usedLetters = new Set(sections.map(s => s.letter));
  const availableLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .filter(l => !usedLetters.has(l));

  const handleAddSection = async () => {
    if (!selectedLetter || adding) return;
    setAdding(true);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}/sections`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ letter: selectedLetter })
    });
    setAdding(false);
    setModalOpen(false);
    setSelectedLetter("");
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}/sections`)
      .then(r => r.json())
      .then(setSections)
      .catch(() => setSections([]));
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete || deleting) return;
    setDeleting(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionToDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteModalOpen(false);
    setSectionToDelete(null);
    if (res.ok) {
      setSections(prev => prev.filter(s => s.id !== sectionToDelete.id));
    } else {
      alert("No se pudo eliminar la sección");
    }
  };

  const handleCardClick = (sec: Section, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    router.push(`/grado/${bimesterId}/secciones/${gradeId}/${sec.id}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 text-center sm:text-left tracking-tight">
            Secciones de {getLabel(gradeId) ?? `Grado ${gradeId}`}{" "}
            <span className="text-indigo-400">
              ({getLabel(bimesterId) ?? `Bimestre ${bimesterId}`})
            </span>
          </h1>
          <button
            className="bg-indigo-600 text-white rounded-full px-6 py-2 text-lg font-semibold shadow hover:bg-indigo-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-95"
            onClick={() => setModalOpen(true)}
            disabled={adding}
          >
            + Sección
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="text-gray-500 text-lg text-center py-10">
            No hay secciones para este grado.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {sections.map(sec => (
              <li
                key={sec.id}
                className="bg-white/90 border border-indigo-200 rounded-2xl shadow-sm p-7 flex flex-col items-center relative cursor-pointer group transition-all hover:shadow-xl"
                onClick={e => handleCardClick(sec, e)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") handleCardClick(sec, e as any);
                }}
                aria-label={`Ir a la sección ${sec.letter}`}
                role="button"
              >
                <button
                  className="absolute top-4 right-4 p-1 rounded-full bg-white hover:bg-red-100 text-gray-400 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 z-10"
                  title="Eliminar sección"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSectionToDelete(sec);
                    setDeleteModalOpen(true);
                  }}
                >
                  <TrashIcon />
                </button>
                <span className="text-2xl font-semibold text-indigo-800 mt-2 z-10">
                  Sección {sec.letter}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Modal crear */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 cursor-pointer" onClick={() => setModalOpen(false)}>
            <div className="bg-white rounded-2xl p-8 shadow-2xl min-w-[300px] w-full max-w-xs flex flex-col gap-5 cursor-default" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-2 text-indigo-700 text-center">Nueva Sección</h2>
              <label className="block text-lg font-medium">
                <span className="text-gray-800">Letra de sección:</span>
                <select
                  className="mt-2 block w-full border border-indigo-200 rounded-lg px-3 py-2 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={selectedLetter}
                  onChange={e => setSelectedLetter(e.target.value)}
                  autoFocus
                >
                  <option value="">Selecciona</option>
                  {availableLetters.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <div className="flex gap-3 justify-end mt-2">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition" onClick={() => setModalOpen(false)} disabled={adding}>
                  Cancelar
                </button>
                <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:bg-indigo-400" onClick={handleAddSection} disabled={!selectedLetter || adding}>
                  {adding ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal eliminar */}
        {deleteModalOpen && sectionToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 cursor-pointer" onClick={() => setDeleteModalOpen(false)}>
            <div className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar sección</h2>
              <p className="text-lg text-gray-800 text-center">
                ¿Eliminar la sección <b>{sectionToDelete.letter}</b>?<br />
                <span className="text-red-600 text-sm block mt-2">
                  Esta acción eliminará datos relacionados.
                </span>
              </p>
              <div className="flex gap-3 justify-end mt-2">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                  Cancelar
                </button>
                <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:bg-red-400" onClick={handleDeleteSection} disabled={deleting}>
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}