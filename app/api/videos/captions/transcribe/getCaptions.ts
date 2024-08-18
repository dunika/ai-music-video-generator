interface WordBase {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
  speaker?: number;
  speaker_confidence?: number;
}


export function getCaptions(words: WordBase[]) {
  const captions = words.map((word) => {
    return {
      start: convertSecondsToMilliseconds(word.start),
      text: cleanWord(word.word),
    }
  })


  // Ensure captions are at least 200ms long
  for (let i = 0; i < captions.length - 1; i++) {
    const caption = captions[i]
    const nextCaption =  captions[i + 1] 

    const captionDuration = nextCaption.start - caption.start

    if (captionDuration < 200) {
      nextCaption.start += (200 - captionDuration);
    } 
  }

  // Merge captions that are less than 200ms apart
  const mergedCaptions = []
  for (let i = 0; i < captions.length; i++) {
    let caption = captions[i]
    const nextIndex = i + 1;

    if (nextIndex >= captions.length) {
      mergedCaptions.push(caption)
      continue
    }

    const nextCaption = captions[nextIndex]

    const captionDuration = nextCaption.start - caption.start
    const mergedText = `${caption.text} ${nextCaption.text}`.trim();

    if (captionDuration <= 200  && mergedText.length >= 11) {
      caption.text = mergedText
      i++ // Skip the next caption since it's merged
    }

    mergedCaptions.push(caption)
  }

  return mergedCaptions
}

function cleanWord(word: string) {
  let cleaned = word.toLowerCase()
  cleaned = cleaned.split('').filter((char) => char.match(/[a-z']/)).join('').trim()
  return cleaned
}

function roundToOneDecimalPlace(number: number) {
  return Math.round(number * 10) / 10
}

function convertSecondsToMilliseconds(seconds: number) {
  return roundToOneDecimalPlace(seconds) * 1000
}
