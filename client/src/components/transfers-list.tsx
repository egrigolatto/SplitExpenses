import { formatAmount } from "../utils/format";
import type { Transfer } from "../utils/split-expenses";

interface TransfersListProps {
  transfers: Transfer[];
}

export function TransfersList({ transfers }: TransfersListProps) {
  if (transfers.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Todos los saldos están al día. No hace falta ninguna transferencia.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {transfers.map((transfer, index) => (
        <li
          key={`${transfer.from}-${transfer.to}-${index}`}
          className="flex items-center justify-between gap-3 rounded border border-neutral-200 bg-white px-4 py-3 text-sm"
        >
          <span>
            <strong>{transfer.from}</strong>
            <span className="text-neutral-500"> paga a </span>
            <strong>{transfer.to}</strong>
          </span>
          <span className="font-semibold">{formatAmount(transfer.amount)}</span>
        </li>
      ))}
    </ol>
  );
}
