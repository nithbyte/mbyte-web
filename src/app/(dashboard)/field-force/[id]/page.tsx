import React, { Suspense } from "react";
import { MRDetailsView } from "./MRDetailsView";
import { mockMRs } from "@/mock";

export function generateStaticParams() {
  return mockMRs.map((mr) => ({
    id: mr.id,
  }));
}

export default async function MRDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-slate-500">
          Loading representative details...
        </div>
      }
    >
      <MRDetailsView id={id} />
    </Suspense>
  );
}
