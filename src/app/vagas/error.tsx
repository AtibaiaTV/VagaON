"use client";

import { useEffect } from "react";

export default function VagasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/vagas error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f5]">
      <div className="text-center max-w-md px-6">
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar vagas</h2>
        <p className="text-muted-foreground text-sm mb-1">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
