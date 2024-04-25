import { roundToOneDecimals } from './numbers'

export const millisecondsToSeconds = (milliseconds: number) => {
  return roundToOneDecimals(milliseconds / 1000)
}

export const secondsToMilliseconds = (seconds: number) => {
  return Math.round(seconds * 1000)
}
