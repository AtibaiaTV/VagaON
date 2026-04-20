interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

const widths = { sm: 120, md: 160, lg: 210 };
const heights = { sm: 40, md: 52, lg: 68 };

export default function Logo({ size = "md", variant = "default" }: LogoProps) {
  if (variant === "white") {
    return (
      <div className="flex items-center gap-2">
        <svg width="26" height="18" viewBox="0 0 32 22" fill="none">
          <path d="M2 12 C6 17 10 20 13 20 C16 20 20 14 30 2" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.06em" }}>
          <span style={{ color: "#ffffff" }}>VAGA</span>
          <span style={{ color: "#4ade80" }}>ON</span>
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo-horizontal.png"
      alt="VagaON"
      style={{
        width: widths[size],
        height: heights[size],
        objectFit: "contain",
        mixBlendMode: "multiply",
        flexShrink: 0,
      }}
    />
  );
}
