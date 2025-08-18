import React, { useEffect } from "react";

export function ModalAutoClose({
  message,
  onClose,
  timeout = 2000,
}: {
  message: string;
  onClose: () => void;
  timeout?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, timeout);
    return () => clearTimeout(timer);
  }, [message, onClose, timeout]);

  // Decide color/icon based on message content
  const isError = message.toLowerCase().includes("error");
  const isWarning = message.toLowerCase().includes("advertencia") || message.toLowerCase().includes("warning");
  const color = isError
    ? "red"
    : isWarning
    ? "yellow"
    : "green";
  const icon = isError ? (
    <span className="text-red-600 text-4xl mb-2">✖️</span>
  ) : isWarning ? (
    <span className="text-yellow-500 text-4xl mb-2">⚠️</span>
  ) : (
    <span className="text-green-600 text-4xl mb-2">✅</span>
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] w-full max-w-xs flex flex-col items-center gap-3 border-t-8 border-${color}-500`}>
        {icon}
        <h2 className={`text-2xl font-bold mb-2 text-${color}-700 text-center`}>
          {isError ? "¡Error!" : isWarning ? "Advertencia" : "¡Guardado!"}
        </h2>
        <p className="mb-4 text-base text-gray-900 text-center">{message}</p>
        <div className="text-gray-400 text-sm italic">Este mensaje se cerrará automáticamente</div>
      </div>
    </div>
  );
}