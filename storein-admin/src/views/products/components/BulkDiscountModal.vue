<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.6);"
        @click.self="$emit('update:modelValue', false)">

        <div class="bg-card rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style="max-height: 88vh;">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-text-primary text-base">تخفیف گروهی</h2>
                <p class="text-xs text-text-disabled mt-0.5">محصولات را انتخاب کنید، تخفیف تعیین کنید و اعمال کنید</p>
              </div>
            </div>
            <button @click="$emit('update:modelValue', false)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

            <!-- Product selector panel -->
            <div class="flex-1 flex flex-col min-h-0 overflow-hidden">

              <!-- Filter strip -->
              <div class="px-5 py-4 border-b border-border bg-surface/40 flex-shrink-0">
                <div class="flex items-center gap-1.5 mb-3">
                  <svg class="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                  <span class="text-xs font-semibold text-text-secondary">افزودن بر اساس فیلتر</span>
                </div>
                <div class="flex gap-2">
                  <select v-model="filterCategory" class="field-input text-sm flex-1 h-9 py-0 min-w-0">
                    <option value="">همه دسته‌ها</option>
                    <option v-for="c in categories" :key="c._id" :value="c._id">{{ c.name }}</option>
                  </select>
                  <select v-model="filterBrand" class="field-input text-sm flex-1 h-9 py-0 min-w-0">
                    <option value="">همه برندها</option>
                    <option v-for="b in brands" :key="b._id" :value="b._id">{{ b.name }}</option>
                  </select>
                  <button @click="fetchFiltered"
                    :disabled="filterLoading || (!filterCategory && !filterBrand)"
                    class="h-9 px-3.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-sm font-medium flex-shrink-0 flex items-center gap-1.5 disabled:opacity-40 transition-all">
                    <svg v-if="filterLoading" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    جستجو
                  </button>
                </div>

                <!-- Filter results list -->
                <Transition name="slide-down">
                  <div v-if="filterSearched || filterLoading" class="mt-3">
                    <div v-if="filterLoading" class="flex items-center gap-2 text-xs text-text-disabled">
                      <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      در حال جستجو...
                    </div>
                    <div v-else-if="!filterResults.length" class="text-xs text-text-disabled">
                      هیچ محصولی با این فیلتر یافت نشد
                    </div>
                    <div v-else>
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-text-secondary font-fanum">
                          {{ filterResults.length }} محصول یافت شد
                          <span v-if="newInResults.length < filterResults.length" class="text-primary font-medium">
                            · {{ newInResults.length }} جدید
                          </span>
                        </span>
                        <button v-if="newInResults.length" @click="addAllFiltered"
                          class="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                            <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
                          </svg>
                          افزودن همه جدید
                        </button>
                      </div>
                      <div class="space-y-1 max-h-32 overflow-y-auto">
                        <div v-for="p in filterResults" :key="p._id"
                          class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-card transition-colors group">
                          <img :src="p.thumbnail || p.images?.[0]"
                            class="w-7 h-7 rounded-md object-contain border border-border bg-surface flex-shrink-0"
                            @error="e => e.target.style.opacity='0'" />
                          <span class="flex-1 text-xs text-text-primary truncate">{{ p.name }}</span>
                          <span v-if="existingIds.has(p._id)"
                            class="text-xs text-success flex items-center gap-0.5 flex-shrink-0 font-medium">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            در لیست
                          </span>
                          <button v-else @click="addSingle(p)"
                            class="w-6 h-6 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-all opacity-0 group-hover:opacity-100">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Selected products -->
              <div class="flex-1 overflow-y-auto">
                <!-- Empty state -->
                <div v-if="!targetProducts.length"
                  class="flex flex-col items-center justify-center h-full text-center py-12 px-8">
                  <div class="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4 border border-border">
                    <svg class="w-7 h-7 text-text-disabled/50" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <p class="text-sm font-medium text-text-secondary">هنوز محصولی انتخاب نشده</p>
                  <p class="text-xs text-text-disabled mt-1.5 leading-relaxed">از فیلتر بالا دسته‌بندی یا برند را جستجو کنید</p>
                </div>

                <!-- Product list -->
                <div v-else>
                  <div class="flex items-center justify-between px-5 py-2.5 sticky top-0 bg-card/90 backdrop-blur border-b border-border z-10">
                    <span class="text-xs font-semibold text-text-secondary">
                      <span class="text-text-primary font-bold font-fanum">{{ targetProducts.length }}</span>
                      محصول انتخابی
                    </span>
                    <button @click="targetProducts = []"
                      class="text-xs text-error/60 hover:text-error transition-colors flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      پاک کردن همه
                    </button>
                  </div>
                  <div class="divide-y divide-border/50">
                    <div v-for="p in targetProducts" :key="p._id"
                      class="flex items-center gap-3 px-5 py-3 hover:bg-surface/30 transition-colors group">
                      <img :src="p.thumbnail || p.images?.[0]"
                        class="w-10 h-10 rounded-xl object-contain border border-border bg-surface flex-shrink-0 p-1"
                        @error="e => e.target.style.opacity = '0'" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-text-primary truncate leading-tight">{{ p.name }}</p>
                        <div v-if="validDiscount" class="flex items-center gap-2 mt-1">
                          <span class="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded-md font-fanum font-bold">
                            {{ formatPrice(Math.round(p.minPrice * (1 - discountPct / 100))) }}
                          </span>
                          <span class="text-xs line-through text-text-disabled font-fanum">
                            {{ formatPrice(p.minPrice) }}
                          </span>
                        </div>
                        <p v-else class="text-xs text-text-disabled font-fanum mt-0.5">{{ formatPrice(p.minPrice) }}</p>
                      </div>
                      <button @click="removeProduct(p._id)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-text-disabled hover:text-error hover:bg-error/5 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Discount config panel -->
            <div class="w-full md:w-64 flex-shrink-0 flex flex-col bg-surface/20 border-r border-border">
              <div class="flex-1 p-5 space-y-5 overflow-y-auto">

                <!-- Percentage input -->
                <div>
                  <p class="text-xs font-semibold text-text-secondary mb-3">درصد تخفیف</p>
                  <div class="flex justify-center mb-4">
                    <div class="relative">
                      <input
                        v-model.number="discountPct"
                        type="number" min="0" max="90" step="1" dir="ltr"
                        class="w-28 h-16 rounded-2xl border-2 text-center text-4xl font-bold font-fanum bg-card focus:outline-none transition-colors"
                        :class="discountPct > 0
                          ? 'text-primary border-primary/50 focus:border-primary'
                          : 'text-text-primary border-border focus:border-border/80'"
                      />
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold select-none"
                        :class="discountPct > 0 ? 'text-primary/50' : 'text-text-disabled'">٪</span>
                    </div>
                  </div>
                  <input type="range" v-model.number="discountPct" min="0" max="90" step="1"
                    class="w-full accent-primary cursor-pointer" />
                  <div class="flex justify-between text-xs text-text-disabled mt-1 font-fanum">
                    <span>۰</span><span>۳۰</span><span>۶۰</span><span>۹۰</span>
                  </div>
                </div>

                <!-- Quick presets -->
                <div>
                  <p class="text-xs text-text-disabled mb-2">انتخاب سریع</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button v-for="pct in [10, 20, 30, 50]" :key="pct"
                      @click="discountPct = pct"
                      class="px-3 py-1 rounded-lg text-xs font-fanum font-medium transition-all"
                      :class="discountPct === pct
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface hover:bg-card text-text-secondary border border-border'">
                      {{ pct }}٪
                    </button>
                  </div>
                </div>

                <!-- Summary -->
                <div class="rounded-xl border border-border bg-card p-4 space-y-2.5">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-text-secondary">محصولات</span>
                    <span class="text-sm font-fanum font-bold"
                      :class="targetProducts.length ? 'text-text-primary' : 'text-text-disabled'">
                      {{ targetProducts.length || '—' }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-text-secondary">تخفیف</span>
                    <span class="text-sm font-fanum font-bold"
                      :class="discountPct > 0 ? 'text-primary' : 'text-text-disabled'">
                      {{ discountPct > 0 ? discountPct + '٪' : '—' }}
                    </span>
                  </div>
                  <template v-if="targetProducts.length && discountPct > 0">
                    <div class="pt-2 border-t border-border">
                      <p class="text-xs text-text-secondary leading-relaxed">
                        قیمت نهایی
                        <span class="text-success font-bold font-fanum">{{ discountPct }}٪</span>
                        پایین‌تر خواهد بود
                      </p>
                    </div>
                  </template>
                  <template v-else-if="targetProducts.length && discountPct === 0">
                    <div class="pt-2 border-t border-border">
                      <p class="text-xs text-warning leading-relaxed">تخفیف فعلی محصولات حذف می‌شود</p>
                    </div>
                  </template>
                </div>

              </div>

              <!-- Actions -->
              <div class="p-4 border-t border-border space-y-2 flex-shrink-0">
                <button
                  @click="apply"
                  :disabled="!targetProducts.length || saving"
                  class="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                  :class="targetProducts.length && !saving
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20'
                    : 'bg-surface/80 text-text-disabled cursor-not-allowed border border-border'">
                  <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <svg v-else-if="targetProducts.length" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>{{ saving ? 'در حال اعمال...' : targetProducts.length ? `اعمال روی ${targetProducts.length} محصول` : 'محصولی انتخاب نشده' }}</span>
                </button>
                <button @click="$emit('update:modelValue', false)"
                  class="w-full h-9 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-colors">
                  انصراف
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { productService } from '@/services/product.service'
import { useUiStore }     from '@/stores/ui.store'
import { formatPrice }    from '@/utils/formatters'

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  initialProducts: { type: Array,   default: () => [] },
  categories:      { type: Array,   default: () => [] },
  brands:          { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'applied'])
