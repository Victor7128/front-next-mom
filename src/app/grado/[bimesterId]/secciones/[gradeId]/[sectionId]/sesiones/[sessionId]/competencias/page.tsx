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
    fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionId}/competencies`)
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionId}/competencies`, {
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/competencies/${editCompId}`, {
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/competencies/${deleteCompId}`, {
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
    <main className="min-h-screen bg-white py-12 px-8 relative">
      {/* Botón fijo en la esquina superior derecha */}
      <button
        className="fixed top-6 right-8 bg-blue-600 text-white px-5 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition z-50 cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        + Agregar competencia
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Competencias de la sesión
      </h1>
      {loading ? (
        <div className="text-gray-500">Cargando competencias...</div>
      ) : (
        <>
          {competencies.length === 0 ? (
            <div className="text-gray-500 mb-8">
              No hay competencias registradas para esta sesión.
            </div>
          ) : (
            <ul className="flex flex-col gap-4 max-w-2xl">
              {competencies.map((comp, idx) => (
                <li key={comp.id} className="relative group">
                  <Link
                    href={`/grado/${bimesterId}/secciones/${gradeId}/${sectionId}/sesiones/${sessionId}/competencias/${comp.id}/habilidades`}
                    className="block bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm transition"
                    tabIndex={0}
                  >
                    <span className="font-semibold text-lg">
                      {displayCompetencyName(comp, idx)}
                    </span>
                    {comp.description && (
                      <div className="text-sm text-gray-600 mt-1">{comp.description}</div>
                    )}
                  </Link>
                  {/* Botones de editar/eliminar fuera del link */}
                  <span className="absolute top-2 right-4 flex gap-2 items-center z-10">
                    {/* Editar */}
                    <button
                      className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded transition cursor-pointer"
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
                      className="text-red-600 hover:text-red-900 px-2 py-1 rounded transition cursor-pointer"
                      title="Eliminar competencia"
                      onClick={() => openDeleteModal(comp.id)}
                      tabIndex={-1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 8a1 1 0 011 1v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
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

      {/* Modal para agregar competencia */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Nueva competencia</h2>
            <form onSubmit={handleCreateCompetency}>
              <label className="block mb-4">
                <span className="text-gray-800">
                  Nombre de la competencia (opcional):
                </span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  disabled={creating}
                  maxLength={100}
                  placeholder="Si se deja vacío, será C1, C2..."
                />
              </label>
              <label className="block mb-2">
                <span className="text-gray-800">
                  Descripción (opcional):
                </span>
                <textarea
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  disabled={creating}
                  maxLength={300}
                  placeholder="Breve descripción de la competencia"
                  rows={2}
                />
              </label>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-bold cursor-pointer"
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
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Editar competencia</h2>
            <form onSubmit={handleEditCompetency}>
              <label className="block mb-4">
                <span className="text-gray-800">
                  Nombre de la competencia (opcional):
                </span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={editing}
                  maxLength={100}
                  placeholder="Si se deja vacío, será C1, C2..."
                />
              </label>
              <label className="block mb-2">
                <span className="text-gray-800">
                  Descripción (opcional):
                </span>
                <textarea
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  disabled={editing}
                  maxLength={300}
                  placeholder="Breve descripción de la competencia"
                  rows={2}
                />
              </label>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editing}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-bold cursor-pointer"
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
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-700">Eliminar competencia</h2>
            <p>¿Estás seguro que quieres eliminar esta competencia?</p>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold cursor-pointer"
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