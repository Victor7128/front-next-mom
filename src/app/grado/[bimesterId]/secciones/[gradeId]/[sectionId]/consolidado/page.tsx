"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ExportButton } from "@/app/components/ExportButton";
import type {
  ConsolidadoResponse,
  Session,
  Competency,
  Ability,
  Criterion,
  Student,
  Observation,
  Value
} from "@/app/util/exportConsolidado";

export default function ConsolidadoPage() {
  const params = useParams() as { sectionId: string };
  const { sectionId } = params;

  // Estados base
  const [data, setData] = useState<ConsolidadoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalObs, setModalObs] = useState<{
    student: Student;
    ability: Ability;
    text: string;
  } | null>(null);

  // Carga de datos
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setData(null);

    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://backend-web-mom-3dmj.shuttle.app";
    fetch(`${base}/sections/${sectionId}/consolidado`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`Error ${r.status} al cargar consolidado`);
        }
        return r.json();
      })
      .then((json: ConsolidadoResponse) => setData(json))
      .catch((e) => {
        if (e.name === "AbortError") return;
        console.error(e);
        setError(e.message);
      });

    return () => controller.abort();
  }, [sectionId]);

  // Datos seguros (para que los useMemo siempre tengan algo)
  const sessions = data?.sessions ?? [];
  const competencies = data?.competencies ?? [];
  const abilities = data?.abilities ?? [];
  const criterios = data?.criteria ?? [];
  const students = data?.students ?? [];
  const observations = data?.observations ?? [];
  const values = data?.values ?? [];

  // Agrupaciones memoizadas
  const compsPorSesion = useMemo(() => {
    const map: Record<number, Competency[]> = {};
    competencies.forEach((c) => (map[c.session_id] ||= []).push(c));
    return map;
  }, [competencies]);

  const abilitiesPorComp = useMemo(() => {
    const map: Record<number, Ability[]> = {};
    abilities.forEach((a) => (map[a.competency_id] ||= []).push(a));
    return map;
  }, [abilities]);

  const criteriosPorAbility = useMemo(() => {
    const map: Record<number, Criterion[]> = {};
    criterios.forEach((cr) => (map[cr.ability_id] ||= []).push(cr));
    return map;
  }, [criterios]);

  const obsPorEstudHab = useMemo(() => {
    const map: Record<string, string> = {};
    observations.forEach((o: Observation) => {
      map[`${o.student_id}-${o.ability_id}`] = o.observation;
    });
    return map;
  }, [observations]);

  const valorPorStudentCriterion = useMemo(() => {
    const map: Record<string, string> = {};
    values.forEach((v: Value) => {
      map[`${v.student_id}-${v.criterion_id}`] = v.value;
    });
    return map;
  }, [values]);

  function getValorCriterio(student_id: number, criterion_id: number) {
    return valorPorStudentCriterion[`${student_id}-${criterion_id}`] ?? "";
  }

  function getColspanSesion(ses: Session) {
    return (compsPorSesion[ses.id] || []).reduce((acc, comp) => {
      return (
        acc +
        (abilitiesPorComp[comp.id] || []).reduce((sum, ab) => {
          return sum + (criteriosPorAbility[ab.id]?.length || 0) + 1; // +1 observación
        }, 0) +
        1 // +1 promedio competencia
      );
    }, 0);
  }

  function getAbilityById(ability_id: number) {
    return abilities.find((a) => a.id === ability_id);
  }

  function getStudentById(student_id: number) {
    return students.find((s) => s.id === student_id);
  }

  const isLoading = !error && data === null;
  const hasData = !isLoading && !error && data !== null;

  return (
    <main className="min-h-screen bg-white py-8 px-3 overflow-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">
          Consolidado por Sesión
        </h1>
        {hasData && data && (
          <ExportButton
            data={data}
            fileName={`consolidado_seccion_${sectionId}.xlsx`}
            calcularPromedios={false}
            comentarios={true}
          />
        )}
      </div>

      {error && (
        <div className="p-4 border rounded bg-red-50 text-red-700 mb-4">
          <p className="font-semibold mb-2">
            No se pudo cargar el consolidado: {error}
          </p>
          <button
            onClick={() => location.reload()}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-4 text-sm text-gray-600 animate-pulse">
          Cargando consolidado...
        </div>
      )}

      {hasData && (
        <div className="overflow-auto border rounded">
          <table className="border-collapse w-full text-xs">
            <thead>
              {/* Fila 1: Sesiones */}
              <tr>
                <th
                  className="border font-bold bg-gray-200 text-center"
                  rowSpan={4}
                  style={{ minWidth: 36 }}
                >
                  N°
                </th>
                <th
                  className="border font-bold bg-gray-200 text-center"
                  rowSpan={4}
                  style={{ minWidth: 240 }}
                >
                  APELLIDOS Y NOMBRES
                </th>
                {sessions.map((ses) => (
                  <th
                    key={ses.id}
                    className="border font-bold bg-gray-100 text-center"
                    colSpan={getColspanSesion(ses)}
                  >
                    {ses.title || `Sesión ${ses.number}`}
                  </th>
                ))}
              </tr>

              {/* Fila 2: Competencias */}
              <tr>
                {sessions.map((ses) =>
                  (compsPorSesion[ses.id] || []).map((comp) => (
                    <th
                      key={comp.id}
                      className="border font-bold bg-gray-100 text-center"
                      colSpan={
                        (abilitiesPorComp[comp.id] || []).reduce(
                          (sum, ab) =>
                            sum + (criteriosPorAbility[ab.id]?.length || 0) + 1, // obs
                          0
                        ) + 1 // promedio
                      }
                    >
                      {comp.display_name}
                    </th>
                  ))
                )}
              </tr>

              {/* Fila 3: Habilidades */}
              <tr>
                {sessions.map((ses) =>
                  (compsPorSesion[ses.id] || []).flatMap((comp) => {
                    const abilityCells = (abilitiesPorComp[comp.id] || []).map(
                      (ab) => (
                        <th
                          key={ab.id}
                          className="border font-bold bg-gray-200 text-center"
                          colSpan={(criteriosPorAbility[ab.id]?.length || 0) + 1}
                        >
                          {ab.display_name}
                        </th>
                      )
                    );
                    abilityCells.push(
                      <th
                        key={`promed-col-${comp.id}`}
                        className="border font-bold bg-gray-200 text-center"
                        rowSpan={1}
                        style={{
                          minWidth: 40,
                          writingMode: "vertical-rl",
                          rotate: "180deg",
                        }}
                      >
                        PROMED
                      </th>
                    );
                    return abilityCells;
                  })
                )}
              </tr>

              {/* Fila 4: Criterios + Observación + Resultado */}
              <tr>
                {sessions.map((ses) =>
                  (compsPorSesion[ses.id] || []).flatMap((comp) => {
                    const cells = (abilitiesPorComp[comp.id] || []).flatMap(
                      (ab) => {
                        const crits = criteriosPorAbility[ab.id] || [];
                        return [
                          ...crits.map((cr) => (
                            <th
                              key={cr.id}
                              className="border font-bold bg-gray-100 text-center"
                              style={{ minWidth: 36 }}
                              title={cr.display_name}
                            >
                              {cr.display_name}
                            </th>
                          )),
                          <th
                            key={`obs-head-${ab.id}`}
                            className="border font-bold bg-yellow-50 text-center"
                            style={{ minWidth: 30 }}
                            title="Observación"
                          >
                            📝
                          </th>,
                        ];
                      }
                    );
                    cells.push(
                      <th
                        key={`resultado-head-${comp.id}`}
                        className="border font-bold bg-gray-100 text-center"
                        style={{ minWidth: 52 }}
                        title="Promedio de la competencia"
                      >
                        Resultado
                      </th>
                    );
                    return cells;
                  })
                )}
              </tr>
            </thead>

            <tbody>
              {students.map((st, idx) => (
                <tr key={st.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border text-center font-medium">{idx + 1}</td>
                  <td className="border">{st.full_name}</td>

                  {sessions.map((ses) =>
                    (compsPorSesion[ses.id] || []).flatMap((comp) =>
                      (abilitiesPorComp[comp.id] || []).flatMap((ab) => {
                        const crits = criteriosPorAbility[ab.id] || [];
                        return [
                          ...crits.map((cr) => (
                            <td
                              key={`${st.id}-${cr.id}`}
                              className="border text-center"
                              style={{ height: 30 }}
                            >
                              {getValorCriterio(st.id, cr.id)}
                            </td>
                          )),
                          <td
                            key={`obs-${st.id}-${ab.id}`}
                            className="border text-center"
                            style={{
                              height: 30,
                              background: obsPorEstudHab[`${st.id}-${ab.id}`]
                                ? "#FFF9C4"
                                : undefined,
                            }}
                          >
                            {obsPorEstudHab[`${st.id}-${ab.id}`] && (
                              <button
                                title="Ver observación"
                                onClick={() =>
                                  setModalObs({
                                    student: getStudentById(st.id)!,
                                    ability: getAbilityById(ab.id)!,
                                    text: obsPorEstudHab[`${st.id}-${ab.id}`],
                                  })
                                }
                                className="text-yellow-600 hover:text-yellow-900"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "1.05em",
                                }}
                              >
                                📝
                              </button>
                            )}
                          </td>,
                        ];
                      }).concat([
                        <td
                          key={`promed-${st.id}-${comp.id}`}
                          className="border text-center text-[11px]"
                          style={{ height: 30 }}
                        ></td>,
                      ])
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Observaciones */}
      {modalObs && (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setModalObs(null)}
              title="Cerrar"
            >
              ✖
            </button>
            <h2 className="text-lg font-bold mb-2">
              Observación de {modalObs.student.full_name}
            </h2>
            <p className="text-sm text-gray-700 mb-2">
              <b>Habilidad:</b> {modalObs.ability.display_name}
            </p>
            <div className="border p-3 rounded bg-gray-50 text-gray-800 whitespace-pre-line text-sm max-h-64 overflow-auto">
              {modalObs.text}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}