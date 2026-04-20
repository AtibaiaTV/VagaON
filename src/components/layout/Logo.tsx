interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}

const widths = { sm: 110, md: 148, lg: 196 };
const heights = { sm: 36, md: 48, lg: 64 };

export default function Logo({ size = "md", variant = "default" }: LogoProps) {
  if (variant === "white") {
    // On dark backgrounds: show the real logo inside a white rounded container
    return (
      <div
        className="inline-flex items-center justify-center bg-white rounded-xl"
        style={{ padding: "8px 14px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-horizontal.png"
          alt="VagaON"
          style={{
            width: widths[size],
            height: heights[size],
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  // Default: on light backgrounds, use the PNG directly with multiply blend
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
