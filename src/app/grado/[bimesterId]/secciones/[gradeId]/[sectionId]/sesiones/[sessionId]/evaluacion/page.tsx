"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, Fragment } from "react";
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
    [abilityId: number]: {
      [criterionId: number]: EvalValue | "";
    }
  }
};

type LocalObs = {
  [studentId: number]: {
    [abilityId: number]: string;
  }
};

export default function EvaluacionPage() {
  const params = useParams() as { sessionId?: string };
  const sessionId = params.sessionId;

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [context, setContext] = useState<EvaluationContextResponse | null>(null);

  const [localValues, setLocalValues] = useState<LocalValue>({});
  const [localObs, setLocalObs] = useState<LocalObs>({});
  const [saving, setSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal de observación
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsAbilityId, setObsAbilityId] = useState<number | null>(null);
  const [obsStudentId, setObsStudentId] = useState<number | null>(null);
  const [obsInput, setObsInput] = useState("");

  // Inicialización de combos
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

  // Cargar contexto y valores iniciales
  useEffect(() => {
    setContext(null);
    if (!sessionId || !selectedCompetencyId || !selectedProductId) return;
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/evaluation/context?session_id=${sessionId}&product_id=${selectedProductId}&competency_id=${selectedCompetencyId}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: EvaluationContextResponse) => {
        setContext(data);
        setLocalValues(prev => {
          const newVals: LocalValue = { ...prev };
          data.students.forEach(st => {
            if (!newVals[st.id]) newVals[st.id] = {};
            data.abilities.forEach(ability => {
              if (!newVals[st.id][ability.id]) newVals[st.id][ability.id] = {};
              data.criteria
                .filter(cr => cr.ability_id === ability.id)
                .forEach(cr => {
                  const found = data.values.find(
                    v => v.student_id === st.id && v.ability_id === ability.id && v.criterion_id === cr.id
                  );
                  newVals[st.id][ability.id][cr.id] = found ? (found.value as EvalValue) : "";
                });
            });
          });
          return newVals;
        });
        setLocalObs(prev => {
          const newObs: LocalObs = { ...prev };
          data.students.forEach(st => {
            if (!newObs[st.id]) newObs[st.id] = {};
            data.abilities.forEach(ability => {
              const found = data.values.find(
                v => v.student_id === st.id && v.ability_id === ability.id
              );
              newObs[st.id][ability.id] = found?.observation || "";
            });
          });
          return newObs;
        });
      })
      .catch(e => setFetchError(typeof e === "string" ? e : e.message));
  }, [sessionId, selectedCompetencyId, selectedProductId]);

  // Cambiar valor local
  const handleLocalChange = (
    student_id: number,
    ability_id: number,
    criterion_id: number,
    value: EvalValue
  ) => {
    setLocalValues(prev => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        [ability_id]: {
          ...prev[student_id]?.[ability_id],
          [criterion_id]: value,
        },
      },
    }));
  };

  // Observaciones
  const openObsModal = (studentId: number, abilityId: number) => {
    setObsStudentId(studentId);
    setObsAbilityId(abilityId);
    setObsInput(localObs[studentId]?.[abilityId] ?? "");
    setObsModalOpen(true);
  };
  const closeObsModal = () => setObsModalOpen(false);
  const handleSaveObs = () => {
    if (obsStudentId !== null && obsAbilityId !== null) {
      setLocalObs(prev => ({
        ...prev,
        [obsStudentId]: {
          ...prev[obsStudentId],
          [obsAbilityId]: obsInput,
        },
      }));
    }
    setObsModalOpen(false);
  };

  // Guardar TODO
  const handleSaveAll = async () => {
    if (!context || context.locked) return;
    setSaving(true);
    setModalMsg(null);
    const product = context.product;
    const promises: Promise<any>[] = [];
    context.students.forEach(st => {
      context.abilities.forEach(ability => {
        const criteria = context.criteria.filter(c => c.ability_id === ability.id);
        criteria.forEach(cr => {
          const value = localValues[st.id]?.[ability.id]?.[cr.id] ?? "";
          promises.push(
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/evaluation/value`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: Number(sessionId),
                competency_id: context.competency.id,
                ability_id: ability.id,
                criterion_id: cr.id,
                product_id: product.id,
                student_id: st.id,
                value,
                observation: localObs[st.id]?.[ability.id] || null,
              }),
            })
          );
        });
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
      // Opcional: recarga del backend
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

  // Agrupación de columnas por capacidad
  function getCapacityTableHeaders(abilities: Ability[], criteria: Criterion[]) {
    // Nivel 1: capacidad (colSpan = criterios + 1 observación)
    const abilityGroups = abilities.map(ability => {
      const numCriterios = criteria.filter(c => c.ability_id === ability.id).length;
      return {
        id: ability.id,
        display_name: ability.display_name,
        colSpan: numCriterios + 1,
      };
    });
    // Nivel 2: criterios + observación
    const criteriaHeaders = abilities.flatMap(ability => {
      const crs = criteria.filter(c => c.ability_id === ability.id);
      return [
        ...crs.map(cr => ({
          id: cr.id,
          label: cr.display_name,
          abilityId: ability.id,
        })),
        { id: `obs_${ability.id}`, label: "📝", abilityId: ability.id },
      ];
    });
    return { abilityGroups, criteriaHeaders };
  }

  if (fetchError) {
    return (
      <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-2 py-6">
        <div className="text-red-700 font-bold mb-4">{fetchError}</div>
        <div className="text-gray-500">
          Verifica que la URL tenga <b>sessionId</b> o que los elementos existan en la sesión.
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-2 py-6">
      {modalMsg && (
        <ModalAutoClose
          message={modalMsg}
          onClose={() => setModalMsg(null)}
        />
      )}

      {obsModalOpen && obsAbilityId !== null && obsStudentId !== null && context && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeObsModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 min-w-[220px] w-full max-w-xs flex flex-col gap-4 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-yellow-700 text-center">
              Observación para {context.students.find(s => s.id === obsStudentId)?.full_name}
              {" - "}
              {context.abilities.find(a => a.id === obsAbilityId)?.display_name}
            </h2>
            <textarea
              className="block w-full border border-blue-200 rounded-lg px-2 py-1 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              rows={3}
              value={obsInput}
              onChange={e => setObsInput(e.target.value)}
              placeholder="Escribe aquí la observación..."
              disabled={saving}
              maxLength={500}
            />
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                type="button"
                onClick={closeObsModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:bg-blue-400"
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

      {/* Título y selectores */}
      {context && context.session?.name && (
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-indigo-700 text-center">
          {context.session.name}
        </h1>
      )}
      {context && context.product?.name && (
        <div className="text-center text-sm md:text-base text-gray-700 mb-6">
          Producto: <span className="font-semibold">{context.product.name}</span>
        </div>
      )}

      {/* Selector de competencia */}
      <div className="w-full max-w-xl mb-4">
        <label className="font-bold mr-2 text-base md:text-lg">Selecciona competencia:</label>
        <select
          value={selectedCompetencyId ?? ""}
          onChange={e => {
            setSelectedCompetencyId(Number(e.target.value) || null);
            setSelectedProductId(null);
            setContext(null);
          }}
          className="cursor-pointer border border-indigo-200 rounded-lg px-2 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white text-sm"
        >
          <option value="">Elige una competencia</option>
          {competencies.map(c => (
            <option key={c.id} value={c.id}>{c.display_name}</option>
          ))}
        </select>
      </div>
      {/* Selector de producto */}
      <div className="w-full max-w-xl mb-6">
        <label className="font-bold mr-2 text-base md:text-lg">Selecciona producto:</label>
        <select
          value={selectedProductId ?? ""}
          onChange={e => {
            setSelectedProductId(Number(e.target.value) || null);
            setContext(null);
          }}
          className="cursor-pointer border border-indigo-200 rounded-lg px-2 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white text-sm"
        >
          <option value="">Elige un producto</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* MATRIZ COMPLETA */}
      {context && (
        <div className="w-full overflow-x-auto rounded-xl border bg-white/90">
          <div className="min-w-[650px] md:min-w-full">
          {(() => {
            const { abilityGroups, criteriaHeaders } = getCapacityTableHeaders(context.abilities, context.criteria);
            return (
              <table className="border-collapse w-full text-[11px] md:text-sm">
                <thead>
                  <tr>
                    <th
                      className="border font-bold bg-gray-200 text-center sticky left-0 z-10"
                      rowSpan={2}
                      style={{ minWidth: 80, maxWidth: 160, width: "25%", background: "#f1f5f9" }}
                    >
                      APELLIDOS Y NOMBRES
                    </th>
                    {abilityGroups.map(grp => (
                      <th
                        key={grp.id}
                        className="border font-bold bg-gray-100 text-center"
                        colSpan={grp.colSpan}
                      >
                        {grp.display_name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {criteriaHeaders.map(h => (
                      <th
                        key={`${h.abilityId}_${h.id}`}
                        className={`border font-bold text-center ${typeof h.id === "string" && h.id.startsWith("obs_") ? "bg-yellow-50" : "bg-gray-50"}`}
                        style={typeof h.id === "string" && h.id.startsWith("obs_") ? { minWidth: 24, fontWeight: 700 } : { minWidth: 24 }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {context.students.map((st, idx) => (
                    <tr key={st.id} className="odd:bg-white even:bg-gray-50">
                      <td
                        className="border text-black font-medium sticky left-0 z-10 bg-gray-200"
                        style={{ minWidth: 140, background: "#f1f5f9" }}
                      >
                        {st.full_name}
                      </td>
                      {context.abilities.map(ability => (
                        <Fragment key={ability.id}>
                          {context.criteria
                            .filter(c => c.ability_id === ability.id)
                            .map(cr => (
                              <td key={`v_${st.id}_${ability.id}_${cr.id}`} className="border text-center min-w-[28px] px-0">
                                <div className="flex flex-col md:flex-row gap-1 md:gap-0 justify-center items-center">
                                  {["AD", "A", "B", "C"].map(level => (
                                    <label key={level} className="mx-0.5 text-[10px] md:text-xs font-semibold text-indigo-700 whitespace-nowrap">
                                      <input
                                        type="radio"
                                        name={`eval_${st.id}_${ability.id}_${cr.id}`}
                                        checked={localValues[st.id]?.[ability.id]?.[cr.id] === level}
                                        disabled={saving || context.locked}
                                        onChange={() =>
                                          handleLocalChange(st.id, ability.id, cr.id, level as EvalValue)
                                        }
                                        className="cursor-pointer accent-indigo-600"
                                      />{" "}
                                      {level}
                                    </label>
                                  ))}
                                </div>
                              </td>
                            ))}
                          <td
                            key={`obs_${st.id}_${ability.id}`}
                            className="border text-center min-w-[30px] px-0"
                            style={{
                              background: localObs[st.id]?.[ability.id]?.trim() ? "#FFF9C4" : "#FEFCE8",
                            }}
                          >
                            <button
                              className={`px-2 py-1 rounded-lg font-semibold ${localObs[st.id]?.[ability.id]?.trim() ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition text-xs`}
                              type="button"
                              disabled={saving || context.locked}
                              onClick={() => openObsModal(st.id, ability.id)}
                            >
                              {localObs[st.id]?.[ability.id]?.trim()
                                ? "📝"
                                : "+"}
                            </button>
                          </td>
                        </Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-4 items-center justify-end w-full max-w-xl">
        <button
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow transition disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          disabled={saving || context?.locked}
          onClick={handleSaveAll}
        >
          Guardar toda la matriz de evaluación
        </button>
      </div>
    </main>
  );
}