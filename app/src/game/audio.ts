type SoundName = 'click' | 'switch' | 'absorb' | 'complete' | 'card'
class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private ambientTimer = 0
  private volume = 0.45
  private muted = false
  async start() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.context = new AudioContextClass()
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume * 0.55
      this.master.connect(this.context.destination)
      this.createAmbience()
    }
    if (this.context.state === 'suspended') await this.context.resume()
  }
  private createAmbience() {
    if (!this.context || !this.master) return
    const ctx = this.context
    const length = ctx.sampleRate * 4
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let previous = 0
    for (let i = 0; i < length; i += 1) { const white = Math.random() * 2 - 1; previous = previous * 0.985 + white * 0.015; data[i] = previous * 2.4 }
    const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 540
    const gain = ctx.createGain(); gain.gain.value = 0.18
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start()
    for (const [frequency, level] of [[110, 0.018], [164.81, 0.012]] as const) {
      const oscillator = ctx.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency
      const droneGain = ctx.createGain(); droneGain.gain.value = level
      oscillator.connect(droneGain); droneGain.connect(this.master); oscillator.start()
    }
    this.ambientTimer = window.setInterval(() => this.pluck(), 4600)
  }
  private pluck() {
    if (!this.context || !this.master || this.muted) return
    const notes = [220, 246.94, 293.66, 329.63, 392, 440]
    const frequency = notes[Math.floor(Math.random() * notes.length)]
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency * 2
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.028, now + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6)
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(now); oscillator.stop(now + 2.7)
  }
  play(name: SoundName) {
    if (!this.context || !this.master || this.muted) return
    const sequences: Record<SoundName, number[]> = { click: [330], switch: [196, 293.66, 440], absorb: [392, 587.33], complete: [261.63, 329.63, 392, 523.25], card: [440, 659.25, 880] }
    const now = this.context.currentTime
    sequences[name].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator(); oscillator.type = name === 'switch' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency
      const gain = this.context!.createGain(); const start = now + index * 0.09
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.075, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65)
      oscillator.connect(gain); gain.connect(this.master!); oscillator.start(start); oscillator.stop(start + 0.7)
    })
  }
  setVolume(value: number) { this.volume = value; if (this.master && this.context) this.master.gain.setTargetAtTime(this.muted ? 0 : value * 0.55, this.context.currentTime, 0.05) }
  setMuted(value: boolean) { this.muted = value; if (this.master && this.context) this.master.gain.setTargetAtTime(value ? 0 : this.volume * 0.55, this.context.currentTime, 0.05) }
  get isMuted() { return this.muted }
  get currentVolume() { return this.volume }
  get ambientInterval() { return this.ambientTimer }
}
export const audio = new AudioEngine()
