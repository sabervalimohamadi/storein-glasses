<template>
  <div class="p-6 max-w-3xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-text-primary">مدیریت رنگ‌ها</h1>
        <p class="text-sm text-text-secondary mt-0.5">{{ colors.length }} رنگ ثبت شده</p>
      </div>
      <AdminButton @click="openCreate">+ افزودن رنگ</AdminButton>
    </div>

    <!-- Color grid -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <AdminSkeleton v-for="i in 6" :key="i" height="72px" class="rounded-xl" />
    </div>

    <div v-else-if="colors.length === 0" class="text-center py-16 text-text-secondary">
      هنوز رنگی ثبت نشده.
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div
        v-for="color in colors"
        :key="color._id"
        class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface group"
      >
        <!-- Swatch -->
        <div
          class="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 shadow-sm"
          :style="{ backgroundColor: color.hex }"
        />
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-text-primary text-sm truncate">{{ color.name }}</p>
          <p class="text-xs text-text-secondary font-mono">{{ color.hex }}</p>
        </div>
        <!-- Actions -->
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="openEdit(color)"
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
            title="ویرایش"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z"/>
            </svg>
          </button>
          <button
            @click="confirmDelete(color)"
            class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors"
            title="حذف"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <AdminModal v-model="showModal" :title="editingColor ? 'ویرایش رنگ' : 'افزودن رنگ جدید'" size="sm">
      <form @submit.prevent="saveColor" class="space-y-4">
        <AdminInput v-model="form.name" label="نام رنگ" placeholder="مثلاً: مشکی" required />

        <!-- Hex picker -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">رنگ <span class="text-red-500">*</span></label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              v-model="form.hex"
              class="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5"
            />
            <AdminInput v-model="form.hex" placeholder="#000000" class="flex-1 font-mono" />
          </div>
          <p v-if="hexError" class="text-xs text-red-500 mt-1">{{ hexError }}</p>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="isActive" v-model="form.isActive" class="w-4 h-4 accent-primary" />
          <label for="isActive" class="text-sm text-text-primary">فعال</label>
        </div>
      </form>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AdminButton variant="ghost" @click="showModal = false">انصراف</AdminButton>
          <AdminButton @click="saveColor" :loading="saving">
            {{ editingColor ? 'ذخیره تغییرات' : 'افزودن رنگ' }}
          </AdminButton>
        </div>
      </template>
    </AdminModal>

    <!-- Delete confirm -->
    <AdminConfirm
      v-model="showConfirm"
      title="حذف رنگ"
      :message="`رنگ «${deletingColor?.name}» حذف شود؟`"
      :loading="deleting"
      @confirm="deleteColor"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { colorService } from '@/services/color.service'
import { useUiStore } from '@/stores/ui.store'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminModal    from '@/components/common/AdminModal.vue'
import AdminConfirm  from '@/components/common/AdminConfirm.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const ui      = useUiStore()
const colors  = ref([])
const loading = ref(false)
const saving  = ref(false)
const deleting = ref(false)

const showModal   = ref(false)
const showConfirm = ref(false)
const editingColor  = ref(null)
const deletingColor = ref(null)

const form = reactive({ name: '', hex: '#000000', isActive: true })

const hexError = computed(() => {
  if (!form.hex) return ''
  return /^#[0-9A-Fa-f]{6}$/.test(form.hex) ? '' : 'فرمت باید #RRGGBB باشد'
})

async function loadColors() {
  loading.value = true
  try {
    const { data } = await colorService.getAll()
    colors.value = Array.isArray(data) ? data : []
  } catch {
    ui.addToast('خطا در بارگذاری رنگ‌ها', 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingColor.value = null
  form.name = ''
  form.hex  = '#000000'
  form.isActive = true
  showModal.value = true
}

function openEdit(color) {
  editingColor.value = color
  form.name     = color.name
  form.hex      = color.hex
  form.isActive = color.isActive
  showModal.value = true
}

async function saveColor() {
  if (!form.name.trim()) return ui.addToast('نام رنگ الزامی است', 'error')
  if (hexError.value)    return ui.addToast(hexError.value, 'error')

  saving.value = true
  try {
    if (editingColor.value) {
      const { data } = await colorService.update(editingColor.value._id, { ...form })
      const idx = colors.value.findIndex(c => c._id === editingColor.value._id)
      if (idx !== -1) colors.value[idx] = data
      ui.addToast('رنگ ویرایش شد', 'success')
    } else {
      const { data } = await colorService.create({ ...form })
      colors.value.push(data)
      ui.addToast('رنگ افزوده شد', 'success')
    }
    showModal.value = false
  } catch (e) {
    ui.addToast(e?.response?.data?.message ?? 'خطا در ذخیره رنگ', 'error')
  } finally {
    saving.value = false
  }
}

function confirmDelete(color) {
  deletingColor.value = color
  showConfirm.value   = true
}

async function deleteColor() {
  deleting.value = true
  try {
    await colorService.remove(deletingColor.value._id)
    colors.value = colors.value.filter(c => c._id !== deletingColor.value._id)
    ui.addToast('رنگ حذف شد', 'success')
    showConfirm.value = false
  } catch {
    ui.addToast('خطا در حذف رنگ', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(loadColors)
</script>
