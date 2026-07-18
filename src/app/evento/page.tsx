import type { Metadata } from "next";
import Link from "next/link";
import { branding } from "@/config/branding";
import { loadWordmarkSvg } from "@/lib/wordmark";

export const metadata: Metadata = {
  title: "El evento",
  description: `${branding.name}: ${branding.eventDates}. ${branding.eventPlace}. Stands de proveedores, ofertas del evento y tu carrito en el teléfono.`,
};

/**
 * Landing del evento (/evento): hero con el wordmark y los círculos
 * flotantes de la identidad FarmaFest, info de la edición 2026 y cómo
 * usar el carrito. Los QR de pasillo siguen apuntando al buscador (/).
 */
export default function EventoPage() {
  return (
    <div className="pt-2">
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden -mx-3 px-6 pt-12 pb-14 text-center">
        <FestCircles />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fest-magenta-texto">
            2ª edición
          </p>
          <div
            role="img"
            aria-label={branding.name}
            className="w-72 max-w-full mx-auto mt-4"
            dangerouslySetInnerHTML={{ __html: loadWordmarkSvg() }}
          />
          <p className="mt-5 text-lg font-bold text-brand-dark">
            {branding.eventDates}
          </p>
          <p className="text-sm text-ink-muted mt-1">{branding.eventPlace}</p>
          <div className="mt-7 flex flex-col items-center gap-2">
            <Link
              href="/"
              className="h-12 px-8 rounded-2xl bg-brand text-white font-semibold flex items-center shadow-md active:bg-brand-dark"
            >
              Buscar productos
            </Link>
            <Link
              href="/carrito/"
              className="h-11 px-6 rounded-2xl font-semibold text-brand flex items-center active:bg-brand-soft"
            >
              Ver mi carrito
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Números del evento ---- */}
      <section aria-label="El evento en números">
        <dl className="grid grid-cols-3 gap-2">
          <Stat value="60" label="stands" color="bg-fest-amarillo/25" />
          <Stat value="9.000+" label="productos" color="bg-fest-rosa/25" />
          <Stat value="3" label="días" color="bg-fest-celeste/40" />
        </dl>
      </section>

      {/* ---- Qué es ---- */}
      <section className="mt-8 px-1">
        <h2 className="text-xl font-bold">El evento de tu farmacia</h2>
        <p className="text-sm text-ink-muted mt-2 leading-relaxed">
          Tres días con los proveedores de la red en un mismo predio:
          lanzamientos, precios de evento y asesoramiento en cada stand.
          Recorré, compará y comprá directo en la caja de cada proveedor.
        </p>
      </section>

      {/* ---- Cómo funciona el carrito ---- */}
      <section className="mt-8 px-1">
        <h2 className="text-xl font-bold">Tu carrito, en tu teléfono</h2>
        <ol className="mt-4 flex flex-col gap-4">
          <Paso n={1} color="bg-fest-azul">
            <b>Escaneá el QR</b> pegado en el stand (o buscá cualquier
            producto desde la home) y mirá precios al instante.
          </Paso>
          <Paso n={2} color="bg-fest-magenta">
            <b>Armá tu carrito</b> mientras recorrés. Se guarda en tu
            teléfono y se agrupa solo por stand.
          </Paso>
          <Paso n={3} color="bg-fest-verde">
            <b>Pasá por la caja del stand</b> y mostrá el QR de tu pedido
            para pagar. Cada stand cobra en su propia caja.
          </Paso>
        </ol>
        <p className="text-xs text-ink-muted mt-4">
          La app funciona aunque la señal en el predio sea mala: una vez que
          la abriste, el catálogo queda guardado en tu teléfono.
        </p>
      </section>

      {/* ---- Preguntas frecuentes ---- */}
      <section className="mt-10 px-1">
        <h2 className="text-xl font-bold mb-3">Preguntas frecuentes</h2>
        <div className="flex flex-col gap-2">
          <Faq q="¿Tengo que instalar una app?">
            No. Es una página web: escaneás un QR y ya estás adentro. Si
            querés, el navegador te ofrece agregarla a tu pantalla de inicio.
          </Faq>
          <Faq q="¿Funciona sin señal?">
            Sí. Después de la primera visita, el catálogo completo y tu
            carrito quedan disponibles aunque no tengas conexión. Los precios
            se actualizan cuando volvés a tener señal.
          </Faq>
          <Faq q="¿Cómo pago?">
            En la caja de cada stand, con los medios de pago que acepte ese
            proveedor. La app no cobra: te genera un QR con tu pedido para
            agilizar la fila.
          </Faq>
          <Faq q="¿Los precios de la app son los finales?">
            Los precios se cargan y actualizan durante el evento, pero el
            precio final siempre lo confirma la caja del stand al cobrar.
          </Faq>
          <Faq q="¿Cuándo y dónde es?">
            {branding.eventDates}. {branding.eventPlace}. Apenas se confirmen
            fechas y sede definitivas, las vas a ver acá.
          </Faq>
        </div>
      </section>

      {/* ---- CTA final ---- */}
      <section className="mt-10 mb-4 rounded-2xl bg-brand-soft px-5 py-6 text-center">
        <p className="font-bold text-lg">¿Listo para recorrer?</p>
        <Link
          href="/"
          className="mt-4 h-12 px-8 rounded-2xl bg-brand text-white font-semibold inline-flex items-center active:bg-brand-dark"
        >
          Empezar a buscar
        </Link>
      </section>
    </div>
  );
}

/** Círculos flotantes de la identidad FarmaFest (decorativos). */
function FestCircles() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <span className="fest-circle bg-fest-rosa/70 w-36 h-36 -left-10 top-6" />
      <span
        className="fest-circle bg-fest-celeste/80 w-24 h-24 -right-6 top-24"
        style={{ animationDelay: "-2s", animationDuration: "9s" }}
      />
      <span
        className="fest-circle bg-fest-amarillo/70 w-16 h-16 left-6 bottom-2"
        style={{ animationDelay: "-4s", animationDuration: "8s" }}
      />
      <span
        className="fest-circle bg-fest-lima/60 w-10 h-10 right-14 bottom-8"
        style={{ animationDelay: "-1s", animationDuration: "6s" }}
      />
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl ${color} px-3 py-4 text-center flex flex-col`}>
      <dt className="order-2 text-xs text-ink/80">{label}</dt>
      <dd className="order-1 text-2xl font-bold text-ink tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Paso({
  n,
  color,
  children,
}: {
  n: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 items-start">
      <span
        className={`${color} w-9 h-9 rounded-full text-white font-bold flex items-center justify-center shrink-0 mt-0.5`}
        aria-hidden
      >
        {n}
      </span>
      <p className="text-sm leading-relaxed pt-1.5">{children}</p>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl bg-surface border border-border-c px-4 py-3">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-semibold text-sm min-h-8">
        {q}
        <span
          aria-hidden
          className="text-brand transition-transform group-open:rotate-45 text-xl leading-none"
        >
          +
        </span>
      </summary>
      <p className="text-sm text-ink-muted leading-relaxed pt-2">{children}</p>
    </details>
  );
}
