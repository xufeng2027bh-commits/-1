import React, { useCallback, useEffect, useRef } from 'react'

export default function ClickSpark({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1,
  className = '',
  children,
}) {
  const canvasRef = useRef(null)
  const sparksRef = useRef([])
  const animationRef = useRef(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return undefined

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches
    }
    syncMotionPreference()
    motionQuery.addEventListener?.('change', syncMotionPreference)

    let resizeTimeout
    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width, height }
    }
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }

    let resizeObserver
    const activateCanvas = () => {
      if (resizeObserver) return
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(parent)
      resizeCanvas()
    }

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activateCanvas()
          visibilityObserver.disconnect()
        }
      },
      { rootMargin: '320px 0px', threshold: 0 },
    )

    visibilityObserver.observe(parent)

    return () => {
      visibilityObserver.disconnect()
      resizeObserver?.disconnect()
      clearTimeout(resizeTimeout)
      motionQuery.removeEventListener?.('change', syncMotionPreference)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const ease = useCallback((value) => {
    switch (easing) {
      case 'linear':
        return value
      case 'ease-in':
        return value * value
      case 'ease-in-out':
        return value < 0.5
          ? 2 * value * value
          : -1 + (4 - 2 * value) * value
      default:
        return value * (2 - value)
    }
  }, [easing])

  const drawFrame = useCallback((timestamp) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    const { width, height } = sizeRef.current
    context.clearRect(0, 0, width, height)

    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = timestamp - spark.startTime
      if (elapsed >= duration) return false

      const progress = elapsed / duration
      const eased = ease(progress)
      const distance = eased * sparkRadius * extraScale
      const lineLength = sparkSize * (1 - eased)
      const cos = Math.cos(spark.angle)
      const sin = Math.sin(spark.angle)

      context.strokeStyle = sparkColor
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(
        spark.x + distance * cos,
        spark.y + distance * sin,
      )
      context.lineTo(
        spark.x + (distance + lineLength) * cos,
        spark.y + (distance + lineLength) * sin,
      )
      context.stroke()
      return true
    })

    if (sparksRef.current.length) {
      animationRef.current = requestAnimationFrame(drawFrame)
    } else {
      animationRef.current = null
    }
  }, [duration, ease, extraScale, sparkColor, sparkRadius, sparkSize])

  const handlePointerDown = useCallback((event) => {
    if (reducedMotionRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const now = performance.now()
    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, index) => ({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        angle: (Math.PI * 2 * index) / sparkCount,
        startTime: now,
      })),
    )

    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(drawFrame)
    }
  }, [drawFrame, sparkCount])

  return (
    <div
      className={`click-spark ${className}`}
      onPointerDown={handlePointerDown}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      {children}
    </div>
  )
}
