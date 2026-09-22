import { describe, expect, it } from "vitest";

import { splitExpenses, type SplitParticipant } from "./split-expenses";

function sumTransferTotals(result: ReturnType<typeof splitExpenses>): number {
  return result.transfers.reduce((sum, transfer) => sum + transfer.amount, 0);
}

describe("splitExpenses", () => {
  it("resuelve el ejemplo del README: quien pago de mas cobra con dos transferencias", () => {
    const result = splitExpenses([
      { name: "Juan", paidAmount: 100 },
      { name: "Pedro", paidAmount: 40 },
      { name: "Lucas", paidAmount: 40 },
    ]);

    expect(result.totalAmount).toBe(180);
    expect(result.balances).toEqual([
      { name: "Juan", paidAmount: 100, shareAmount: 60, balance: 40 },
      { name: "Pedro", paidAmount: 40, shareAmount: 60, balance: -20 },
      { name: "Lucas", paidAmount: 40, shareAmount: 60, balance: -20 },
    ]);
    expect(result.transfers).toEqual([
      { from: "Pedro", to: "Juan", amount: 20 },
      { from: "Lucas", to: "Juan", amount: 20 },
    ]);
  });

  it("no genera transferencias cuando todos pagaron igual", () => {
    const result = splitExpenses([
      { name: "Ana", paidAmount: 30 },
      { name: "Beto", paidAmount: 30 },
      { name: "Cami", paidAmount: 30 },
    ]);

    expect(result.transfers).toEqual([]);
    expect(result.balances.every((balance) => balance.balance === 0)).toBe(true);
  });

  it("convierte a un unico pagador en el destino de todas las transferencias", () => {
    const result = splitExpenses([
      { name: "Sponsor", paidAmount: 100 },
      { name: "A", paidAmount: 0 },
      { name: "B", paidAmount: 0 },
      { name: "C", paidAmount: 0 },
    ]);

    expect(result.transfers).toHaveLength(3);
    expect(result.transfers.every((transfer) => transfer.to === "Sponsor")).toBe(true);
    expect(result.transfers.every((transfer) => transfer.amount === 25)).toBe(true);
  });

  it("distribuye el excedente de centavos y conserva la suma de balances en cero", () => {
    const participants: SplitParticipant[] = [
      { name: "Uno", paidAmount: 100 },
      { name: "Dos", paidAmount: 0 },
      { name: "Tres", paidAmount: 0 },
    ];

    const result = splitExpenses(participants);
    const shares = result.balances.map((balance) => balance.shareAmount);

    expect(shares).toEqual([33.34, 33.33, 33.33]);
    expect(result.balances.reduce((sum, balance) => sum + balance.balance, 0)).toBeCloseTo(0, 2);
    expect(sumTransferTotals(result)).toBeCloseTo(66.66, 2);
    expect(result.transfers.length).toBeLessThanOrEqual(participants.length - 1);
  });

  it("maneja montos con decimales sin errores de punto flotante", () => {
    const result = splitExpenses([
      { name: "Ana", paidAmount: 19.99 },
      { name: "Beto", paidAmount: 0.01 },
    ]);

    expect(result.totalAmount).toBe(20);
    expect(result.balances[0]?.balance).toBe(9.99);
    expect(result.balances[1]?.balance).toBe(-9.99);
    expect(result.transfers).toEqual([{ from: "Beto", to: "Ana", amount: 9.99 }]);
  });

  it("un participante solo queda en cero y sin transferencias", () => {
    const result = splitExpenses([{ name: "Solo", paidAmount: 42 }]);

    expect(result.balances[0]?.balance).toBe(0);
    expect(result.transfers).toEqual([]);
  });

  it("todos con monto cero no produce transferencias", () => {
    const result = splitExpenses([
      { name: "A", paidAmount: 0 },
      { name: "B", paidAmount: 0 },
    ]);

    expect(result.totalAmount).toBe(0);
    expect(result.transfers).toEqual([]);
    expect(result.balances.every((balance) => balance.balance === 0)).toBe(true);
  });

  it("saldos parciales: un deudor grande salda a dos acreedores en orden decreciente", () => {
    const result = splitExpenses([
      { name: "Acreedora Uno", paidAmount: 50 },
      { name: "Neutro", paidAmount: 30 },
      { name: "Deudor", paidAmount: 0 },
      { name: "Acreedora Dos", paidAmount: 40 },
    ]);

    expect(result.totalAmount).toBe(120);
    expect(result.balances.map((balance) => balance.balance)).toEqual([20, 0, -30, 10]);
    expect(result.transfers).toEqual([
      { from: "Deudor", to: "Acreedora Uno", amount: 20 },
      { from: "Deudor", to: "Acreedora Dos", amount: 10 },
    ]);
  });

  it("rechaza una lista vacia", () => {
    expect(() => splitExpenses([])).toThrow("Se requiere al menos un participante");
  });

  it("rechaza montos negativos", () => {
    expect(() => splitExpenses([{ name: "A", paidAmount: -1 }])).toThrow(
      "Los montos pagados deben ser numeros finitos mayores o iguales a 0",
    );
  });

  it("rechaza montos no finitos", () => {
    expect(() => splitExpenses([{ name: "A", paidAmount: Number.NaN }])).toThrow();
    expect(() => splitExpenses([{ name: "A", paidAmount: Number.POSITIVE_INFINITY }])).toThrow();
  });
});
