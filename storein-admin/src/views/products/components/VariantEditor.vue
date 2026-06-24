<template>
  <div>
    <div class="space-y-3">
      <div
        v-for="(variant, idx) in modelValue"
        :key="idx"
        class="border border-border rounded-xl p-4 bg-card"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-bold text-text-secondary">تنوع {{ idx + 1 }}</span>
          <div class="flex items-center gap-3">
            <button
              @click="duplicateVariant(idx)"
              class="text-text-disabled hover:text-primary transition-colors text-xs flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              کپی
            </button>
            <button
              v-if="modelValue.length > 1"
              @click="removeVariant(idx)"
              class="text-text-disabled hover:text-error transition-colors text-xs flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              حذف
            </button>
          </div>
        </div>

        <!-- Fields -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label class="field-label">SKU</label>
            <input v-model="variant.sku" type="text" dir="ltr" placeholder="RB-3025-BLK"
                   class="field-input text-left" />
          </div>
          <div>
            <label class="field-label">قیمت (تومان) <span class="text-error">*</span></label>
            <PriceInput
              v-model="variant.price"
              placeholder="2125000"
              :class="['field-input text-left', errors?.[idx]?.price ? 'border-error' : '']"
            />
            <p v-if="errors?.[idx]?.price" class="field-error">{{ errors[idx].price }}</p>
          </div>
          <div>
            <label class="field-label">قیمت اصلی (تومان)</label>
            <PriceInput
              v-model="variant.comparePrice"
              placeholder="2500000"
              class="field-input text-left"
            />
            <p v-if="variant.comparePrice > 0 && variant.comparePrice <= variant.price"
               class="text-warning text-xs mt-1">باید از قیمت فروش بیشتر باشد</p>
          </div>
          <div>
            <label class="field-label">موجودی <span class="text-error">*</span></label>
            <input v-model.number="variant.stock" type="number" min="0" step="1" dir="ltr"
                   placeholder="10"
                   :class="['field-input text-left', errors?.[idx]?.stock ? 'border-error' : '']" />
            <p v-if="errors?.[idx]?.stock" class="field-error">{{ errors[idx].stock }}</p>
          </div>
        </div>

        <!-- Wholesale pricing -->
        <div class="mb-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-3">
          <p class="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">🏪 قیمت عمده (اختیاری)</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label text-amber-700 dark:text-amber-400">قیمت عمده (تومان)</label>
              <PriceInput
                v-model="variant.wholesalePrice"
                placeholder="0"
                class="field-input text-left"
              />
            </div>
            <div>
              <label class="field-label text-amber-700 dark:text-amber-400">حداقل تعداد عمده</label>
              <input v-model.number="variant.wholesaleMinQty" type="number" min="1" step="1" dir="ltr"
                     placeholder="10"
                     class="field-input text-left" />
            </div>
          </div>
        </div>

        <!-- Attributes -->
        <div>
          <label class="field-label mb-2">ویژگی‌های این تنوع</label>

          <div class="space-y-2 mb-2">
            <div v-for="(val, key) in variant.attributes" :key="key" class="flex items-center gap-2">

              <!-- Key input -->
              <input
                :value="key"
                @change="renameAttrKey(idx, key, $event.target.value)"
                type="text" placeholder="نام ویژگی (مثلاً: رنگ)"
                class="field-input flex-1 text-sm"
              />
              <span class="text-text-disabled flex-shrink-0">:</span>

              <!-- ── رنگ ── -->
              <template v-if="key === 'رنگ'">
                <div class="flex-1 relative" data-attr-picker>
                  <button type="button" @click.stop="toggleDropdown(idx, key)"
                    class="field-input w-full flex items-center gap-2 text-sm text-right">
                    <span v-if="getColorHex(val)"
                      class="w-5 h-5 rounded-full border border-black/15 flex-shrink-0"
                      :style="{ backgroundColor: getColorHex(val) }" />
                    <span :class="['flex-1 text-right truncate', val ? '' : 'text-text-disabled']">
                      {{ val || 'انتخاب رنگ...' }}
                    </span>
                    <svg class="w-4 h-4 text-text-disabled flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <div v-if="openDropdown === `${idx}-${key}`"
                    class="absolute top-full mt-1 right-0 left-0 z-50 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto py-1"
                    @click.stop>
                    <div class="px-2 pb-1 sticky top-0 bg-card">
                      <input v-model="colorSearch" type="text" placeholder="جستجو..."
                        class="w-full text-xs px-2 py-1.5 border border-border rounded-lg outline-none focus:border-primary bg-surface dark:bg-slate-800 text-text-primary placeholder:text-text-disabled"
                        @click.stop />
                    </div>
                    <!-- Clear option -->
                    <button v-if="val" type="button" @click="selectValue(idx, key, '')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-right">
                      ✕ حذف انتخاب
                    </button>
                    <button v-for="color in filteredColors" :key="color._id"
                      type="button"
                      @click="selectValue(idx, key, color.name)"
                      :class="[
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-right',
                        val === color.name
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300 font-medium'
                          : 'text-text-primary hover:bg-slate-100 dark:hover:bg-white/5',
                      ]">
                      <span class="w-5 h-5 rounded-full border border-black/10 flex-shrink-0"
                        :style="{ backgroundColor: color.hex }" />
                      {{ color.name }}
                      <span class="text-xs text-text-disabled font-mono mr-auto">{{ color.hex }}</span>
                      <span v-if="val === color.name" class="text-primary dark:text-blue-300 text-xs">✓</span>
                    </button>
                    <p v-if="!filteredColors.length" class="text-xs text-text-disabled px-3 py-2 text-center">
                      رنگی یافت نشد
                    </p>
                  </div>
                </div>
              </template>

              <!-- ── شکل فریم ── -->
              <template v-else-if="key === 'شکل فریم'">
                <div class="flex-1 relative" data-attr-picker>
                  <button type="button" @click.stop="toggleDropdown(idx, key)"
                    class="field-input w-full flex items-center gap-2 text-sm text-right">
                    <span v-if="val" class="text-base flex-shrink-0">
                      {{ shapeIcon(FRAME_SHAPES.find(s => s.label === val)?.value) }}
                    </span>
                    <span :class="['flex-1 text-right truncate', val ? '' : 'text-text-disabled']">
                      {{ val || 'انتخاب شکل فریم...' }}
                    </span>
                    <svg class="w-4 h-4 text-text-disabled flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <div v-if="openDropdown === `${idx}-${key}`"
                    class="absolute top-full mt-1 right-0 left-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-y-auto py-1"
                    @click.stop>
                    <button v-if="val" type="button" @click="selectValue(idx, key, '')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-right">
                      ✕ حذف انتخاب
                    </button>
                    <button v-for="shape in FRAME_SHAPES" :key="shape.value"
                      type="button"
                      @click="selectValue(idx, key, shape.label)"
                      :class="[
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-right',
                        val === shape.label
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300 font-medium'
                          : 'text-text-primary hover:bg-slate-100 dark:hover:bg-white/5',
                      ]">
                      <span class="text-base w-6 text-center flex-shrink-0">
                        {{ shape.icon || shapeIcon(shape.value) }}
                      </span>
                      <span class="flex-1">{{ shape.label }}</span>
                      <span v-if="val === shape.label" class="text-primary dark:text-blue-300 text-xs">✓</span>
                    </button>
                    <p v-if="!FRAME_SHAPES.length" class="text-xs text-text-disabled px-3 py-2 text-center">
                      ابتدا از منوی ویژگی‌های اختصاصی شکل فریم اضافه کنید
                    </p>
                  </div>
                </div>
              </template>

              <!-- ── جنس فریم ── -->
              <template v-else-if="key === 'جنس فریم'">
                <div class="flex-1 relative" data-attr-picker>
                  <button type="button" @click.stop="toggleDropdown(idx, key)"
                    class="field-input w-full flex items-center gap-2 text-sm text-right">
                    <span v-if="val" class="text-base flex-shrink-0">
                      {{ materialIcon(FRAME_MATERIALS.find(m => m.label === val)?.value) }}
                    </span>
                    <span :class="['flex-1 text-right truncate', val ? '' : 'text-text-disabled']">
                      {{ val || 'انتخاب جنس فریم...' }}
                    </span>
                    <svg class="w-4 h-4 text-text-disabled flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <div v-if="openDropdown === `${idx}-${key}`"
                    class="absolute top-full mt-1 right-0 left-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-y-auto py-1"
                    @click.stop>
                    <button v-if="val" type="button" @click="selectValue(idx, key, '')"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-right">
                      ✕ حذف انتخاب
                    </button>
                    <button v-for="mat in FRAME_MATERIALS" :key="mat.value"
                      type="button"
                      @click="selectValue(idx, key, mat.label)"
                      :class="[
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-right',
                        val === mat.label
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300 font-medium'
                          : 'text-text-primary hover:bg-slate-100 dark:hover:bg-white/5',
                      ]">
                      <span class="text-base w-6 text-center flex-shrink-0">
                        {{ mat.icon || materialIcon(mat.value) }}
                      </span>
                      <span class="flex-1">{{ mat.label }}</span>
                      <span v-if="val === mat.label" class="text-primary dark:text-blue-300 text-xs">✓</span>
                    </button>
                    <p v-if="!FRAME_MATERIALS.length" class="text-xs text-text-disabled px-3 py-2 text-center">
                      ابتدا از منوی ویژگی‌های اختصاصی جنس فریم اضافه کنید
                    </p>
                  </div>
                </div>
              </template>

              <!-- ── متن آزاد ── -->
              <template v-else>
                <input
                  :value="val"
                  @input="variant.attributes[key] = $event.target.value"
                  type="text" placeholder="مقدار (مثلاً: مشکی)"
                  class="field-input flex-1 text-sm"
                />
              </template>

              <button @click="removeAttr(idx, key)"
                class="text-text-disabled hover:text-error transition-colors flex-shrink-0 p-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Preset quick-add -->
          <div class="flex flex-wrap gap-2 mb-2">
            <button
              v-for="preset in presetAttrs" :key="preset"
              v-show="!(preset in (variant.attributes ?? {}))"
              @click="addAttr(idx, preset)"
              class="text-xs px-2 py-1 rounded-lg border border-dashed border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >+ {{ preset }}</button>
          </div>

          <button @click="addAttr(idx, '')"
            class="text-xs text-text-secondary hover:text-primary flex items-center gap-1 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
            </svg>
            افزودن ویژگی دلخواه
          </button>
        </div>
      </div>
    </div>

    <!-- Add variant -->
    <button @click="addVariant"
      class="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-border text-text-secondary text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
      </svg>
      افزودن تنوع جدید
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { colorService } from '@/services/color.service'
import PriceInput from '@/components/ui/PriceInput.vue'

