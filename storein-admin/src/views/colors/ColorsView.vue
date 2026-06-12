<template>
  <div class="p-6 max-w-4xl mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold text-text-primary">ویژگی‌های اختصاصی</h1>
        <p class="text-sm text-text-secondary mt-0.5">
          {{ activeTab === 'colors'
              ? `${colors.length} رنگ ثبت شده`
              : activeTab === 'frameShape'
                ? `${shapes.length} شکل فریم`
                : `${materials.length} جنس فریم` }}
        </p>
      </div>
      <AdminButton @click="openCreate">+ افزودن {{ tabLabel }}</AdminButton>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-6 bg-surface p-1 rounded-xl w-fit">
      <button
        v-for="tab in tabs" :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
          activeTab === tab.key
            ? 'bg-card text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        ]"
      >
        <span>{{ tab.icon }}</span>{{ tab.label }}
      </button>
    </div>

    <!-- ── رنگ‌ها ── -->
    <template v-if="activeTab === 'colors'">
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AdminSkeleton v-for="i in 6" :key="i" height="72px" class="rounded-xl" />
      </div>
      <div v-else-if="!colors.length" class="text-center py-16 text-text-secondary">
        هنوز رنگی ثبت نشده.
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div v-for="color in pagedColors" :key="color._id"
          class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface group">
          <div class="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 shadow-sm"
            :style="{ backgroundColor: color.hex }" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-text-primary text-sm truncate">{{ color.name }}</p>
            <p class="text-xs text-text-secondary font-mono">{{ color.hex }}</p>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="openEdit(color)" class="icon-btn hover:text-primary" title="ویرایش">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z"/>
              </svg>
            </button>
            <button @click="confirmDelete(color)" class="icon-btn hover:text-error" title="حذف">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <AdminPagination v-model="page" :total-pages="colorTotalPages" :loading="loading" />
    </template>

    <!-- ── شکل فریم ── -->
    <template v-else-if="activeTab === 'frameShape'">
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminSkeleton v-for="i in 4" :key="i" height="120px" class="rounded-xl" />
      </div>
      <div v-else-if="!shapes.length" class="text-center py-16 text-text-secondary">
        هنوز شکل فریمی ثبت نشده.
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="item in shapes" :key="item._id"
          class="admin-card flex flex-col items-center gap-3 py-5 text-center group relative">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            {{ item.icon || '🔲' }}
          </div>
          <div>
            <p class="font-semibold text-text-primary text-sm">{{ item.label }}</p>
            <p class="text-text-disabled text-xs font-mono mt-0.5">{{ item.value }}</p>
          </div>
          <button
            @click="toggleActive(item)"
            :title="item.isActive ? 'کلیک برای غیرفعال کردن' : 'کلیک برای فعال کردن'"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full border transition-all duration-150 cursor-pointer',
              item.isActive
                ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30'
                : 'bg-surface text-text-disabled border-border hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 hover:border-green-200',
            ]"
          >
            {{ item.isActive ? 'فعال' : 'غیرفعال' }}
          </button>
          <div class="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="openEdit(item)" class="icon-btn hover:text-primary"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z"/></svg></button>
            <button @click="confirmDelete(item)" class="icon-btn hover:text-error"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── جنس فریم ── -->
    <template v-else-if="activeTab === 'frameMaterial'">
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <AdminSkeleton v-for="i in 5" :key="i" height="120px" class="rounded-xl" />
      </div>
      <div v-else-if="!materials.length" class="text-center py-16 text-text-secondary">
        هنوز جنس فریمی ثبت نشده.
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div v-for="item in materials" :key="item._id"
          class="admin-card flex flex-col items-center gap-3 py-5 text-center group relative">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            {{ item.icon || '⚙️' }}
          </div>
          <div>
            <p class="font-semibold text-text-primary text-sm">{{ item.label }}</p>
            <p class="text-text-disabled text-xs font-mono mt-0.5">{{ item.value }}</p>
          </div>
          <button
            @click="toggleActive(item)"
            :title="item.isActive ? 'کلیک برای غیرفعال کردن' : 'کلیک برای فعال کردن'"
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full border transition-all duration-150 cursor-pointer',
              item.isActive
                ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30'
                : 'bg-surface text-text-disabled border-border hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 hover:border-green-200',
            ]"
          >
            {{ item.isActive ? 'فعال' : 'غیرفعال' }}
          </button>
          <div class="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="openEdit(item)" class="icon-btn hover:text-primary"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 012-2z"/></svg></button>
            <button @click="confirmDelete(item)" class="icon-btn hover:text-error"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Modal: Add/Edit ── -->
    <AdminModal v-model="showModal" :title="editingItem ? `ویرایش ${tabLabel}` : `افزودن ${tabLabel}`" size="sm">
      <form @submit.prevent="saveItem" class="space-y-4">

        <!-- Color fields -->
        <template v-if="activeTab === 'colors'">
          <AdminInput v-model="form.name" label="نام رنگ" placeholder="مثلاً: مشکی" required />
          <div>
            <label class="field-label">رنگ <span class="text-error">*</span></label>
            <div class="flex items-center gap-3">
              <input type="color" v-model="form.hex"
                class="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
              <AdminInput v-model="form.hex" placeholder="#000000" class="flex-1 font-mono" />
            </div>
            <p v-if="hexError" class="text-xs text-error mt-1">{{ hexError }}</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="colorActive" v-model="form.isActive" class="w-4 h-4 accent-primary" />
            <label for="colorActive" class="text-sm text-text-primary">فعال</label>
          </div>
        </template>

        <!-- Frame attr fields -->
        <template v-else>
          <AdminInput v-model="form.label" :label="`نام ${tabLabel}`" :placeholder="`مثلاً: ${activeTab === 'frameShape' ? 'گرد' : 'استیل'}`" required />
          <div>
            <label class="field-label">
              شناسه فیلتر
              <span class="text-error">*</span>
              <span class="text-text-disabled font-normal text-xs mr-1">(انگلیسی، بدون فاصله)</span>
            </label>
            <input
              v-model="form.value"
              dir="ltr"
              :placeholder="activeTab === 'frameShape' ? 'round' : 'steel'"
              class="field-input"
            />
            <p class="text-text-disabled text-xs mt-1">این مقدار در فیلتر محصولات استفاده می‌شود</p>
          </div>
          <div>
            <label class="field-label">آیکون <span class="text-text-disabled font-normal text-xs">(اختیاری — یک ایموجی)</span></label>
            <input v-model="form.icon" placeholder="⭕" class="field-input w-24 text-center text-xl" maxlength="4" />
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="attrActive" v-model="form.isActive" class="w-4 h-4 accent-primary" />
            <label for="attrActive" class="text-sm text-text-primary">فعال</label>
          </div>
        </template>

      </form>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AdminButton variant="ghost" @click="showModal = false">انصراف</AdminButton>
          <AdminButton @click="saveItem" :loading="saving">
            {{ editingItem ? 'ذخیره تغییرات' : `افزودن ${tabLabel}` }}
          </AdminButton>
        </div>
      </template>
    </AdminModal>

    <AdminConfirm
      v-model="showConfirm"
      :title="`حذف ${tabLabel}`"
      :message="`«${deletingItem?.name ?? deletingItem?.label}» حذف شود؟`"
      :loading="deleting"
      @confirm="deleteItem"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { colorService }         from '@/services/color.service'
