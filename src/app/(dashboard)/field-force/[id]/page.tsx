import React, { Suspense } from "react";
import { MRDetailsView } from "./MRDetailsView";

export const dynamic = "force-dynamic";

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
