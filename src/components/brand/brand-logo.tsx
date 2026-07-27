import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  textClassName?: string;
};

export function BrandLogo({
  href = "/",
  className,
  textClassName,
}: BrandLogoProps) {
  const content = (
    <>
      <BrandMark />
      <span className={cn("min-w-0 font-semibold tracking-tight", textClassName)}>
        AI IELTS Copilot
      </span>
    </>
  );

  return (
    <Link
      href={href}
      aria-label="AI IELTS Copilot home"
      className={cn(
        "inline-flex min-w-0 items-center gap-2 text-sm text-slate-950",
        className,
      )}
    >
      {content}
    </Link>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200",
        className,
      )}
    >
      <Image
        src="/icon.png"
        alt=""
        width={32}
        height={32}
        sizes="32px"
        className="h-8 w-8 object-cover"
        priority
      />
    </span>
  );
}
