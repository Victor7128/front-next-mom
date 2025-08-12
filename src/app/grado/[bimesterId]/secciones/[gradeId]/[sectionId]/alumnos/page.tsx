"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Section = { id: number; grade_id: number; letter: string; };
type Grade = { id: number; bimester_id: number; number: number; };
type Bimester = { id: number; name: string; };
type Student = { id: number; section_id: number; full_name: string; };

export default function AlumnosPage() {
  const params = useParams();
  const bimesterId = params?.bimesterId as string;
  const gradeId = params?.gradeId as string;
  const sectionId = params?.sectionId as string;

  const [section, setSection] = useState<Section | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [bimester, setBimester] = useState<Bimester | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar datos
  useEffect(() => {
    if (sectionId)
      fetch(`http://127.0.0.1:8000/sections/${sectionId}`)
        .then(r => r.json())
        .then(setSection)
        .catch(() => setSection(null));
  }, [sectionId]);

  useEffect(() => {
    if (gradeId)
      fetch(`http://127.0.0.1:8000/grades/${gradeId}`)
        .then(r => r.json())
        .then(setGrade)
        .catch(() => setGrade(null));
  }, [gradeId]);

  useEffect(() => {
    if (grade && grade.bimester_id)
      fetch(`http://127.0.0.1:8000/bimesters/${grade.bimester_id}`)
        .then(r => r.json())
        .then(setBimester)
        .catch(() => setBimester(null));
  }, [grade]);

  // Lista alumnos
  const fetchStudents = () => {
    if (sectionId)
      fetch(`http://127.0.0.1:8000/sections/${sectionId}/students`)
        .then(r => r.json())
        .then(setStudents)
        .catch(() => setStudents([]));
  };
  useEffect(fetchStudents, [sectionId]);

  // Crear alumno
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || adding) return;
    setAdding(true);
    await fetch(`http://127.0.0.1:8000/sections/${sectionId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: newName.trim() }),
    });
    setNewName("");
    setAdding(false);
    fetchStudents();
  };

  // Editar alumno
  const openEditModal = (student: Student) => {
    setStudentToEdit(student);
    setEditName(student.full_name);
    setEditModalOpen(true);
  };
  const handleEditStudent = async () => {
    if (!studentToEdit || !editName.trim() || editing) return;
    setEditing(true);
    await fetch(`http://127.0.0.1:8000/students/${studentToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: editName.trim() }),
    });
    setEditing(false);
    setEditModalOpen(false);
    setStudentToEdit(null);
    fetchStudents();
  };

  // Eliminar alumno
  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };
  const handleDeleteStudent = async () => {
    if (!studentToDelete || deleting) return;
    setDeleting(true);
    await fetch(`http://127.0.0.1:8000/students/${studentToDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setStudentToDelete(null);
    fetchStudents();
  };

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      {/* Encabezado con contexto */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Alumnos de la Sección {section ? section.letter : "?"}
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

      {/* Formulario para agregar alumno */}
      <form className="flex gap-2 items-center mb-6" onSubmit={handleAddStudent}>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-sm"
          placeholder="Nombre completo del alumno"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={adding}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-bold shadow hover:bg-blue-700 transition cursor-pointer"
          disabled={!newName.trim() || adding}
        >
          Agregar
        </button>
      </form>

      {/* Lista de alumnos */}
      {students.length === 0 ? (
        <div className="text-gray-500">No hay alumnos registrados en esta sección.</div>
      ) : (
        <ul className="flex flex-col gap-2 max-w-xl">
          {students.map(stu => (
            <li
              key={stu.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 flex justify-between items-center"
            >
              <span className="font-semibold text-gray-800">{stu.full_name}</span>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold cursor-pointer"
                  onClick={() => openEditModal(stu)}
                  title="Editar alumno"
                >
                  Editar
                </button>
                <button
                  className="px-2 py-1 rounded bg-red-200 hover:bg-red-300 text-red-900 font-bold cursor-pointer"
                  onClick={() => openDeleteModal(stu)}
                  title="Eliminar alumno"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de edición */}
      {editModalOpen && studentToEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-yellow-700">Editar alumno</h2>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-full"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              disabled={editing}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setEditModalOpen(false)}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-yellow-600 text-white font-bold cursor-pointer"
                onClick={handleEditStudent}
                disabled={!editName.trim() || editing}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteModalOpen && studentToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-700">Eliminar alumno</h2>
            <div className="text-gray-800">
              ¿Estás seguro de que deseas eliminar a <b>{studentToDelete.full_name}</b>?
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold cursor-pointer"
                onClick={handleDeleteStudent}
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