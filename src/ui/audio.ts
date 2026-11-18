let ctx: AudioContext | undefined, rain: AudioBufferSourceNode | undefined
export function sound(enabled: boolean, ambient: boolean, type = 'click') {
  if (!enabled && !ambient && !ctx) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    if (enabled) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        t = ctx.currentTime
      osc.type = 'sine'
      osc.frequency.setValueAtTime(type === 'paper' ? 270 : 510, t)
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.055)
      gain.gain.setValueAtTime(0.024, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(t + 0.07)
    }
    if (ambient && !rain) {
      const n = ctx.sampleRate * 3,
        buf = ctx.createBuffer(1, n, ctx.sampleRate),
        samples = buf.getChannelData(0)
      let prev = 0
      for (let i = 0; i < n; i++) {
        prev = (prev + (Math.random() * 2 - 1) * 0.12) / 1.1
        samples[i] = prev * 0.15
      }
      rain = ctx.createBufferSource()
      rain.buffer = buf
      rain.loop = true
      rain.connect(ctx.destination)
      rain.start()
    }
    if (!ambient && rain) {
      rain.stop()
      rain.disconnect()
      rain = undefined
    }
  } catch {
    /* Audio may be unavailable in a restricted webview. */
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ctx) void ctx.suspend()
})
