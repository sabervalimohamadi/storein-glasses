<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">تنظیمات سایت</h1>
        <p class="text-text-secondary text-sm mt-0.5">عنوان، لوگو، سئو، شبکه‌های اجتماعی و فوتر</p>
      </div>
      <AdminButton :loading="saving" :disabled="!dirty" @click="saveAll">
        {{ dirty ? '✓ ذخیره تغییرات' : 'ذخیره‌شده ✓' }}
      </AdminButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <AdminSkeleton v-for="i in 4" :key="i" height="80px" class="rounded-xl" />
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex items-center gap-1 mb-6 bg-surface p-1 rounded-xl w-fit flex-wrap">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.key
              ? 'bg-card text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          ]"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Tab: عمومی ──────────────────────────────────── -->
      <div v-show="activeTab === 'general'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">اطلاعات عمومی سایت</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.siteName"
              label="نام سایت" placeholder="استورین" required
              hint="در تب مرورگر و عنوان صفحات نمایش داده می‌شود" />
            <AdminInput v-model="form.tagline"
              label="شعار سایت" placeholder="فروشگاه تخصصی عینک‌های طبی و آفتابی"
              hint="زیر نام سایت در فوتر نمایش داده می‌شود" />
          </div>

          <!-- Logo upload -->
          <div>
            <label class="field-label">لوگو سایت</label>
            <div class="flex items-center gap-4 mt-2">
              <div class="w-24 h-16 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.logoUrl" :src="form.logoUrl" class="w-full h-full object-contain p-1" />
                <span v-else class="text-3xl">🖼</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <AdminInput v-model="form.logoUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                  <AdminButton variant="secondary" :loading="uploading.logo" @click="triggerUpload('logo')">
                    📷 آپلود
                  </AdminButton>
                </div>
                <p class="text-xs text-text-disabled">پیشنهاد: PNG با پس‌زمینه شفاف، ارتفاع ۱۲۰px</p>
              </div>
            </div>
          </div>

          <!-- Favicon upload -->
          <div>
            <label class="field-label">فاوآیکون (Favicon)</label>
            <div class="flex items-center gap-4 mt-2">
              <div class="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.faviconUrl" :src="form.faviconUrl" class="w-8 h-8 object-contain" />
                <span v-else class="text-2xl">🌐</span>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex gap-2">
                  <AdminInput v-model="form.faviconUrl" dir="ltr" placeholder="https://..." class="flex-1" />
                  <AdminButton variant="secondary" :loading="uploading.favicon" @click="triggerUpload('favicon')">
                    📷 آپلود
                  </AdminButton>
                </div>
                <p class="text-xs text-text-disabled">پیشنهاد: ICO یا PNG مربعی ۳۲×۳۲ یا ۶۴×۶۴</p>
              </div>
            </div>
          </div>

          <input ref="fileInputLogo"    type="file" accept="image/*" class="hidden" @change="onFileChange($event, 'logo')" />
          <input ref="fileInputFavicon" type="file" accept="image/png,image/x-icon,image/svg+xml" class="hidden" @change="onFileChange($event, 'favicon')" />
        </div>
      </div>

      <!-- ── Tab: سئو ────────────────────────────────────── -->
      <div v-show="activeTab === 'seo'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">تنظیمات سئو</h3>

          <AdminTextarea v-model="form.description"
            label="توضیحات متا (Meta Description)"
            placeholder="توضیح کوتاهی درباره سایت که در نتایج جستجو نمایش داده می‌شود..."
            :rows="3"
            :hint="`${form.description.length}/160 کاراکتر`" />

          <AdminInput v-model="form.keywords"
            label="کلمات کلیدی (Keywords)"
            placeholder="عینک آفتابی, عینک طبی, لنز رنگی, خرید عینک"
            hint="با کاما جدا کنید" />

          <!-- OG Image -->
          <div>
            <label class="field-label">تصویر شبکه‌های اجتماعی (OG Image)</label>
            <p class="text-xs text-text-disabled mb-2">هنگام اشتراک لینک در واتساپ، تلگرام و ... نمایش داده می‌شود</p>
            <div class="flex items-center gap-4">
              <div class="w-32 h-20 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="form.ogImage" :src="form.ogImage" class="w-full h-full object-cover" />
                <span v-else class="text-3xl">🖼</span>
              </div>
              <div class="flex-1 flex gap-2">
                <AdminInput v-model="form.ogImage" dir="ltr" placeholder="https://..." class="flex-1" />
                <AdminButton variant="secondary" :loading="uploading.ogImage" @click="triggerUpload('ogImage')">
                  📷 آپلود
                </AdminButton>
              </div>
            </div>
            <input ref="fileInputOg" type="file" accept="image/*" class="hidden" @change="onFileChange($event, 'ogImage')" />
          </div>

          <!-- SEO preview -->
          <div class="bg-surface rounded-xl p-4 border border-border">
            <p class="text-xs font-medium text-text-secondary mb-3 uppercase tracking-wide">پیش‌نمایش نتیجه جستجو</p>
            <p class="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-medium leading-tight">
              {{ form.siteName || 'نام سایت' }}
            </p>
            <p class="text-[#006621] dark:text-[#34a853] text-xs my-0.5">storein.ir ›</p>
            <p class="text-[#545454] dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {{ form.description || 'توضیحات متا در اینجا نمایش داده می‌شود...' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ── Tab: شبکه‌های اجتماعی ──────────────────────── -->
      <div v-show="activeTab === 'social'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">لینک‌های شبکه‌های اجتماعی</h3>
          <p class="text-text-secondary text-sm -mt-2">لینک‌های خالی در فوتر نمایش داده نخواهند شد</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div v-for="platform in socialPlatforms" :key="platform.key">
              <label class="field-label flex items-center gap-2">
                <span>{{ platform.icon }}</span>
                {{ platform.label }}
              </label>
              <AdminInput
                v-model="form.social[platform.key]"
                :placeholder="platform.placeholder"
                dir="ltr"
                class="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: فوتر ───────────────────────────────────── -->
      <div v-show="activeTab === 'footer'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">محتوای فوتر</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.footerTagline"
              label="شعار فوتر"
              placeholder="با بیش از هزاران محصول از برترین برندهای جهانی..."
              hint="اگر خالی باشد از شعار اصلی استفاده می‌شود" />
            <AdminInput v-model="form.footerCopyright"
              label="متن کپی‌رایت"
              placeholder="تمامی حقوق برای استورین محفوظ است" />
          </div>

          <!-- Footer links -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="field-label mb-0">لینک‌های سفارشی فوتر</label>
              <AdminButton variant="ghost" size="sm" @click="addFooterLink">
                + افزودن لینک
              </AdminButton>
            </div>

            <div v-if="!form.footerLinks.length"
                 class="py-8 text-center text-text-disabled text-sm border border-dashed border-border rounded-xl">
              هنوز لینکی اضافه نشده — دکمه بالا را بزنید
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(link, idx) in form.footerLinks"
                :key="idx"
                class="flex items-center gap-2"
              >
                <AdminInput v-model="link.label"
                  placeholder="عنوان لینک مثلاً: درباره ما"
                  class="flex-1" />
                <AdminInput v-model="link.url"
                  placeholder="/about یا https://..."
                  dir="ltr"
                  class="flex-1" />
                <button
                  @click="removeFooterLink(idx)"
                  class="w-9 h-9 flex-shrink-0 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors text-sm"
                >✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: تماس ───────────────────────────────────── -->
      <div v-show="activeTab === 'contact'" class="space-y-5">
        <div class="admin-card space-y-5">
          <h3 class="section-title">اطلاعات تماس</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput v-model="form.phone"
              label="شماره تلفن" placeholder="۰۲۱-۱۲۳۴۵۶۷۸" dir="ltr"
              hint="در فوتر سایت نمایش داده می‌شود" />
            <AdminInput v-model="form.email"
              label="ایمیل پشتیبانی" placeholder="support@storein.ir" dir="ltr" />
          </div>

          <AdminTextarea v-model="form.address"
            label="آدرس" placeholder="تهران، خیابان ..." :rows="2" />
        </div>
      </div>

      <!-- Bottom save bar (sticky) -->
      <Transition name="slide-up">
        <div v-if="dirty"
             class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-2xl px-5 py-3">
          <span class="text-sm text-text-secondary">تغییرات ذخیره نشده دارید</span>
          <AdminButton variant="ghost" @click="resetForm">بازگردانی</AdminButton>
          <AdminButton :loading="saving" @click="saveAll">ذخیره تغییرات</AdminButton>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { settingsService } from '@/services/settings.service'
