<template>
  <div class="bg-surface rounded-xl p-5 mb-6">

    <!-- Not logged in -->
    <div v-if="!authStore.isLoggedIn" class="text-center py-4">
      <p class="text-text-secondary text-sm mb-3">
        برای ثبت نظر وارد حساب کاربری خود شوید
      </p>
      <RouterLink :to="{ name: 'login' }">
        <BaseButton variant="outline" size="sm">ورود / ثبت‌نام</BaseButton>
      </RouterLink>
    </div>

    <!-- Form -->
    <div v-else>
      <button @click="formOpen = !formOpen" class="flex items-center justify-between w-full">
        <span class="font-bold text-text-primary text-sm">ثبت نظر و امتیاز</span>
        <svg
          class="w-4 h-4 text-text-secondary transition-transform duration-200"
          :class="{ 'rotate-180': formOpen }"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <Transition name="slide-down">
        <div v-if="formOpen" class="mt-4 space-y-4">

          <!-- Star selector -->
          <div>
            <label class="text-sm text-text-secondary block mb-2">
              امتیاز شما:
              <span class="text-brand font-bold">{{ ratingLabel }}</span>
            </label>
            <BaseRating v-model="form.rating" size="lg" />
          </div>

          <!-- Title -->
          <BaseInput
            v-model="form.title"
            label="عنوان نظر"
            placeholder="مثلاً: کیفیت عالی، ارزش خرید دارد"
            :error="errors.title"
          />

          <!-- Comment -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">
              متن نظر <span class="text-error">*</span>
            </label>
            <textarea
              v-model="form.comment"
              rows="4"
              placeholder="تجربه خود از این محصول را بنویسید..."
              :class="['input-field resize-none', errors.comment ? 'border-error' : '']"
            />
            <p v-if="errors.comment" class="text-error text-xs mt-1">{{ errors.comment }}</p>
          </div>

          <!-- API error -->
          <div v-if="apiError" class="bg-red-50 border border-red-200 rounded-xl p-3">
            <p class="text-error text-sm">{{ apiError }}</p>
          </div>

          <BaseButton block :loading="submitting" @click="submitReview">ثبت نظر</BaseButton>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore }   from '@/stores/ui.store'
import { reviewService } from '@/services/review.service'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput  from '@/components/common/BaseInput.vue'
import BaseRating from '@/components/common/BaseRating.vue'

const props = defineProps({
  productId: { type: String, required: true },
})
const emit = defineEmits(['submitted'])

const authStore = useAuthStore()
const ui        = useUiStore()

const formOpen  = ref(false)
const submitting = ref(false)
const apiError  = ref('')

const form   = reactive({ rating: 0, title: '', comment: '' })
const errors = reactive({ title: '', comment: '' })

const ratingLabels = ['', 'بد', 'متوسط', 'خوب', 'خیلی خوب', 'عالی']
const ratingLabel  = computed(() => ratingLabels[form.rating] || '')

async function submitReview() {
  errors.title = errors.comment = apiError.value = ''

  if (!form.rating)            { errors.title   = 'امتیاز الزامی است'; return }
  if (!form.comment.trim())    { errors.comment = 'متن نظر الزامی است'; return }
  if (form.comment.length < 10) { errors.comment = 'حداقل ۱۰ کاراکتر وارد کنید'; return }

  submitting.value = true
  try {
    await reviewService.create({
      productId: props.productId,
      rating:    form.rating,
      title:     form.title.trim(),
      comment:   form.comment.trim(),
    })
    ui.addToast('نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود', 'success')
    Object.assign(form, { rating: 0, title: '', comment: '' })
    formOpen.value = false
    emit('submitted')
  } catch (err) {
    if (err.response?.status === 403) {
      apiError.value = 'برای ثبت نظر باید این محصول را خریداری کرده باشید'
    } else {
      apiError.value = 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
