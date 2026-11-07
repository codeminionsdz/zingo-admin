import Image from "next/image";

const logoAspectRatio = 1335 / 466;

export function BrandLogo({
  className,
  width = 128,
  suffix,
}: {
  className?: string;
  width?: number;
  suffix?: string;
}) {
  return (
    <span
      className={className ? `brand-logo ${className}` : "brand-logo"}
      role="img"
      aria-label={suffix ? `ZinGo ${suffix}` : "ZinGo"}
    >
      <Image
        className="brand-logo__image"
        src="/branding/zingo-logo.png"
        alt=""
        width={width}
        height={Math.round(width / logoAspectRatio)}
        priority
      />
      {suffix ? <span className="brand-logo__suffix">{suffix}</span> : null}
    </span>
  );
}
