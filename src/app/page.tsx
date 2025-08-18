"use client";
import { useEffect, useState } from "react";
import BimesterList from "./components/BimesterList";

type Bimester = { id: number; name: string };

export default function HomePage() {
  const [bimesters, setBimesters] = useState<Bimester[]>([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bimesters`)
      .then(res => res.json())
      .then(setBimesters)
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-8 tracking-tight">
          Bimestres
        </h1>
        <BimesterList bimesters={bimesters} />
      </div>
    </main>
  );
}