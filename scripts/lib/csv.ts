/**
 * Parser y serializador CSV mínimos pero correctos (RFC 4180): campos
 * separados por comas, registros por saltos de línea, comillas dobles para
 * encerrar campos con comas/saltos, y comillas escapadas duplicándolas ("").
 *
 * Sin dependencias: es lo que exporta Google Sheets "Publicar en la web → CSV"
 * y lo que consume la ingesta. Testeado en tests/csv.test.ts.
 */

/** Convierte un texto CSV en filas de celdas (strings). */
export function parseCsv(text: string): string[][] {
  // Saca el BOM que a veces antepone Google Sheets.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      endField();
      i++;
    } else if (c === "\n") {
      endRow();
      i++;
    } else if (c === "\r") {
      endRow();
      i += text[i + 1] === "\n" ? 2 : 1; // \r\n o \r suelto
    } else {
      field += c;
      i++;
    }
  }
  // Última fila si el archivo no termina en salto de línea.
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

/** Escapa un valor para CSV (comillas si contiene coma, comilla o salto). */
function escapeCsv(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serializa filas de celdas a texto CSV (CRLF entre registros). */
export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
}
