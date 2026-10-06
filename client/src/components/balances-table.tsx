import { formatAmount } from "../utils/format";
import type { ParticipantBalance } from "../utils/split-expenses";

interface BalancesTableProps {
  balances: ParticipantBalance[];
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

export function BalancesTable({ balances }: BalancesTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Saldos por participante</caption>
      <thead>
        <tr className="border-b border-brand-400/25 text-left text-neutral-300">
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
          <tr key={`${balance.name}-${index}`} className="border-b border-white/10 last:border-0">
            <td className="py-2 pr-2 font-medium text-white">{balance.name}</td>
            <td className="py-2 pr-2 text-right text-neutral-300 tabular-nums">
              {formatAmount(balance.paidAmount)}
            </td>
            <td className="py-2 pr-2 text-right text-neutral-300 tabular-nums">
              {formatAmount(balance.shareAmount)}
            </td>
            <td
              className={`py-2 text-right font-medium tabular-nums ${
                balance.balance > 0
                  ? "text-emerald-400"
                  : balance.balance < 0
                    ? "text-rose-400"
                    : "text-neutral-400"
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
