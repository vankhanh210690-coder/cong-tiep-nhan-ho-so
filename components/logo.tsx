import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Horizontal lockup — compass mark + wordmark "DuHoc/24".
 * Default height responsive: 28px mobile → 32px desktop.
 * Override với className (vd. "h-20 md:h-28" cho footer).
 */
export const Logo = ({ className }: { className?: string; uniColor?: boolean }) => {
  return (
    <Image
      src="/images/logo-duhoc24.png"
      alt="DuHoc24 — Cổng tiếp nhận hồ sơ du học"
      width={2075}
      height={515}
      priority
      className={cn("h-7 w-auto sm:h-8", className)}
    />
  );
};

/**
 * Compass mark only — dùng khi cần icon vuông (favicon, badge, loading).
 */
export const LogoMark = ({ className }: { className?: string; uniColor?: boolean }) => {
  return (
    <Image
      src="/images/logo-compass.png"
      alt="DuHoc24 compass mark"
      width={515}
      height={479}
      className={cn("size-7 w-auto", className)}
    />
  );
};
