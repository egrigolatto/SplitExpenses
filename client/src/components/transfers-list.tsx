import { formatAmount } from "../utils/format";
import type { Transfer } from "../utils/split-expenses";

interface TransfersListProps {
  transfers: Transfer[];
}

export function TransfersList({ transfers }: TransfersListProps) {
  if (transfers.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Todos los saldos están al día. No hace falta ninguna transferencia.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {transfers.map((transfer, index) => (
        <li
          key={`${transfer.from}-${transfer.to}-${index}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
        >
          <span>
            <strong className="font-semibold text-white">{transfer.from}</strong>
            <span className="text-neutral-400"> paga a </span>
            <strong className="font-semibold text-white">{transfer.to}</strong>
          </span>
          <span className="font-semibold text-brand-200 tabular-nums">
            {formatAmount(transfer.amount)}
          </span>
        </li>
      ))}
    </ol>
  );
}
