"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Tipos de los modelos
type Competency = { id: number; number: number; name?: string | null };
type Criterion = { id: number; number: number; name?: string | null };
type Student = { id: number; full_name: string };
type EvalValue = "AD" | "A" | "B" | "C";

type MatrixResponse = {
  locked: boolean;
  competency: { id: number; display_name: string };
  criteria: { id: number; display_name: string }[];
  students: { id: number; full_name: string }[];
  values: { student_id: number; criterion_id: number; value: string }[];
};

type LocalValue = {
  [studentId: number]: {
    [criterionId: number]: EvalValue | "";
  };
};

export default function EvaluacionPage() {
  const params = useParams() as { sessionId: string; sectionId: string };
  const { sessionId } = params;
  const [competencias, setCompetencias] = useState<Competency[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<MatrixResponse | null>(null);
  const [localValues, setLocalValues] = useState<LocalValue>({});
  const [saving, setSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState<string | null>(null);

  // Fetch competencias
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/sessions/${sessionId}/competencies`)
      .then(r => r.json())
      .then(setCompetencias);
  }, [sessionId]);

  // Fetch matrix and initialize localValues
  useEffect(() => {
    if (!selectedCompId) return;
    fetch(`http://127.0.0.1:8000/sessions/${sessionId}/competencies/${selectedCompId}/matrix`)
      .then(r => r.json())
      .then((data: MatrixResponse) => {
        setMatrix(data);
        // Inicializa localValues según lo que trae la matriz actual
        const newLocal: LocalValue = {};
        data.students.forEach(st => {
          newLocal[st.id] = {};
          data.criteria.forEach(cr => {
            const valObj = data.values.find(
              v => v.student_id === st.id && v.criterion_id === cr.id
            );
            newLocal[st.id][cr.id] = valObj ? (valObj.value as EvalValue) : "";
          });
        });
        setLocalValues(newLocal);
      });
  }, [selectedCompId, sessionId]);

  // Cierre automático del modal al segundo o 2
  useEffect(() => {
    if (modalMsg) {
      const timer = setTimeout(() => setModalMsg(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [modalMsg]);

  // Actualiza localValues cuando se cambia un radio
  const handleLocalChange = (
    student_id: number,
    criterion_id: number,
    value: EvalValue
  ) => {
    setLocalValues(prev => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        [criterion_id]: value,
      },
    }));
  };

  // Guardar evaluación (envía todos los cambios al backend)
  const handleSave = async () => {
    if (!matrix || !selectedCompId || matrix.locked) return;
    setSaving(true);
    setModalMsg(null);

    try {
      const promises: Promise<any>[] = [];
      matrix.students.forEach(st => {
        matrix.criteria.forEach(cr => {
          const value = localValues[st.id]?.[cr.id] ?? "";
          if (value) {
            promises.push(
              fetch(`http://127.0.0.1:8000/evaluation/value`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  session_id: Number(sessionId),
                  competency_id: selectedCompId,
                  criterion_id: cr.id,
                  student_id: st.id,
                  value,
                }),
              })
            );
          }
        });
      });

      const results = await Promise.allSettled(promises);

      const hasError = results.some(
        (res) =>
          res.status === "rejected" ||
          (res.status === "fulfilled" &&
            "ok" in res.value &&
            !res.value.ok)
      );

      setSaving(false);

      if (hasError) {
        setModalMsg("Error al guardar los cambios.");
      } else {
        setModalMsg("Los cambios se guardaron correctamente.");
      }

      // Refresca la matriz y los valores
      fetch(`http://127.0.0.1:8000/sessions/${sessionId}/competencies/${selectedCompId}/matrix`)
        .then(r => r.json())
        .then((data: MatrixResponse) => {
          setMatrix(data);
          const newLocal: LocalValue = {};
          data.students.forEach(st => {
            newLocal[st.id] = {};
            data.criteria.forEach(cr => {
              const valObj = data.values.find(
                v => v.student_id === st.id && v.criterion_id === cr.id
              );
              newLocal[st.id][cr.id] = valObj ? (valObj.value as EvalValue) : "";
            });
          });
          setLocalValues(newLocal);
        });
    } catch (e) {
      setSaving(false);
      setModalMsg("Error al guardar los cambios.");
    }
  };

  // Bloquear competencia (lock)
  const handleLock = async () => {
    if (!selectedCompId) return;
    setSaving(true);
    await fetch(`http://127.0.0.1:8000/evaluation/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: Number(sessionId),
        competency_id: selectedCompId,
      }),
    });
    // Refresca estado
    fetch(`http://127.0.0.1:8000/sessions/${sessionId}/competencies/${selectedCompId}/matrix`)
      .then(r => r.json())
      .then((data: MatrixResponse) => {
        setMatrix(data);
        setSaving(false);
        setModalMsg("Competencia bloqueada. Ya no se puede editar.");
      });
  };

  // Desbloquear competencia (unlock)
  const handleUnlock = async () => {
    if (!selectedCompId) return;
    setSaving(true);
    await fetch(`http://127.0.0.1:8000/evaluation/lock`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: Number(sessionId),
        competency_id: selectedCompId,
      }),
    });
    // Refresca estado
    fetch(`http://127.0.0.1:8000/sessions/${sessionId}/competencies/${selectedCompId}/matrix`)
      .then(r => r.json())
      .then((data: MatrixResponse) => {
        setMatrix(data);
        setSaving(false);
        setModalMsg("Competencia desbloqueada. Ya se puede editar.");
      });
  };

  return (
    <main className="min-h-screen bg-white py-12 px-8">
      {modalMsg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <div className="bg-white rounded-lg shadow-lg p-8 text-center min-w-[300px]">
            <h2 className="text-xl font-bold mb-4">
              {modalMsg.includes("Error")
                ? "Error"
                : modalMsg.includes("bloqueada")
                  ? "Bloqueada"
                  : modalMsg.includes("desbloqueada")
                    ? "Desbloqueada"
                    : "¡Guardado!"}
            </h2>
            <p className="mb-6">{modalMsg}</p>
            <div className="text-gray-400 text-sm">Este mensaje se cerrará automáticamente</div>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Evaluación</h1>
      <div className="mb-6">
        <label className="font-bold mr-2">Selecciona competencia a evaluar:</label>
        <select
          value={selectedCompId ?? ""}
          onChange={e => setSelectedCompId(Number(e.target.value))}
          className="cursor-pointer"
        >
          <option value="">Elige una competencia</option>
          {competencias.map(c => (
            <option key={c.id} value={c.id} className="cursor-pointer">
              {c.name || `Competencia ${c.number}`}
            </option>
          ))}
        </select>
      </div>

      {matrix && (
        <div>
          <div className="mb-4 flex gap-4 items-center">
            <span
              className={`font-bold px-3 py-1 rounded ${
                matrix.locked
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {matrix.locked ? "Estado: BLOQUEADO (no editable)" : "Estado: DESBLOQUEADO (editable)"}
            </span>
            {matrix.locked ? (
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded font-bold cursor-pointer"
                disabled={saving}
                onClick={handleUnlock}
              >
                Desbloquear competencia
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-red-600 text-white rounded font-bold cursor-pointer"
                disabled={saving}
                onClick={handleLock}
              >
                Bloquear competencia
              </button>
            )}
          </div>
          <table className="border w-full">
            <thead>
              <tr>
                <th className="border p-2" rowSpan={2}>Estudiante</th>
                <th className="border p-2 text-center" colSpan={matrix.criteria.length}>
                  {matrix.competency.display_name}
                </th>
              </tr>
              <tr>
                {matrix.criteria.map(cr => (
                  <th key={cr.id} className="border p-2">{cr.display_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.students.map(st => (
                <tr key={st.id}>
                  <td className="border p-2">{st.full_name}</td>
                  {matrix.criteria.map(cr => (
                    <td key={cr.id} className="border p-2">
                      {["AD", "A", "B", "C"].map(level => (
                        <label key={level} className="mr-2">
                          <input
                            type="radio"
                            name={`eval_${st.id}_${cr.id}`}
                            checked={localValues[st.id]?.[cr.id] === level}
                            disabled={saving || matrix.locked}
                            onChange={() =>
                              handleLocalChange(st.id, cr.id, level as EvalValue)
                            }
                            className="cursor-pointer"
                          />{" "}
                          {level}
                        </label>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex gap-4 items-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded font-bold cursor-pointer"
              disabled={saving || matrix.locked}
              onClick={handleSave}
            >
              Guardar evaluación
            </button>
          </div>
        </div>
      )}
    </main>
  );
}