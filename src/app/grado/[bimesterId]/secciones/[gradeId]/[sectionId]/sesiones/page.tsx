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
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}`)
        .then(r => r.json())
        .then(setSection)
        .catch(() => setSection(null));
  }, [sectionId]);

  useEffect(() => {
    if (gradeId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/grades/${gradeId}`)
        .then(r => r.json())
        .then(setGrade)
        .catch(() => setGrade(null));
  }, [gradeId]);

  useEffect(() => {
    if (grade && grade.bimester_id)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bimesters/${grade.bimester_id}`)
        .then(r => r.json())
        .then(setBimester)
        .catch(() => setBimester(null));
  }, [grade]);

  // Listar sesiones
  const fetchSessions = () => {
    if (sectionId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}/sessions`)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}/sessions`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionToDelete.id}`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.length > 0 ? title : null, date }),
    });
    setEditing(false);
    setEditModalOpen(false);
    setSessionToEdit(null);
    fetchSessions();
  };

  function toRoman(num: number): string {
    if (isNaN(num) || num <= 0) return "";
    const romans = [
      ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
      ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
      ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]
    ];
    let res = "";
    for (const [letter, n] of romans) {
      const value = Number(n);
      while (num >= value) {
        res += letter;
        num -= value;
      }
    }
    return res;
  }

  function getHeaderLabel() {
    const bimRoman = toRoman(Number(bimesterId));
    const gradoNumero = grade ? grade.number : "";
    const sectionLetter = section ? section.letter : "";
    if (bimRoman && gradoNumero && sectionLetter) return `${bimRoman} Bimestre ${gradoNumero}° ${sectionLetter}`;
    if (bimRoman && gradoNumero) return `${bimRoman} Bimestre ${gradoNumero}°`;
    if (bimRoman) return `${bimRoman} Bimestre`;
    return "";
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      {/* Encabezado con contexto */}
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-3 text-center sm:text-left">
          {getHeaderLabel()}
        </h1>
      </div>

      {/* Botón crear sesión */}
      <div className="w-full max-w-2xl flex items-center mb-8">
        <button
          className="bg-indigo-600 text-white rounded-full px-6 py-2 text-lg font-semibold shadow hover:bg-indigo-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-95"
          onClick={handleOpenCreateModal}
          disabled={creating}
        >
          + Nueva sesión
        </button>
      </div>

      {/* Lista de sesiones */}
      <div className="w-full max-w-2xl">
        {sessions.length === 0 ? (
          <div className="text-gray-500 text-lg text-center py-8">No hay sesiones registradas en esta sección.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map(sess => (
              <li key={sess.id} className="relative group">
                <Link
                  href={`/grado/${bimesterId}/secciones/${gradeId}/${sectionId}/sesiones/${sess.id}`}
                  className="bg-white/90 border border-indigo-200 rounded-2xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 transition-all hover:shadow-lg hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer no-underline"
                  title={`Ver sesión ${sess.number}`}
                >
                  <div className="flex flex-col">
                    <span className="text-indigo-900 text-lg font-semibold">{sess.title || `Sesión ${sess.number}`}</span>
                    <span className="text-sm text-gray-500">{sess.date ? `Fecha: ${sess.date.slice(0, 10)}` : ""}</span>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
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
      </div>

      {/* Modal para crear sesión */}
      {createModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setCreateModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-indigo-700 text-center">Nueva sesión</h2>
            <label className="text-gray-700 font-semibold">Nombre de la sesión:</label>
            <input
              type="text"
              value={newSessionTitle}
              onChange={e => setNewSessionTitle(e.target.value)}
              className="border border-indigo-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              placeholder="Escribe el nombre (opcional)"
              disabled={creating}
              autoFocus
            />
            <label className="text-gray-700 font-semibold">Fecha:</label>
            <input
              type="date"
              value={newSessionDate}
              onChange={e => setNewSessionDate(e.target.value)}
              className="border border-indigo-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              disabled={creating}
            />
            <div className="flex gap-3 mt-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:bg-indigo-400"
                onClick={handleCreateSession}
                disabled={creating}
              >
                Crear sesión
              </button>
            </div>
            <span className="text-xs text-gray-500 text-center">Si dejas el nombre vacío, se asignará automáticamente (Ej. "Sesión 1")</span>
          </div>
        </div>
      )}

      {/* Modal de edición de sesión */}
      {editModalOpen && sessionToEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-yellow-700 text-center">Editar sesión</h2>
            <label className="text-gray-700 font-semibold">Nombre de la sesión:</label>
            <input
              type="text"
              value={editSessionTitle}
              onChange={e => setEditSessionTitle(e.target.value)}
              className="border border-yellow-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
              placeholder="Escribe el nombre"
              disabled={editing}
              autoFocus
            />
            <label className="text-gray-700 font-semibold">Fecha:</label>
            <input
              type="date"
              value={editSessionDate}
              onChange={e => setEditSessionDate(e.target.value)}
              className="border border-yellow-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
              disabled={editing}
            />
            <div className="flex gap-3 mt-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setEditModalOpen(false)}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition disabled:bg-yellow-400"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar sesión</h2>
            <div className="text-gray-800 text-center">
              ¿Estás seguro de que deseas eliminar la sesión <b>{sessionToDelete.title || `Sesión ${sessionToDelete.number}`}</b>?
              <br />
              <span className="text-red-600 text-sm block mt-2">
                Esto puede eliminar toda la información asociada a esta sesión (competencias, criterios y evaluaciones).
              </span>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:bg-red-400"
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