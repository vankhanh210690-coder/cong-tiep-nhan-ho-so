import { cn } from "@/lib/utils";

export const LogoMark = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn("size-7", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring hairline */}
      <circle cx="24" cy="24" r="23" stroke="currentColor" strokeOpacity="0.18" />
      {/* Inner compass star — editorial compass motif */}
      <path
        d="M24 7 L26.4 21.6 L41 24 L26.4 26.4 L24 41 L21.6 26.4 L7 24 L21.6 21.6 Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="2.4" fill="var(--background)" />
    </svg>
  );
};

export const Logo = ({ className }: { className?: string; uniColor?: boolean }) => {
  return (
    <span className={cn("flex items-center gap-2.5 text-foreground", className)}>
      <LogoMark />
      <span className="flex items-baseline gap-0.5">
        <span className="font-serif text-xl font-medium tracking-tight">DuHoc</span>
        <span className="font-mono text-[0.7rem] font-light text-[color:var(--umber)]">
          /24
        </span>
      </span>
    </span>
  );
};
