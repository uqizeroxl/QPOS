type ActivityDateValue = string | number | Date | null | undefined;

function parseActivityDate(value: ActivityDateValue) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatActivityTime(value: ActivityDateValue) {
  const date = parseActivityDate(value);

  if (!date) {
    return "Baru saja";
  }

  const diffInMs = Date.now() - date.getTime();
  const diffInMinutes = Math.max(Math.floor(diffInMs / 60_000), 0);

  if (diffInMinutes < 1) {
    return "Baru saja";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit lalu`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} jam lalu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} hari lalu`;
}

export function formatActivityDate(value: ActivityDateValue) {
  const date = parseActivityDate(value);

  if (!date) {
    return "Baru saja";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
