import React, { useEffect, useRef } from 'react'

const stats = [
  { value: 1, unit: '亿+', label: '直播大促累计 GMV', precision: 1 },
  { value: 400, unit: '%', label: 'AI 项目目标完成率' },
  { value: 83, unit: '%', label: '评论整理耗时降幅（约）' },
]

export default function ProfileStats() {
  const statsRef = useRef(null)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches || !('IntersectionObserver' in window)) return

    const counters = [...statsRef.current.querySelectorAll('.stat-count')]
    const frames = new Set()
    const observer = new IntersectionObserver((entries) => {
      if (motion.matches) return

      for (const entry of entries) {
        if (entry.intersectionRatio < 0.45) continue
        const counter = entry.target
        const { value, precision = 0 } = stats[counters.indexOf(counter)]
        observer.unobserve(counter)
        counter.textContent = '0'
        let start
        let frame

        const tick = (now) => {
          frames.delete(frame)
          start ??= now
          const progress = motion.matches ? 1 : Math.min((now - start) / 1650, 1)
          if (progress === 1) {
            counter.textContent = String(value)
            return
          }

          const eased = 1 - (1 - progress) ** 2
          const multiplier = 10 ** precision
          const current = Math.floor(value * eased * multiplier) / multiplier
          counter.textContent = current.toFixed(precision)
          frame = requestAnimationFrame(tick)
          frames.add(frame)
        }

        frame = requestAnimationFrame(tick)
        frames.add(frame)
      }
    }, { threshold: 0.45 })

    counters.forEach((counter) => observer.observe(counter))
    return () => {
      observer.disconnect()
      frames.forEach((frame) => cancelAnimationFrame(frame))
      counters.forEach((counter, index) => { counter.textContent = String(stats[index].value) })
    }
  }, [])

  return (
    <div className="stats" ref={statsRef}>
      {stats.map(({ value, unit, label }) => (
        <div key={label}>
          <strong>
            <span className="stat-accessible">{value}{unit}</span>
            <b className="stat-count" aria-hidden="true">{value}</b>
            <span aria-hidden="true">{unit}</span>
          </strong>
          <small>{label}</small>
        </div>
      ))}
    </div>
  )
}
