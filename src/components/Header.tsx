import Link from "next/link";
import Image from "next/image";
import { branding } from "@/config/branding";
import { CartLink } from "./CartLink";

/**
 * Header de marca: blanco con el wordmark multicolor oficial, como el sitio
 * del evento. Los controles funcionales van en azul de marca.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border-c">
      <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
        <Link
          href="/"
          className="flex items-center min-w-0 flex-1"
          aria-label={`${branding.name}, inicio`}
        >
          <Image
            src={branding.logoSmall}
            alt={branding.name}
            width={107}
            height={25}
            priority
            className="h-[25px] w-auto"
          />
        </Link>
        <Link
          href="/evento/"
          className="text-sm font-semibold text-brand px-2 py-2 rounded-lg active:bg-brand-soft"
        >
          Evento
        </Link>
        <CartLink />
      </div>
    </header>
  );
}
