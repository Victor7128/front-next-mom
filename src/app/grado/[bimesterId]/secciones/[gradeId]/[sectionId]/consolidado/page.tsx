"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Modelos según el consolidado del backend
type Competency = { id: number; display_name: string; transv?: boolean };
type Criterion = { id: number; competency_id: number; display_name: string };
type Student = { id: number; full_name: string };
type Value = { student_id: number; criterion_id: number; value: string };

type ConsolidadoResponse = {
  students: Student[];
  competencies: Competency[];
  criteria: Criterion[];
  values: Value[];
};

export default function ConsolidadoPage() {
  const params = useParams() as { sectionId: string };
  const { sectionId } = params;
  const [data, setData] = useState<ConsolidadoResponse | null>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/sections/${sectionId}/consolidado`)
      .then(r => r.json())
      .then(setData);
  }, [sectionId]);

  if (!data) return <div>Cargando consolidado...</div>;

  // Agrupar criterios por competencia
  const criteriosPorComp: Record<number, Criterion[]> = {};
  data.criteria.forEach(cr => {
    if (!criteriosPorComp[cr.competency_id]) criteriosPorComp[cr.competency_id] = [];
    criteriosPorComp[cr.competency_id].push(cr);
  });

  // Separar competencias regulares y transversales
  const competenciasRegulares = data.competencies.filter(comp => !comp.transv);
  const competenciasTransversales = data.competencies.filter(comp => comp.transv);

  // Para obtener el valor de un criterio específico
  function getValorCriterio(student_id: number, criterion_id: number) {
    if (!data) return "";
    const valObj = data.values.find(
      v => v.student_id === student_id && v.criterion_id === criterion_id
    );
    return valObj ? valObj.value : "";
  }

  return (
    <main className="min-h-screen bg-white py-12 px-2 overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Consolidado</h1>
      <table className="border-collapse w-full text-xs">
        <thead>
          {/* Fila 1: Encabezados principales */}
          <tr>
            <th className="border font-bold bg-gray-200 text-center" rowSpan={3} style={{ minWidth: 32 }}>N°</th>
            <th className="border font-bold bg-gray-200 text-center" rowSpan={3} style={{ minWidth: 200 }}>APELLIDOS Y NOMBRES</th>
            <th 
              className="border font-bold bg-gray-100 text-center" 
              colSpan={competenciasRegulares.reduce((total, comp) => 
                total + (criteriosPorComp[comp.id]?.length || 0) + 1, 0
              )}
            >
              COMPETENCIAS DE AREA
            </th>
          </tr>

          {/* Fila 2: Nombres de competencias regulares */}
          <tr>
            {competenciasRegulares.map(comp =>
              <th
                key={comp.id}
                className="border font-bold bg-gray-100 text-center"
                colSpan={(criteriosPorComp[comp.id]?.length || 0) + 1}
              >
                {comp.display_name}
              </th>
            )}
          </tr>

          {/* Fila 3: Criterios y PROMED para competencias regulares, TIC y AUTON para transversales */}
          <tr>
            {competenciasRegulares.map(comp => (
              <React.Fragment key={comp.id}>
                {(criteriosPorComp[comp.id] || []).map(cr => (
                  <th key={cr.id} className="border font-bold bg-gray-200 text-center" style={{ minWidth: 36 }}>
                    {cr.display_name}
                  </th>
                ))}
                <th className="border font-bold bg-gray-200 text-center" style={{ minWidth: 36, writingMode: "vertical-rl" }}>
                  PROMED
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.students.map((st, idx) => (
            <tr key={st.id}>
              <td className="border text-center">{idx + 1}</td>
              <td className="border">{st.full_name}</td>
              
              {/* Competencias regulares: criterios y PROMED */}
              {competenciasRegulares.map(comp => (
                <React.Fragment key={comp.id}>
                  {(criteriosPorComp[comp.id] || []).map(cr => (
                    <td key={cr.id} className="border text-center" style={{ height: 32 }}>
                      {getValorCriterio(st.id, cr.id)}
                    </td>
                  ))}
                  <td className="border text-center" style={{ height: 32 }}>
                    {/* Celda vacía para PROMED (docente llenará) */}
                  </td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}