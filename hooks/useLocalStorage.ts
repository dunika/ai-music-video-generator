import {
  useEffect,
} from 'react'
import { useImmer } from "use-immer";
import { usePrevious } from './usePrevious';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useImmer(initialValue)
  const prevKey = usePrevious(key)

  useEffect(() => {
    if (key !== prevKey) {
      if (typeof window === 'undefined') {
        setStoredValue(initialValue)
        return
      }
      try {
        const item = window.localStorage.getItem(key)
        setStoredValue(item ? JSON.parse(item) : initialValue)
      } catch (error) {
        console.log(error)
        setStoredValue(initialValue)
      }
    }
  }, [key])

  useEffect(() => {
    if (key === prevKey) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(storedValue))
        }
      } catch (error) {
        console.log(error)
      }
    }
  }, [storedValue, key])


  return [storedValue, setStoredValue]
}
