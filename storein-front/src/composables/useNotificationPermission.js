import { ref, computed } from 'vue'

const STORAGE_KEY = 'notif_asked'

const hasApi = typeof window !== 'undefined' && 'Notification' in window

const permission = ref(hasApi ? Notification.permission : 'denied')

export function useNotificationPermission() {
  const alreadyAsked = computed(() => {
    try { return !!localStorage.getItem(STORAGE_KEY) } catch { return true }
  })

  const canAsk = computed(
    () => hasApi && permission.value === 'default' && !alreadyAsked.value,
  )

  const isGranted = computed(() => hasApi && permission.value === 'granted')

  async function requestPermission() {
    if (!hasApi) return 'denied'
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* storage blocked */ }
    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* storage blocked */ }
  }

  return { canAsk, isGranted, requestPermission, dismiss }
}
