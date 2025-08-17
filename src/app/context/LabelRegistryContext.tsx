"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface LabelRegistryState {
  labels: Record<string,string>;
  setLabel: (segment: string, label: string) => void;
  setMany: (entries: Record<string,string>) => void;
  getLabel: (segment: string) => string | undefined;
  clear: () => void;
}

const LabelRegistryContext = createContext<LabelRegistryState | null>(null);

export const LabelRegistryProvider: React.FC<{children: React.ReactNode; initial?: Record<string,string>}> = ({children, initial = {}}) => {
  const [labels, setLabels] = useState<Record<string,string>>(initial);

  const setLabel = useCallback((segment: string, label: string) => {
    setLabels(prev => prev[segment] === label ? prev : {...prev, [segment]: label});
  }, []);

  const setMany = useCallback((entries: Record<string,string>) => {
    setLabels(prev => {
      let changed = false;
      const merged = {...prev};
      for (const k in entries) {
        if (entries[k] && merged[k] !== entries[k]) {
          merged[k] = entries[k];
          changed = true;
        }
      }
      return changed ? merged : prev;
    });
  }, []);

  const getLabel = useCallback((segment: string) => labels[segment], [labels]);
  const clear = useCallback(() => setLabels({}), []);

  return (
    <LabelRegistryContext.Provider value={{labels, setLabel, setMany, getLabel, clear}}>
      {children}
    </LabelRegistryContext.Provider>
  );
};

export function useLabelRegistry() {
  const ctx = useContext(LabelRegistryContext);
  if (!ctx) throw new Error("useLabelRegistry debe usarse dentro de <LabelRegistryProvider>");
  return ctx;
}