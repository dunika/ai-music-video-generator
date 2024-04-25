import {
  continueRender,
  delayRender,
  staticFile,
} from 'remotion'
import { roundRange } from '../../modules/numbers'

// const { fontFamily: monser } = loadFont()

if (typeof window !== 'undefined') {
  const waitForFont = delayRender()
  // const font = new FontFace(
  //   'Rubik',
  //   `url('${staticFile('RubikOne-Regular.ttf')}') format('truetype')`,
  // )
  // font
  //   .load()
  //   .then(() => {
  //     document.fonts.add(font)
  //     continueRender(waitForFont)
  //   })
  //   .catch((err) => console.log('Error loading font', err))

  const localMontserrat = new FontFace(
    'Montserrat',
    `url('${staticFile('Montserrat/static/Montserrat-Black.ttf')}') format('truetype')`,
  )

  localMontserrat
    .load()
    .then(() => {
      document.fonts.add(localMontserrat)
      continueRender(waitForFont)
    })
    .catch((err) => {
      return console.log('Error loading font', err)
    })
}

export const getTextShadowAndOutline = (color: string, value: string = '3') => {
  return `${value}px ${value}px 0 ${color}, -${value}px ${value}px 0 ${color}, -${value}px -${value}px 0 ${color}, ${value}px -${value}px 0 ${color}`
  return `${values} ${color}, 2px 3px 0 ${color},  0px 0px 0 ${color}, -0.4px -0.4px 0 ${color}, 0.4px -0.4px 0 ${color}, -0.4px 0.4px 0 ${color}, 0px 0px 0 ${color}`
}

export const getNeonSign = () => {
  return '0 0 40px rgba(255,255,255, 0.2), 0 0 80px rgba(255,255,255, 0.2), 0 0 90px rgba(255,255,255, 0.2), 0 0 100px rgba(255,255,255, 0.2), 0 0 150px rgba(255,255,255, 0.2)'
}

export const getFontVariationSettings = ({
  slant = -3,
  grad = 150,
  counterWidth = 520,
  uppercaseHeight = 760,
  thinStroke = 90,
}: {
  slant?: number;
  grad?: number;
  counterWidth?: number;
  uppercaseHeight?: number;
  thinStroke?: number
} = {}) => {
  return [
    ['slnt', roundRange(slant, -10, 0)],
    // -200 - 150
    ['GRAD', roundRange(grad, -200, 150)],
    /* counter width */
    ['XTRA', roundRange(counterWidth, 323, 603)],
    /* uppercase height 528 - 760 */
    ['YTUC', roundRange(uppercaseHeight, 528, 760)],
    /* thin stroke */
    ['YOPQ', roundRange(thinStroke, 25, 135)],
  ].map(([tag, value]) => `"${tag}" ${value}`).join(', ')
}

export const styles = {
  absoluteCenter: {
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
  absoluteCenterX: {
    left: '50%',
    position: 'absolute',
    transform: 'translateX(-50%)',
  },
  flexCenter: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 900,
    fontOpticalSizing: 'auto',
    fontFamily: 'Montserrat',
    fontStretch: '150%',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 3,
    '-webkit-text-stroke': `7px ${hexToRgba('#000000', 0.8)}`,
    fontVariationSettings: getFontVariationSettings(),
    textShadow: `0px 2px 35px ${hexToRgba('#000000', 0.7)}`,
  },
}

// rgba(255,255,255, 0.2),
export const textColors = {
  white: {
    text: '#FFFFFF',
    shadow: '#333',
  },
  black: {
    text: '#222',
    shadow: '#FFF',
  },
  pepsi: {
    text: '#e61e38',
    shadow: '#03568e',
  },
  sprite: {
    text: '#17aa4f',
    shadow: '#ffcb0a',
  },
  pokemon: {
    text: '#f8c708',
    shadow: '#0454a2',
  },
  fedex: {
    text: '#',
    shadow: '#4d148c',
  },
  chirstmas: {
    text: '#fff',
    shadow: hexToRgba('#000000', 0.9),
  },
}

function hexToRgba(hex: string, alpha: number = 1): string {
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}
