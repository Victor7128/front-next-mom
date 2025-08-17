"use client";
import { useEffect, useState } from "react";
import BimesterList from "./components/BimesterList";

type Bimester = { id: number; name: string };

export default function HomePage() {
  const [bimesters, setBimesters] = useState<Bimester[]>([]);
  useEffect(() => {
    fetch("https://backend-web-mom-3dmj.shuttle.app/bimesters")
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