import { frameAttributeService } from '@/services/frame-attribute.service'
import { useUiStore }   from '@/stores/ui.store'
import AdminButton      from '@/components/common/AdminButton.vue'
import AdminInput       from '@/components/common/AdminInput.vue'
import AdminModal       from '@/components/common/AdminModal.vue'
import AdminConfirm     from '@/components/common/AdminConfirm.vue'
import AdminSkeleton    from '@/components/common/AdminSkeleton.vue'
import AdminPagination  from '@/components/common/AdminPagination.vue'

const ui = useUiStore()

// ── Tabs ──────────────────────────────────────────────────
const tabs = [
  { key: 'colors',        icon: '🎨', label: 'رنگ‌ها' },
  { key: 'frameShape',    icon: '🖼️', label: 'شکل فریم' },
  { key: 'frameMaterial', icon: '⚙️', label: 'جنس فریم' },
]
const activeTab = ref('colors')

const tabLabel = computed(() =>
  tabs.find(t => t.key === activeTab.value)?.label ?? ''
)

// ── State ──────────────────────────────────────────────────
const loading   = ref(false)
const saving    = ref(false)
const deleting  = ref(false)
const page      = ref(1)
const PER_PAGE  = 24

const showModal   = ref(false)
const showConfirm = ref(false)
const editingItem  = ref(null)
const deletingItem = ref(null)

