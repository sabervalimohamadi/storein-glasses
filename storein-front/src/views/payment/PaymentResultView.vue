<template>
  <div class="container-main py-16 flex items-center justify-center min-h-[60vh]">
    <div class="w-full max-w-md text-center">

      <!-- Loading -->
      <div v-if="verifying" class="space-y-4">
        <div class="w-16 h-16 rounded-full border-4 border-brand/20 border-t-brand animate-spin mx-auto" />
        <p class="text-text-secondary">در حال تأیید پرداخت...</p>
      </div>

      <!-- Notification consent (shown 3s after success) -->
      <NotificationConsentModal v-model="showConsentModal" />

      <!-- Success -->
      <div v-else-if="result === 'success'" class="space-y-6">
        <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <svg class="w-10 h-10 text-success" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-text-primary">پرداخت موفق</h1>
          <p class="text-text-secondary text-sm mt-2">سفارش شما با موفقیت ثبت و پرداخت شد</p>
          <p v-if="refId" class="text-text-disabled text-xs font-fanum mt-1">کد پیگیری: {{ refId }}</p>
        </div>

        <div class="rounded-2xl border border-surface-border p-5 text-right space-y-3"
             style="background-color: var(--color-card)">
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">شماره سفارش</span>
            <span class="font-fanum text-text-primary font-medium">{{ orderNumber || '—' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">وضعیت</span>
            <span class="text-success font-medium">تأیید شده</span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <RouterLink :to="{ name: 'user-order-detail', params: { id: orderId } }"
            class="btn-brand py-3 flex items-center justify-center gap-2 w-full">
            مشاهده جزئیات سفارش
          </RouterLink>
          <RouterLink :to="{ name: 'home' }"
            class="py-3 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors w-full flex items-center justify-center">
            بازگشت به صفحه اصلی
          </RouterLink>
        </div>
      </div>

      <!-- Failed -->
      <div v-else-if="result === 'failed'" class="space-y-6">
        <div class="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto">
          <svg class="w-10 h-10 text-error" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-text-primary">پرداخت ناموفق</h1>
          <p class="text-text-secondary text-sm mt-2">{{ errorMessage || 'پرداخت انجام نشد یا لغو شد' }}</p>
        </div>

        <div class="flex flex-col gap-3">
          <RouterLink :to="{ name: 'checkout' }"
            class="btn-brand py-3 flex items-center justify-center gap-2 w-full">
            تلاش مجدد
          </RouterLink>
          <RouterLink :to="{ name: 'user-orders' }"
            class="py-3 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors w-full flex items-center justify-center">
            مشاهده سفارشات
          </RouterLink>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paymentService } from '@/services/payment.service'
import { orderService }   from '@/services/order.service'
import { useCartStore }   from '@/stores/cart.store'
import { useNotificationPermission } from '@/composables/useNotificationPermission'
import NotificationConsentModal from '@/components/common/NotificationConsentModal.vue'

const route     = useRoute()
const router    = useRouter()
const cartStore = useCartStore()

const { canAsk } = useNotificationPermission()
const showConsentModal = ref(false)
let consentTimer = null

function scheduleConsentModal() {
  if (!canAsk.value) return
  consentTimer = setTimeout(() => { showConsentModal.value = true }, 3000)
}

onUnmounted(() => { if (consentTimer) clearTimeout(consentTimer) })

const verifying    = ref(true)
const result       = ref(null)   // 'success' | 'failed'
const refId        = ref('')
const errorMessage = ref('')
const orderId      = ref(route.query.orderId ?? '')
const orderNumber  = ref('')

onMounted(async () => {
  // ZarinPal sends capitalized params (Authority, Status); handle both
  const authority = (route.query.authority || route.query.Authority) ?? ''
  const status    = (route.query.status    || route.query.Status)    ?? ''
  const qOrderId  = route.query.orderId ?? ''

  // Direct wallet payment success (no gateway redirect)
  if (status === 'success' && !authority) {
    if (qOrderId) {
      orderId.value = qOrderId
      try {
        const { data } = await orderService.getMyOrder(qOrderId)
        orderNumber.value = data.orderNumber ?? ''
      } catch { /* silent */ }
    }
    result.value   = 'success'
    verifying.value = false
    cartStore.items = []
    scheduleConsentModal()
    return
  }

  // Gateway callback
  if (!authority) {
    result.value    = 'failed'
    errorMessage.value = 'اطلاعات پرداخت یافت نشد'
    verifying.value = false
    return
  }

  try {
    const { data } = await paymentService.verifyPayment({ authority, status })
    if (data.success) {
      refId.value  = data.refId ?? ''
      result.value = 'success'
      // fetch order number if orderId in query
      if (qOrderId) {
        orderId.value = qOrderId
        try {
          const { data: ord } = await orderService.getMyOrder(qOrderId)
          orderNumber.value = ord.orderNumber ?? ''
        } catch { /* silent */ }
      }
      await cartStore.fetchCart()
      scheduleConsentModal()
    } else {
      result.value    = 'failed'
      errorMessage.value = data.message ?? 'پرداخت تأیید نشد'
    }
  } catch (err) {
    result.value    = 'failed'
    errorMessage.value = err?.response?.data?.message ?? 'خطا در تأیید پرداخت'
  } finally {
    verifying.value = false
  }
})
</script>
