"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// Icono de eliminar (Heroicons style)
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

// Icono de editar
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 5.487l1.651 1.652a2.25 2.25 0 010 3.182l-8.03 8.03a4.505 4.505 0 01-1.87 1.13l-2.47.685a.375.375 0 01-.46-.46l.685-2.47a4.505 4.505 0 011.13-1.87l8.03-8.03a2.25 2.25 0 013.184 0z" />
  </svg>
);

type Section = { id: number; grade_id: number; letter: string; };
type Grade = { id: number; bimester_id: number; number: number; };
type Bimester = { id: number; name: string; };
type Session = { id: number; section_id: number; number: number; title?: string | null; date?: string };

export default function SesionesPage() {
  const params = useParams();
  const bimesterId = params?.bimesterId as string;
  const gradeId = params?.gradeId as string;
  const sectionId = params?.sectionId as string;
  const router = useRouter();

  const [section, setSection] = useState<Section | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [bimester, setBimester] = useState<Bimester | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Para eliminar sesión
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Para crear sesión
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDate, setNewSessionDate] = useState(""); // dejar vacío por defecto
  const [creating, setCreating] = useState(false);

  // Para editar sesión
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState("");
  const [editSessionDate, setEditSessionDate] = useState("");
  const [editing, setEditing] = useState(false);

  // Cargar contexto
  useEffect(() => {
    if (sectionId)
      fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionId}`)
        .then(r => r.json())
        .then(setSection)
        .catch(() => setSection(null));
  }, [sectionId]);

  useEffect(() => {
    if (gradeId)
      fetch(`https://backend-web-mom-3dmj.shuttle.app/grades/${gradeId}`)
        .then(r => r.json())
        .then(setGrade)
        .catch(() => setGrade(null));
  }, [gradeId]);

  useEffect(() => {
    if (grade && grade.bimester_id)
      fetch(`https://backend-web-mom-3dmj.shuttle.app/bimesters/${grade.bimester_id}`)
        .then(r => r.json())
        .then(setBimester)
        .catch(() => setBimester(null));
  }, [grade]);

  // Listar sesiones
  const fetchSessions = () => {
    if (sectionId)
      fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionId}/sessions`)
        .then(r => r.json())
        .then(setSessions)
        .catch(() => setSessions([]));
  };
  useEffect(fetchSessions, [sectionId]);

  // Crear sesión
  const handleOpenCreateModal = () => {
    setNewSessionTitle("");
    setNewSessionDate("");
    setCreateModalOpen(true);
  };

  const handleCreateSession = async () => {
    if (creating) return;
    setCreating(true);

    const date = newSessionDate || new Date().toISOString().split('T')[0];
    const title = newSessionTitle.trim();
    const payload = {
      title: newSessionTitle.trim() || null,
      date: newSessionDate || new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        alert("Error al crear la sesión: " + err);
        return;
      }
      setCreateModalOpen(false);
      setNewSessionTitle("");
      setNewSessionDate("");
      fetchSessions();
    } finally {
      setCreating(false);
    }
  };

  // Eliminar sesión
  const openDeleteModal = (session: Session) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete || deleting) return;
    setDeleting(true);
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionToDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setSessionToDelete(null);
    fetchSessions();
  };

  // Editar sesión
  const openEditModal = (session: Session) => {
    setSessionToEdit(session);
    setEditSessionTitle(session.title || "");
    setEditSessionDate(session.date ? session.date.slice(0, 10) : "");
    setEditModalOpen(true);
  };

  const handleEditSession = async () => {
    if (!sessionToEdit || editing) return;
    setEditing(true);
    const title = editSessionTitle.trim();
    const date = editSessionDate || new Date().toISOString().slice(0, 10);
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.length > 0 ? title : null, date }),
    });
    setEditing(false);
    setEditModalOpen(false);
    setSessionToEdit(null);
    fetchSessions();
  };

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      {/* Encabezado con contexto */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Sesiones de la Sección {section ? section.letter : "?"}
        </h1>
        <div className="text-gray-700">
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

      {/* Botón crear sesión */}
      <button
        className="bg-blue-600 text-white rounded-full px-4 py-2 text-lg font-bold mb-6 shadow hover:bg-blue-700 transition cursor-pointer"
        onClick={handleOpenCreateModal}
        disabled={creating}
      >
        + Nueva sesión
      </button>

      {/* Lista de sesiones */}
      {sessions.length === 0 ? (
        <div className="text-gray-500">No hay sesiones registradas en esta sección.</div>
      ) : (
        <ul className="flex flex-col gap-2 max-w-xl">
          {sessions.map(sess => (
            <li key={sess.id} className="relative group">
              <Link
                href={`/grado/${bimesterId}/secciones/${gradeId}/${sectionId}/sesiones/${sess.id}`}
                className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 flex justify-between items-center cursor-pointer transition hover:scale-[1.02] hover:shadow-md no-underline"
                title={`Ver sesión ${sess.number}`}
              >
                <div>
                  <span className="text-gray-800 text-lg font-semibold">{sess.title || `Sesión ${sess.number}`}</span>
                  <span className="ml-3 text-sm text-gray-500">{sess.date ? `Fecha: ${sess.date.slice(0, 10)}` : ""}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-2 rounded-full bg-white hover:bg-yellow-100 text-gray-500 hover:text-yellow-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 z-10"
                    title="Editar sesión"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditModal(sess);
                    }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="p-2 rounded-full bg-white hover:bg-red-100 text-gray-500 hover:text-red-600 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 z-10"
                    title="Eliminar sesión"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDeleteModal(sess);
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Modal para crear sesión */}
      {createModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setCreateModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Nueva sesión</h2>
            <label className="text-gray-700 font-semibold">Nombre de la sesión:</label>
            <input
              type="text"
              value={newSessionTitle}
              onChange={e => setNewSessionTitle(e.target.value)}
              className="border rounded px-3 py-2 mb-2"
              placeholder="Escribe el nombre (opcional)"
              disabled={creating}
            />
            <label className="text-gray-700 font-semibold">Fecha:</label>
            <input
              type="date"
              value={newSessionDate}
              onChange={e => setNewSessionDate(e.target.value)}
              className="border rounded px-3 py-2 mb-2"
              disabled={creating}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-bold cursor-pointer"
                onClick={handleCreateSession}
                disabled={creating}
              >
                Crear sesión
              </button>
            </div>
            <span className="text-xs text-gray-500">Si dejas el nombre vacío, se asignará automáticamente (Ej. "Sesión 1")</span>
          </div>
        </div>
      )}

      {/* Modal de edición de sesión */}
      {editModalOpen && sessionToEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">Editar sesión</h2>
            <label className="text-gray-700 font-semibold">Nombre de la sesión:</label>
            <input
              type="text"
              value={editSessionTitle}
              onChange={e => setEditSessionTitle(e.target.value)}
              className="border rounded px-3 py-2 mb-2"
              placeholder="Escribe el nombre"
              disabled={editing}
            />
            <label className="text-gray-700 font-semibold">Fecha:</label>
            <input
              type="date"
              value={editSessionDate}
              onChange={e => setEditSessionDate(e.target.value)}
              className="border rounded px-3 py-2 mb-2"
              disabled={editing}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setEditModalOpen(false)}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-bold cursor-pointer"
                onClick={handleEditSession}
                disabled={editing}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar sesión */}
      {deleteModalOpen && sessionToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[320px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-700">Eliminar sesión</h2>
            <div className="text-gray-800">
              ¿Estás seguro de que deseas eliminar la sesión <b>{sessionToDelete.title || `Sesión ${sessionToDelete.number}`}</b>?
              <br />
              <span className="text-red-600">
                Esto puede eliminar toda la información asociada a esta sesión (competencias, criterios y evaluaciones).
              </span>
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
                onClick={handleDeleteSession}
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