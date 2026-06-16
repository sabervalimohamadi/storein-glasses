import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { logger } from '@/utils/logger'
import OtpInput from './OtpInput.vue'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper(props = {}) {
  return mount(OtpInput, {
    props: { modelValue: '', length: 6, ...props },
    attachTo: document.body,
  })
}

function cell(w, index) {
  return w.find(`[data-testid="otp-cell-${index}"]`)
}

async function typeInto(w, index, char) {
  const el = cell(w, index)
  await el.setValue(char)
  await el.trigger('input', { target: { value: char } })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OtpInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Layout ────────────────────────────────────────────────────────────────

  describe('layout', () => {
    it('renders exactly `length` input cells', () => {
      const w = makeWrapper({ length: 6 })
      expect(w.findAll('[data-testid^="otp-cell-"]')).toHaveLength(6)
    })

    it('uses CSS grid so boxes cannot overflow', () => {
      const w = makeWrapper({ length: 6 })
      const grid = w.find('[data-testid="otp-grid"]')
      expect(grid.attributes('style')).toContain('grid-template-columns')
    })

    it('each cell has w-full so it fills its grid column', () => {
      const w = makeWrapper({ length: 6 })
      expect(cell(w, 0).classes()).toContain('w-full')
    })
  })

  // ── Input behaviour ───────────────────────────────────────────────────────

  describe('input behaviour', () => {
    it('only accepts numeric characters', async () => {
      const w = makeWrapper()
      const input = cell(w, 0).element
      const event = new Event('input', { bubbles: true })
      input.value = 'a'
      input.dispatchEvent(event)
      await nextTick()
      expect(w.emitted('update:modelValue')).toBeTruthy()
      // 'a' → stripped → empty string
      const emitted = w.emitted('update:modelValue')
      const last = emitted[emitted.length - 1][0]
      expect(last).toBe('')
    })

    it('emits update:modelValue with joined digits', async () => {
      const w = makeWrapper()
      const input = cell(w, 0).element
      const event = new Event('input', { bubbles: true })
      input.value = '5'
      input.dispatchEvent(event)
      await nextTick()
      const emitted = w.emitted('update:modelValue')
      const last = emitted[emitted.length - 1][0]
      expect(last).toBe('5')
    })

    it('emits complete when all cells are filled', async () => {
      const w = makeWrapper({ length: 3 })
      for (let i = 0; i < 3; i++) {
        const input = cell(w, i).element
        input.value = String(i + 1)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()
      }
      expect(w.emitted('complete')).toBeTruthy()
      expect(w.emitted('complete')[0][0]).toBe('123')
    })

    it('does not emit complete when only partial digits are filled', async () => {
      const w = makeWrapper({ length: 4 })
      const input = cell(w, 0).element
      input.value = '9'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      expect(w.emitted('complete')).toBeFalsy()
    })
  })

  // ── Keyboard navigation ───────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('Backspace on empty cell moves focus to previous cell', async () => {
      const w = makeWrapper()
      const prev = cell(w, 0).element
      const focusSpy = vi.spyOn(prev, 'focus')
      await cell(w, 1).trigger('keydown', { key: 'Backspace' })
      await nextTick()
      expect(focusSpy).toHaveBeenCalled()
    })

    it('Backspace on filled cell clears it without moving focus', async () => {
      const w = makeWrapper()
      // Fill cell 1
      cell(w, 1).element.value = '7'
      cell(w, 1).element.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      const curr = cell(w, 1).element
      const focusSpy = vi.spyOn(curr, 'focus')
      await cell(w, 1).trigger('keydown', { key: 'Backspace' })
      await nextTick()
      expect(focusSpy).not.toHaveBeenCalled()
    })
  })

  // ── Paste ─────────────────────────────────────────────────────────────────

  describe('paste', () => {
    it('fills all cells from pasted text', async () => {
      const w = makeWrapper({ length: 6 })
      const clipboardData = { getData: () => '123456' }
      await cell(w, 0).trigger('paste', { clipboardData, preventDefault: vi.fn() })
      await nextTick()
      const emitted = w.emitted('update:modelValue')
      const last = emitted[emitted.length - 1][0]
      expect(last).toBe('123456')
    })

    it('strips non-numeric characters from paste', async () => {
      const w = makeWrapper({ length: 4 })
      const clipboardData = { getData: () => 'ab1234' }
      await cell(w, 0).trigger('paste', { clipboardData, preventDefault: vi.fn() })
      await nextTick()
      const emitted = w.emitted('update:modelValue')
      const last = emitted[emitted.length - 1][0]
      expect(last).toBe('1234')
    })

    it('logs debug on paste', async () => {
      const w = makeWrapper({ length: 6 })
      const clipboardData = { getData: () => '123456' }
      await cell(w, 0).trigger('paste', { clipboardData, preventDefault: vi.fn() })
      await nextTick()
      expect(logger.debug).toHaveBeenCalledWith(
        'OTP input: pasted digits', { count: 6 }, 'OtpInput',
      )
    })
  })

  // ── Reset ─────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all cells when modelValue resets to empty string', async () => {
      const w = makeWrapper({ length: 3 })
      // fill cells via input events (digits internal state changes, prop stays '')
      for (let i = 0; i < 3; i++) {
        cell(w, i).element.value = String(i + 1)
        cell(w, i).element.dispatchEvent(new Event('input', { bubbles: true }))
      }
      await nextTick()
      expect(cell(w, 0).element.value).toBe('1')

      // The watcher only fires when the prop VALUE changes. Since prop starts at '' and
      // our input events only emit but don't change the prop, we must first set the prop
      // to a non-empty value (simulating the parent binding catching up) then reset it.
      await w.setProps({ modelValue: '123' })
      await w.setProps({ modelValue: '' })
      await nextTick()
      for (let i = 0; i < 3; i++) {
        expect(cell(w, i).element.value).toBe('')
      }
    })

    it('logs debug on parent reset', async () => {
      const w = makeWrapper()
      // trigger a real prop change: non-empty → empty so the watcher fires
      await w.setProps({ modelValue: '654321' })
      await w.setProps({ modelValue: '' })
      await nextTick()
      expect(logger.debug).toHaveBeenCalledWith(
        'OTP input: cleared by parent', {}, 'OtpInput',
      )
    })
  })

  // ── Error state ───────────────────────────────────────────────────────────

  describe('error state', () => {
    it('applies error class when error prop is true', () => {
      const w = makeWrapper({ error: true })
      expect(cell(w, 0).classes()).toContain('border-error')
    })

    it('does not apply error class when error prop is false', () => {
      const w = makeWrapper({ error: false })
      expect(cell(w, 0).classes()).not.toContain('border-error')
    })
  })
})
