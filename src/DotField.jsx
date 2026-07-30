import React, { memo, useEffect, useRef } from 'react'
import './DotField.css'

const TAU = Math.PI * 2

const DotField = memo(({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  gradientFrom = 'rgba(255,255,255,.25)',
  gradientTo = 'rgba(225,37,44,.35)',
  glowColor = 'rgba(225,37,44,.16)',
  className = '',
}) => {
  const canvasRef = useRef(null)
  const glowRef = useRef(null)
  const stateRef = useRef({
    dots: [],
    mouse: { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0 },
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const dpr = coarsePointer ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    const frameInterval = 1000 / (coarsePointer ? 12 : 24)
    let frame
    let resizeTimer
    let lastFrame = 0
    let tickCount = 0
    let engagement = 0
    let isVisible = true
    let isRunning = false

    const rebuild = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      canvas.width = Math.ceil(rect.width * dpr)
      canvas.height = Math.ceil(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const step = dotRadius + dotSpacing
      const cols = Math.floor(rect.width / step)
      const rows = Math.floor(rect.height / step)
      const padX = (rect.width % step) / 2
      const padY = (rect.height % step) / 2

      stateRef.current.rect = rect
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
      gradient.addColorStop(0, gradientFrom)
      gradient.addColorStop(1, gradientTo)
      stateRef.current.gradient = gradient
      stateRef.current.dots = Array.from({ length: rows * cols }, (_, index) => {
        const column = index % cols
        const row = Math.floor(index / cols)
        const x = padX + column * step + step / 2
        const y = padY + row * step + step / 2
        return { x, y, sx: x, sy: y }
      })
    }

    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(rebuild, 100)
    }

    const onMove = (event) => {
      const rect = stateRef.current.rect
      if (!rect) return
      const mouse = stateRef.current.mouse
      mouse.x = event.clientX - rect.left
      mouse.y = event.clientY - rect.top
    }

    const updateSpeed = () => {
      const mouse = stateRef.current.mouse
      const dx = mouse.x - mouse.px
      const dy = mouse.y - mouse.py
      mouse.speed += (Math.hypot(dx, dy) - mouse.speed) * 0.35
      mouse.px = mouse.x
      mouse.py = mouse.y
    }

    const renderFrame = () => {
      tickCount += 1
      const { dots, mouse, rect, gradient } = stateRef.current
      if (!rect) return

      updateSpeed()
      engagement += (Math.min(mouse.speed / 5, 1) - engagement) * 0.06
      ctx.clearRect(0, 0, rect.width, rect.height)
      ctx.fillStyle = gradient
      ctx.beginPath()
      const cursorRadiusSquared = cursorRadius * cursorRadius

      dots.forEach((dot, index) => {
        const dx = mouse.x - dot.x
        const dy = mouse.y - dot.y
        const distanceSquared = (dx * dx) + (dy * dy)

        if (distanceSquared < cursorRadiusSquared && engagement > 0.01) {
          const distance = Math.sqrt(distanceSquared) || 1
          const amount = 1 - distance / cursorRadius
          const push = amount * amount * bulgeStrength * engagement
          dot.sx += (dot.x - ((dx / distance) * push) - dot.sx) * 0.15
          dot.sy += (dot.y - ((dy / distance) * push) - dot.sy) * 0.15
        } else {
          dot.sx += (dot.x - dot.sx) * 0.1
          dot.sy += (dot.y - dot.sy) * 0.1
        }

        const flash = sparkle
          && ((((index * 2654435761) ^ (tickCount >> 3)) >>> 0) % 100 < 3)
        const radius = dotRadius * (flash ? 0.9 : 0.5)
        ctx.moveTo(dot.sx + radius, dot.sy)
        ctx.arc(dot.sx, dot.sy, radius, 0, TAU)
      })

      ctx.fill()
      if (glowRef.current) {
        glowRef.current.setAttribute('cx', stateRef.current.mouse.x)
        glowRef.current.setAttribute('cy', stateRef.current.mouse.y)
        glowRef.current.style.opacity = engagement
      }
    }

    const draw = (now) => {
      if (!isVisible || document.hidden) {
        isRunning = false
        return
      }

      frame = requestAnimationFrame(draw)
      if (now - lastFrame < frameInterval) return
      lastFrame = now
      renderFrame()
    }

    const start = () => {
      if (reducedMotion || isRunning || !isVisible || document.hidden) return
      isRunning = true
      canvas.dataset.animating = 'true'
      frame = requestAnimationFrame(draw)
    }

    const stop = () => {
      isRunning = false
      canvas.dataset.animating = 'false'
      cancelAnimationFrame(frame)
    }

    const onVisibilityChange = () => {
      if (document.hidden) stop()
      else start()
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) start()
      else stop()
    }, { rootMargin: '120px 0px', threshold: 0 })

    const resizeObserver = new ResizeObserver(onResize)
    rebuild()
    renderFrame()
    visibilityObserver.observe(canvas.parentElement)
    resizeObserver.observe(canvas.parentElement)
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (!coarsePointer && !reducedMotion) {
      window.addEventListener('pointermove', onMove, { passive: true })
    }
    start()

    return () => {
      stop()
      clearTimeout(resizeTimer)
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pointermove', onMove)
    }
  }, [
    dotRadius,
    dotSpacing,
    cursorRadius,
    bulgeStrength,
    sparkle,
    gradientFrom,
    gradientTo,
  ])

  return (
    <div className={`dot-field-container ${className}`}>
      <canvas ref={canvasRef} />
      <svg aria-hidden="true">
        <defs>
          <radialGradient id="dot-field-glow">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill="url(#dot-field-glow)"
        />
      </svg>
    </div>
  )
})

DotField.displayName = 'DotField'

export default DotField
