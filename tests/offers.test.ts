import { describe, expect, it } from "vitest";
import { descuentoPct, ofertaLabel, tieneOferta } from "../src/lib/offers";

describe("descuentoPct", () => {
  it("calcula el porcentaje redondeado", () => {
    expect(descuentoPct({ precio: 700, precioAnterior: 1000 })).toBe(30);
    expect(descuentoPct({ precio: 11300, precioAnterior: 18850 })).toBe(40);
  });
  it("es null si no hay precio anterior o no es mayor", () => {
    expect(descuentoPct({ precio: 700 })).toBeNull();
    expect(descuentoPct({ precio: 700, precioAnterior: 700 })).toBeNull();
    expect(descuentoPct({ precio: 700, precioAnterior: 500 })).toBeNull();
  });
});

describe("ofertaLabel", () => {
  it("prioriza el descuento concreto sobre la etiqueta", () => {
    expect(
      ofertaLabel({ precio: 700, precioAnterior: 1000, oferta: "Oferta" })
    ).toBe("-30%");
  });
  it("usa la etiqueta cuando no hay baja de precio", () => {
    expect(ofertaLabel({ precio: 700, oferta: "2x1" })).toBe("2x1");
  });
  it("es null sin oferta", () => {
    expect(ofertaLabel({ precio: 700 })).toBeNull();
  });
});

describe("tieneOferta", () => {
  it("detecta oferta por etiqueta o por descuento", () => {
    expect(tieneOferta({ precio: 700, precioAnterior: 1000 })).toBe(true);
    expect(tieneOferta({ precio: 700, oferta: "Combo" })).toBe(true);
    expect(tieneOferta({ precio: 700 })).toBe(false);
    expect(tieneOferta({ precio: 700, precioAnterior: 600 })).toBe(false);
  });
});
