const lines = `
Been alive
Everyday 
of my life
With a hand
That can 
pull me 
through

My blast
From a 
laughing 
past
In the 
santa hat
Playing 
it cool

Thats you

Long time
Its been a long while
My dream team
Grilling 
machine

I got 
the back
You got 
the back
oh baby
you best
Believe


`

// Split the lines by newline and filter out any empty lines
const captionLines = lines.split('\n').filter((line) => line.trim() !== '')

// Initialize the start time
let startTime = 0

// Create the captions array
const captions = captionLines.map((text) => {
  const caption = {
    text,
    start: startTime,
  }
  // Increase the start time for the next caption
  startTime += 700
  return caption
})

console.log(captions)

copy(captions)
