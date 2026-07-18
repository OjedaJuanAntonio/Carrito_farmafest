import { describe, expect, it } from "vitest";
import { addItem, EMPTY_CART, groupByStand } from "../src/lib/cart";
import { getStrategy, STRATEGIES } from "../src/lib/checkout";
import {
  decodeCompact,
  encodeCompact,
} from "../src/lib/checkout/compact-encoder";
import type { Product } from "../src/lib/types";

const P1: Product = {
  codigo: "7791000000017",
  descripcion: "Ibuprofeno 400mg x10",
  precio: 3500.5,
  stand: 12,
};
const P2: Product = {
  codigo: "7791000000024",
  descripcion: "Paracetamol 500mg x10",
  precio: 2100,
  stand: 12,
};

function group() {
  let c = addItem(EMPTY_CART, P1);
  c = addItem(c, P1);
  c = addItem(c, P2);
  return groupByStand(c)[0];
}

describe("estrategias de checkout", () => {
  it("la estrategia configurada existe y las tres están registradas", () => {
    expect(Object.keys(STRATEGIES).sort()).toEqual([
      "pantalla",
      "qr-codigos",
      "qr-compacto",
    ]);
    expect(getStrategy()).toBeDefined();
  });

  it("getStrategy respeta el override y cae en la configurada si es inválido", () => {
    expect(getStrategy("pantalla").id).toBe("pantalla");
    expect(getStrategy("qr-compacto").id).toBe("qr-compacto");
    expect(getStrategy("cualquiera").id).toBe(getStrategy().id);
    expect(getStrategy(null).id).toBe(getStrategy().id);
  });

  it("variante pantalla: sin QR", () => {
    const payload = STRATEGIES.pantalla.build({ group: group(), proveedor: "X" });
    expect(payload.kind).toBe("screen");
  });

  it("variante qr-codigos: un renglón codigo;cantidad por producto", () => {
    const payload = STRATEGIES["qr-codigos"].build({
      group: group(),
      proveedor: "X",
    });
    if (payload.kind !== "qr") throw new Error("esperaba QR");
    expect(payload.data.split("\n")).toEqual([
      "7791000000017;2",
      "7791000000024;1",
    ]);
  });

  it("variante qr-compacto: payload FF1 decodificable", () => {
    const payload = STRATEGIES["qr-compacto"].build({
      group: group(),
      proveedor: "X",
    });
    if (payload.kind !== "qr") throw new Error("esperaba QR");
    expect(payload.data.startsWith("FF1|12|")).toBe(true);
    const decoded = decodeCompact(payload.data);
    expect(decoded.stand).toBe(12);
    expect(decoded.items).toEqual([
      { codigo: "7791000000017", qty: 2 },
      { codigo: "7791000000024", qty: 1 },
    ]);
    // total en centavos sin errores de redondeo (3500.50*2 + 2100)
    expect(decoded.totalCents).toBe(910100);
  });
});

describe("encoder compacto FF1", () => {
  it("round-trip encode/decode", () => {
    const original = {
      stand: 7,
      totalCents: 123456,
      items: [
        { codigo: "7791000000017", qty: 3 },
        { codigo: "779123456", qty: 1 },
      ],
    };
    expect(decodeCompact(encodeCompact(original))).toEqual(original);
  });

  it("rechaza versiones desconocidas", () => {
    expect(() => decodeCompact("FF9|1|100|7791000000017:1")).toThrow(
      /Versión/
    );
  });

  it("rechaza payloads truncados o corruptos", () => {
    expect(() => decodeCompact("FF1|1|100|")).toThrow(/sin ítems/);
    expect(() => decodeCompact("FF1|0|100|7791000000017:1")).toThrow(/Stand/);
    expect(() => decodeCompact("FF1|1|abc|7791000000017:1")).toThrow(/Total/);
    expect(() => decodeCompact("FF1|1|100|xxx:1")).toThrow(/Ítem/);
    expect(() => decodeCompact("FF1|1|100|7791000000017:0")).toThrow(/Ítem/);
  });
});
