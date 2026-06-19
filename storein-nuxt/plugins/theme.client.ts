// Client-only: applies saved dark/light preference before first paint (no FOUC)
export default defineNuxtPlugin(() => {
  const { init } = useTheme()
  init()
})
