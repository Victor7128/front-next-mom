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

  const { setMany, getLabel } = useLabelRegistry();   // <-- Hook dentro del componente

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
    fetch(`https://backend-web-mom-3dmj.shuttle.app/grades/${gradeId}/sections`)
      .then(r => r.json())
      .then(setSections)
      .catch(() => setSections([]));

    fetch(`https://backend-web-mom-3dmj.shuttle.app/grades/${gradeId}`)
      .then(r => r.json())
      .then(setGrade)
      .catch(() => setGrade(null));
  }, [gradeId]);

  // Registrar labels en cuanto tengamos info
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/grades/${gradeId}/sections`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ letter: selectedLetter })
    });
    setAdding(false);
    setModalOpen(false);
    setSelectedLetter("");
    // Refetch
    fetch(`https://backend-web-mom-3dmj.shuttle.app/grades/${gradeId}/sections`)
      .then(r => r.json())
      .then(setSections)
      .catch(() => setSections([]));
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete || deleting) return;
    setDeleting(true);
    const res = await fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionToDelete.id}`, { method: "DELETE" });
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
    <main className="min-h-screen bg-white p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">
          Secciones de {getLabel(gradeId) ?? `Grado ${gradeId}`} ({getLabel(bimesterId) ?? `Bimestre ${bimesterId}`})
        </h1>
        <button
          className="bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-bold shadow hover:bg-blue-700 transition"
          onClick={() => setModalOpen(true)}
          disabled={adding}
        >
          + Sección
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-gray-500 text-sm">No hay secciones para este grado.</div>
      ) : (
        <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          {sections.map(sec => (
            <li
              key={sec.id}
              className="bg-white border border-gray-300 rounded-xl shadow-md p-6 pt-8 flex flex-col items-center w-full sm:w-64 relative cursor-pointer transition hover:scale-[1.03] hover:shadow-lg"
              onClick={e => handleCardClick(sec, e)}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") handleCardClick(sec, e as any);
              }}
              aria-label={`Ir a la sección ${sec.letter}`}
              role="button"
            >
              <button
                className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-red-100 text-gray-500 hover:text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500 z-10"
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
              <span className="text-lg font-semibold text-gray-800 mt-2 z-10">
                Sección {sec.letter}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Modal crear */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold">Nueva Sección</h2>
            <label className="block text-sm">
              <span className="text-gray-800">Letra de sección:</span>
              <select
                className="mt-2 block w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={selectedLetter}
                onChange={e => setSelectedLetter(e.target.value)}
              >
                <option value="">Selecciona</option>
                {availableLetters.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 text-sm" onClick={() => setModalOpen(false)} disabled={adding}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white font-bold text-sm" onClick={handleAddSection} disabled={!selectedLetter || adding}>
                {adding ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteModalOpen && sectionToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-red-700">Eliminar sección</h2>
            <p className="text-sm text-gray-800">
              ¿Eliminar la sección <b>{sectionToDelete.letter}</b>?<br />
              <span className="text-red-600">Esta acción eliminará datos relacionados.</span>
            </p>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200 text-sm" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded bg-red-600 text-white font-bold text-sm" onClick={handleDeleteSection} disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}