const props = defineProps({
  modelValue:     { type: Array,  default: () => [] },
  errors:         { type: Object, default: () => ({}) },
  frameShapes:    { type: Array,  default: () => [] },
  frameMaterials: { type: Array,  default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const presetAttrs = ['رنگ', 'شکل فریم', 'جنس فریم', 'اندازه']

const FRAME_SHAPES    = computed(() => props.frameShapes)
const FRAME_MATERIALS = computed(() => props.frameMaterials)

// ── Fallback icon maps (when item has no icon field) ───────
const SHAPE_ICONS = {
  round: '⭕', square: '🔲', oval: '🥚', rectangular: '▬',
  aviator: '✈️', 'cat-eye': '😼', octagonal: '🔷', rimless: '💎',
}
const MATERIAL_ICONS = {
  steel: '🔩', titanium: '🪖', acetate: '🎭', tr90: '🧬', carbon: '🖤',
}
function shapeIcon(val)    { return SHAPE_ICONS[val]    ?? '🔲' }
function materialIcon(val) { return MATERIAL_ICONS[val] ?? '⚙️' }

// ── Colors ────────────────────────────────────────────────
const colors       = ref([])
const colorSearch  = ref('')
const openDropdown = ref(null)

const filteredColors = computed(() => {
  if (!colorSearch.value.trim()) return colors.value
  return colors.value.filter(c => c.name.includes(colorSearch.value))
})

function getColorHex(name) {
  return colors.value.find(c => c.name === name)?.hex ?? null
}

function toggleDropdown(variantIdx, key) {
  const id = `${variantIdx}-${key}`
  openDropdown.value = openDropdown.value === id ? null : id
  colorSearch.value  = ''
}

// Single-select: pick a value and close
function selectValue(variantIdx, key, value) {
  const updated = props.modelValue.map((v, i) =>
    i === variantIdx ? { ...v, attributes: { ...v.attributes, [key]: value } } : v
  )
  emit('update:modelValue', updated)
  openDropdown.value = null
}

function closeOnOutside(e) {
  if (!e.target.closest('[data-attr-picker]')) openDropdown.value = null
}

onMounted(async () => {
  try {
    const res = await colorService.getActive()
    colors.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('خطا در بارگذاری رنگ‌ها:', e?.response?.status)
  }
  document.addEventListener('click', closeOnOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutside))

// ── Variant helpers ────────────────────────────────────────
function newVariant() {
  return { sku: '', price: 0, comparePrice: 0, stock: 0, attributes: {}, wholesalePrice: null, wholesaleMinQty: 10 }
}
function addVariant() {
  emit('update:modelValue', [...props.modelValue, newVariant()])
}
function duplicateVariant(idx) {
  const src = props.modelValue[idx]
  const copy = { sku: src.sku, price: src.price, comparePrice: src.comparePrice, stock: src.stock, attributes: { ...src.attributes }, wholesalePrice: src.wholesalePrice ?? null, wholesaleMinQty: src.wholesaleMinQty ?? 10 }
  const updated = [...props.modelValue]
  updated.splice(idx + 1, 0, copy)
  emit('update:modelValue', updated)
}
function removeVariant(idx) {
  const updated = [...props.modelValue]
  updated.splice(idx, 1)
  emit('update:modelValue', updated)
}
function addAttr(variantIdx, key) {
  const updated = props.modelValue.map((v, i) =>
    i === variantIdx ? { ...v, attributes: { ...v.attributes, [key]: '' } } : v
  )
  emit('update:modelValue', updated)
}
function removeAttr(variantIdx, key) {
  const updated = props.modelValue.map((v, i) => {
    if (i !== variantIdx) return v
    const attrs = { ...v.attributes }
    delete attrs[key]
    return { ...v, attributes: attrs }
  })
  emit('update:modelValue', updated)
}
function renameAttrKey(variantIdx, oldKey, newKey) {
  if (!newKey.trim() || oldKey === newKey) return
  const updated = props.modelValue.map((v, i) => {
    if (i !== variantIdx) return v
    const attrs = { ...v.attributes }
    const val = attrs[oldKey]
    delete attrs[oldKey]
    attrs[newKey] = val
    return { ...v, attributes: attrs }
  })
  emit('update:modelValue', updated)
}
</script>
