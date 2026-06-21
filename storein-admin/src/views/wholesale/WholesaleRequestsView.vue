<template>
  <div class="p-6">

    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="page-title">درخواست‌های عمده‌فروشی</h1>
      <div class="flex gap-2">
        <button
          v-for="s in statusTabs"
          :key="s.value"
          @click="currentStatus = s.value; fetchRequests()"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            currentStatus === s.value
              ? 'bg-primary text-white'
              : 'bg-surface text-text-secondary hover:bg-surface-hover',
          ]"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-xl skeleton" />
    </div>

    <!-- Table -->
    <div v-else class="admin-card overflow-hidden p-0">
      <table class="w-full text-sm">
        <thead class="border-b border-border">
          <tr class="text-text-secondary text-xs">
            <th class="text-right px-4 py-3 font-medium">کاربر</th>
            <th class="text-right px-4 py-3 font-medium">شرکت</th>
            <th class="text-right px-4 py-3 font-medium">کد ملی</th>
            <th class="text-right px-4 py-3 font-medium hidden md:table-cell">توضیحات</th>
            <th class="text-right px-4 py-3 font-medium">تاریخ</th>
            <th class="text-right px-4 py-3 font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="req in requests"
            :key="req._id"
            class="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="font-medium text-text-primary">{{ req.firstName }} {{ req.lastName }}</div>
              <div class="text-text-disabled text-xs font-fanum">{{ req.phone }}</div>
            </td>
            <td class="px-4 py-3 text-text-primary">{{ req.wholesaleCompanyName }}</td>
            <td class="px-4 py-3 font-fanum text-text-secondary">{{ req.wholesaleNationalId }}</td>
            <td class="px-4 py-3 text-text-secondary max-w-xs truncate hidden md:table-cell">
              {{ req.wholesaleDescription || '—' }}
            </td>
            <td class="px-4 py-3 text-text-disabled text-xs font-fanum">
              {{ new Date(req.createdAt).toLocaleDateString('fa-IR') }}
            </td>
            <td class="px-4 py-3">
              <div v-if="currentStatus === 'pending'" class="flex gap-2">
                <button
                  @click="handleAction(req._id, 'approve')"
                  :disabled="actionLoading === req._id"
                  class="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  ✓ تأیید
                </button>
                <button
                  @click="openReject(req._id)"
                  :disabled="actionLoading === req._id"
                  class="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  ✕ رد
                </button>
              </div>
              <span v-else-if="currentStatus === 'approved'" class="text-green-600 text-xs font-bold">✓ تأیید شده</span>
              <span v-else class="text-red-500 text-xs font-bold">✕ رد شده</span>
            </td>
          </tr>
          <tr v-if="!requests.length && !loading">
            <td colspan="6" class="text-center py-16 text-text-disabled">
              درخواستی یافت نشد
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal رد کردن -->
    <Teleport to="body">
      <div v-if="rejectModal.open" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h3 class="font-bold text-text-primary mb-4">دلیل رد درخواست</h3>
          <textarea
            v-model="rejectModal.reason"
            class="w-full border border-border rounded-xl p-3 text-sm resize-none mb-4 bg-surface text-text-primary"
            rows="3"
            placeholder="دلیل را وارد کنید (اختیاری)"
          />
          <div class="flex gap-3">
            <button
              @click="confirmReject"
              class="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors"
            >
              تأیید رد
            </button>
            <button
              @click="rejectModal.open = false"
              class="flex-1 border border-border py-2.5 rounded-xl text-text-secondary hover:bg-surface transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import http from '@/services/http.service'
import { useUiStore } from '@/stores/ui.store'

const ui            = useUiStore()
const requests      = ref([])
const loading       = ref(false)
const actionLoading = ref(null)
const currentStatus = ref('pending')

const rejectModal = reactive({ open: false, userId: null, reason: '' })

const statusTabs = [
  { value: 'pending',  label: '⏳ در انتظار' },
  { value: 'approved', label: '✓ تأیید شده' },
  { value: 'rejected', label: '✕ رد شده'    },
]

async function fetchRequests() {
  loading.value = true
  try {
    const { data } = await http.get('/admin/wholesale-requests', { params: { status: currentStatus.value } })
    requests.value = data || []
  } catch {
    ui.addToast('خطا در بارگذاری درخواست‌ها', 'error')
  } finally {
    loading.value = false
  }
}

async function handleAction(userId, action, reason = '') {
  actionLoading.value = userId
  try {
    await http.patch(`/admin/wholesale-requests/${userId}`, { action, reason })
    ui.addToast(action === 'approve' ? 'کاربر تأیید شد ✓' : 'درخواست رد شد', 'success')
    await fetchRequests()
  } catch {
    ui.addToast('خطا در انجام عملیات', 'error')
  } finally {
    actionLoading.value = null
  }
}

function openReject(userId) {
  rejectModal.open   = true
  rejectModal.userId = userId
  rejectModal.reason = ''
}

async function confirmReject() {
  await handleAction(rejectModal.userId, 'reject', rejectModal.reason)
  rejectModal.open = false
}

onMounted(fetchRequests)
</script>
