<template>
  <div class="max-w-2xl">

    <!-- Header -->
    <div class="mb-6">
      <h1 class="page-title">ارسال اعلان و پیامک</h1>
      <p class="text-text-secondary text-sm mt-0.5">ارسال نوتیفیکیشن داخلی یا پیامک به کاربران</p>
    </div>

    <!-- Tabs -->
    <div class="flex rounded-xl border border-border overflow-hidden mb-6 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'px-6 py-2.5 text-sm font-medium transition-colors duration-150',
          activeTab === tab.id
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:text-text-primary',
        ]"
        @click="switchTab(tab.id)"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Success banner -->
    <div v-if="successMsg" class="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-center gap-3">
      <span class="text-green-600 text-xl">✓</span>
      <p class="text-green-700 font-medium text-sm">{{ successMsg }}</p>
    </div>

    <!-- Error banner -->
    <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
      <p class="text-error text-sm">{{ errorMsg }}</p>
    </div>

    <!-- ── TAB: نوتیفیکیشن ────────────────────────────────────── -->
    <div v-if="activeTab === 'notification'" class="admin-card p-6 space-y-5">
      <h3 class="section-title">ارسال نوتیفیکیشن داخلی</h3>

      <!-- Target -->
      <div>
        <label class="field-label">گیرنده</label>
        <div class="flex gap-3 mt-1.5">
          <button
            v-for="t in targets"
            :key="t.id"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              notifForm.target === t.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-text-secondary hover:border-primary/50',
            ]"
            @click="notifForm.target = t.id; notifForm.targetUserId = ''"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Target user ID (when specific) -->
      <AdminInput
        v-if="notifForm.target === 'specific'"
        v-model="notifForm.targetUserId"
        label="شناسه کاربر (ObjectId)"
        placeholder="مثال: 64a1f2e3b4c5d6e7f8a9b0c1"
        dir="ltr"
        :error="notifErrors.targetUserId"
      />

      <!-- Type -->
      <div>
        <label class="field-label">نوع اعلان</label>
        <select
          v-model="notifForm.type"
          class="input-field mt-1"
        >
          <option v-for="t in notifTypes" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
      </div>

      <!-- Title -->
      <AdminInput
        v-model="notifForm.title"
        label="عنوان"
        placeholder="عنوان اعلان"
        :error="notifErrors.title"
      />

      <!-- Body -->
      <div>
        <label class="field-label">متن اعلان</label>
        <textarea
          v-model="notifForm.body"
          rows="3"
          placeholder="متن کامل اعلان..."
          class="input-field mt-1 resize-none"
          :class="notifErrors.body ? 'border-error ring-2 ring-error/15' : ''"
        />
        <p v-if="notifErrors.body" class="field-error">{{ notifErrors.body }}</p>
        <p class="text-text-disabled text-xs mt-1">{{ notifForm.body.length }} / ۵۰۰</p>
      </div>

      <div class="flex items-center gap-3 pt-1">
        <AdminButton :loading="loading" @click="handleBroadcast">
          ارسال نوتیفیکیشن
        </AdminButton>
        <button
          type="button"
          class="text-text-secondary text-sm hover:text-text-primary transition-colors"
          @click="resetNotif"
        >
          پاک کردن
        </button>
      </div>
    </div>

    <!-- ── TAB: پیامک ─────────────────────────────────────────── -->
    <div v-else class="admin-card p-6 space-y-5">
      <h3 class="section-title">ارسال پیامک</h3>

      <!-- Target -->
      <div>
        <label class="field-label">گیرنده</label>
        <div class="flex gap-3 mt-1.5">
          <button
            v-for="t in targets"
            :key="t.id"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              smsForm.target === t.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-text-secondary hover:border-primary/50',
            ]"
            @click="smsForm.target = t.id; smsForm.phone = ''"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Phone (when specific) -->
      <AdminInput
        v-if="smsForm.target === 'specific'"
        v-model="smsForm.phone"
        label="شماره موبایل"
        placeholder="09xxxxxxxxx"
        type="tel"
        dir="ltr"
        :error="smsErrors.phone"
      />

      <!-- Message -->
      <div>
        <label class="field-label">متن پیامک</label>
        <textarea
          v-model="smsForm.message"
          rows="4"
          placeholder="متن پیامک..."
          class="input-field mt-1 resize-none"
          :class="smsErrors.message ? 'border-error ring-2 ring-error/15' : ''"
        />
        <p v-if="smsErrors.message" class="field-error">{{ smsErrors.message }}</p>
        <p class="text-text-disabled text-xs mt-1">{{ smsForm.message.length }} / ۵۰۰</p>
      </div>

      <!-- Broadcast warning -->
      <div v-if="smsForm.target === 'all'" class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
        <span class="text-amber-500 flex-shrink-0">⚠️</span>
        <p class="text-amber-700 text-sm">این پیامک برای <strong>همه کاربران فعال</strong> ارسال می‌شود و هزینه‌بر است.</p>
      </div>

      <div class="flex items-center gap-3 pt-1">
        <AdminButton :loading="loading" @click="handleSendSms">
          ارسال پیامک
        </AdminButton>
        <button
          type="button"
          class="text-text-secondary text-sm hover:text-text-primary transition-colors"
          @click="resetSms"
        >
          پاک کردن
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { notificationService } from '@/services/notification.service'
import { logger } from '@/utils/logger'
import AdminInput  from '@/components/common/AdminInput.vue'
import AdminButton from '@/components/common/AdminButton.vue'

