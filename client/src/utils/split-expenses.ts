export interface SplitParticipant {
  name: string;
  paidAmount: number;
}

export interface ParticipantBalance {
  name: string;
  paidAmount: number;
  shareAmount: number;
  balance: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface SplitResult {
  totalAmount: number;
  balances: ParticipantBalance[];
  transfers: Transfer[];
}

const CENTS_PER_UNIT = 100;

function toCents(amount: number): number {
  return Math.round(amount * CENTS_PER_UNIT);
}

function fromCents(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

function allocateCents(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return Array.from({ length: count }, (_, index) => (index < remainder ? base + 1 : base));
}

function computeTransfers(balancesCents: number[], names: string[]): Transfer[] {
  const creditors = balancesCents
    .map((balance, index) => ({ name: names[index] ?? "", amount: balance }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const debtors = balancesCents
    .map((balance, index) => ({ name: names[index] ?? "", amount: -balance }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    if (creditor === undefined || debtor === undefined) {
      break;
    }

    const amount = Math.min(creditor.amount, debtor.amount);

    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: fromCents(amount),
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) {
      creditorIndex += 1;
    }

    if (debtor.amount === 0) {
      debtorIndex += 1;
    }
  }

  return transfers;
}

export function splitExpenses(participants: SplitParticipant[]): SplitResult {
  if (participants.length === 0) {
    throw new Error("Se requiere al menos un participante");
  }

  if (
    participants.some(
      (participant) => !Number.isFinite(participant.paidAmount) || participant.paidAmount < 0,
    )
  ) {
    throw new Error("Los montos pagados deben ser numeros finitos mayores o iguales a 0");
  }

  const paidCents = participants.map((participant) => toCents(participant.paidAmount));
  const totalCents = paidCents.reduce((sum, amount) => sum + amount, 0);
  const shareCents = allocateCents(totalCents, participants.length);
  const balanceCents = paidCents.map((amount, index) => amount - (shareCents[index] ?? 0));

  const balances: ParticipantBalance[] = participants.map((participant, index) => ({
    name: participant.name,
    paidAmount: fromCents(paidCents[index] ?? 0),
    shareAmount: fromCents(shareCents[index] ?? 0),
    balance: fromCents(balanceCents[index] ?? 0),
  }));

  return {
    totalAmount: fromCents(totalCents),
    balances,
    transfers: computeTransfers(
      balanceCents,
      participants.map((participant) => participant.name),
    ),
  };
}
