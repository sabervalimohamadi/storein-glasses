import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/notification.service', () => ({
  notificationService: {
    broadcast: vi.fn(),
    sendSms:   vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/components/common/AdminInput.vue', () => ({
  default: {
    name: 'AdminInput',
    props: ['modelValue', 'label', 'type', 'placeholder', 'dir', 'error'],
    emits: ['update:modelValue'],
    template: `<div>
      <label>{{ label }}</label>
      <input
        :value="modelValue"
        :type="type || 'text'"
        :data-testid="label"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span v-if="error" class="error">{{ error }}</span>
    </div>`,
  },
}))

vi.mock('@/components/common/AdminButton.vue', () => ({
  default: {
    name: 'AdminButton',
    props: ['loading'],
    emits: ['click'],
    template: `<button :disabled="loading" @click="$emit('click')"><slot /></button>`,
  },
}))

import NotificationsSendView from './NotificationsSendView.vue'
import { notificationService } from '@/services/notification.service'
import { logger } from '@/utils/logger'

function mountView() {
  return mount(NotificationsSendView)
}

describe('NotificationsSendView', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── tab switching ─────────────────────────────────────────────
  describe('tab switching', () => {
    it('starts on notification tab', () => {
      const w = mountView()
      expect(w.vm.activeTab).toBe('notification')
    })

    it('switches to SMS tab on click', async () => {
      const w = mountView()
      await w.vm.switchTab('sms')
      expect(w.vm.activeTab).toBe('sms')
    })

    it('clears messages when switching tabs', async () => {
      const w = mountView()
      w.vm.successMsg = 'موفق'
      w.vm.errorMsg   = 'خطا'
      await w.vm.switchTab('sms')
      expect(w.vm.successMsg).toBe('')
      expect(w.vm.errorMsg).toBe('')
    })
  })

  // ── notification validation ───────────────────────────────────
  describe('notification — validation', () => {
    it('requires title', async () => {
      const w = mountView()
      w.vm.notifForm.body = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notifErrors.title).toBeTruthy()
      expect(notificationService.broadcast).not.toHaveBeenCalled()
    })

    it('requires body', async () => {
      const w = mountView()
      w.vm.notifForm.title = 'عنوان'
      await w.vm.handleBroadcast()
      expect(w.vm.notifErrors.body).toBeTruthy()
      expect(notificationService.broadcast).not.toHaveBeenCalled()
    })

    it('requires targetUserId when target is specific', async () => {
      const w = mountView()
      w.vm.notifForm.target = 'specific'
      w.vm.notifForm.title  = 'عنوان'
      w.vm.notifForm.body   = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.notifErrors.targetUserId).toBeTruthy()
      expect(notificationService.broadcast).not.toHaveBeenCalled()
    })

    it('passes when all fields are valid for all-users broadcast', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 5 } })
      const w = mountView()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن اعلان'
      await w.vm.handleBroadcast()
      expect(notificationService.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'عنوان', body: 'متن اعلان' }),
      )
    })
  })

  // ── notification submit ───────────────────────────────────────
  describe('notification — submit', () => {
    it('sends broadcast to all users without targetUserId', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 10 } })
      const w = mountView()
      w.vm.notifForm.title = 'تخفیف'
      w.vm.notifForm.body  = 'پیام ویژه'
      w.vm.notifForm.type  = 'promo'
      await w.vm.handleBroadcast()
      const call = notificationService.broadcast.mock.calls[0][0]
      expect(call).not.toHaveProperty('targetUserId')
      expect(call.type).toBe('promo')
    })

    it('sends broadcast with targetUserId when target is specific', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 1 } })
      const w = mountView()
      w.vm.notifForm.target       = 'specific'
      w.vm.notifForm.targetUserId = '64a1f2e3b4c5d6e7f8a9b0c1'
      w.vm.notifForm.title        = 'اعلان'
      w.vm.notifForm.body         = 'متن'
      await w.vm.handleBroadcast()
      expect(notificationService.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ targetUserId: '64a1f2e3b4c5d6e7f8a9b0c1' }),
      )
    })

    it('shows success and logs on success', async () => {
      notificationService.broadcast.mockResolvedValue({ data: { sent: 3 } })
      const w = mountView()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.successMsg).toContain('3')
      expect(logger.info).toHaveBeenCalled()
    })

    it('shows error message and logs on failure', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'خطای سرور' } } })
      notificationService.broadcast.mockRejectedValue(err)
      const w = mountView()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.errorMsg).toContain('خطای سرور')
      expect(logger.error).toHaveBeenCalled()
    })

    it('resets loading to false on error', async () => {
      notificationService.broadcast.mockRejectedValue(new Error('network'))
      const w = mountView()
      w.vm.notifForm.title = 'عنوان'
      w.vm.notifForm.body  = 'متن'
      await w.vm.handleBroadcast()
      expect(w.vm.loading).toBe(false)
    })
  })

  // ── sms validation ────────────────────────────────────────────
  describe('sms — validation', () => {
    it('requires message', async () => {
      const w = mountView()
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.message).toBeTruthy()
      expect(notificationService.sendSms).not.toHaveBeenCalled()
    })

    it('requires phone when target is specific', async () => {
      const w = mountView()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.message = 'پیامک آزمایشی'
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.phone).toBeTruthy()
      expect(notificationService.sendSms).not.toHaveBeenCalled()
    })

    it('rejects invalid phone format', async () => {
      const w = mountView()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.phone   = '123'
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.phone).toContain('معتبر نیست')
      expect(notificationService.sendSms).not.toHaveBeenCalled()
    })

    it('accepts valid phone 09xxxxxxxxx', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 1, failed: 0 } })
      const w = mountView()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.phone   = '09121234567'
      w.vm.smsForm.message = 'پیامک آزمایشی'
      await w.vm.handleSendSms()
      expect(w.vm.smsErrors.phone).toBe('')
      expect(notificationService.sendSms).toHaveBeenCalled()
    })
  })

  // ── sms submit ────────────────────────────────────────────────
  describe('sms — submit', () => {
    it('sends sms to all when target is all (no phone in payload)', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 20, failed: 0 } })
      const w = mountView()
      w.vm.smsForm.message = 'پیامک انبوه'
      await w.vm.handleSendSms()
      const call = notificationService.sendSms.mock.calls[0][0]
      expect(call).not.toHaveProperty('phone')
      expect(call.message).toBe('پیامک انبوه')
    })

    it('sends sms with phone when target is specific', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 1, failed: 0 } })
      const w = mountView()
      w.vm.smsForm.target  = 'specific'
      w.vm.smsForm.phone   = '09121234567'
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(notificationService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '09121234567' }),
      )
    })

    it('shows success message with sent count', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 7, failed: 0 } })
      const w = mountView()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.successMsg).toContain('7')
      expect(logger.info).toHaveBeenCalled()
    })

    it('shows failed count in success message when some failed', async () => {
      notificationService.sendSms.mockResolvedValue({ data: { sent: 8, failed: 2 } })
      const w = mountView()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.successMsg).toContain('2')
    })

    it('shows error and logs on API failure', async () => {
      const err = Object.assign(new Error(), { response: { data: { message: 'اعتبار ناکافی' } } })
      notificationService.sendSms.mockRejectedValue(err)
      const w = mountView()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.errorMsg).toContain('اعتبار ناکافی')
      expect(logger.error).toHaveBeenCalled()
    })

    it('resets loading to false on error', async () => {
      notificationService.sendSms.mockRejectedValue(new Error('network'))
      const w = mountView()
      w.vm.smsForm.message = 'پیامک'
      await w.vm.handleSendSms()
      expect(w.vm.loading).toBe(false)
    })
  })

  // ── reset ─────────────────────────────────────────────────────
  describe('reset', () => {
    it('resetNotif clears all notification form fields', () => {
      const w = mountView()
      w.vm.notifForm.title  = 'عنوان'
      w.vm.notifForm.body   = 'متن'
      w.vm.successMsg       = 'موفق'
      w.vm.resetNotif()
      expect(w.vm.notifForm.title).toBe('')
      expect(w.vm.notifForm.body).toBe('')
      expect(w.vm.successMsg).toBe('')
    })

    it('resetSms clears all sms form fields', () => {
      const w = mountView()
      w.vm.smsForm.message = 'پیامک'
      w.vm.smsForm.phone   = '09121234567'
      w.vm.errorMsg        = 'خطا'
      w.vm.resetSms()
      expect(w.vm.smsForm.message).toBe('')
      expect(w.vm.smsForm.phone).toBe('')
      expect(w.vm.errorMsg).toBe('')
    })
  })
})
