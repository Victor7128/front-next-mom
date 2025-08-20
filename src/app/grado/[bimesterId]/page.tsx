"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Icono de eliminar (Heroicons)
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
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bimesters/${bimesterId}/grades`)
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bimesters/${bimesterId}/grades`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setGradeToDelete(null);
        fetchGrades();
      } else {
        alert("No se pudo eliminar el grado");
      }
    } catch (error) {
      alert("Error de red eliminando grado");
    } finally {
      setDeleting(false);
    }
  };

  // Números ya utilizados
  const usedNumbers = new Set(grades.map((g) => g.number));

  // Opciones de grado típicos (puedes ajustar)
  const gradoOptions = [1, 2, 3, 4, 5, 6];

  function toRoman(num: number): string {
    if (num <= 0 || num > 3999) return num.toString(); // Límite básico
    const romans = [
      ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
      ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
      ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]
    ];
    let res = "";
    for (const [letter, n] of romans) {
      const value = n as number;
      while (num >= value) {
        res += letter;
        num -= value;
      }
    }
    return res;
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 text-center sm:text-left tracking-tight">
            {toRoman(Number(bimesterId))} Bimestre
          </h1>
          <button
            className="bg-indigo-600 text-white rounded-full px-6 py-2 text-lg font-semibold shadow hover:bg-indigo-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-95"
            onClick={() => setModalOpen(true)}
            title="Agregar nuevo grado"
          >
            + Grado
          </button>
        </div>

        {grades.length === 0 ? (
          <div className="text-gray-500 text-lg text-center py-10">
            No hay grados registrados para este bimestre.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {grades.map((g) => (
              <li
                key={g.id}
                className="relative bg-white/90 border border-indigo-200 rounded-2xl shadow-sm p-7 flex flex-col items-center group transition-all hover:shadow-xl"
              >
                {/* Capa clickeable para ir a secciones */}
                <a
                  href={`/grado/${bimesterId}/secciones/${g.id}`}
                  className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  style={{ cursor: "pointer" }}
                  aria-label={`Ir a secciones del grado ${g.number}`}
                />
                <span className="text-2xl font-semibold text-indigo-800 z-10">
                  {g.number}°
                </span>
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition z-20 bg-white rounded-full p-1 shadow hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
                  title="Eliminar grado"
                  onClick={(e) => {
                    e.stopPropagation();
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
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 cursor-pointer"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 shadow-2xl min-w-[300px] w-full max-w-xs flex flex-col gap-5 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-2 text-indigo-700 text-center">Nuevo Grado</h2>
              <label className="block">
                <span className="text-gray-800 font-medium">Número de grado:</span>
                <select
                  className="mt-2 block w-full border border-indigo-200 rounded-lg px-3 py-2 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={gradeNumber}
                  onChange={(e) => setGradeNumber(Number(e.target.value))}
                  autoFocus
                >
                  <option value="">Selecciona</option>
                  {gradoOptions.map((num) =>
                    usedNumbers.has(num) ? null : (
                      <option key={num} value={num}>
                        {num}°
                      </option>
                    )
                  )}
                </select>
              </label>
              <div className="flex gap-3 mt-2 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:bg-indigo-400"
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
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
            onClick={() => setDeleteModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar grado</h2>
              <div className="text-gray-800 text-center">
                ¿Estás seguro de que deseas eliminar el grado <b>{gradeToDelete.number}°</b>?<br />
                <span className="text-red-600 text-sm block mt-2">
                  Esta acción eliminará toda la información asociada a este grado, incluyendo secciones, alumnos, sesiones, competencias y evaluaciones.
                </span>
              </div>
              <div className="flex gap-3 mt-2 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:bg-red-400"
                  onClick={handleDeleteGrade}
                  disabled={deleting}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}