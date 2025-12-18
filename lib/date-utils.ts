export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0]
}

export const getDateString = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

export const getAvailableDates = (daysAhead = 14): string[] => {
  const dates: string[] = []
  const today = new Date()

  for (let i = 1; i <= daysAhead; i++) {
    const date = addDays(today, i)
    if (!isWeekend(date)) {
      dates.push(getDateString(date))
    }
  }

  return dates
}
