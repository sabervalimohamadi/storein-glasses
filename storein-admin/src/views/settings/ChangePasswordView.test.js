import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/auth.service', () => ({
  authService: { changePassword: vi.fn() },
}))

vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/services/socket.service', () => ({
  socketService: { disconnect: vi.fn() },
}))

vi.mock('@/components/common/AdminInput.vue', () => ({
  default: {
    name: 'AdminInput',
    props: ['modelValue', 'label', 'type', 'placeholder', 'dir', 'autocomplete', 'error'],
    emits: ['update:modelValue'],
    template: `<div>
      <label>{{ label }}</label>
      <input
        :value="modelValue"
        :type="type"
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
    template: `<button :disabled="loading" @click="$emit('click')">
      <slot />
    </button>`,
  },
}))

import ChangePasswordView from './ChangePasswordView.vue'
import { authService } from '@/services/auth.service'
import { logger } from '@/utils/logger'
import { useAuthStore } from '@/stores/auth.store'

function mountView(isAdmin = true) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(ChangePasswordView, { global: { plugins: [pinia] } })
  const store = useAuthStore()
  store.user  = { _id: 'u1', isAdmin, role: isAdmin ? 'admin' : 'manager' }
  store.token = 'tok'
  return { wrapper, store }
}

describe('ChangePasswordView', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('access control', () => {
    it('shows the form when user isAdmin', async () => {
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.admin-card').exists()).toBe(true)
      expect(wrapper.find('.text-error').exists()).toBe(false)
    })

    it('shows access denied when user is not admin', async () => {
      const { wrapper } = mountView(false)
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('دسترسی غیرمجاز')
    })
  })

  describe('validation', () => {
    it('shows error when currentPassword is too short', async () => {
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword  = 'abc'
      wrapper.vm.form.newPassword      = 'NewPass#1'
      wrapper.vm.form.confirmPassword  = 'NewPass#1'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.errors.currentPassword).toBeTruthy()
      expect(authService.changePassword).not.toHaveBeenCalled()
    })

    it('shows error when newPassword is less than 8 chars', async () => {
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'correct'
      wrapper.vm.form.newPassword     = 'short'
      wrapper.vm.form.confirmPassword = 'short'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.errors.newPassword).toBeTruthy()
      expect(authService.changePassword).not.toHaveBeenCalled()
    })

    it('shows error when new password equals current', async () => {
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'SamePass#1'
      wrapper.vm.form.newPassword     = 'SamePass#1'
      wrapper.vm.form.confirmPassword = 'SamePass#1'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.errors.newPassword).toContain('یکسان')
      expect(authService.changePassword).not.toHaveBeenCalled()
    })

    it('shows error when confirm password does not match', async () => {
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'OldPass#1'
      wrapper.vm.form.newPassword     = 'NewPass#2'
      wrapper.vm.form.confirmPassword = 'Different#3'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.errors.confirmPassword).toBeTruthy()
      expect(authService.changePassword).not.toHaveBeenCalled()
    })
  })

  describe('submit', () => {
    it('calls authService.changePassword with correct args on valid form', async () => {
      authService.changePassword.mockResolvedValue({ data: { message: 'ok' } })
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'OldPass#1'
      wrapper.vm.form.newPassword     = 'NewPass#2'
      wrapper.vm.form.confirmPassword = 'NewPass#2'
      await wrapper.vm.handleSubmit()
      expect(authService.changePassword).toHaveBeenCalledWith('OldPass#1', 'NewPass#2')
    })

    it('shows success message and clears form on success', async () => {
      authService.changePassword.mockResolvedValue({ data: { message: 'ok' } })
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'OldPass#1'
      wrapper.vm.form.newPassword     = 'NewPass#2'
      wrapper.vm.form.confirmPassword = 'NewPass#2'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.successMsg).toBeTruthy()
      expect(wrapper.vm.form.currentPassword).toBe('')
      expect(wrapper.vm.form.newPassword).toBe('')
      expect(logger.info).toHaveBeenCalled()
    })

    it('shows error message and logs on API failure', async () => {
      const err = Object.assign(new Error('401'), {
        response: { data: { message: 'رمز عبور فعلی اشتباه است' } },
      })
      authService.changePassword.mockRejectedValue(err)
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'WrongPass#1'
      wrapper.vm.form.newPassword     = 'NewPass#2'
      wrapper.vm.form.confirmPassword = 'NewPass#2'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.errorMsg).toContain('رمز عبور فعلی اشتباه است')
      expect(logger.error).toHaveBeenCalled()
    })

    it('resets loading to false on error', async () => {
      authService.changePassword.mockRejectedValue(new Error('network'))
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword = 'OldPass#1'
      wrapper.vm.form.newPassword     = 'NewPass#2'
      wrapper.vm.form.confirmPassword = 'NewPass#2'
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('resetForm', () => {
    it('clears all fields and messages', async () => {
      const { wrapper } = mountView(true)
      await wrapper.vm.$nextTick()
      wrapper.vm.form.currentPassword  = 'abc'
      wrapper.vm.errorMsg              = 'خطا'
      wrapper.vm.successMsg            = 'موفق'
      wrapper.vm.resetForm()
      expect(wrapper.vm.form.currentPassword).toBe('')
      expect(wrapper.vm.errorMsg).toBe('')
      expect(wrapper.vm.successMsg).toBe('')
    })
  })
})
