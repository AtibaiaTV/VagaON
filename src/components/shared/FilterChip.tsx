"use client";

export default function FilterChip({
  label,
  active,
  onClick,
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
        active
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white text-foreground border-border hover:border-primary/50 hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}
