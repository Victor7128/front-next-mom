"use client";
import { useEffect, useState } from "react";
import BimesterList from "./components/BimesterList";

type Bimester = { id: number; name: string };

export default function HomePage() {
  const [bimesters, setBimesters] = useState<Bimester[]>([]);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/bimesters")
      .then(res => res.json())
      .then(setBimesters)
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Bimestres</h1>
      <BimesterList bimesters={bimesters} />
    </main>
  );
}