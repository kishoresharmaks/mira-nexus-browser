'use client';

import { getRotation, type Page } from '@/lib/catalog';

type Props = {
  pages: Page[];
  liveCount: number;
  today: { year: number; month: number; day: number };
};

export function TodayLedger({ pages, liveCount, today }: Props) {
  const rotation = getRotation(
    pages,
    7,
    new Date(today.year, today.month, today.day, 12),
  );

  return (
    <section className="panel ledger-panel" aria-labelledby="ledger-title">
      <div className="panel-head">
        <div>
          <h2 className="panel-title" id="ledger-title">
            Seven-day ledger
          </h2>
          <p className="panel-sub">
            Live pages only, in shelf order. Today is marked in signal orange.
          </p>
        </div>
        <p className="panel-sub">
          {liveCount} live {liveCount === 1 ? 'page' : 'pages'}
        </p>
      </div>

      <div className="ledger" role="list">
        {rotation.map((day) => (
          <div
            key={day.date.getTime()}
            className="ledger-day"
            data-today={day.isToday ? 'true' : undefined}
            role="listitem"
          >
            <p className="ledger-date">{day.label}</p>
            <p className="ledger-weekday">
              {day.isToday ? 'Today' : day.weekday}
            </p>
            {day.page ? (
              <>
                <p className="ledger-title">{day.page.title}</p>
                <p className="ledger-cat">
                  {day.page.category || 'Reading'}
                </p>
              </>
            ) : (
              <p className="ledger-empty">No live page</p>
            )}
          </div>
        ))}
      </div>

      <p className="panel-sub ledger-note">
        Previewed on this desk&rsquo;s calendar. A device in another timezone
        can land on a neighbouring day.
      </p>
    </section>
  );
}
