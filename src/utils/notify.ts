/**
 * Global Notification Dispatcher for Enlace CRM
 * Avoids window.alert and provides non-intrusive toast notifications.
 */
export function notify(message: string, type: 'success' | 'info' | 'error' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('enlace-notify', {
        detail: { message, type }
      })
    );
  }
}
