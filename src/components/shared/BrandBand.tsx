import { ReactNode } from "react";

type BrandColor = "dark" | "darker";

const COLORS: Record<BrandColor, string> = {
  dark: "#1a5c38",
  darker: "#143f28",
};

export default function BrandBand({
  color = "dark",
  dots = false,
  circles = true,
  className = "",
  children,
}: {
  color?: BrandColor;
  dots?: boolean;
  circles?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ backgroundColor: COLORS[color] }} className={`relative overflow-hidden ${className}`}>
      {dots && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      )}
      {circles && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
}
