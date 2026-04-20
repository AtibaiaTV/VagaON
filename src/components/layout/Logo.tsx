interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

const widths = { sm: 110, md: 148, lg: 196 };
const heights = { sm: 36, md: 48, lg: 64 };

export default function Logo({ size = "md", variant = "default" }: LogoProps) {
  if (variant === "white") {
    // On dark green backgrounds: invert to pure white logo
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/images/logo-horizontal.png"
        alt="VagaON"
        style={{
          width: widths[size],
          height: heights[size],
          objectFit: "contain",
          filter: "brightness(0) invert(1)",
          flexShrink: 0,
        }}
      />
    );
  }

  // Default: on light/white backgrounds
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
