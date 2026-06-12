import { onMounted, onUnmounted } from 'vue'
import { socketService }  from '@/services/socket.service'
import { useUiStore }     from '@/stores/ui.store'
import { useAuthStore }   from '@/stores/auth.store'

let audioCtx = null

function playPing() {
  try {
    audioCtx = audioCtx ?? new (window.AudioContext || window.webkitAudioContext)()
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type      = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.4)
  } catch { /* non-critical */ }
}

export function useRealtimeNotifications() {
  const ui   = useUiStore()
  const auth = useAuthStore()

  function handleNewOrder(payload) {
    ui.addNotification({
      id:        payload.orderId,
      type:      'order',
      title:     'سفارش جدید',
      body:      `${payload.customerName} — ${Number(payload.total).toLocaleString('fa')} تومان`,
      orderId:   payload.orderId,
      createdAt: payload.createdAt,
    })
    playPing()
  }

  function handleNewReview(payload) {
    ui.addNotification({
      id:        payload.reviewId,
      type:      'review',
      title:     'نظر جدید',
      body:      `${payload.userName} برای "${payload.productName}" — ${payload.rating}★`,
      reviewId:  payload.reviewId,
      createdAt: payload.createdAt,
    })
    playPing()
  }

  onMounted(() => {
    if (!auth.token) return
    socketService.connect(auth.token)
    socketService.on('new_order',  handleNewOrder)
    socketService.on('new_review', handleNewReview)
  })

  onUnmounted(() => {
    socketService.off('new_order',  handleNewOrder)
    socketService.off('new_review', handleNewReview)
  })
}