import { uploadService }   from '@/services/upload.service'
import { useUiStore }      from '@/stores/ui.store'
import AdminButton   from '@/components/common/AdminButton.vue'
import AdminInput    from '@/components/common/AdminInput.vue'
import AdminTextarea from '@/components/common/AdminTextarea.vue'
import AdminSkeleton from '@/components/common/AdminSkeleton.vue'

const ui = useUiStore()

const loading = ref(false)
const saving  = ref(false)
const uploading = reactive({ logo: false, favicon: false, ogImage: false })

const fileInputLogo    = ref(null)
const fileInputFavicon = ref(null)
const fileInputOg      = ref(null)

const activeTab = ref('general')

const tabs = [
  { key: 'general', icon: '⚙️', label: 'عمومی' },
  { key: 'seo',     icon: '🔍', label: 'سئو' },
  { key: 'social',  icon: '📱', label: 'شبکه‌های اجتماعی' },
  { key: 'footer',  icon: '📄', label: 'فوتر' },
  { key: 'contact', icon: '📞', label: 'تماس' },
]

const socialPlatforms = [
  { key: 'instagram', icon: '📷', label: 'اینستاگرام', placeholder: 'https://instagram.com/storein' },
  { key: 'telegram',  icon: '✈️', label: 'تلگرام',     placeholder: 'https://t.me/storein' },
  { key: 'twitter',   icon: '🐦', label: 'توییتر / X',  placeholder: 'https://x.com/storein' },
  { key: 'whatsapp',  icon: '💬', label: 'واتساپ',      placeholder: 'https://wa.me/989...' },
  { key: 'linkedin',  icon: '💼', label: 'لینکدین',     placeholder: 'https://linkedin.com/company/storein' },
  { key: 'youtube',   icon: '▶️', label: 'یوتیوب',     placeholder: 'https://youtube.com/@storein' },
]

