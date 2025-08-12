"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Puedes importar un icono de delete desde Heroicons o usar SVG directamente
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="h-6 w-6"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-1 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7m5-4v4M9 7V3m6 4V3" />
  </svg>
);

type Grade = {
  id: number;
  bimester_id: number;
  number: number;
};

export default function GradoPage() {
  const params = useParams();
  const bimesterId = params?.bimesterId as string;

  const [grades, setGrades] = useState<Grade[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [gradeNumber, setGradeNumber] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<Grade | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar grados al montar y cuando se crea o elimina uno
  const fetchGrades = () => {
    fetch(`http://127.0.0.1:8000/bimesters/${bimesterId}/grades`)
      .then((res) => res.json())
      .then(setGrades)
      .catch(() => setGrades([]));
  };

  useEffect(() => {
    if (bimesterId) fetchGrades();
    // eslint-disable-next-line
  }, [bimesterId]);

  // Crear nuevo grado
  const handleCreateGrade = async () => {
    if (!gradeNumber || creating) return;
    setCreating(true);
    await fetch(`http://127.0.0.1:8000/bimesters/${bimesterId}/grades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: gradeNumber }),
    });
    setCreating(false);
    setModalOpen(false);
    setGradeNumber("");
    fetchGrades();
  };

  // Eliminar grado
  const handleDeleteGrade = async () => {
    if (!gradeToDelete || deleting) return;
    setDeleting(true);

    try {
      console.log("Eliminando grado:", gradeToDelete);
      const response = await fetch(`http://127.0.0.1:8000/grades/${gradeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log("Grado eliminado correctamente");
        setDeleteModalOpen(false);
        setGradeToDelete(null);
        fetchGrades();
      } else {
        console.error("Error eliminando grado", response.status, await response.text());
        alert("No se pudo eliminar el grado");
      }
    } catch (error) {
      console.error("Error de red eliminando grado", error);
      alert("Error de red eliminando grado");
    } finally {
      setDeleting(false);
    }
  };

  // Números ya utilizados
  const usedNumbers = new Set(grades.map((g) => g.number));

  // Opciones de grado típicos (puedes ajustar)
  const gradoOptions = [1, 2, 3, 4, 5, 6];

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Grados del Bimestre {bimesterId}</h1>
        <button
          className="bg-blue-600 text-white rounded-full px-4 py-2 text-lg font-bold shadow hover:bg-blue-700 transition cursor-pointer"
          onClick={() => setModalOpen(true)}
          title="Agregar nuevo grado"
        >
          + Grado
        </button>
      </div>

      {grades.length === 0 ? (
        <div className="text-gray-500 text-lg">
          No hay grados registrados para este bimestre.
        </div>
      ) : (
        <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          {grades.map((g) => (
            <li
              key={g.id}
              className="bg-white border border-gray-300 rounded-xl shadow-md p-6 flex flex-col items-center w-full sm:w-64 relative"
            >
              <a
                href={`/grado/${bimesterId}/secciones/${g.id}`}
                className="absolute inset-0 z-0"
                style={{ cursor: "pointer" }}
                aria-label={`Ir a secciones del grado ${g.number}`}
              />
              <span className="text-lg font-semibold text-gray-800">
                {g.number}°
              </span>
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition cursor-pointer"
                title="Eliminar grado"
                onClick={() => {
                  setGradeToDelete(g);
                  setDeleteModalOpen(true);
                }}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal para agregar grado */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 cursor-pointer"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Nuevo Grado</h2>
            <label className="block">
              <span className="text-gray-800">Número de grado:</span>
              <select
                className="mt-2 block w-full border border-gray-300 rounded px-2 py-1 cursor-pointer"
                value={gradeNumber}
                onChange={(e) => setGradeNumber(Number(e.target.value))}
              >
                <option value="" className="cursor-pointer">Selecciona</option>
                {gradoOptions.map((num) =>
                  usedNumbers.has(num) ? null : (
                    <option key={num} value={num} className="cursor-pointer">
                      {num}°
                    </option>
                  )
                )}
              </select>
            </label>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setModalOpen(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-bold cursor-pointer"
                onClick={handleCreateGrade}
                disabled={!gradeNumber || creating}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {deleteModalOpen && gradeToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-700">Eliminar grado</h2>
            <div className="text-gray-800">
              ¿Estás seguro de que deseas eliminar el grado <b>{gradeToDelete.number}°</b>?<br />
              <span className="text-red-600">Esto eliminará toda la información asociada a este grado, incluyendo secciones, alumnos, sesiones, competencias y evaluaciones.</span>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold cursor-pointer"
                onClick={handleDeleteGrade}
                disabled={deleting}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}