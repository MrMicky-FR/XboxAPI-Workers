export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000)
}

export function addHours(date: Date, hours: number): Date {
  return addSeconds(date, hours * 3600)
}

export function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24)
}

export function addMonths(date: Date, months: number): Date {
  return addDays(date, months * 30)
}
