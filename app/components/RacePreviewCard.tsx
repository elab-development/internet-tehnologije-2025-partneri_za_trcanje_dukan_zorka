import React from 'react';

type RaceStatus =
  | 'NA_CEKANJU'
  | 'PRIHVACENO'
  | 'ODBIJENO'
  | 'PLANIRANA'
  | 'U_TOKU'
  | 'ZAVRSENA'
  | 'OTKAZANA'
  | string;

const resolveDisplayStatus = (
  status: RaceStatus | null | undefined,
  vremePocetka: string | Date
): RaceStatus | null => {
  const startMs = new Date(vremePocetka).getTime();
  const hasValidStart = Number.isFinite(startMs);

  if (status === 'OTKAZANA' || status === 'U_TOKU' || status === 'ZAVRSENA') {
    return status;
  }

  if (hasValidStart && startMs < Date.now()) {
    return 'ZAVRSENA';
  }

  return status ?? 'PLANIRANA';
};

interface RacePreviewCardProps {
  naziv: string;
  vremePocetka: string | Date;
  planiranaDistancaKm?: number | null;
  organizatorIme?: string | null;
  organizatorSlot?: React.ReactNode;
  brojPrijava?: number | null;
  status?: RaceStatus | null;
  tezina?: string | null;
  opis?: string | null;
  compact?: boolean;
  minimal?: boolean;
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
  rightAction?: React.ReactNode;
  onOpenDetails?: () => void;
  detailsLabel?: string;
  detailsContainerClassName?: string;
}

const statusLabel = (status?: RaceStatus | null) => {
  if (!status) return null;
  switch (status) {
    case 'NA_CEKANJU':
      return 'Na cekanju';
    case 'PRIHVACENO':
      return 'Prihvaceno';
    case 'ODBIJENO':
      return 'Odbijeno';
    case 'PLANIRANA':
      return 'Planirana';
    case 'U_TOKU':
      return 'U toku';
    case 'ZAVRSENA':
      return 'Zavrsena';
    case 'OTKAZANA':
      return 'Otkazana';
    default:
      return status;
  }
};

export default function RacePreviewCard({
  naziv,
  vremePocetka,
  planiranaDistancaKm,
  organizatorIme,
  organizatorSlot,
  brojPrijava,
  status,
  tezina,
  opis,
  compact = false,
  minimal = false,
  theme = 'auto',
  className = '',
  rightAction,
  onOpenDetails,
  detailsLabel = 'Detalji trke',
  detailsContainerClassName,
}: RacePreviewCardProps) {
  const dt = new Date(vremePocetka);
  const resolvedStatus = resolveDisplayStatus(status, vremePocetka);
  const statusText = statusLabel(resolvedStatus);
  const isForcedLight = theme === 'light';
  const isForcedDark = theme === 'dark';

  const containerClasses = isForcedLight
    ? 'rounded-xl border border-slate-200/80 bg-white/85 p-3 text-slate-700'
    : isForcedDark
    ? 'rounded-xl border border-white/15 bg-white/10 p-3 text-slate-100'
    : 'rounded-xl border border-slate-300/80 bg-white/85 p-3 text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-100';

  const mutedTextClasses = isForcedLight
    ? 'text-xs text-slate-500'
    : isForcedDark
    ? 'text-xs text-slate-300'
    : 'text-xs text-slate-500 dark:text-slate-400';

  const metaTextClasses = isForcedLight
    ? 'text-xs text-slate-600'
    : isForcedDark
    ? 'text-xs text-slate-200'
    : 'text-xs text-slate-600 dark:text-slate-300';

  const statusClasses = isForcedLight
    ? 'inline-flex rounded-full border border-blue-300/60 bg-blue-100/70 px-2.5 py-1 text-[11px] font-semibold text-blue-700'
    : isForcedDark
    ? 'inline-flex rounded-full border border-blue-300/35 bg-blue-400/15 px-2.5 py-1 text-[11px] font-semibold text-blue-200'
    : 'inline-flex rounded-full border border-blue-300/60 bg-blue-100/70 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-300/30 dark:bg-blue-400/15 dark:text-blue-200';

  const detailsBtnClasses = isForcedLight
    ? 'inline-flex rounded-md border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white'
    : isForcedDark
    ? 'inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20'
    : 'inline-flex rounded-md border border-slate-300/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20';

  const metaPillClasses = isForcedLight
    ? 'rounded-lg border border-slate-300/90 bg-white/95 px-2 py-1.5'
    : isForcedDark
    ? 'rounded-lg border border-white/20 bg-white/10 px-2 py-1.5'
    : 'rounded-lg border border-slate-300/85 bg-white/90 px-2 py-1.5 dark:border-white/15 dark:bg-white/5';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate font-bold ${compact ? 'text-base' : 'text-lg'}`}>{naziv}</p>
        </div>
        {rightAction}
      </div>

      <div className={`mt-2 ${mutedTextClasses}`}>
        <span className="font-medium">Datum:</span> {dt.toLocaleDateString()} u {dt.toLocaleTimeString().slice(0, 5)}
      </div>

      {!minimal && (
        <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
          <p className={`${metaTextClasses} ${metaPillClasses}`}>
            Distanca: <span className="font-semibold">{planiranaDistancaKm ?? 0} km</span>
          </p>
          <p className={`${metaTextClasses} ${metaPillClasses}`}>
            Tezina: <span className="font-semibold">{tezina || 'N/A'}</span>
          </p>
          {typeof brojPrijava === 'number' && (
            <p className={`${metaTextClasses} ${metaPillClasses}`}>
              Prijavljeno: <span className="font-semibold">{brojPrijava}</span>
            </p>
          )}
        </div>
      )}

      {!minimal && (
        <div className={`mt-2 ${metaTextClasses}`}>
          Organizator:{' '}
          {organizatorSlot ? (
            organizatorSlot
          ) : (
            <span className="font-semibold">{organizatorIme || 'Nepoznato'}</span>
          )}
        </div>
      )}

      {statusText && (
        <div className={`mt-2 ${statusClasses}`}>
          Status: {statusText}
        </div>
      )}

      {opis && !compact && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{opis}</p>
      )}

      {onOpenDetails && (
        <div className={detailsContainerClassName ?? 'mt-4'}>
          <button
            onClick={onOpenDetails}
            className={detailsBtnClasses}
          >
            {detailsLabel}
          </button>
        </div>
      )}
    </div>
  );
}
