<template>
  <div class="admin-card mb-4">
    <div class="flex flex-wrap gap-3 items-end">

      <div class="flex-1 min-w-[220px]">
        <AdminInput
          v-model="f.search"
          placeholder="شماره سفارش یا شماره تلفن مشتری..."
          prepend="🔍"
        />
      </div>

      <div class="w-40">
        <AdminSelect v-model="f.status" placeholder="همه وضعیت‌ها" :options="statusOptions" />
      </div>

      <div class="flex items-end gap-2">
        <div>
          <label class="field-label text-xs">از تاریخ</label>
          <input v-model="f.startDate" type="date" class="field-input text-sm w-36" dir="ltr" />
        </div>
        <div>
          <label class="field-label text-xs">تا تاریخ</label>
          <input v-model="f.endDate" type="date" class="field-input text-sm w-36" dir="ltr" />
        </div>
      </div>

      <AdminButton v-if="hasActive" variant="ghost" @click="reset">پاک کردن</AdminButton>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useDebounce }    from '@/composables/useDebounce'
import AdminInput         from '@/components/common/AdminInput.vue'
import AdminSelect        from '@/components/common/AdminSelect.vue'
import AdminButton        from '@/components/common/AdminButton.vue'
import { ORDER_STATUSES } from '@/utils/constants'

defineProps({ loading: Boolean })
const emit = defineEmits(['change'])

const f = reactive({ search: '', status: '', startDate: '', endDate: '' })

const dSearch = useDebounce(computed(() => f.search))

watch(dSearch, () => emitChange())
watch([() => f.status, () => f.startDate, () => f.endDate], emitChange)

function emitChange() {
  emit('change', {
    search:    dSearch.value  || undefined,
    status:    f.status       || undefined,
    startDate: f.startDate    || undefined,
    endDate:   f.endDate      || undefined,
  })
}

function reset() {
  f.search = f.status = f.startDate = f.endDate = ''
}

const hasActive = computed(() => f.search || f.status || f.startDate || f.endDate)

const statusOptions = Object.entries(ORDER_STATUSES).map(([v, d]) => ({
  value: v, label: d.label,
}))
</script>