const activeTab = ref('notification')
const loading   = ref(false)
const successMsg = ref('')
const errorMsg   = ref('')

const tabs = [
  { id: 'notification', icon: '🔔', label: 'نوتیفیکیشن' },
  { id: 'sms',          icon: '📱', label: 'پیامک' },
]

const targets = [
  { id: 'all',      label: 'همه کاربران' },
  { id: 'specific', label: 'کاربر مشخص' },
]

const notifTypes = [
  { value: 'system',       label: 'سیستمی' },
  { value: 'promo',        label: 'تخفیف و پروموشن' },
  { value: 'order_update', label: 'وضعیت سفارش' },
  { value: 'payment',      label: 'پرداخت' },
]

// ── Notification form ─────────────────────────────────────────
const notifForm = reactive({
  target: 'all', targetUserId: '', type: 'system', title: '', body: '',
})
const notifErrors = reactive({ targetUserId: '', title: '', body: '' })

function resetNotif() {
  notifForm.target = 'all'; notifForm.targetUserId = ''
  notifForm.type = 'system'; notifForm.title = ''; notifForm.body = ''
  notifErrors.targetUserId = ''; notifErrors.title = ''; notifErrors.body = ''
  successMsg.value = ''; errorMsg.value = ''
}

function validateNotif() {
  let ok = true
  notifErrors.targetUserId = ''; notifErrors.title = ''; notifErrors.body = ''

  if (notifForm.target === 'specific' && !notifForm.targetUserId.trim()) {
    notifErrors.targetUserId = 'شناسه کاربر الزامی است'; ok = false
  }
  if (!notifForm.title.trim()) {
    notifErrors.title = 'عنوان الزامی است'; ok = false
  }
  if (!notifForm.body.trim() || notifForm.body.length < 2) {
    notifErrors.body = 'متن اعلان الزامی است'; ok = false
  }
  return ok
}

async function handleBroadcast() {
  successMsg.value = ''; errorMsg.value = ''
  if (!validateNotif()) return

  loading.value = true
  try {
    const payload = {
      type:  notifForm.type,
      title: notifForm.title.trim(),
      body:  notifForm.body.trim(),
      ...(notifForm.target === 'specific' && { targetUserId: notifForm.targetUserId.trim() }),
    }
    const { data } = await notificationService.broadcast(payload)
    logger.info('Admin broadcast sent', { sent: data.sent, target: notifForm.target }, 'NotificationsSendView')
    successMsg.value = `نوتیفیکیشن با موفقیت برای ${data.sent} کاربر ارسال شد`
    resetNotif()
    successMsg.value = `نوتیفیکیشن با موفقیت برای ${data.sent} کاربر ارسال شد`
  } catch (e) {
    logger.error('Admin broadcast failed', e, {}, 'NotificationsSendView')
    const msg = e.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارسال اعلان')
  } finally {
    loading.value = false
  }
}

// ── SMS form ──────────────────────────────────────────────────
const smsForm   = reactive({ target: 'all', phone: '', message: '' })
const smsErrors = reactive({ phone: '', message: '' })

function resetSms() {
  smsForm.target = 'all'; smsForm.phone = ''; smsForm.message = ''
  smsErrors.phone = ''; smsErrors.message = ''
  successMsg.value = ''; errorMsg.value = ''
}

function validateSms() {
  let ok = true
  smsErrors.phone = ''; smsErrors.message = ''

  if (smsForm.target === 'specific') {
    if (!smsForm.phone.trim()) {
      smsErrors.phone = 'شماره موبایل الزامی است'; ok = false
    } else if (!/^((\+98|0)?9\d{9})$/.test(smsForm.phone.trim())) {
      smsErrors.phone = 'شماره موبایل معتبر نیست'; ok = false
    }
  }
  if (!smsForm.message.trim() || smsForm.message.length < 2) {
    smsErrors.message = 'متن پیامک الزامی است'; ok = false
  }
  return ok
}

async function handleSendSms() {
  successMsg.value = ''; errorMsg.value = ''
  if (!validateSms()) return

  loading.value = true
  try {
    const payload = {
      message: smsForm.message.trim(),
      ...(smsForm.target === 'specific' && { phone: smsForm.phone.trim() }),
    }
    const { data } = await notificationService.sendSms(payload)
    logger.info('Admin SMS sent', { sent: data.sent, failed: data.failed, target: smsForm.target }, 'NotificationsSendView')
    const msg = data.failed > 0
      ? `پیامک برای ${data.sent} نفر ارسال شد (${data.failed} شکست خورد)`
      : `پیامک با موفقیت برای ${data.sent} نفر ارسال شد`
    resetSms()
    successMsg.value = msg
  } catch (e) {
    logger.error('Admin SMS send failed', e, {}, 'NotificationsSendView')
    const msg = e.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg ?? 'خطا در ارسال پیامک')
  } finally {
    loading.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab
  successMsg.value = ''; errorMsg.value = ''
}
</script>
