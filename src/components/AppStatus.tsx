import { useEffect, useSyncExternalStore } from 'react'
import { dismissOfflineReady, dismissUpdate, pwaState, reloadToUpdate, subscribe } from '../lib/pwa'

/** App messages: a new version is ready, StepLab works offline, and "you're offline". */
export function AppStatus() {
  const { updateReady, offlineReady, online } = useSyncExternalStore(subscribe, pwaState)

  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(dismissOfflineReady, 5000)
    return () => clearTimeout(t)
  }, [offlineReady])

  return (
    <div className="app-status" aria-live="polite">
      {!online && (
        <div className="app-status-msg app-status-offline" role="status">
          You're offline. Writing, previewing and Download HTML still work. Colab and sandbox links need the internet.
        </div>
      )}
      {updateReady && (
        <div className="app-status-msg" role="status">
          <span>A new version of StepLab is ready.</span>
          <button className="btn btn-small btn-red" onClick={() => reloadToUpdate()}>
            Reload
          </button>
          <button className="btn btn-small" onClick={dismissUpdate}>
            Later
          </button>
        </div>
      )}
      {offlineReady && !updateReady && (
        <div className="app-status-msg" role="status">
          StepLab now works offline on this computer.
        </div>
      )}
    </div>
  )
}
