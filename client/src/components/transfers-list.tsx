import { cx } from "../utils/cx";
import { formatAmount } from "../utils/format";
import type { Transfer } from "../utils/split-expenses";

interface TransfersListProps {
  transfers: Transfer[];
  dark?: boolean;
}

export function TransfersList({ transfers, dark = false }: TransfersListProps) {
  if (transfers.length === 0) {
    return (
      <p className={cx("text-sm", dark ? "text-neutral-300" : "text-neutral-600")}>
        Todos los saldos están al día. No hace falta ninguna transferencia.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {transfers.map((transfer, index) => (
        <li
          key={`${transfer.from}-${transfer.to}-${index}`}
          className={cx(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            dark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white",
          )}
        >
          <span>
            <strong className={dark ? "font-semibold text-white" : ""}>{transfer.from}</strong>
            <span className={dark ? "text-neutral-400" : "text-neutral-500"}> paga a </span>
            <strong className={dark ? "font-semibold text-white" : ""}>{transfer.to}</strong>
          </span>
          <span
            className={cx(
              "font-semibold tabular-nums",
              dark ? "text-brand-200" : "text-neutral-900",
            )}
          >
            {formatAmount(transfer.amount)}
          </span>
        </li>
      ))}
    </ol>
  );
}
