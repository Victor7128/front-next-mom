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
        flex flex-col gap-4
        sm:flex-row sm:flex-wrap
        justify-center items-center
        mt-4
      "
    >
      {bimesters.map((bimester) => (
        <Link
          key={bimester.id}
          href={`/grado/${bimester.id}`}
          className="
            w-full sm:w-64
            bg-white
            border border-gray-300
            rounded-xl
            shadow-md
            p-6
            flex flex-col items-center
            transition
            hover:scale-105 hover:shadow-lg
            cursor-pointer
            text-inherit
            no-underline
          "
        >
          <span className="text-lg font-semibold text-gray-800">
            {bimester.name}
          </span>
        </Link>
      ))}
    </div>
  );
}