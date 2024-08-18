const subs = [
  {
    start: 52200,
    text: 'put my',
    end: 0,
  },
  {
    start: 52800,
    text: 'head on',
    end: 0,
  },
  {
    start: 53600,
    text: 'a cloud',
    end: 0,
  },
  {
    start: 54400,
    text: 'in the',
    end: 0,
  },
  {
    start: 55100,
    text: 'fast',
    end: 0,
  },
  {
    start: 55600,
    text: 'lane',
    end: 0,
  },
  {
    start: 56900,
    text: 'this time',
    end: 0,
  },
  {
    start: 57500,
    text: "i'm gonna",
    end: 0,
  },
  {
    start: 58100,
    text: 'break off',
    end: 0,
  },
  {
    start: 59100,
    text: 'the last',
    end: 0,
  },
  {
    start: 59800,
    text: 'chain',
    end: 0,
  },
  {
    start: 60700,
    text: 'with a',
    end: 0,
  },
  {
    start: 61500,
    text: 'heart',
    end: 0,
  },
  {
    start: 61900,
    text: "that's",
    end: 0,
  },
  {
    start: 62400,
    text: 'relentlessly',
    end: 0,
  },
  {
    start: 63500,
    text: 'insane',
    end: 0,
  },
  {
    start: 64800,
    text: 'here',
    end: 0,
  },
  {
    start: 65500,
    text: 'i am',
    end: 0,
  },
  {
    start: 66600,
    text: 'and baby',
    end: 0,
  },
  {
    start: 67500,
    text: "i'm-a",
    end: 0,
  },
  {
    start: 68200,
    text: 'doubling ',
    end: 0,
  },
  {
    start: 69100,
    text: 'down',
    end: 0,
  },
  {
    start: 71300,
    text: 'baby',
    end: 0,
  },
  {
    start: 71800,
    text: "i'm-a",
    end: 0,
  },
  {
    start: 72500,
    text: 'doubling',
    end: 0,
  },
  {
    start: 73400,
    text: 'down',
    end: 0,
  },
]

function adjustCaptions(captions, newStartTime) {
  if (!captions.length) return []

  // Calculate the time difference between the new and the original start time
  const timeDiff = newStartTime - captions[0].start

  // Adjust each caption's start time
  return captions.map((sub) => ({
    ...sub,
    start: sub.start + timeDiff,
  }))
}

// Set the new start time for the first caption
const adjustedSubs = adjustCaptions(subs, 156200) // Example: new start time is 35000
copy(adjustedSubs)
