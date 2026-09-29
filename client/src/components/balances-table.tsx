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
        <tr className="border-b border-neutral-200 text-left">
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
          <tr
            key={`${balance.name}-${index}`}
            className="border-b border-neutral-100 last:border-0"
          >
            <td className="py-2 pr-2 font-medium">{balance.name}</td>
            <td className="py-2 pr-2 text-right">{formatAmount(balance.paidAmount)}</td>
            <td className="py-2 pr-2 text-right">{formatAmount(balance.shareAmount)}</td>
            <td
              className={`py-2 text-right font-medium ${
                balance.balance > 0
                  ? "text-green-700"
                  : balance.balance < 0
                    ? "text-red-700"
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
