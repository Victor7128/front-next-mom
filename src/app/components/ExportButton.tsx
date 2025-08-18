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
      className="px-4 py-2 rounded-lg bg-green-600 text-white text-base font-semibold shadow hover:bg-green-700 transition disabled:opacity-60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      {loading ? "Generando..." : "Exportar Excel"}
    </button>
  );
};