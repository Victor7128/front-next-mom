"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";

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

  // Lista alumnos
  const fetchStudents = () => {
    if (sectionId)
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}/students`)
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}/students`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/students/${studentToEdit.id}`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/students/${studentToDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setStudentToDelete(null);
    fetchStudents();
  };

  // Importar desde CSV (acepta solo una columna con cualquier contenido, incluso con comas/tildes)
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
      // Detectar delimitador y columnas
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
      if (lines.length < 2) throw new Error("El archivo debe tener encabezado y al menos un alumno.");
      // Detectar delimitador
      let delimiter = ",";
      if (lines[0].includes(";")) delimiter = ";";
      const headerColumns = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
      const nameIdx = headerColumns.findIndex(
        h => ["full_name", "nombre", "nombre_completo"].includes(h)
      );
      // CASO 1: solo una columna (admite comas/tildes sin comillas)
      if (headerColumns.length === 1) {
        let imported = 0;
        let errors: string[] = [];
        for (let i = 1; i < lines.length; ++i) {
          const full_name = lines[i].trim();
          if (!full_name) {
            errors.push(`Fila ${i + 1}: nombre vacío`);
            continue;
          }
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}/students`, {
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
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      // CASO 2: formato CSV estándar, usa papaparse (permite más columnas)
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter,
        transformHeader: h => h.trim().toLowerCase(),
      });
      if (parsed.errors.length) {
        throw new Error("Error al procesar el archivo CSV: " + parsed.errors.map(e => e.message).join(", "));
      }
      let imported = 0;
      let errors: string[] = [];
      for (let i = 0; i < parsed.data.length; ++i) {
        const row = parsed.data[i] as any;
        const full_name = row.full_name || row.nombre || row.nombre_completo;
        if (!full_name || !full_name.trim()) {
          errors.push(`Fila ${i + 2}: nombre vacío`);
          continue;
        }
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sections/${sectionId}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: full_name.trim() }),
          });
          if (!res.ok) {
            const msg = await res.text();
            errors.push(`Fila ${i + 2}: ${msg || res.statusText}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Fila ${i + 2}: Error de red`);
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
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      {/* Encabezado con contexto */}
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-3 text-center sm:text-left">
          Alumnos de la Sección {section ? section.letter : "?"}
        </h1>
        <div className="text-gray-700 text-lg text-center sm:text-left">
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
      <div className="w-full max-w-2xl mb-6 flex items-center">
        <button
          className="bg-green-600 text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-green-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95"
          onClick={handleImportClick}
        >
          Importar desde archivo
        </button>
      </div>

      {/* Modal de importación */}
      {importModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setImportModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[350px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-green-700 text-center">Importar alumnos desde archivo</h2>
            <ol className="mb-2 text-gray-700 list-decimal pl-5 text-base">
              <li>
                Crea un archivo <b>CSV</b> con el siguiente formato:
                <pre className="bg-gray-100 border border-gray-200 rounded my-2 p-2 text-xs">
                  full_name
                  {"\n"}GARCÍA LÓPEZ, ANA MARÍA
                  {"\n"}DÍAZ PÉREZ, JOSÉ ÁNGEL
                  {"\n"}RODRÍGUEZ, JULIO
                </pre>
                <span className="block text-xs text-gray-500">
                  También puedes usar "nombre" o "nombre_completo" como encabezado. Si el archivo sólo tiene una columna de nombres, no importa si hay comas o tildes en los nombres, ¡se aceptará!
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
                      : "bg-green-100 hover:bg-green-200"
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
      <form className="flex gap-3 items-center mb-8 w-full max-w-2xl" onSubmit={handleAddStudent}>
        <input
          type="text"
          className="border border-indigo-200 rounded-lg px-3 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          placeholder="Nombre completo del alumno"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={adding}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-indigo-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          disabled={!newName.trim() || adding}
        >
          Agregar
        </button>
      </form>

      {/* Lista de alumnos */}
      <div className="w-full max-w-2xl">
        {students.length === 0 ? (
          <div className="text-gray-500 text-lg text-center py-8">No hay alumnos registrados en esta sección.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {students.map(stu => (
              <li
                key={stu.id}
                className="bg-white/90 border border-indigo-200 rounded-xl shadow-sm px-4 py-3 flex justify-between items-center"
              >
                <span className="font-semibold text-indigo-900">{stu.full_name}</span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-semibold shadow-sm transition"
                    onClick={() => openEditModal(stu)}
                    title="Editar alumno"
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-semibold shadow-sm transition"
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
      </div>

      {/* Modal de edición */}
      {editModalOpen && studentToEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[300px] w-full max-w-xs flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-yellow-700 text-center">Editar alumno</h2>
            <input
              type="text"
              className="border border-indigo-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              disabled={editing}
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setEditModalOpen(false)}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition disabled:bg-yellow-400"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[300px] w-full max-w-xs flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar alumno</h2>
            <div className="text-lg text-gray-800 text-center">
              ¿Estás seguro de que deseas eliminar a <b>{studentToDelete.full_name}</b>?
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:bg-red-400"
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