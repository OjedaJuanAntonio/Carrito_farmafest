import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "../scripts/lib/csv";

describe("parseCsv", () => {
  it("parsea filas y columnas simples", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("respeta comas dentro de comillas", () => {
    expect(parseCsv('nombre,precio\n"Crema x2, oferta",1000')).toEqual([
      ["nombre", "precio"],
      ["Crema x2, oferta", "1000"],
    ]);
  });

  it("desescapa comillas dobles", () => {
    expect(parseCsv('a\n"dijo ""hola"""')).toEqual([["a"], ['dijo "hola"']]);
  });

  it("soporta saltos de línea dentro de comillas", () => {
    expect(parseCsv('a,b\n"línea1\nlínea2",x')).toEqual([
      ["a", "b"],
      ["línea1\nlínea2", "x"],
    ]);
  });

  it("maneja CRLF, LF y CR sueltos", () => {
    expect(parseCsv("a,b\r\n1,2\r3,4\n5,6")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
      ["5", "6"],
    ]);
  });

  it("saca el BOM inicial", () => {
    expect(parseCsv("﻿a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("no agrega fila fantasma si termina en salto de línea", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("preserva campos vacíos", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });
});

describe("toCsv (round-trip)", () => {
  it("serializa y vuelve a parsear igual", () => {
    const rows = [
      ["Código", "Descripción", "Precio"],
      ["7791", 'Crema "premium", 2x1', "1.234,50"],
      ["7792", "Línea\ncon salto", ""],
    ];
    const parsed = parseCsv(toCsv(rows));
    expect(parsed).toEqual(rows.map((r) => r.map((c) => String(c))));
  });

  it("solo entrecomilla lo necesario", () => {
    expect(toCsv([["simple", "con,coma"]])).toBe('simple,"con,coma"');
  });
});
