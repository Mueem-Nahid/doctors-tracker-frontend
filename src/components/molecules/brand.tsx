import Link from "next/link";
import { BrandMark } from "@/components/atoms/brand-mark";

type BrandProps = { className?: string; href?: string };

export function Brand({ className = "", href = "/dashboard" }: BrandProps) {
  return (
    <Link aria-label="Doctor Tracker home" className={`brand ${className}`.trim()} href={href}>
      <BrandMark className="brand-mark" />
      <span>Doctor Tracker</span>
    </Link>
  );
}
