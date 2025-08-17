"use client";

import React, { useState } from "react";
import type { ConsolidadoResponse } from "@/app/util/exportConsolidado";
import { exportConsolidadoExcel } from "@/app/util/exportConsolidado";

interface ExportButtonProps {
  data: ConsolidadoResponse;
  fileName?: string;
  calcularPromedios?: boolean;
  comentarios?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  fileName,
  calcularPromedios = false,
  comentarios = true,
}) => {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    try {
      setLoading(true);
      await exportConsolidadoExcel(data, {
        hojaObservaciones: true,
        calcularPromedios: false,
        mostrarIcono: true
      });
    } catch (e) {
      console.error("Error exportando Excel:", e);
      alert("Ocurrió un error generando el Excel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60 cursor-pointer"
    >
      {loading ? "Generando..." : "Exportar Excel"}
    </button>
  );
};