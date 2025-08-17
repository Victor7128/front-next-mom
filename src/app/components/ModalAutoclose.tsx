import React, { useEffect } from "react";

export function ModalAutoClose({ message, onClose, timeout = 2000 }: { message: string; onClose: () => void; timeout?: number }) {
  useEffect(() => {
    const timer = setTimeout(onClose, timeout);
    return () => clearTimeout(timer);
  }, [message, onClose, timeout]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="bg-white rounded-lg shadow-lg p-8 text-center min-w-[300px]">
        <h2 className="text-xl font-bold mb-4">
          {message.includes("Error") ? "Error" : "¡Guardado!"}
        </h2>
        <p className="mb-6">{message}</p>
        <div className="text-gray-400 text-sm">Este mensaje se cerrará automáticamente</div>
      </div>
    </div>
  );
}