"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ModalAutoClose } from "@/app/components/ModalAutoclose";

// Tipos para los datos
type Competency = { id: number; display_name: string };
type Product = { id: number; name: string; description: string | null };
type Ability = { id: number; display_name: string };
type Criterion = { id: number; ability_id: number; display_name: string };
type Student = { id: number; full_name: string };
type EvalValue = "AD" | "A" | "B" | "C";
type ValueItem = {
  student_id: number;
  ability_id: number;
  criterion_id: number;
  value: string;
  observation: string | null;
};
type EvaluationContextResponse = {
  locked: boolean;
  session: { id: number; name: string };
  competency: { id: number; display_name: string };
  product: Product;
  abilities: Ability[];
  criteria: Criterion[];
  students: Student[];
  values: ValueItem[];
};
type LocalValue = {
  [studentId: number]: {
    [criterionId: number]: EvalValue | "";
  };
};
type LocalObs = {
  [studentId: number]: string;
};

export default function EvaluacionPage() {
  const params = useParams() as { sessionId?: string };
  const sessionId = params.sessionId;

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [context, setContext] = useState<EvaluationContextResponse | null>(null);
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [selectedAbilityId, setSelectedAbilityId] = useState<number | null>(null);
  const [localValues, setLocalValues] = useState<LocalValue>({});
  const [localObs, setLocalObs] = useState<LocalObs>({});
  const [saving, setSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal de observación
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsStudentId, setObsStudentId] = useState<number | null>(null);
  const [obsInput, setObsInput] = useState("");

  // --- NUEVO: Estado para bloquear/desbloquear
  const [lockLoading, setLockLoading] = useState(false);

  // Al cargar, obtener competencias y productos disponibles para la sesión
  useEffect(() => {
    setFetchError(null);
    if (!sessionId) {
      setFetchError("Falta sessionId en la URL.");
      return;
    }
    fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionId}/competencies`)
      .then(r => r.json())
      .then((data: any[]) => setCompetencies(data.map(c => ({
        id: c.id,
        display_name: c.name ?? `Competencia ${c.number}`
      }))))
      .catch(() => setFetchError("Error al cargar competencias."));
    fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionId}/products`)
      .then(r => r.json())
      .then((data: any[]) => setProducts(data.map(p => ({
        id: p.id,
        name: p.name ?? `Producto ${p.number}`,
        description: p.description
      }))))
      .catch(() => setFetchError("Error al cargar productos."));
  }, [sessionId]);

  useEffect(() => {
    setContext(null);
    setAbilities([]);
    setSelectedAbilityId(null);
    if (!sessionId || !selectedCompetencyId || !selectedProductId) {
      return;
    }
    fetch(`https://backend-web-mom-3dmj.shuttle.app/evaluation/context?session_id=${sessionId}&product_id=${selectedProductId}&competency_id=${selectedCompetencyId}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: EvaluationContextResponse) => {
        setContext(data);
        setAbilities(data.abilities || []);
        if (data.abilities && data.abilities.length > 0) {
          setSelectedAbilityId(data.abilities[0].id);
        }
      })
      .catch(e => setFetchError(typeof e === "string" ? e : e.message));
  }, [sessionId, selectedCompetencyId, selectedProductId]);

  useEffect(() => {
    if (!selectedAbilityId || !context) return;
    const criteria = context.criteria.filter((c) => c.ability_id === selectedAbilityId);
    const values = context.values.filter((v) => v.ability_id === selectedAbilityId);

    const lv: LocalValue = {};
    const lo: LocalObs = {};

    context.students.forEach((st) => {
      lv[st.id] = {};
      criteria.forEach((cr) => {
        const valObj = values.find(
          (v) => v.student_id === st.id && v.criterion_id === cr.id
        );
        lv[st.id][cr.id] = valObj ? (valObj.value as EvalValue) : "";
        const obsVal = values.find((v) => v.student_id === st.id && v.ability_id === selectedAbilityId);
        lo[st.id] = obsVal && obsVal.observation ? obsVal.observation : "";
      });
    });

    setLocalValues(lv);
    setLocalObs(lo);
  }, [selectedAbilityId, context]);

  const handleLocalChange = (
    student_id: number,
    criterion_id: number,
    value: EvalValue
  ) => {
    setLocalValues((prev) => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        [criterion_id]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!context || !selectedAbilityId || context.locked) return;
    setSaving(true);
    setModalMsg(null);

    const criteria = context.criteria.filter((c) => c.ability_id === selectedAbilityId);
    const product = context.product;
    const promises: Promise<any>[] = [];

    context.students.forEach((st) => {
      criteria.forEach((cr) => {
        const value = localValues[st.id]?.[cr.id] ?? "";
        promises.push(
          fetch(`https://backend-web-mom-3dmj.shuttle.app/evaluation/value`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: Number(sessionId),
              competency_id: context.competency.id,
              ability_id: selectedAbilityId,
              criterion_id: cr.id,
              product_id: product.id,
              student_id: st.id,
              value,
              observation: localObs[st.id] || null,
            }),
          })
        );
      });
    });

    const results = await Promise.allSettled(promises);

    const hasError = results.some(
      (res) =>
        res.status === "rejected" ||
        (res.status === "fulfilled" && "ok" in res.value && !res.value.ok)
    );

    setSaving(false);

    if (hasError) {
      setModalMsg("Error al guardar los cambios.");
    } else {
      setModalMsg("Los cambios se guardaron correctamente.");
      fetch(
        `https://backend-web-mom-3dmj.shuttle.app/evaluation/context?session_id=${sessionId}&product_id=${product.id}&competency_id=${context.competency.id}`
      )
        .then(async (r) => {
          if (!r.ok) {
            const txt = await r.text();
            throw new Error(txt || "Error de red");
          }
          return r.json();
        })
        .then((data: EvaluationContextResponse) => {
          setContext(data);
        })
        .catch(e => {
          setFetchError(typeof e === "string" ? e : e.message);
        });
    }
  };

  const openObsModal = (studentId: number) => {
    setObsStudentId(studentId);
    setObsInput(localObs[studentId] || "");
    setObsModalOpen(true);
  };
  const closeObsModal = () => setObsModalOpen(false);
  const handleSaveObs = () => {
    if (obsStudentId !== null) {
      setLocalObs((prev) => ({ ...prev, [obsStudentId]: obsInput }));
    }
    setObsModalOpen(false);
  };

  if (fetchError) {
    return (
      <main className="min-h-screen bg-white py-12 px-8">
        <div className="text-red-700 font-bold mb-4">{fetchError}</div>
        <div className="text-gray-500">
          Verifica que la URL tenga <b>sessionId</b> o que los elementos existan en la sesión.
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-white py-12 px-8">
      {modalMsg && (
        <ModalAutoClose
          message={modalMsg}
          onClose={() => setModalMsg(null)}
        />
      )}
      {obsModalOpen && obsStudentId !== null && context && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
          onClick={closeObsModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">
              Observación para {context.students.find(s => s.id === obsStudentId)?.full_name}
            </h2>
            <textarea
              className="block w-full border border-gray-300 rounded px-2 py-1 mb-4"
              rows={4}
              value={obsInput}
              onChange={e => setObsInput(e.target.value)}
              placeholder="Escribe aquí la observación del estudiante..."
              disabled={saving}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                type="button"
                onClick={closeObsModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-bold"
                type="button"
                onClick={handleSaveObs}
                disabled={saving}
              >
                Guardar observación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Título grande centrado: nombre de la sesión */}
      {context && context.session?.name && (
        <h1 className="text-3xl font-extrabold mb-2 text-blue-900 text-center">
          {context.session.name}
        </h1>
      )}
      {/* Debajo, producto en letra pequeña y centrado */}
      {context && context.product?.name && (
        <div className="text-center text-sm text-gray-700 mb-8">
          Producto: <span className="font-semibold">{context.product.name}</span>
        </div>
      )}

      {/* Selector de competencia */}
      <div className="mb-4">
        <label className="font-bold mr-2">Selecciona competencia:</label>
        <select
          value={selectedCompetencyId ?? ""}
          onChange={e => {
            setSelectedCompetencyId(Number(e.target.value) || null);
            setSelectedProductId(null);
            setContext(null);
          }}
          className="cursor-pointer"
        >
          <option value="">Elige una competencia</option>
          {competencies.map(c => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </select>
      </div>
      {/* Selector de producto */}
      <div className="mb-6">
        <label className="font-bold mr-2">Selecciona producto:</label>
        <select
          value={selectedProductId ?? ""}
          onChange={e => {
            setSelectedProductId(Number(e.target.value) || null);
            setContext(null);
          }}
          className="cursor-pointer"
        >
          <option value="">Elige un producto</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Selector de habilidad */}
      {context && (
        <div className="mb-6">
          <label className="font-bold mr-2">Selecciona habilidad a evaluar:</label>
          <select
            value={selectedAbilityId ?? ""}
            onChange={e => setSelectedAbilityId(Number(e.target.value))}
            className="cursor-pointer"
          >
            <option value="">Elige una habilidad</option>
            {abilities.map(a => (
              <option key={a.id} value={a.id} className="cursor-pointer">
                {a.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Renderiza la tabla de evaluación solo si hay contexto y habilidad */}
      {context && selectedAbilityId && (
        <div className="overflow-x-auto">
          <table className="border w-full">
            <thead>
              <tr>
                <th className="border p-2 align-bottom" rowSpan={3} style={{ minWidth: 180 }}>
                  Estudiante
                </th>
                <th className="border p-2 text-center bg-gray-100" colSpan={context.criteria.filter(c => c.ability_id === selectedAbilityId).length}>
                  {/* Competencia */}
                  {context.competency.display_name}
                </th>
                <th className="border p-2 align-bottom" rowSpan={3} style={{ minWidth: 120 }}>
                  Observaciones
                </th>
              </tr>
              <tr>
                {/* Habilidad */}
                <th className="border p-2 text-center bg-gray-50" colSpan={context.criteria.filter(c => c.ability_id === selectedAbilityId).length}>
                  {context.abilities.find(a => a.id === selectedAbilityId)?.display_name}
                </th>
              </tr>
              <tr>
                {/* Criterios (tantas columnas como criterios) */}
                {context.criteria
                  .filter(c => c.ability_id === selectedAbilityId)
                  .map(cr => (
                    <th
                      key={cr.id}
                      className="border p-2 text-center"
                    >
                      {cr.display_name}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {context.students.map(st => (
                <tr key={st.id}>
                  <td className="border p-2">{st.full_name}</td>
                  {/* Checkboxes para cada criterio */}
                  {context.criteria
                    .filter(c => c.ability_id === selectedAbilityId)
                    .map(cr => (
                      <td key={cr.id} className="border p-2 text-center">
                        {["AD", "A", "B", "C"].map(level => (
                          <label key={level} className="mx-1 text-xs">
                            <input
                              type="radio"
                              name={`eval_${st.id}_${cr.id}`}
                              checked={localValues[st.id]?.[cr.id] === level}
                              disabled={saving || context.locked}
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
                  <td className="border p-2 text-center">
                    <button
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      type="button"
                      disabled={saving || context.locked}
                      onClick={() => openObsModal(st.id)}
                    >
                      {localObs[st.id]?.trim()
                        ? "Ver / Editar"
                        : "Agregar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex gap-4 items-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded font-bold cursor-pointer"
              disabled={saving || context.locked}
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