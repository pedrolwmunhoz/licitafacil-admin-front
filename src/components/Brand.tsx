type Props = {
  size?: "sm" | "md";
  adminBadge?: boolean;
  dark?: boolean;
};

export function RadarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1D1D1B" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d="M4 4a16 16 0 0 1 16 16" />
      <path d="M4 10a10 10 0 0 1 10 10" />
      <circle cx="5" cy="19" r="1.8" fill="#1D1D1B" stroke="none" />
    </svg>
  );
}

export function Brand({ size = "md", adminBadge = false }: Props) {
  const box = size === "sm" ? 28 : 36;
  const icon = size === "sm" ? 17 : 23;
  const text = size === "sm" ? "text-[16px]" : "text-[20px]";
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex shrink-0 items-center justify-center rounded-mock bg-yellow"
        style={{ width: box, height: box }}
        aria-hidden
      >
        <RadarIcon size={icon} />
      </span>
      <span className={`${text} font-extrabold tracking-tight text-white whitespace-nowrap`}>
        Licita<span className="text-yellow">Facil</span>
      </span>
      {adminBadge && (
        <span className="rounded-[2px] bg-muted px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.14em] text-yellow">
          ADMIN
        </span>
      )}
    </div>
  );
}
