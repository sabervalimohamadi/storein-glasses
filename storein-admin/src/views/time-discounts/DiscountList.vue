<template>
  <div class="page-wrapper">
    <div class="page-header">
      <h1 class="page-title">تخفیف‌های مدت‌دار</h1>
      <router-link to="/time-discounts/create">
        <AdminButton variant="primary" icon="plus">تخفیف جدید</AdminButton>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="filters-bar mb-4 flex gap-3 flex-wrap">
      <select v-model="filterActive" @change="fetchDiscounts(1)" class="admin-select">
        <option value="">همه وضعیت‌ها</option>
        <option value="true">فعال</option>
        <option value="false">غیرفعال</option>
      </select>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <AdminSkeleton v-if="loading" :rows="8" />
      <div v-else-if="!discounts?.length" class="empty-state">هیچ تخفیفی یافت نشد</div>
      <table v-else class="admin-table w-full">
        <thead>
          <tr>
            <th>عنوان</th>
            <th>نوع</th>
            <th>مقدار</th>
            <th>شروع</th>
            <th>پایان</th>
            <th>وضعیت</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in discounts" :key="d._id">
            <td class="font-medium">{{ d.title }}</td>
            <td>{{ d.discountType === 'percentage' ? 'درصدی' : 'مبلغ ثابت' }}</td>
            <td class="font-fanum">
              {{ d.value }}{{ d.discountType === 'percentage' ? '٪' : ' تومان' }}
            </td>
            <td class="font-fanum text-sm">{{ formatDate(d.startDate) }}</td>
            <td class="font-fanum text-sm">{{ formatDate(d.endDate) }}</td>
            <td>
              <span :class="['badge', statusClass(d)]">{{ statusLabel(d) }}</span>
            </td>
            <td>
              <div class="flex gap-2 justify-end">
                <button
                  class="btn-icon btn-toggle"
                  :title="d.isActive ? 'غیرفعال کن' : 'فعال کن'"
                  @click="toggleDiscount(d)"
                >
                  <span v-if="d.isActive">⏸</span>
                  <span v-else>▶</span>
                </button>
                <router-link :to="`/time-discounts/${d._id}/edit`">
                  <button class="btn-icon btn-edit" title="ویرایش">✏️</button>
                </router-link>
                <button class="btn-icon btn-delete" title="حذف" @click="confirmDelete(d)">🗑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AdminPagination
      v-if="totalPages > 1"
      :current="page"
      :total="totalPages"
      class="mt-4"
      @change="fetchDiscounts"
    />

    <!-- Delete confirm -->
    <AdminConfirm
      v-if="deleteTarget"
      title="حذف تخفیف"
      :message="`آیا از حذف «${deleteTarget.title}» مطمئنید؟`"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import AdminButton     from '@/components/common/AdminButton.vue'
import AdminSkeleton   from '@/components/common/AdminSkeleton.vue'
import AdminPagination from '@/components/common/AdminPagination.vue'
import AdminConfirm    from '@/components/common/AdminConfirm.vue'
import { timeDiscountService } from '@/services/time-discount.service'

const ui = useUiStore()

const discounts   = ref([])
const loading     = ref(false)
const page        = ref(1)
const totalPages  = ref(1)
const filterActive = ref('')
const deleteTarget = ref(null)

async function fetchDiscounts(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, limit: 20 }
    if (filterActive.value !== '') params.isActive = filterActive.value
    const { data } = await timeDiscountService.getAll(params)
    discounts.value  = data?.discounts ?? []
    totalPages.value = data?.totalPages ?? 1
  } catch {
    ui.addToast('خطا در بارگذاری تخفیف‌ها', 'error')
  } finally {
    loading.value = false
  }
}

async function toggleDiscount(d) {
  try {
    const { data } = await timeDiscountService.toggle(d._id)
    const idx = discounts.value.findIndex((x) => x._id === d._id)
    if (idx !== -1) discounts.value[idx] = data
    ui.addToast(`تخفیف ${data.isActive ? 'فعال' : 'غیرفعال'} شد`, 'success')
  } catch {
    ui.addToast('خطا در تغییر وضعیت', 'error')
  }
}

function confirmDelete(d) { deleteTarget.value = d }

async function doDelete() {
  try {
    await timeDiscountService.remove(deleteTarget.value._id)
    ui.addToast('تخفیف حذف شد', 'success')
    deleteTarget.value = null
    fetchDiscounts(page.value)
  } catch {
    ui.addToast('خطا در حذف', 'error')
  }
}

function statusLabel(d) {
  const now = new Date()
  if (!d.isActive) return 'غیرفعال'
  if (new Date(d.endDate) < now) return 'منقضی'
  if (new Date(d.startDate) > now) return 'زمان‌بندی شده'
  return 'فعال'
}

function statusClass(d) {
  const label = statusLabel(d)
  return {
    'badge-green':  label === 'فعال',
    'badge-yellow': label === 'زمان‌بندی شده',
    'badge-red':    label === 'منقضی',
    'badge-gray':   label === 'غیرفعال',
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

onMounted(() => fetchDiscounts())
</script>

<style scoped>
.page-wrapper { padding: 1.5rem; }
.page-header  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-title   { font-size: 1.25rem; font-weight: 700; }

.admin-table th, .admin-table td { padding: 0.75rem 1rem; text-align: right; border-bottom: 1px solid var(--color-border, #e5e7eb); }
.admin-table thead th { background: var(--color-surface, #f9fafb); font-weight: 600; font-size: 0.875rem; }

.badge        { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-green  { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-red    { background: #fee2e2; color: #991b1b; }
.badge-gray   { background: #f3f4f6; color: #374151; }

.btn-icon   { width: 2rem; height: 2rem; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; cursor: pointer; font-size: 0.9rem; }
.btn-toggle { background: #eff6ff; border-color: #bfdbfe; }
.btn-edit   { background: #f0fdf4; border-color: #bbf7d0; }
.btn-delete { background: #fff1f2; border-color: #fecdd3; }

.empty-state { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.filters-bar .admin-select { padding: 0.4rem 0.75rem; border: 1px solid var(--color-border, #d1d5db); border-radius: 0.375rem; background: white; min-width: 140px; }
</style>
