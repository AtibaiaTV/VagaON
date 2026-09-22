"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<typeof Input>, "type">;

/**
 * Campo de senha com o "olhinho" para conferir o que foi digitado — no
 * celular, sem isso, erro de digitação só aparece no "senhas não conferem".
 */
const InputSenha = forwardRef<HTMLInputElement, Props>(function InputSenha({ className = "", ...props }, ref) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visivel ? "text" : "password"} className={`pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        tabIndex={-1}
      >
        {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export default InputSenha;
