import { describe, expect, it } from "vitest";
import { normalizeText, prepareDocs, searchDocs } from "../src/lib/search";
import type { IndexEntry } from "../src/lib/types";

const ENTRIES: IndexEntry[] = [
  ["7791000000019", "Ibuprofeno 400mg x10 comp", 3500, 1],
  ["7791000000026", "Ibuprofeno 600mg x20 comp", 5200, 2],
  ["7791000000033", "Paracetamol 500mg x10", 2100, 1],
  ["7791000000040", "Crema facial hidratación intensiva", 9800, 3],
  ["7791000000057", "Protector solar FPS 50", 15600, 3],
  ["7752000000011", "Óleo calcáreo 200ml", 4300, 4],
];

const docs = prepareDocs(ENTRIES);

describe("normalizeText", () => {
  it("saca acentos, mayúsculas y espacios extra", () => {
    expect(normalizeText("  Óleo   Calcáreo ")).toBe("oleo calcareo");
    expect(normalizeText("HIDRATACIÓN")).toBe("hidratacion");
  });
});

describe("searchDocs", () => {
  it("no busca con menos de 2 caracteres", () => {
    expect(searchDocs(docs, "i")).toHaveLength(0);
    expect(searchDocs(docs, "")).toHaveLength(0);
  });

  it("encuentra sin importar acentos ni mayúsculas", () => {
    const r = searchDocs(docs, "oleo calcareo");
    expect(r).toHaveLength(1);
    expect(r[0].stand).toBe(4);
  });

  it("exige todos los tokens (AND)", () => {
    expect(searchDocs(docs, "ibuprofeno 600")).toHaveLength(1);
    expect(searchDocs(docs, "ibuprofeno")).toHaveLength(2);
    expect(searchDocs(docs, "ibuprofeno zzz")).toHaveLength(0);
  });

  it("prioriza matches que arrancan con el término", () => {
    const r = searchDocs(docs, "prote");
    expect(r[0].descripcion).toBe("Protector solar FPS 50");
  });

  it("busca por código de barras exacto y por prefijo", () => {
    expect(searchDocs(docs, "7791000000033")[0].descripcion).toContain(
      "Paracetamol"
    );
    expect(searchDocs(docs, "7752")).toHaveLength(1);
    expect(searchDocs(docs, "7791")).toHaveLength(5);
  });

  it("respeta el límite de resultados", () => {
    expect(searchDocs(docs, "7791", 2)).toHaveLength(2);
  });
});
