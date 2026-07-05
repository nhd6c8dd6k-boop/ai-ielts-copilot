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
  compact = false,
  className,
  textClassName,
}: BrandLogoProps) {
  const content = (
    <>
      <BrandMark />
      <span className={cn("min-w-0 font-semibold tracking-tight", textClassName)}>
        <span className={compact ? "hidden sm:inline" : "hidden sm:inline"}>
          AI IELTS Copilot
        </span>
        <span className="sm:hidden">AI IELTS</span>
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
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#020617" />
        <path
          d="M8.5 22.5L14.2 9.5C14.55 8.7 15.68 8.7 16.03 9.5L21.7 22.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.4 17.4H18.8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M20.4 10.4H24.2C25.05 10.4 25.75 11.1 25.75 11.95V17.45C25.75 18.3 25.05 19 24.2 19H22.45L20.4 21.05V19H19.25"
          stroke="#5EEAD4"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.6 12.65L24.05 13.55L25.05 13.7L24.33 14.4L24.5 15.38L23.6 14.92L22.7 15.38L22.88 14.4L22.15 13.7L23.15 13.55L23.6 12.65Z"
          fill="#5EEAD4"
        />
      </svg>
    </span>
  );
}
