<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">کاربران</h1>
        <p v-if="!loading"
           class="text-text-secondary text-sm mt-0.5 font-fanum">
          {{ formatNumber(total) }} کاربر
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-card">
      <div class="flex flex-wrap gap-3 items-end">
        <AdminInput
          v-model="search"
          placeholder="جستجو با نام یا شماره موبایل..."
          prepend="🔍"
          class="flex-1 min-w-[220px]" />
        <AdminSelect
          v-model="blockedFilter"
          :options="blockedOptions"
          placeholder="همه کاربران"
          class="w-44" />
        <AdminButton v-if="search || blockedFilter"
          variant="ghost" @click="resetFilters">
          پاک کردن
        </AdminButton>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <AdminTable
        :columns="columns"
        :rows="users"
        :loading="loading"
        :skeleton-rows="10"
        empty-text="کاربری یافت نشد">

        <!-- Avatar + Name -->
        <template #cell-name="{ row }">
          <RouterLink
            :to="{ name: 'user-detail', params: { id: row._id } }"
            class="flex items-center gap-3 group">
            <div :class="[
              'w-9 h-9 rounded-full flex items-center justify-center',
              'text-sm font-bold flex-shrink-0 transition-transform',
              'group-hover:scale-110',
              row.isBlocked ? 'bg-red-100 text-red-600'
                            : 'bg-primary/10 text-primary',
            ]">
              {{ (row.firstName?.[0] ?? row.phone?.[2] ?? '؟').toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="font-medium text-text-primary text-sm
                         group-hover:text-primary transition-colors truncate">
                {{ row.firstName ?? '' }} {{ row.lastName ?? '' }}
                <span v-if="row.isAdmin"
                  class="text-[10px] bg-primary/10 text-primary
                         px-1.5 py-0.5 rounded-full mr-1 font-medium">
                  ادمین
                </span>
              </p>
              <p class="text-text-disabled text-xs font-fanum" dir="ltr">
                {{ row.phone }}
              </p>
            </div>
          </RouterLink>
        </template>

        <!-- Orders count -->
        <template #cell-ordersCount="{ row }">
          <span class="font-fanum font-medium text-text-primary text-sm">
            {{ formatNumber(row.ordersCount ?? 0) }}
          </span>
        </template>

        <!-- Total spent -->
        <template #cell-totalSpent="{ row }">
          <span class="font-fanum text-sm text-text-primary font-medium">
            {{ formatPrice(row.totalSpent ?? 0) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-isBlocked="{ row }">
          <AdminBadge
            :variant="row.isBlocked ? 'error' : 'success'"
            size="sm"
            :dot="true">
            {{ row.isBlocked ? 'مسدود' : 'فعال' }}
          </AdminBadge>
        </template>

        <!-- Join date -->
        <template #cell-createdAt="{ row }">
          <span class="text-text-secondary text-xs font-fanum">
            {{ formatDate(row.createdAt) }}
          </span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-1">
            <!-- View detail -->
            <RouterLink
              :to="{ name: 'user-detail', params: { id: row._id } }"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-text-secondary hover:bg-primary/10 hover:text-primary
                     transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0
                     8.268 2.943 9.542 7-1.274 4.057-5.064
                     7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </RouterLink>

            <!-- Block / Unblock -->
            <button v-if="!row.isAdmin"
              @click="toggleBlock(row)"
              :title="row.isBlocked ? 'رفع مسدودی' : 'مسدود کردن'"
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'transition-colors',
                row.isBlocked
                  ? 'text-text-secondary hover:bg-green-50 hover:text-success'
                  : 'text-text-secondary hover:bg-red-50 hover:text-error',
              ]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor"
                   stroke-width="2" viewBox="0 0 24 24">
                <path v-if="!row.isBlocked" stroke-linecap="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2
                     2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                <path v-else stroke-linecap="round"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2
                     2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
              </svg>
            </button>
          </div>
        </template>

      </AdminTable>
    </div>

    <!-- Pagination -->
    <AdminPagination
      v-model="page"
      :total-pages="totalPages"
      :loading="loading"
      @update:modelValue="fetchUsers" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { userService }  from '@/services/user.service'
import { useUiStore }   from '@/stores/ui.store'
import { useDebounce }  from '@/composables/useDebounce'
import { formatPrice, formatNumber, formatDate } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

import AdminTable      from '@/components/common/AdminTable.vue'
import AdminBadge      from '@/components/common/AdminBadge.vue'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminInput      from '@/components/common/AdminInput.vue'
import AdminSelect     from '@/components/common/AdminSelect.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'

const ui = useUiStore()

const users         = ref([])
const loading       = ref(true)
const total         = ref(0)
const page          = ref(1)
const search        = ref('')
const blockedFilter = ref('')

const dSearch    = useDebounce(search)
const totalPages = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE))

watch(dSearch, () => { page.value = 1; fetchUsers() })
watch(blockedFilter, () => { page.value = 1; fetchUsers() })

const columns = [
  { key: 'name',        label: 'کاربر',       width: '220px' },
  { key: 'ordersCount', label: 'سفارشات',      width: '90px',  align: 'center', sortable: true },
  { key: 'totalSpent',  label: 'مجموع خرید',   width: '150px', align: 'center', sortable: true },
  { key: 'isBlocked',   label: 'وضعیت',        width: '100px', align: 'center' },
  { key: 'createdAt',   label: 'تاریخ عضویت',  width: '120px' },
  { key: 'actions',     label: '',             width: '80px',  align: 'center' },
]

const blockedOptions = [
  { value: 'false', label: 'فقط فعال‌ها' },
  { value: 'true',  label: 'فقط مسدودها' },
]

async function fetchUsers() {
  loading.value = true
  try {
    const params = {
      page: page.value, limit: ITEMS_PER_PAGE,
      ...(dSearch.value         ? { search:    dSearch.value }       : {}),
      ...(blockedFilter.value !== ''
            ? { isBlocked: blockedFilter.value } : {}),
    }
    const { data } = await userService.getAll(params)
    users.value = data?.items ?? []
    total.value = data?.total ?? 0
  } catch {
    ui.addToast('خطا در بارگذاری کاربران', 'error')
  } finally {
    loading.value = false
  }
}

async function toggleBlock(user) {
  const wasBlocked = user.isBlocked
  user.isBlocked = !wasBlocked
  try {
    const { data } = await userService.block(user._id)
    user.isBlocked = data?.isBlocked ?? !wasBlocked
    ui.addToast(
      user.isBlocked
        ? `کاربر «${user.firstName ?? user.phone}» مسدود شد`
        : `مسدودی «${user.firstName ?? user.phone}» رفع شد`,
      user.isBlocked ? 'warning' : 'success'
    )
  } catch {
    user.isBlocked = wasBlocked
    ui.addToast('خطا در تغییر وضعیت کاربر', 'error')
  }
}

function resetFilters() {
  search.value = ''
  blockedFilter.value = ''
}

onMounted(fetchUsers)
</script>
