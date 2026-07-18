import { describe, expect, it } from "vitest";
import {
  addItem,
  clearStand,
  EMPTY_CART,
  groupByStand,
  qtyOf,
  refreshFromCatalog,
  removeItem,
  setQty,
  totalUnits,
  type Cart,
} from "../src/lib/cart";
import type { Product } from "../src/lib/types";

const IBUPROFENO: Product = {
  codigo: "7791000000017",
  descripcion: "Ibuprofeno 400mg x10",
  precio: 3500,
  stand: 1,
};
const PARACETAMOL: Product = {
  codigo: "7791000000024",
  descripcion: "Paracetamol 500mg x10",
  precio: 2100,
  stand: 1,
};
const PROTECTOR: Product = {
  codigo: "7791000000031",
  descripcion: "Protector solar FPS 50",
  precio: 15600,
  stand: 3,
  foto: "/img/demo/prod-1.svg",
};

function cartWithAll(): Cart {
  let c = addItem(EMPTY_CART, IBUPROFENO);
  c = addItem(c, IBUPROFENO); // 2 unidades
  c = addItem(c, PARACETAMOL);
  c = addItem(c, PROTECTOR);
  return c;
}

describe("carrito", () => {
  it("agrega productos y acumula cantidades", () => {
    const c = cartWithAll();
    expect(c.items).toHaveLength(3);
    expect(qtyOf(c, IBUPROFENO.codigo)).toBe(2);
    expect(totalUnits(c)).toBe(4);
  });

  it("conserva la foto solo si existe", () => {
    const c = cartWithAll();
    expect(c.items.find((i) => i.codigo === PROTECTOR.codigo)?.foto).toBe(
      "/img/demo/prod-1.svg"
    );
    expect(
      c.items.find((i) => i.codigo === IBUPROFENO.codigo)?.foto
    ).toBeUndefined();
  });

  it("setQty en 0 elimina el ítem; negativo también", () => {
    let c = cartWithAll();
    c = setQty(c, IBUPROFENO.codigo, 0);
    expect(qtyOf(c, IBUPROFENO.codigo)).toBe(0);
    expect(c.items).toHaveLength(2);
    c = setQty(c, PARACETAMOL.codigo, -5);
    expect(c.items).toHaveLength(1);
  });

  it("removeItem saca el producto", () => {
    const c = removeItem(cartWithAll(), PARACETAMOL.codigo);
    expect(c.items.map((i) => i.codigo)).not.toContain(PARACETAMOL.codigo);
  });

  it("agrupa por stand con subtotales correctos", () => {
    const groups = groupByStand(cartWithAll());
    expect(groups.map((g) => g.stand)).toEqual([1, 3]);
    const g1 = groups[0];
    expect(g1.unidades).toBe(3);
    expect(g1.subtotal).toBe(3500 * 2 + 2100);
    expect(groups[1].subtotal).toBe(15600);
  });

  it("clearStand vacía solo ese stand (post-caja)", () => {
    const c = clearStand(cartWithAll(), 1);
    expect(c.items).toHaveLength(1);
    expect(c.items[0].stand).toBe(3);
  });

  it("refreshFromCatalog actualiza precios sin tocar cantidades", () => {
    const c = cartWithAll();
    const updated = refreshFromCatalog(c, [
      { ...IBUPROFENO, precio: 3900 },
    ]);
    const item = updated.items.find((i) => i.codigo === IBUPROFENO.codigo)!;
    expect(item.precio).toBe(3900);
    expect(item.qty).toBe(2);
    // los demás quedan igual
    expect(
      updated.items.find((i) => i.codigo === PARACETAMOL.codigo)?.precio
    ).toBe(2100);
  });

  it("refreshFromCatalog devuelve el mismo objeto si nada cambió", () => {
    const c = cartWithAll();
    expect(refreshFromCatalog(c, [IBUPROFENO])).toBe(c);
  });
});