// data
const colors    = ref([])
const shapes    = ref([])
const materials = ref([])

const form = reactive({
  // color fields
  name: '', hex: '#000000',
  // frame attr fields
  label: '', value: '', icon: '',
  // shared
  isActive: true,
})

// ── Color helpers ──────────────────────────────────────────
const hexError = computed(() =>
  form.hex && !/^#[0-9A-Fa-f]{6}$/.test(form.hex) ? 'فرمت باید #RRGGBB باشد' : ''
)
const colorTotalPages = computed(() => Math.ceil(colors.value.length / PER_PAGE))
const pagedColors = computed(() =>
  colors.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

// ── Load ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    if (activeTab.value === 'colors') {
      const { data } = await colorService.getAll()
      colors.value = Array.isArray(data) ? data : []
    } else if (activeTab.value === 'frameShape') {
      const { data } = await frameAttributeService.getAll('frameShape')
      shapes.value = Array.isArray(data) ? data : []
    } else {
      const { data } = await frameAttributeService.getAll('frameMaterial')
      materials.value = Array.isArray(data) ? data : []
    }
  } catch {
    ui.addToast('خطا در بارگذاری', 'error')
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => { page.value = 1; load() })
onMounted(load)

// ── Open modal ─────────────────────────────────────────────
function resetForm() {
  form.name = ''; form.hex = '#000000'
  form.label = ''; form.value = ''; form.icon = ''
  form.isActive = true
}

function openCreate() {
  editingItem.value = null
  resetForm()
  showModal.value = true
}

function openEdit(item) {
  editingItem.value = item
  if (activeTab.value === 'colors') {
    form.name     = item.name
    form.hex      = item.hex
    form.isActive = item.isActive
  } else {
    form.label    = item.label
    form.value    = item.value
    form.icon     = item.icon ?? ''
    form.isActive = item.isActive
  }
  showModal.value = true
}

// ── Save ──────────────────────────────────────────────────
async function saveItem() {
  saving.value = true
  try {
    if (activeTab.value === 'colors') {
      await saveColor()
    } else {
      await saveFrameAttr()
    }
    showModal.value = false
    load()
  } catch (e) {
    ui.addToast(e?.response?.data?.message ?? 'خطا در ذخیره', 'error')
  } finally {
    saving.value = false
  }
}

async function saveColor() {
  if (!form.name.trim()) throw new Error('نام الزامی')
  if (hexError.value)    throw new Error(hexError.value)
  const dto = { name: form.name, hex: form.hex, isActive: form.isActive }
  if (editingItem.value) {
    await colorService.update(editingItem.value._id, dto)
    ui.addToast('رنگ ویرایش شد', 'success')
  } else {
    await colorService.create(dto)
    ui.addToast('رنگ افزوده شد', 'success')
  }
}

async function saveFrameAttr() {
  if (!form.label.trim()) throw new Error('نام الزامی')
  if (!form.value.trim()) throw new Error('شناسه الزامی')
  const dto = {
    type:     activeTab.value,
    label:    form.label.trim(),
    value:    form.value.trim(),
    icon:     form.icon.trim(),
    isActive: form.isActive,
  }
  if (editingItem.value) {
    await frameAttributeService.update(editingItem.value._id, dto)
    ui.addToast(`${tabLabel.value} ویرایش شد`, 'success')
  } else {
    await frameAttributeService.create(dto)
    ui.addToast(`${tabLabel.value} افزوده شد`, 'success')
  }
}

// ── Toggle active ─────────────────────────────────────────
async function toggleActive(item) {
  try {
    await frameAttributeService.update(item._id, { isActive: !item.isActive })
    item.isActive = !item.isActive
  } catch {
    ui.addToast('خطا در تغییر وضعیت', 'error')
  }
}

// ── Delete ────────────────────────────────────────────────
function confirmDelete(item) {
  deletingItem.value = item
  showConfirm.value  = true
}

async function deleteItem() {
  deleting.value = true
  try {
    if (activeTab.value === 'colors') {
      await colorService.remove(deletingItem.value._id)
    } else {
      await frameAttributeService.remove(deletingItem.value._id)
    }
    ui.addToast('حذف شد', 'success')
    showConfirm.value = false
    load()
  } catch {
    ui.addToast('خطا در حذف', 'error')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.icon-btn {
  @apply w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary/10;
}
</style>
