import { formatAmount } from "../utils/format";
import type { ParticipantBalance } from "../utils/split-expenses";

interface BalancesTableProps {
  balances: ParticipantBalance[];
  dark?: boolean;
}

function balanceLabel(balance: ParticipantBalance): string {
  if (balance.balance > 0) {
    return `Recibe ${formatAmount(balance.balance)}`;
  }

  if (balance.balance < 0) {
    return `Debe ${formatAmount(-balance.balance)}`;
  }

  return "En cero";
}

export function BalancesTable({ balances, dark = false }: BalancesTableProps) {
  const headClass = dark ? "border-brand-400/25 text-neutral-300" : "border-neutral-200";
  const rowClass = dark ? "border-white/10" : "border-neutral-100";
  const mutedClass = dark ? "text-neutral-300" : "text-neutral-900";

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Saldos por participante</caption>
      <thead>
        <tr className={`border-b text-left ${headClass}`}>
          <th scope="col" className="py-2 pr-2 font-medium">
            Participante
          </th>
          <th scope="col" className="py-2 pr-2 text-right font-medium">
            Pagó
          </th>
          <th scope="col" className="py-2 pr-2 text-right font-medium">
            Le toca
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Saldo
          </th>
        </tr>
      </thead>
      <tbody>
        {balances.map((balance, index) => (
          <tr key={`${balance.name}-${index}`} className={`border-b last:border-0 ${rowClass}`}>
            <td className={`py-2 pr-2 font-medium ${dark ? "text-white" : ""}`}>{balance.name}</td>
            <td className={`py-2 pr-2 text-right tabular-nums ${mutedClass}`}>
              {formatAmount(balance.paidAmount)}
            </td>
            <td className={`py-2 pr-2 text-right tabular-nums ${mutedClass}`}>
              {formatAmount(balance.shareAmount)}
            </td>
            <td
              className={`py-2 text-right font-medium tabular-nums ${
                balance.balance > 0
                  ? dark
                    ? "text-emerald-400"
                    : "text-emerald-700"
                  : balance.balance < 0
                    ? dark
                      ? "text-rose-400"
                      : "text-rose-700"
                    : "text-neutral-500"
              }`}
            >
              {balanceLabel(balance)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
