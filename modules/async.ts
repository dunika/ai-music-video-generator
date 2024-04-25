export const retry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    const response = await fn()
    return response
  } catch (error) {
    if (retries > 0) {
      console.error(error)
      console.log(`Retrying... ${retries} retries left`)
      const response = await retry(fn, retries - 1)
      return response
    }
    throw error
  }
}
