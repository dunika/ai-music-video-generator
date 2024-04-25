import {
  interpolate,
  useCurrentFrame,
} from 'remotion'

import './font.css'

export const useGradualIncrease = (start, startValue = 1, end = 1.1) => {
  const frame = useCurrentFrame()

  return interpolate(frame, [start, start + 30], [startValue, end], {
    extrapolateRight: 'extend',
  })
}
