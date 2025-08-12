"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Params = {
  sessionId: string;
  competencyId: string;
};

type Criterion = {
  id: number;
  competency_id: number;
  number: number;
  name: string | null;
  description: string | null;
};

export default function CriteriosPage() {
  const params = useParams() as Params;
  const { sessionId, competencyId } = params;
  const [criterios, setCriterios] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para agregar criterio
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal para editar criterio
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  // Modal para eliminar criterio
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar criterios
  const fetchCriterios = () => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/competencies/${competencyId}/criteria`)
      .then(r => r.json())
      .then(data => {
        setCriterios(data);
        setLoading(false);
      })
      .catch(() => {
        setCriterios([]);
        setLoading(false);
      });
  };

  useEffect(fetchCriterios, [competencyId]);

  // Genera nombre por defecto (C1, C2, ...)
  function getDefaultName() {
    // Encuentra el primer nombre del tipo C{n} no usado
    let i = 1;
    const nombresUsados = new Set(
      criterios.map(c => (c.name ? c.name.trim().toUpperCase() : ""))
    );
    while (nombresUsados.has(`C${i}`)) i++;
    return `C${i}`;
  }

  // Crear criterio
  const handleCreateCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    let nombreFinal = newName.trim();
    if (!nombreFinal) {
      nombreFinal = getDefaultName();
    }
    // Valida que no se repita el nombre
    if (
      criterios.some(
        c => c.name && c.name.trim().toUpperCase() === nombreFinal.toUpperCase()
      )
    ) {
      alert("Ya existe un criterio con ese nombre.");
      setCreating(false);
      return;
    }
    setCreating(true);
    await fetch(`http://127.0.0.1:8000/competencies/${competencyId}/criteria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nombreFinal,
        description: newDesc.trim() || null,
      }),
    });
    setCreating(false);
    setModalOpen(false);
    setNewName("");
    setNewDesc("");
    fetchCriterios();
  };

  // Abrir modal de edición
  const openEditModal = (c: Criterion) => {
    setEditId(c.id);
    setEditName(c.name ?? "");
    setEditDesc(c.description ?? "");
    setEditModalOpen(true);
  };

  // Editar criterio
  const handleEditCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing || editId === null) return;
    let nombreFinal = editName.trim();
    if (!nombreFinal) {
      nombreFinal = getDefaultName();
    }
    // Valida que no se repita el nombre
    if (
      criterios.some(
        c => c.id !== editId &&
          c.name &&
          c.name.trim().toUpperCase() === nombreFinal.toUpperCase()
      )
    ) {
      alert("Ya existe un criterio con ese nombre.");
      setEditing(false);
      return;
    }
    setEditing(true);
    await fetch(`http://127.0.0.1:8000/criteria/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nombreFinal,
        description: editDesc.trim() || null,
      }),
    });
    setEditing(false);
    setEditModalOpen(false);
    setEditId(null);
    setEditName("");
    setEditDesc("");
    fetchCriterios();
  };

  // Abrir modal de eliminar
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  // Eliminar criterio
  const handleDeleteCriterion = async () => {
    if (deleting || deleteId === null) return;
    setDeleting(true);
    await fetch(`http://127.0.0.1:8000/criteria/${deleteId}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setDeleteId(null);
    fetchCriterios();
  };

  return (
    <main className="min-h-screen bg-white py-12 px-8 relative">
      {/* Botón para agregar criterio */}
      <button
        className="fixed top-6 right-8 bg-green-600 text-white px-5 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition z-50 cursor-pointer"
        onClick={() => {
          setModalOpen(true);
          setNewName(""); // Limpiar al abrir
          setNewDesc("");
        }}
      >
        + Agregar criterio
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Criterios de la competencia
      </h1>
      {loading ? (
        <div className="text-gray-500">Cargando criterios...</div>
      ) : (
        <ul className="flex flex-col gap-4 max-w-2xl">
          {criterios.length === 0 ? (
            <div className="text-gray-500 mb-8">
              No hay criterios registrados para esta competencia.
            </div>
          ) : (
            criterios.map((cr) => (
              <li
                key={cr.id}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-green-700">
                    {cr.name || <i>Sin nombre</i>}
                  </span>
                  <br />
                  <span className="font-bold text-green-700">
                    Descripción:
                  </span>{" "}
                  <span className="text-gray-600 text-sm">
                    {cr.description}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded transition cursor-pointer"
                    title="Editar criterio"
                    onClick={() => openEditModal(cr)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L6 11.172V14h2.828l8.586-8.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M4 16v-2.828l8.586-8.586a4 4 0 015.656 5.656L9.828 18H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 px-2 py-1 rounded transition cursor-pointer"
                    title="Eliminar criterio"
                    onClick={() => openDeleteModal(cr.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 8a1 1 0 011 1v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
                      <path d="M4 6V4a2 2 0 012-2h8a2 2 0 012 2v2" />
                      <path d="M16 6H4" />
                    </svg>
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Modal para agregar criterio */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Nuevo criterio</h2>
            <form onSubmit={handleCreateCriterion}>
              <label className="block mb-2">
                <span className="text-gray-800">Nombre del criterio:</span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  disabled={creating}
                  maxLength={100}
                  placeholder={`Ej: ${getDefaultName()}`}
                />
              </label>
              <label className="block mb-2">
                <span className="text-gray-800">Descripción:</span>
                <textarea
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  disabled={creating}
                  maxLength={300}
                  placeholder="Opcional"
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
                  className="px-4 py-2 rounded bg-green-600 text-white font-bold cursor-pointer"
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

      {/* Modal para editar criterio */}
      {editModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Editar criterio</h2>
            <form onSubmit={handleEditCriterion}>
              <label className="block mb-2">
                <span className="text-gray-800">Nombre del criterio:</span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={editing}
                  maxLength={100}
                  placeholder={`Ej: ${getDefaultName()}`}
                />
              </label>
              <label className="block mb-2">
                <span className="text-gray-800">Descripción:</span>
                <textarea
                  className="mt-2 block w-full border border-gray-300 rounded px-2 py-1 "
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  disabled={editing}
                  maxLength={300}
                  placeholder="Opcional"
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

      {/* Modal para eliminar criterio */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-700">Eliminar criterio</h2>
            <p>¿Estás seguro que quieres eliminar este criterio?</p>
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
                onClick={handleDeleteCriterion}
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