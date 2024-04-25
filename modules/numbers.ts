export function roundToOneDecimals(num: number): number {
  return Math.round(num * 10) / 10
}

export const roundRange = (value: number, min: number, max: number) => {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return Math.round(value)
}