const ui   = useUiStore()

const targetProducts = ref([])
const discountPct    = ref(10)
const filterCategory = ref('')
const filterBrand    = ref('')
const filterResults  = ref([])
const filterSearched = ref(false)
const filterLoading  = ref(false)
const saving         = ref(false)

const validDiscount = computed(() => discountPct.value > 0 && discountPct.value <= 90)
const existingIds   = computed(() => new Set(targetProducts.value.map(p => p._id)))
const newInResults  = computed(() => filterResults.value.filter(p => !existingIds.value.has(p._id)))

watch(() => props.modelValue, (open) => {
  if (!open) return
  targetProducts.value = [...props.initialProducts]
  discountPct.value    = 10
  filterCategory.value = ''
  filterBrand.value    = ''
  filterResults.value  = []
  filterSearched.value = false
})

async function fetchFiltered() {
  filterLoading.value  = true
  filterSearched.value = false
  try {
    const params = { limit: 200 }
    if (filterCategory.value) params.category = filterCategory.value
    if (filterBrand.value)    params.brand     = filterBrand.value
    const { data } = await productService.getAll(params)
    filterResults.value  = data?.products ?? []
    filterSearched.value = true
  } catch {
    ui.addToast('خطا در بارگذاری محصولات', 'error')
  } finally {
    filterLoading.value = false
  }
}

