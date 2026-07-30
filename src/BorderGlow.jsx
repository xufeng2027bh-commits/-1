import React, { useCallback, useEffect, useRef } from 'react'
import './BorderGlow.css'

function parseHSL(value) {
  const match = value.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 0, s: 78, l: 52 }
  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  }
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']

  return Object.fromEntries(opacities.map((opacity, index) => [
    `--glow-color${keys[index]}`,
    `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`,
  ]))
}

const gradientPositions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const gradientKeys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven']
const colorMap = [0, 1, 2, 0, 1, 2, 1]

function buildGradientVars(colors) {
  const palette = colors.length ? colors : ['#e1252c']
  const variables = {}

  gradientKeys.forEach((key, index) => {
    const color = palette[Math.min(colorMap[index], palette.length - 1)]
    variables[key] = `radial-gradient(at ${gradientPositions[index]}, ${color} 0px, transparent 50%)`
  })

  variables['--gradient-base'] = `linear-gradient(${palette[0]} 0 100%)`
  return variables
}

const easeOutCubic = (value) => 1 - ((1 - value) ** 3)
const easeInCubic = (value) => value ** 3

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}) {
  let frame
  let timeout
  let cancelled = false

  timeout = window.setTimeout(() => {
    const startedAt = performance.now()
    const tick = (now) => {
      if (cancelled) return
      const progress = Math.min((now - startedAt) / duration, 1)
      onUpdate(start + ((end - start) * ease(progress)))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else onEnd?.()
    }
    frame = requestAnimationFrame(tick)
  }, delay)

  return () => {
    cancelled = true
    window.clearTimeout(timeout)
    if (frame) cancelAnimationFrame(frame)
  }
}

export default function BorderGlow({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '0 78 52',
  backgroundColor = '#101010',
  borderRadius = 0,
  glowRadius = 34,
  glowIntensity = 0.8,
  coneSpread = 20,
  animated = false,
  colors = ['#e1252c', '#ff6b70', '#f2f1ed'],
  fillOpacity = 0.16,
}) {
  const cardRef = useRef(null)
  const rectRef = useRef(null)
  const pointerRef = useRef(null)
  const pointerFrameRef = useRef(null)

  const updatePointerGlow = useCallback(() => {
    const card = cardRef.current
    const rect = rectRef.current
    const pointer = pointerRef.current
    pointerFrameRef.current = null
    if (!card || !rect || !pointer) return

    const x = pointer.x - rect.left
    const y = pointer.y - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const dx = x - centerX
    const dy = y - centerY
    const kx = dx === 0 ? Number.POSITIVE_INFINITY : centerX / Math.abs(dx)
    const ky = dy === 0 ? Number.POSITIVE_INFINITY : centerY / Math.abs(dy)
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
    let angle = (Math.atan2(dy, dx) * (180 / Math.PI)) + 90
    if (angle < 0) angle += 360

    card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3))
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
  }, [])

  const handlePointerEnter = useCallback(() => {
    rectRef.current = cardRef.current?.getBoundingClientRect() || null
  }, [])

  const handlePointerMove = useCallback((event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY }
    if (!rectRef.current) {
      rectRef.current = cardRef.current?.getBoundingClientRect() || null
    }
    if (!pointerFrameRef.current) {
      pointerFrameRef.current = requestAnimationFrame(updatePointerGlow)
    }
  }, [updatePointerGlow])

  useEffect(() => () => {
    if (pointerFrameRef.current) cancelAnimationFrame(pointerFrameRef.current)
  }, [])

  useEffect(() => {
    const card = cardRef.current
    if (!animated || !card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    let cancelAnimations = []
    let hasPlayed = false

    const playSweep = () => {
      if (hasPlayed) return
      hasPlayed = true
      card.classList.add('sweep-active')
      card.style.setProperty('--cursor-angle', '110deg')

      cancelAnimations = [
        animateValue({
          duration: 650,
          onUpdate: (value) => card.style.setProperty('--edge-proximity', value),
        }),
        animateValue({
          ease: easeInCubic,
          duration: 1800,
          end: 50,
          onUpdate: (value) => card.style.setProperty('--cursor-angle', `${(355 * (value / 100)) + 110}deg`),
        }),
        animateValue({
          ease: easeOutCubic,
          delay: 1800,
          duration: 2500,
          start: 50,
          end: 100,
          onUpdate: (value) => card.style.setProperty('--cursor-angle', `${(355 * (value / 100)) + 110}deg`),
        }),
        animateValue({
          ease: easeInCubic,
          delay: 3000,
          duration: 1700,
          start: 100,
          end: 0,
          onUpdate: (value) => card.style.setProperty('--edge-proximity', value),
          onEnd: () => card.classList.remove('sweep-active'),
        }),
      ]
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        playSweep()
        observer.disconnect()
      }
    }, { threshold: 0.28 })

    observer.observe(card)

    return () => {
      observer.disconnect()
      cancelAnimations.forEach((cancel) => cancel())
      card.classList.remove('sweep-active')
    }
  }, [animated])

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--edge-sensitivity': edgeSensitivity,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--cone-spread': coneSpread,
        '--fill-opacity': fillOpacity,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      }}
    >
      <span className="edge-light" aria-hidden="true" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}
