import { defineStore } from 'pinia'
import { ref } from 'vue'
import { frameAttributeService } from '~/services/frame-attribute.service'
import { logger } from '~/utils/logger'

const CTX = 'FrameAttributeStore'

export const useFrameAttributeStore = defineStore('frameAttribute', () => {
  const frameShapes    = ref([])
  const frameMaterials = ref([])
  const loading        = ref(false)
  const loaded         = ref(false)

  async function fetch() {
    if (loaded.value) return
    loading.value = true
    try {
      const [shapesRes, materialsRes] = await Promise.all([
        frameAttributeService.getActive('frameShape'),
        frameAttributeService.getActive('frameMaterial'),
      ])
      frameShapes.value    = Array.isArray(shapesRes.data)    ? shapesRes.data    : []
      frameMaterials.value = Array.isArray(materialsRes.data) ? materialsRes.data : []
      loaded.value = true
      logger.debug(
        'Frame attributes loaded',
        { shapes: frameShapes.value.length, materials: frameMaterials.value.length },
        CTX,
      )
    } catch (err) {
      logger.error('Failed to load frame attributes', err, CTX)
    } finally {
      loading.value = false
    }
  }

  return { frameShapes, frameMaterials, loading, loaded, fetch }
})
