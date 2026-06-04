<template>
  <div class="space-y-5">

    <!-- Back + order number + status badge -->
    <div class="flex items-center gap-3">
      <button @click="$router.back()"
        class="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors flex-shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="page-title font-fanum" dir="ltr">{{ order?.orderNumber ?? '...' }}</h1>
          <AdminBadge v-if="order" :variant="ORDER_STATUSES[order.status]?.color ?? 'gray'" size="md">
            {{ ORDER_STATUSES[order.status]?.label ?? order.status }}
          </AdminBadge>
        </div>
        <p v-if="order" class="text-text-secondary text-xs mt-0.5 font-fanum">
          ثبت شده در: {{ formatDateTime(order.createdAt) }}
        </p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <AdminSkeleton height="160px" class="rounded-xl" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminSkeleton height="140px" class="rounded-xl" />
        <AdminSkeleton height="140px" class="rounded-xl" />
      </div>
      <AdminSkeleton height="200px" class="rounded-xl" />
    </div>

    <template v-else-if="order">

      <!-- Status updater -->
      <OrderStatusUpdater
        :current-status="order.status"
        :order-id="order._id"
        :loading="updatingStatus"
        @updated="updateStatus"
      />

      <!-- Customer + Financial summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="admin-card">
          <h3 class="section-title mb-4 flex items-center gap-2">
            <span>👤</span> اطلاعات مشتری
          </h3>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between">
              <dt class="text-text-secondary">نام:</dt>
              <dd class="font-medium text-text-primary">
                {{ order.user?.firstName }} {{ order.user?.lastName }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-text-secondary">تلفن:</dt>
              <dd class="font-fanum font-medium" dir="ltr">{{ order.user?.phone }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-text-secondary">روش پرداخت:</dt>
              <dd class="font-medium">
                {{ order.paymentMethod === 'wallet' ? 'کیف پول' : 'درگاه پرداخت آنلاین' }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="admin-card">
          <h3 class="section-title mb-4 flex items-center gap-2">
            <span>💰</span> خلاصه مالی
          </h3>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between">
              <dt class="text-text-secondary">جمع اقلام:</dt>
              <dd class="font-fanum font-medium">
                {{ formatPrice(order.total + (order.discount ?? 0)) }}
              </dd>
            </div>
            <div v-if="order.discount > 0" class="flex justify-between">
              <dt class="text-success">
                تخفیف کوپن
                <span v-if="order.couponCode" class="font-mono text-xs bg-green-100 px-1 rounded ml-1">
                  {{ order.couponCode }}
                </span>:
              </dt>
              <dd class="text-success font-fanum font-medium">- {{ formatPrice(order.discount) }}</dd>
            </div>
            <div class="flex justify-between border-t border-border pt-2">
              <dt class="font-bold text-text-primary">مبلغ پرداختی:</dt>
              <dd class="font-black text-primary font-fanum text-base">{{ formatPrice(order.total) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Shipping address -->
      <div class="admin-card">
        <h3 class="section-title mb-3 flex items-center gap-2">
          <span>📍</span> آدرس تحویل
        </h3>
        <div class="text-sm text-text-secondary leading-7">
          <p>
            <span class="font-medium text-text-primary">
              {{ order.address?.province }}، {{ order.address?.city }}
            </span>
            — {{ order.address?.street }}
          </p>
          <p class="mt-1 flex flex-wrap gap-4">
            <span>
              کد پستی:
              <span class="font-fanum font-medium text-text-primary" dir="ltr">{{ order.address?.postalCode }}</span>
            </span>
            <span>
              گیرنده:
              <span class="font-medium text-text-primary">{{ order.address?.recipient }}</span>
            </span>
            <span>
              تلفن گیرنده:
              <span class="font-fanum font-medium text-text-primary" dir="ltr">{{ order.address?.phone }}</span>
            </span>
          </p>
        </div>
      </div>

      <!-- Order items -->
      <div class="admin-card">
        <h3 class="section-title mb-4 flex items-center gap-2">
          <span>📦</span> اقلام سفارش
          <span class="text-text-disabled font-normal text-xs font-fanum">({{ order.items?.length }} کالا)</span>
        </h3>
        <div class="space-y-3">
          <div
            v-for="item in order.items"
            :key="item.productId"
            class="flex items-center gap-4 py-3 border-b border-border last:border-none"
          >
            <img
              :src="item.image" :alt="item.name"
              class="w-14 h-14 rounded-xl object-contain border border-border bg-surface flex-shrink-0 p-1"
              @error="e => (e.target.style.opacity = '0')"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-text-primary text-sm truncate">{{ item.name }}</p>
              <p class="text-text-secondary text-xs mt-0.5 font-fanum">
                {{ formatPrice(item.price) }} × {{ item.quantity }} عدد
              </p>
            </div>
            <span class="font-black text-text-primary font-fanum flex-shrink-0">
              {{ formatPrice(item.totalPrice) }}
            </span>
          </div>
        </div>
      </div>

    </template>

    <!-- Not found -->
    <div v-else-if="!loading" class="admin-card text-center py-16 text-text-disabled">
      <div class="text-5xl mb-3">🔍</div>
      <p>سفارش یافت نشد</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute }                    from 'vue-router'
import { orderService }                from '@/services/order.service'
import { useUiStore }                  from '@/stores/ui.store'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import { ORDER_STATUSES }              from '@/utils/constants'

import OrderStatusUpdater from './components/OrderStatusUpdater.vue'
import AdminBadge    from '@/components/common/AdminBadge.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const route = useRoute()
const ui    = useUiStore()

const order          = ref(null)
const loading        = ref(true)
const updatingStatus = ref(false)

async function fetchOrder() {
  loading.value = true
  try {
    const { data } = await orderService.getById(route.params.id)
    order.value = data
    document.title = `${data.orderNumber} | ادمین استورین`
  } catch {
    ui.addToast('خطا در بارگذاری سفارش', 'error')
  } finally {
    loading.value = false
  }
}

async function updateStatus(newStatus) {
  if (!order.value || newStatus === order.value.status) return
  updatingStatus.value = true
  try {
    const { data } = await orderService.updateStatus(order.value._id, newStatus)
    order.value = data
    ui.addToast(`وضعیت سفارش به «${ORDER_STATUSES[newStatus]?.label}» تغییر کرد`, 'success')
  } catch (err) {
    ui.addToast(err.response?.data?.message ?? 'خطا در تغییر وضعیت', 'error')
  } finally {
    updatingStatus.value = false
  }
}

onMounted(fetchOrder)
onUnmounted(() => { document.title = 'استورین | پنل مدیریت' })
</script>
