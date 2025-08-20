"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Params = {
  bimesterId: string;
  gradeId: string;
  sectionId: string;
  sessionId: string;
};

type Competency = {
  id: number;
  session_id: number;
  number: number;
  name: string | null;
  description: string | null;
};

export default function CompetenciasPage() {
  const params = useParams() as Params;
  const { bimesterId, gradeId, sectionId, sessionId } = params;

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para agregar competencia
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal para editar competencia
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCompId, setEditCompId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  // Modal para eliminar competencia
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCompId, setDeleteCompId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar competencias
  const fetchCompetencies = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/competencies`)
      .then(r => r.json())
      .then(data => {
        setCompetencies(data);
        setLoading(false);
      })
      .catch(() => {
        setCompetencies([]);
        setLoading(false);
      });
  };
  useEffect(fetchCompetencies, [sessionId]);

  // Crear competencia
  const handleCreateCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/competencies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim() ? newName.trim() : null,
        description: newDescription.trim() ? newDescription.trim() : null,
      }),
    });
    setCreating(false);
    setModalOpen(false);
    setNewName("");
    setNewDescription("");
    fetchCompetencies();
  };

  // Editar competencia
  const openEditModal = (comp: Competency) => {
    setEditCompId(comp.id);
    setEditName(comp.name ?? "");
    setEditDescription(comp.description ?? "");
    setEditModalOpen(true);
  };

  const handleEditCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompId || editing) return;
    setEditing(true);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/competencies/${editCompId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim() ? editName.trim() : null,
        description: editDescription.trim() ? editDescription.trim() : null,
      }),
    });
    setEditing(false);
    setEditModalOpen(false);
    setEditName("");
    setEditDescription("");
    setEditCompId(null);
    fetchCompetencies();
  };

  // Eliminar competencia
  const openDeleteModal = (compId: number) => {
    setDeleteCompId(compId);
    setDeleteModalOpen(true);
  };

  const handleDeleteCompetency = async () => {
    if (!deleteCompId || deleting) return;
    setDeleting(true);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/competencies/${deleteCompId}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setDeleteCompId(null);
    fetchCompetencies();
  };

  // Mostrar nombre predeterminado
  function displayCompetencyName(comp: Competency, idx: number) {
    if (comp.name && comp.name.trim() !== "") return comp.name;
    return `C${comp.number ?? idx + 1}`;
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10 relative">
      {/* Botón fijo en la esquina superior derecha */}
      <button
        className="fixed top-6 right-8 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
        onClick={() => setModalOpen(true)}
      >
        + Agregar competencia
      </button>

      <div className="w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-6 text-center sm:text-left">
          Competencia
        </h1>
        {loading ? (
          <div className="text-gray-500 text-lg text-center py-8">Cargando competencias...</div>
        ) : (
          <>
            {competencies.length === 0 ? (
              <div className="text-gray-500 text-lg text-center py-8">
                No hay competencias registradas para esta sesión.
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {competencies.map((comp, idx) => (
                  <li key={comp.id} className="relative group">
                    <Link
                      href={`/grado/${bimesterId}/secciones/${gradeId}/${sectionId}/sesiones/${sessionId}/competencias/${comp.id}/habilidades`}
                      className="block bg-white/90 border border-indigo-200 rounded-2xl px-6 py-5 shadow-sm transition-all hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      tabIndex={0}
                    >
                      <span className="font-semibold text-lg text-indigo-900">
                        {displayCompetencyName(comp, idx)}
                      </span>
                      {comp.description && (
                        <div className="text-base text-gray-700 mt-1 break-words">{comp.description}</div>
                      )}
                    </Link>
                    {/* Botones de editar/eliminar fuera del link */}
                    <span className="absolute top-2 right-4 flex gap-2 items-center z-10">
                      {/* Editar */}
                      <button
                        className="p-2 bg-white hover:bg-yellow-100 text-gray-500 hover:text-yellow-700 rounded-full shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        title="Editar competencia"
                        onClick={() => openEditModal(comp)}
                        tabIndex={-1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L6 11.172V14h2.828l8.586-8.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M4 16v-2.828l8.586-8.586a4 4 0 015.656 5.656L9.828 18H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {/* Eliminar */}
                      <button
                        className="p-2 bg-white hover:bg-red-100 text-gray-500 hover:text-red-700 rounded-full shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="Eliminar competencia"
                        onClick={() => openDeleteModal(comp.id)}
                        tabIndex={-1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 8a1 1 0 011 1v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
                          <path d="M4 6V4a2 2 0 012-2h8a2 2 0 012 2v2" />
                          <path d="M16 6H4" />
                        </svg>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Modal para agregar competencia */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-indigo-700 text-center">Nueva competencia</h2>
            <form onSubmit={handleCreateCompetency} className="flex flex-col gap-3">
              <label>
                <span className="text-gray-800">Nombre de la competencia (opcional):</span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  disabled={creating}
                  maxLength={100}
                  placeholder="Si se deja vacío, será C1, C2..."
                  autoFocus
                />
              </label>
              <label>
                <span className="text-gray-800">Descripción (opcional):</span>
                <textarea
                  className="mt-2 block w-full border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  disabled={creating}
                  maxLength={300}
                  placeholder="Breve descripción de la competencia"
                  rows={2}
                />
              </label>
              <div className="flex gap-3 mt-2 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:bg-indigo-400"
                  type="submit"
                  disabled={creating}
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar competencia */}
      {editModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-yellow-700 text-center">Editar competencia</h2>
            <form onSubmit={handleEditCompetency} className="flex flex-col gap-3">
              <label>
                <span className="text-gray-800">Nombre de la competencia (opcional):</span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-yellow-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={editing}
                  maxLength={100}
                  placeholder="Si se deja vacío, será C1, C2..."
                  autoFocus
                />
              </label>
              <label>
                <span className="text-gray-800">Descripción (opcional):</span>
                <textarea
                  className="mt-2 block w-full border border-yellow-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  disabled={editing}
                  maxLength={300}
                  placeholder="Breve descripción de la competencia"
                  rows={2}
                />
              </label>
              <div className="flex gap-3 mt-2 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editing}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition disabled:bg-yellow-400"
                  type="submit"
                  disabled={editing}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para eliminar competencia */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar competencia</h2>
            <p className="text-center">¿Estás seguro que quieres eliminar esta competencia?</p>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:bg-red-400"
                type="button"
                onClick={handleDeleteCompetency}
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