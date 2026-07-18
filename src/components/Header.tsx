import Link from "next/link";
import Image from "next/image";
import { branding } from "@/config/branding";
import { CartLink } from "./CartLink";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-brand text-white shadow-md">
      <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
        <Link href="/" className="flex items-center gap-2 min-w-0 flex-1">
          <Image
            src={branding.logoSmall}
            alt=""
            width={28}
            height={28}
            className="shrink-0"
          />
          <span className="font-bold text-lg tracking-tight truncate">
            {branding.name}
          </span>
        </Link>
        <CartLink />
      </div>
    </header>
  );
}
