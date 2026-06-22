<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p v-if="!loading" class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} سفارش عمده
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Real-time
        </span>
      </div>
    </div>

    <!-- Status tabs -->
    <div class="flex gap-1 p-1 bg-surface-alt rounded-xl border border-border overflow-x-auto">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        @click="switchTab(tab.value)"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
          activeTab === tab.value
            ? 'bg-bg text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tab.value === 'pending' && ui.pendingWholesaleOrderCount > 0"
          class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold font-fanum"
        >
          {{ ui.pendingWholesaleOrderCount > 99 ? '99+' : ui.pendingWholesaleOrderCount }}
        </span>
      </button>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="orders"
        :loading="loading"
        :skeleton-rows="10"
        empty-text="سفارش عمده‌ای یافت نشد"
      >
        <template #cell-orderNumber="{ row }">
          <RouterLink
            :to="{ name: 'order-detail', params: { id: row._id } }"
            class="font-bold text-primary hover:underline text-sm font-fanum"
            dir="ltr"
          >
            {{ row.orderNumber }}
          </RouterLink>
        </template>

        <template #cell-customer="{ row }">
          <div>
            <p class="font-medium text-text-primary text-sm">
              {{ row.userId?.firstName ?? '' }} {{ row.userId?.lastName ?? '' }}
            </p>
            <p v-if="row.userId?.wholesaleCompanyName" class="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
              {{ row.userId.wholesaleCompanyName }}
            </p>
            <p class="text-text-disabled text-xs font-fanum" dir="ltr">{{ row.userId?.phone }}</p>
          </div>
        </template>

        <template #cell-items="{ row }">
          <span class="text-text-secondary text-sm font-fanum">
            {{ row.items?.length ?? 0 }} قلم
          </span>
        </template>

        <template #cell-total="{ row }">
          <span class="font-fanum font-bold text-text-primary text-sm">
            {{ formatPrice(row.total) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AdminBadge :variant="ORDER_STATUSES[row.status]?.color ?? 'gray'" size="sm">
            {{ ORDER_STATUSES[row.status]?.label ?? row.status }}
          </AdminBadge>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-text-secondary text-xs font-fanum">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>

        <template #cell-action="{ row }">
          <RouterLink
            :to="{ name: 'order-detail', params: { id: row._id } }"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors mx-auto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </RouterLink>
        </template>
      </AdminTable>
    </div>

    <AdminPagination
      v-model="page"
      :total-pages="totalPages"
      :loading="loading"
      @update:modelValue="fetchOrders"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { wholesaleService } from '@/services/wholesale.service'
import { useUiStore }       from '@/stores/ui.store'
import { formatPrice, formatNumber, formatDate } from '@/utils/formatters'
import { ORDER_STATUSES, ITEMS_PER_PAGE }        from '@/utils/constants'

import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

const ui = useUiStore()

const orders    = ref([])
const loading   = ref(true)
const total     = ref(0)
const page      = ref(1)
const activeTab = ref('pending')

const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

const statusTabs = [
  { value: 'pending',    label: 'در انتظار' },
  { value: 'confirmed',  label: 'تأیید شده' },
  { value: 'processing', label: 'در حال پردازش' },
  { value: 'shipped',    label: 'ارسال شده' },
  { value: 'delivered',  label: 'تحویل داده شده' },
  { value: 'cancelled',  label: 'لغو شده' },
  { value: '',           label: 'همه' },
]

const columns = [
  { key: 'orderNumber', label: 'شماره سفارش', width: '180px' },
  { key: 'customer',    label: 'مشتری عمده',   width: '200px' },
  { key: 'items',       label: 'تعداد اقلام',   width: '100px', align: 'center' },
  { key: 'total',       label: 'مبلغ کل',        width: '140px', align: 'center' },
  { key: 'status',      label: 'وضعیت',          width: '120px', align: 'center' },
  { key: 'createdAt',   label: 'تاریخ ثبت',       width: '130px' },
  { key: 'action',      label: '',               width: '60px',  align: 'center' },
]

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await wholesaleService.getWholesaleOrders({
      page:   page.value,
      limit:  ITEMS_PER_PAGE,
      status: activeTab.value || undefined,
    })
    orders.value = data?.items ?? []
    total.value  = data?.total ?? 0

    // After fetching pending orders, sync badge count
    if (activeTab.value === 'pending') {
      ui.setPendingWholesaleOrderCount(data?.total ?? 0)
    }
  } catch {
    ui.addToast('خطا در بارگذاری سفارشات عمده', 'error')
  } finally {
    loading.value = false
  }
}

function switchTab(status) {
  activeTab.value = status
  page.value = 1
  fetchOrders()
}

onMounted(fetchOrders)
</script>