function addSingle(p) {
  if (!existingIds.value.has(p._id)) targetProducts.value.push(p)
}

function addAllFiltered() {
  targetProducts.value.push(...newInResults.value)
  filterResults.value  = []
  filterSearched.value = false
  filterCategory.value = ''
  filterBrand.value    = ''
}

function removeProduct(id) {
  targetProducts.value = targetProducts.value.filter(p => p._id !== id)
}

async function apply() {
  if (!targetProducts.value.length) return
  const pct = Number(discountPct.value)
  if (pct < 0 || pct > 90) { ui.addToast('درصد تخفیف باید بین ۰ تا ۹۰ باشد', 'error'); return }

  saving.value = true
  try {
    const { data } = await productService.bulkDiscount({
      productIds:  targetProducts.value.map(p => p._id),
      discountPct: pct,
    })
    const msg = pct === 0
      ? `تخفیف ${data.updated} محصول حذف شد`
      : `تخفیف ${pct}٪ روی ${data.updated} محصول اعمال شد`
    ui.addToast(msg, 'success')
    emit('applied', { productIds: targetProducts.value.map(p => p._id), discountPct: pct })
    emit('update:modelValue', false)
  } catch (err) {
    ui.addToast(err.response?.data?.message ?? 'خطا در اعمال تخفیف', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.slide-down-enter-active { transition: all 0.2s ease; }
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }

input[type="range"] {
  height: 4px;
  border-radius: 9999px;
}
</style>
