<template>
  <div>
    <!-- Variant rows -->
    <div class="space-y-3">
      <div
        v-for="(variant, idx) in modelValue"
        :key="idx"
        class="border border-border rounded-xl p-4 bg-white"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-bold text-text-secondary">تنوع {{ idx + 1 }}</span>
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

        <!-- Fields: SKU + Price + ComparePrice + Stock -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label class="field-label">SKU</label>
            <input v-model="variant.sku" type="text" dir="ltr" placeholder="RB-3025-BLK"
                   class="field-input text-left" />
          </div>

          <div>
            <label class="field-label">قیمت (تومان) <span class="text-error">*</span></label>
            <input v-model.number="variant.price" type="number" min="0" step="1000" dir="ltr"
                   placeholder="2125000"
                   :class="['field-input text-left', errors?.[idx]?.price ? 'border-error' : '']" />
            <p v-if="errors?.[idx]?.price" class="field-error">{{ errors[idx].price }}</p>
          </div>

          <div>
            <label class="field-label">قیمت اصلی (تومان)</label>
            <input v-model.number="variant.comparePrice" type="number" min="0" step="1000" dir="ltr"
                   placeholder="2500000" class="field-input text-left" />
            <p v-if="variant.comparePrice > 0 && variant.comparePrice <= variant.price"
               class="text-warning text-xs mt-1">
              باید از قیمت فروش بیشتر باشد
            </p>
          </div>

          <div>
            <label class="field-label">موجودی <span class="text-error">*</span></label>
            <input v-model.number="variant.stock" type="number" min="0" step="1" dir="ltr"
                   placeholder="10"
                   :class="['field-input text-left', errors?.[idx]?.stock ? 'border-error' : '']" />
            <p v-if="errors?.[idx]?.stock" class="field-error">{{ errors[idx].stock }}</p>
          </div>
        </div>

        <!-- Attributes -->
        <div>
          <label class="field-label mb-2">ویژگی‌های این تنوع</label>

          <div class="space-y-2 mb-2">
            <div v-for="(val, key) in variant.attributes" :key="key" class="flex items-center gap-2">
              <input
                :value="key"
                @change="renameAttrKey(idx, key, $event.target.value)"
                type="text" placeholder="نام ویژگی (مثلاً: رنگ)"
                class="field-input flex-1 text-sm"
              />
              <span class="text-text-disabled flex-shrink-0">:</span>

              <!-- Color picker when key === 'رنگ' -->
              <template v-if="key === 'رنگ'">
                <div class="flex-1 relative" ref="colorDropdownRef">
                  <button
                    type="button"
                    @click="toggleColorDropdown(idx, key)"
                    class="field-input w-full flex items-center gap-2 text-sm text-right"
                  >
                    <span
                      v-if="getColorHex(val)"
                      class="w-5 h-5 rounded-full border border-black/15 flex-shrink-0"
                      :style="{ backgroundColor: getColorHex(val) }"
                    />
                    <span class="flex-1 text-right">{{ val || 'انتخاب رنگ...' }}</span>
                    <svg class="w-4 h-4 text-text-disabled flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <!-- Dropdown -->
                  <div
                    v-if="openDropdown === `${idx}-${key}`"
                    class="absolute top-full mt-1 right-0 left-0 z-50 bg-white border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto py-1"
                  >
                    <!-- Search -->
                    <div class="px-2 pb-1 sticky top-0 bg-white">
                      <input
                        v-model="colorSearch"
                        type="text"
                        placeholder="جستجو..."
                        class="w-full text-xs px-2 py-1.5 border border-border rounded-lg outline-none focus:border-primary"
                        @click.stop
                      />
                    </div>
                    <button
                      v-for="color in filteredColors"
                      :key="color._id"
                      type="button"
                      @click="selectColor(idx, key, color)"
                      :class="[
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface transition-colors text-right',
                        variant.attributes[key] === color.name ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary'
                      ]"
                    >
                      <span
                        class="w-5 h-5 rounded-full border border-black/10 flex-shrink-0"
                        :style="{ backgroundColor: color.hex }"
                      />
                      {{ color.name }}
                      <span class="text-xs text-text-disabled font-mono mr-auto">{{ color.hex }}</span>
                    </button>
                    <p v-if="filteredColors.length === 0" class="text-xs text-text-disabled px-3 py-2 text-center">
                      رنگی یافت نشد
                    </p>
                  </div>
                </div>
              </template>

              <!-- Plain text for other attributes -->
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
              v-for="preset in presetAttrs"
              :key="preset"
              v-show="!(preset in (variant.attributes ?? {}))"
              @click="addAttr(idx, preset)"
              class="text-xs px-2 py-1 rounded-lg border border-dashed border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              + {{ preset }}
            </button>
          </div>

          <!-- Custom attr -->
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

const props = defineProps({
  modelValue: { type: Array,  default: () => [] },
  errors:     { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const presetAttrs = ['رنگ', 'شکل فریم', 'جنس فریم', 'اندازه']

// ── Colors ────────────────────────────────────────────────
const colors      = ref([])
const colorSearch = ref('')
const openDropdown = ref(null)

const filteredColors = computed(() => {
  if (!colorSearch.value.trim()) return colors.value
  return colors.value.filter(c => c.name.includes(colorSearch.value))
})

function getColorHex(name) {
  return colors.value.find(c => c.name === name)?.hex ?? null
}

function toggleColorDropdown(variantIdx, key) {
  const id = `${variantIdx}-${key}`
  openDropdown.value = openDropdown.value === id ? null : id
  colorSearch.value  = ''
}

function selectColor(variantIdx, key, color) {
  const updated = props.modelValue.map((v, i) =>
    i === variantIdx ? { ...v, attributes: { ...v.attributes, [key]: color.name } } : v
  )
  emit('update:modelValue', updated)
  openDropdown.value = null
}

function closeOnOutside(e) {
  if (!e.target.closest('[ref="colorDropdownRef"]')) openDropdown.value = null
}

onMounted(async () => {
  try {
    const { data } = await colorService.getActive()
    colors.value = Array.isArray(data) ? data : []
  } catch { /* silent */ }
  document.addEventListener('click', closeOnOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutside))

// ── Variant helpers ────────────────────────────────────────
function newVariant() {
  return { sku: '', price: 0, comparePrice: 0, stock: 0, attributes: {} }
}

function addVariant() {
  emit('update:modelValue', [...props.modelValue, newVariant()])
}

function removeVariant(idx) {
  const updated = [...props.modelValue]
  updated.splice(idx, 1)
  emit('update:modelValue', updated)
}

function addAttr(variantIdx, key) {
  const updated = props.modelValue.map((v, i) =>
    i === variantIdx
      ? { ...v, attributes: { ...v.attributes, [key]: '' } }
      : v
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
