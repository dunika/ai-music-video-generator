import {
  useEffect,
  useState,
} from 'react'
import { getPermissionStatus } from './mediaUtils'

export enum MicrophonePermissionStatus {
  Granted = 'granted',
  Denied = 'denied',
  Pending = 'pending',
  Error = 'error'
}

const mapPermissionStatus = (status: PermissionStatus): MicrophonePermissionStatus => {
  switch (status.state) {
    case 'granted':
      return MicrophonePermissionStatus.Granted
    default:
      return MicrophonePermissionStatus.Denied
  }
}

const useMicrophonePermissionStatus = () => {
  const [status, setStatus] = useState<MicrophonePermissionStatus>(
    MicrophonePermissionStatus.Pending,
  )

  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    let permissionStatusResult: PermissionStatus | null = null

    const updatePermissionStatus = async () => {
      try {
        setError(null)
        setStatus(MicrophonePermissionStatus.Pending)

        permissionStatusResult = await getPermissionStatus()

        const update = (permissionStatus: PermissionStatus) => {
          if (isMounted) {
            setStatus(mapPermissionStatus(permissionStatus))
          }
        }

        permissionStatusResult.onchange = (event: Event) => {
          if (event.target instanceof PermissionStatus) {
            update(event.target)
          }
        }

        update(permissionStatusResult)
      } catch (error) {
        setStatus(MicrophonePermissionStatus.Error)
        setError(error as Error)
      }
    }

    updatePermissionStatus()

    return () => {
      isMounted = false
      if (permissionStatusResult?.onchange) {
        permissionStatusResult.onchange = null
      }
    }
  }, [])

  return {
    status,
    error,
  }
}

export default useMicrophonePermissionStatus
