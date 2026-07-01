import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "./Button";

type DatePickerProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
};

function getCalendarCells(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: firstDay }, () => null);

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDisplayDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default function DatePicker({ label, value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value);
  const calendarCells = useMemo(() => getCalendarCells(viewDate), [viewDate]);
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  const moveMonth = (direction: -1 | 1) => {
    setViewDate(
      (currentViewDate) =>
        new Date(
          currentViewDate.getFullYear(),
          currentViewDate.getMonth() + direction,
          1,
        ),
    );
  };

  return (
    <label className="relative block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => {
          setViewDate(value);
          setIsOpen((currentValue) => !currentValue);
        }}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 outline-none transition hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <span>{formatDisplayDate(value)}</span>
        <CalendarDays className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="compactIcon"
              onClick={() => moveMonth(-1)}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold text-gray-900">{monthLabel}</p>
            <Button
              variant="compactIcon"
              onClick={() => moveMonth(1)}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarCells.map((date, index) =>
              date ? (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(date);
                    setIsOpen(false);
                  }}
                  className={`h-8 rounded-lg text-sm font-medium transition ${
                    isSameDay(date, value)
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} className="h-8" />
              ),
            )}
          </div>
        </div>
      ) : null}
    </label>
  );
}
