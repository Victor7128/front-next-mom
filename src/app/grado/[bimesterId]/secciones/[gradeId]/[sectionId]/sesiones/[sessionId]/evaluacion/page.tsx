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
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/competencies`)
      .then(r => r.json())
      .then((data: any[]) => setCompetencies(data.map(c => ({
        id: c.id,
        display_name: c.name ?? `Competencia ${c.number}`
      }))))
      .catch(() => setFetchError("Error al cargar competencias."));
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/products`)
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
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/evaluation/context?session_id=${sessionId}&product_id=${selectedProductId}&competency_id=${selectedCompetencyId}`)
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
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/evaluation/value`, {
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/evaluation/context?session_id=${sessionId}&product_id=${product.id}&competency_id=${context.competency.id}`
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
      <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
        <div className="text-red-700 font-bold mb-4">{fetchError}</div>
        <div className="text-gray-500">
          Verifica que la URL tenga <b>sessionId</b> o que los elementos existan en la sesión.
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      {modalMsg && (
        <ModalAutoClose
          message={modalMsg}
          onClose={() => setModalMsg(null)}
        />
      )}
      {obsModalOpen && obsStudentId !== null && context && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeObsModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">
              Observación para {context.students.find(s => s.id === obsStudentId)?.full_name}
            </h2>
            <textarea
              className="block w-full border border-blue-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              rows={4}
              value={obsInput}
              onChange={e => setObsInput(e.target.value)}
              placeholder="Escribe aquí la observación del estudiante..."
              disabled={saving}
              maxLength={500}
            />
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                type="button"
                onClick={closeObsModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:bg-blue-400"
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
        <div className="text-center text-base text-gray-700 mb-8">
          Producto: <span className="font-semibold">{context.product.name}</span>
        </div>
      )}

      {/* Selector de competencia */}
      <div className="w-full max-w-2xl mb-4">
        <label className="font-bold mr-2 text-lg">Selecciona competencia:</label>
        <select
          value={selectedCompetencyId ?? ""}
          onChange={e => {
            setSelectedCompetencyId(Number(e.target.value) || null);
            setSelectedProductId(null);
            setContext(null);
          }}
          className="cursor-pointer border border-indigo-200 rounded-lg px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
        >
          <option value="">Elige una competencia</option>
          {competencies.map(c => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </select>
      </div>
      {/* Selector de producto */}
      <div className="w-full max-w-2xl mb-6">
        <label className="font-bold mr-2 text-lg">Selecciona producto:</label>
        <select
          value={selectedProductId ?? ""}
          onChange={e => {
            setSelectedProductId(Number(e.target.value) || null);
            setContext(null);
          }}
          className="cursor-pointer border border-indigo-200 rounded-lg px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
        >
          <option value="">Elige un producto</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Selector de habilidad */}
      {context && (
        <div className="w-full max-w-2xl mb-6">
          <label className="font-bold mr-2 text-lg">Selecciona habilidad a evaluar:</label>
          <select
            value={selectedAbilityId ?? ""}
            onChange={e => setSelectedAbilityId(Number(e.target.value))}
            className="cursor-pointer border border-indigo-200 rounded-lg px-3 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
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
        <div className="overflow-x-auto w-full max-w-4xl">
          <table className="border w-full rounded-xl shadow bg-white/90">
            <thead>
              <tr>
                <th className="border p-2 align-bottom bg-indigo-100 text-indigo-800 font-semibold" rowSpan={3} style={{ minWidth: 180 }}>
                  Estudiante
                </th>
                <th className="border p-2 text-center bg-indigo-50 text-indigo-900 font-semibold" colSpan={context.criteria.filter(c => c.ability_id === selectedAbilityId).length}>
                  {context.competency.display_name}
                </th>
                <th className="border p-2 align-bottom bg-indigo-100 text-indigo-800 font-semibold" rowSpan={3} style={{ minWidth: 120 }}>
                  Observaciones
                </th>
              </tr>
              <tr>
                <th className="border p-2 text-center bg-indigo-50 text-indigo-900" colSpan={context.criteria.filter(c => c.ability_id === selectedAbilityId).length}>
                  {context.abilities.find(a => a.id === selectedAbilityId)?.display_name}
                </th>
              </tr>
              <tr>
                {context.criteria
                  .filter(c => c.ability_id === selectedAbilityId)
                  .map(cr => (
                    <th
                      key={cr.id}
                      className="border p-2 text-center bg-indigo-50 text-indigo-900"
                    >
                      {cr.display_name}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {context.students.map(st => (
                <tr key={st.id} className="odd:bg-white even:bg-indigo-50">
                  <td className="border p-2 font-semibold text-indigo-900">{st.full_name}</td>
                  {context.criteria
                    .filter(c => c.ability_id === selectedAbilityId)
                    .map(cr => (
                      <td key={cr.id} className="border p-2 text-center">
                        {["AD", "A", "B", "C"].map(level => (
                          <label key={level} className="mx-1 text-xs font-semibold text-indigo-700">
                            <input
                              type="radio"
                              name={`eval_${st.id}_${cr.id}`}
                              checked={localValues[st.id]?.[cr.id] === level}
                              disabled={saving || context.locked}
                              onChange={() =>
                                handleLocalChange(st.id, cr.id, level as EvalValue)
                              }
                              className="cursor-pointer accent-indigo-600"
                            />{" "}
                            {level}
                          </label>
                        ))}
                      </td>
                    ))}
                  <td className="border p-2 text-center">
                    <button
                      className={`px-3 py-1 rounded-lg font-semibold ${localObs[st.id]?.trim() ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition`}
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
          <div className="mt-6 flex gap-4 items-center justify-end">
            <button
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow transition disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
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