const emptyForm = () => ({
  siteName:        '',
  tagline:         '',
  logoUrl:         '',
  faviconUrl:      '',
  description:     '',
  keywords:        '',
  ogImage:         '',
  social: {
    instagram: '',
    telegram:  '',
    twitter:   '',
    whatsapp:  '',
    linkedin:  '',
    youtube:   '',
  },
  footerTagline:   '',
  footerCopyright: '',
  footerLinks:     [],
  phone:           '',
  email:           '',
  address:         '',
})

const form         = reactive(emptyForm())
const savedSnapshot = ref('')

const dirty = computed(() => JSON.stringify(form) !== savedSnapshot.value)

function snapshot() {
  savedSnapshot.value = JSON.stringify(form)
}

function applyData(data) {
  Object.assign(form, {
    siteName:        data.siteName        ?? '',
    tagline:         data.tagline         ?? '',
    logoUrl:         data.logoUrl         ?? '',
    faviconUrl:      data.faviconUrl      ?? '',
    description:     data.description     ?? '',
    keywords:        data.keywords        ?? '',
    ogImage:         data.ogImage         ?? '',
    social: {
      instagram: data.social?.instagram ?? '',
      telegram:  data.social?.telegram  ?? '',
      twitter:   data.social?.twitter   ?? '',
      whatsapp:  data.social?.whatsapp  ?? '',
      linkedin:  data.social?.linkedin  ?? '',
      youtube:   data.social?.youtube   ?? '',
    },
    footerTagline:   data.footerTagline   ?? '',
    footerCopyright: data.footerCopyright ?? '',
    footerLinks:     (data.footerLinks ?? []).map(l => ({ label: l.label ?? '', url: l.url ?? '' })),
    phone:           data.phone           ?? '',
    email:           data.email           ?? '',
    address:         data.address         ?? '',
  })
  snapshot()
}

function resetForm() {
  if (savedSnapshot.value) {
    applyData(JSON.parse(savedSnapshot.value))
  }
}

// ── Load ──────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    const { data } = await settingsService.get()
    applyData(data)
  } catch {
    ui.addToast('خطا در بارگذاری تنظیمات', 'error')
  } finally {
    loading.value = false
  }
})

// ── Save ──────────────────────────────────────────────────
async function saveAll() {
  saving.value = true
  try {
    const dto = {
      siteName:        form.siteName.trim(),
      tagline:         form.tagline.trim(),
      logoUrl:         form.logoUrl.trim(),
      faviconUrl:      form.faviconUrl.trim(),
      description:     form.description.trim(),
      keywords:        form.keywords.trim(),
      ogImage:         form.ogImage.trim(),
      social: { ...form.social },
      footerTagline:   form.footerTagline.trim(),
      footerCopyright: form.footerCopyright.trim(),
      footerLinks:     form.footerLinks
        .filter(l => l.label.trim() && l.url.trim())
        .map(l => ({ label: l.label.trim(), url: l.url.trim() })),
      phone:   form.phone.trim(),
      email:   form.email.trim(),
      address: form.address.trim(),
    }
    const { data } = await settingsService.update(dto)
    applyData(data)
    ui.addToast('تنظیمات ذخیره شد ✓', 'success')
  } catch (err) {
    const msg = err.response?.data?.message
    if (Array.isArray(msg)) msg.forEach(m => ui.addToast(m, 'error'))
    else ui.addToast(msg ?? 'خطا در ذخیره تنظیمات', 'error')
  } finally {
    saving.value = false
  }
}

// ── Footer links ──────────────────────────────────────────
function addFooterLink() {
  form.footerLinks.push({ label: '', url: '' })
}

function removeFooterLink(idx) {
  form.footerLinks.splice(idx, 1)
}

// ── Image upload ──────────────────────────────────────────
const uploadTargets = {
  logo:    { ref: fileInputLogo,    key: 'logoUrl',    flag: 'logo' },
  favicon: { ref: fileInputFavicon, key: 'faviconUrl', flag: 'favicon' },
  ogImage: { ref: fileInputOg,      key: 'ogImage',    flag: 'ogImage' },
}

function triggerUpload(target) {
  uploadTargets[target].ref.value?.click()
}

async function onFileChange(e, target) {
  const file = e.target.files?.[0]
  if (!file) return
  const { key, flag } = uploadTargets[target]
  uploading[flag] = true
  try {
    const { data } = await uploadService.uploadImage(file, 'logos')
    form[key] = data?.original?.url || data?.url || ''
    ui.addToast('تصویر آپلود شد ✓', 'success')
  } catch {
    ui.addToast('خطا در آپلود تصویر', 'error')
  } finally {
    uploading[flag] = false
    e.target.value = ''
  }
}
</script>

<style scoped>
.section-title {
  @apply text-base font-semibold text-text-primary border-b border-border pb-3;
}
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 1rem); }
</style>
