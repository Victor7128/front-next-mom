"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

  // Importar alumnos
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos
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

  // Lista alumnos
  const fetchStudents = () => {
    if (sectionId)
      fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionId}/students`)
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionId}/students`, {
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/students/${studentToEdit.id}`, {
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
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/students/${studentToDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setStudentToDelete(null);
    fetchStudents();
  };

  // Importar desde CSV
  const handleImportClick = () => {
    setImportModalOpen(true);
    setImportError(null);
    setImportSuccess(null);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file || !sectionId) return;
    setImporting(true);

    try {
      const text = await file.text();
      // Parse CSV: esperamos encabezado full_name (case-insensitive), ignora otros campos
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
      if (lines.length < 2) throw new Error("El archivo debe tener encabezado y al menos un alumno.");
      const header = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIdx = header.findIndex(h => h === "full_name" || h === "nombre" || h === "nombre_completo");
      if (nameIdx === -1) throw new Error("El archivo debe tener una columna llamada 'full_name' (o 'nombre').");

      // Procesar filas
      let imported = 0;
      let errors: string[] = [];
      for (let i = 1; i < lines.length; ++i) {
        const cols = lines[i].split(",");
        const full_name = cols[nameIdx]?.trim();
        if (!full_name) {
          errors.push(`Fila ${i + 1}: nombre vacío`);
          continue;
        }
        try {
          const res = await fetch(`https://backend-web-mom-3dmj.shuttle.app/sections/${sectionId}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name }),
          });
          if (!res.ok) {
            const msg = await res.text();
            errors.push(`Fila ${i + 1}: ${msg || res.statusText}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Fila ${i + 1}: Error de red`);
        }
      }
      if (errors.length) {
        setImportError(`Se importaron ${imported} alumnos. Errores:\n` + errors.join("\n"));
      } else {
        setImportSuccess(`Se importaron correctamente ${imported} alumnos.`);
        fetchStudents();
      }
    } catch (err: any) {
      setImportError(err.message || "Error al procesar el archivo.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

      {/* Botón importar */}
      <div className="mb-6">
        <button
          className="bg-green-600 text-white rounded px-4 py-2 font-bold shadow hover:bg-green-700 transition cursor-pointer"
          onClick={handleImportClick}
        >
          Importar desde archivo
        </button>
      </div>

      {/* Modal de importación */}
      {importModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setImportModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[350px] flex flex-col gap-4 max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-green-700">Importar alumnos desde archivo</h2>
            <ol className="mb-2 text-gray-700 list-decimal pl-5">
              <li>
                Crea un archivo <b>CSV</b> con el siguiente formato:
                <pre className="bg-gray-100 border border-gray-200 rounded my-2 p-2 text-xs">
                  full_name
                  {"\n"}Juan Pérez
                  {"\n"}María Gómez
                  {"\n"}Carlos Rojas
                </pre>
                <span className="block text-xs text-gray-500">
                  También puedes usar "nombre" o "nombre_completo" como encabezado.
                </span>
              </li>
              <li>
                Haz click en <b>Seleccionar archivo</b> y elige tu archivo CSV.
              </li>
              <li>
                Espera la confirmación y revisa los errores detallados si los hay.
              </li>
            </ol>
            <div className="flex flex-col items-center mb-2">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: "none" }}
                disabled={importing}
                onChange={handleImportFile}
                id="import-csv-input"
              />
              <label htmlFor="import-csv-input" className="w-full">
                <button
                  type="button"
                  className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold shadow-md transition cursor-pointer
        ${importing
                      ? "bg-gray-300 text-gray-500 cursor-wait"
                      : "bg-green-100"
                    }`}
                  disabled={importing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Importando...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                      </svg>
                      Seleccionar archivo CSV
                    </>
                  )}
                </button>
              </label>
            </div>
            {importError && (
              <div className="bg-red-100 border border-red-300 text-red-800 rounded p-2 whitespace-pre-wrap text-sm">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="bg-green-100 border border-green-300 text-green-800 rounded p-2 whitespace-pre-wrap text-sm">
                {importSuccess}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setImportModalOpen(false)}
                disabled={importing}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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