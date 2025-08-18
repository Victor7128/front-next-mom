import Link from "next/link";
import React from "react";

type Bimester = {
  id: number;
  name: string;
};

type BimesterListProps = {
  bimesters: Bimester[];
};

export default function BimesterList({ bimesters }: BimesterListProps) {
  return (
    <div
      className="
        grid grid-cols-1 sm:grid-cols-2 gap-6
      "
    >
      {bimesters.map((bimester) => (
        <Link
          key={bimester.id}
          href={`/grado/${bimester.id}`}
          className="
            group
            rounded-2xl
            bg-white/80
            border border-indigo-200
            shadow-sm
            p-6
            flex flex-col items-center
            transition-all
            hover:shadow-xl hover:bg-indigo-50 hover:border-indigo-300
            focus:outline-none focus:ring-2 focus:ring-indigo-400
            active:scale-[0.98]
            cursor-pointer
            text-inherit
            no-underline
            min-h-[100px]
          "
        >
          <span className="text-xl font-medium text-indigo-800 group-hover:text-indigo-900 transition">
            {bimester.name}
          </span>
        </Link>
      ))}
    </div>
  );
}