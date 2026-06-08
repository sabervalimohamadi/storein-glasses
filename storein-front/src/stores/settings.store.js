import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsService } from '@/services/settings.service'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(null)
  const loading  = ref(false)
  let   fetched  = false

  const siteName        = computed(() => settings.value?.siteName        ?? 'استورین')
  const tagline         = computed(() => settings.value?.tagline         ?? 'فروشگاه تخصصی عینک‌های طبی و آفتابی')
  const description     = computed(() => settings.value?.description     ?? '')
  const keywords        = computed(() => settings.value?.keywords        ?? '')
  const logoUrl         = computed(() => settings.value?.logoUrl         ?? '')
  const faviconUrl      = computed(() => settings.value?.faviconUrl      ?? '')
  const ogImage         = computed(() => settings.value?.ogImage         ?? '')
  const social          = computed(() => settings.value?.social          ?? {})
  const phone           = computed(() => settings.value?.phone           ?? '')
  const email           = computed(() => settings.value?.email           ?? '')
  const address         = computed(() => settings.value?.address         ?? '')
  const footerTagline   = computed(() => settings.value?.footerTagline   ?? '')
  const footerCopyright = computed(() => settings.value?.footerCopyright ?? 'تمامی حقوق برای استورین محفوظ است')
  const footerLinks     = computed(() => settings.value?.footerLinks     ?? [])

  async function fetchSettings() {
    if (fetched) return
    fetched   = true
    loading.value = true
    try {
      const { data } = await settingsService.getSettings()
      settings.value = data
    } catch {
      // silently use defaults — site must work even if API is down
    } finally {
      loading.value = false
    }
  }

  return {
    settings, loading,
    siteName, tagline, description, keywords,
    logoUrl, faviconUrl, ogImage, social,
    phone, email, address,
    footerTagline, footerCopyright, footerLinks,
    fetchSettings,
  }
})
