"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ESPECIALIDADES_AGRUPADAS } from "@/constants/especialidades";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Select agrupado por categoria — para selecionar UMA especialidade (vagas) */
export default function EspecialidadeSelect({ value, onChange, placeholder = "Selecione a função" }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {ESPECIALIDADES_AGRUPADAS.map(({ categoria, itens }) => (
          <SelectGroup key={categoria.value}>
            <SelectLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide bg-muted/50 -mx-1 px-3 py-1.5">
              {categoria.label}
            </SelectLabel>
            {itens.map((esp) => (
              <SelectItem key={esp.value} value={esp.value} className="pl-5">
                {esp.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
