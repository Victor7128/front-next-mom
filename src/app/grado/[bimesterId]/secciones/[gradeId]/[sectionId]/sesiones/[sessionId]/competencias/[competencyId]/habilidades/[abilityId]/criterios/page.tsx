"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Params = {
  abilityId: string;
};

type Criterion = {
  id: number;
  ability_id: number;
  number: number;
  name: string | null;
  description: string | null;
};

type Ability = {
  id: number;
  competency_id: number;
  number: number;
  name: string | null;
  description: string | null;
};

export default function CriteriosPage() {
  const params = useParams() as Params;
  const { abilityId } = params;
  const [criterios, setCriterios] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);

  // Nombre de la capacidad
  const [abilityName, setAbilityName] = useState<string>("");

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
    if (!abilityId) {
      setCriterios([]);
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/abilities/${abilityId}/criteria`)
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

  // Cargar nombre de la capacidad
  const fetchAbilityName = () => {
    if (!abilityId) {
      setAbilityName("");
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/abilities/${abilityId}`)
      .then(r => r.json())
      .then((data: Ability) => {
        // Si no tiene nombre, mostrar Capacidad N
        setAbilityName(
          data?.name && data.name.trim() !== ""
            ? data.name
            : `Capacidad ${data?.number ?? ""}`
        );
      })
      .catch(() => setAbilityName(""));
  };

  useEffect(fetchCriterios, [abilityId]);
  useEffect(fetchAbilityName, [abilityId]);

  // Genera nombre por defecto (C1, C2, ...)
  function getDefaultName() {
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
    if (creating || !abilityId) return;
    let nombreFinal = newName.trim();
    if (!nombreFinal) {
      nombreFinal = getDefaultName();
    }
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/abilities/${abilityId}/criteria`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/criteria/${editId}`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/criteria/${deleteId}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setDeleteId(null);
    fetchCriterios();
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10 relative">
      {/* Botón para agregar criterio */}
      <button
        className="fixed top-6 right-8 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
        onClick={() => {
          setModalOpen(true);
          setNewName("");
          setNewDesc("");
        }}
      >
        + Agregar criterio
      </button>
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700 mb-6 text-center sm:text-left">
          Criterios de {abilityName ? `(${abilityName})` : ""}
        </h1>
        {loading ? (
          <div className="text-gray-500 text-lg text-center py-8">Cargando criterios...</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {criterios.length === 0 ? (
              <div className="text-gray-500 text-lg text-center py-8">
                No hay criterios registrados para esta habilidad.
              </div>
            ) : (
              criterios.map((cr) => (
                <li
                  key={cr.id}
                  className="bg-white/90 border border-green-200 rounded-2xl px-6 py-5 shadow-sm flex justify-between items-center transition-all hover:shadow-lg hover:bg-green-50 hover:border-green-400"
                >
                  <div>
                    <span className="font-bold text-green-700 text-lg">
                      {cr.name || <i>Sin nombre</i>}
                    </span>
                    {cr.description && (
                      <>
                        <br />
                        <span className="font-bold text-green-700">Descripción: </span>
                        <span className="text-gray-700 text-base">{cr.description}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 bg-white hover:bg-yellow-100 text-gray-500 hover:text-yellow-700 rounded-full shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      title="Editar criterio"
                      onClick={() => openEditModal(cr)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L6 11.172V14h2.828l8.586-8.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M4 16v-2.828l8.586-8.586a4 4 0 015.656 5.656L9.828 18H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="p-2 bg-white hover:bg-red-100 text-gray-500 hover:text-red-700 rounded-full shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                      title="Eliminar criterio"
                      onClick={() => openDeleteModal(cr.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 8a1 1 0 011 1v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9a1 1 0 112 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
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
      </div>

      {/* Modal para agregar criterio */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-green-700 text-center">Nuevo criterio</h2>
            <form onSubmit={handleCreateCriterion} className="flex flex-col gap-3">
              <label>
                <span className="text-gray-800">Nombre del criterio:</span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-green-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  disabled={creating}
                  maxLength={100}
                  placeholder={`Ej: ${getDefaultName()}`}
                  autoFocus
                />
              </label>
              <label>
                <span className="text-gray-800">Descripción:</span>
                <textarea
                  className="mt-2 block w-full border border-green-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  disabled={creating}
                  maxLength={300}
                  placeholder="Opcional"
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
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:bg-green-400"
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
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-yellow-700 text-center">Editar criterio</h2>
            <form onSubmit={handleEditCriterion} className="flex flex-col gap-3">
              <label>
                <span className="text-gray-800">Nombre del criterio:</span>
                <input
                  type="text"
                  className="mt-2 block w-full border border-yellow-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={editing}
                  maxLength={100}
                  placeholder={`Ej: ${getDefaultName()}`}
                  autoFocus
                />
              </label>
              <label>
                <span className="text-gray-800">Descripción:</span>
                <textarea
                  className="mt-2 block w-full border border-yellow-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  disabled={editing}
                  maxLength={300}
                  placeholder="Opcional"
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

      {/* Modal para eliminar criterio */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar criterio</h2>
            <p className="text-center">¿Estás seguro que quieres eliminar este criterio?</p>
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