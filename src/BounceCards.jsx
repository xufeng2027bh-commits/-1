import React, { useEffect, useMemo, useRef, useState } from 'react'
import './BounceCards.css'

export default function BounceCards({
  className = '',
  images = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.2,
  animationStagger = 0.08,
  easeType = 'elastic.out(1, 0.7)',
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)',
  ],
  enableHover = true,
}) {
  const containerRef = useRef(null)
  const gsapRef = useRef(null)
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 560px)').matches,
  )
  const resolvedTransforms = useMemo(() => (
    compact
      ? [
          'rotate(-7deg) translate(-72px)',
          'rotate(5deg) translate(-43px)',
          'rotate(-3deg) translate(-14px)',
          'rotate(3deg) translate(14px)',
          'rotate(-4deg) translate(43px)',
          'rotate(7deg) translate(72px)',
        ]
      : transformStyles
  ), [compact, transformStyles])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 560px)')
    const syncCompact = () => setCompact(query.matches)
    query.addEventListener?.('change', syncCompact)
    return () => query.removeEventListener?.('change', syncCompact)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !('IntersectionObserver' in window)) return undefined
    let active = true
    let ctx
    const reveal = async () => {
      try {
        const { gsap } = await import('gsap')
        if (!active) return
        gsapRef.current = gsap
        ctx = gsap.context(() => {
          gsap.fromTo(
            '.bounce-card',
            { scale: 0.92, opacity: 0.82 },
            {
              scale: 1,
              opacity: 1,
              stagger: animationStagger,
              ease: easeType,
              delay: animationDelay,
              duration: 1.15,
              clearProps: 'opacity',
            },
          )
        }, container)
      } catch {
        // The gallery stays visible if the optional animation bundle fails to load.
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      void reveal()
    }, { threshold: 0.12 })
    observer.observe(container)

    return () => {
      active = false
      observer.disconnect()
      gsapRef.current?.killTweensOf(container.querySelectorAll('.bounce-card'))
      gsapRef.current = null
      ctx?.revert()
    }
  }, [animationStagger, easeType, animationDelay])

  const getNoRotationTransform = (transformStr) => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr)
    if (hasRotate) return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)')
    if (transformStr === 'none') return 'rotate(0deg)'
    return `${transformStr} rotate(0deg)`
  }

  const getPushedTransform = (baseTransform, offsetX) => {
    const translateRegex = /translate\(([-0-9.]+)px\)/
    const match = baseTransform.match(translateRegex)
    if (match) {
      const newX = parseFloat(match[1]) + offsetX
      return baseTransform.replace(translateRegex, `translate(${newX}px)`)
    }
    return baseTransform === 'none'
      ? `translate(${offsetX}px)`
      : `${baseTransform} translate(${offsetX}px)`
  }

  const pushSiblings = (hoveredIdx) => {
    const gsap = gsapRef.current
    if (
      !gsap || !enableHover
      || !containerRef.current
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(hover: none)').matches
    ) return
    const q = gsap.utils.selector(containerRef)

    images.forEach((_, index) => {
      const target = q(`.bounce-card-${index}`)
      const baseTransform = resolvedTransforms[index] || 'none'
      gsap.killTweensOf(target)

      if (index === hoveredIdx) {
        gsap.to(target, {
          transform: getNoRotationTransform(baseTransform),
          scale: 1.08,
          zIndex: 20,
          duration: 0.65,
          ease: 'back.out(1.4)',
          overwrite: 'auto',
        })
        return
      }

      const offsetX = index < hoveredIdx ? -150 : 150
      gsap.to(target, {
        transform: getPushedTransform(baseTransform, offsetX),
        scale: 0.94,
        zIndex: index,
        duration: 0.65,
        ease: 'back.out(1.4)',
        delay: Math.abs(hoveredIdx - index) * 0.055,
        overwrite: 'auto',
      })
    })
  }

  const resetSiblings = () => {
    const gsap = gsapRef.current
    if (
      !gsap || !enableHover
      || !containerRef.current
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(hover: none)').matches
    ) return
    const q = gsap.utils.selector(containerRef)

    images.forEach((_, index) => {
      const target = q(`.bounce-card-${index}`)
      gsap.killTweensOf(target)
      gsap.to(target, {
        transform: resolvedTransforms[index] || 'none',
        scale: 1,
        zIndex: index + 1,
        duration: 0.65,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
      })
    })
  }

  return (
    <div
      className={`bounceCardsContainer ${className}`}
      ref={containerRef}
      style={{ width: containerWidth, height: containerHeight }}
      onMouseLeave={resetSiblings}
    >
      {images.map((src, index) => (
        <div
          key={src}
          className={`bounce-card bounce-card-${index}`}
          style={{
            transform: resolvedTransforms[index] ?? 'none',
            zIndex: index + 1,
          }}
          onMouseEnter={() => pushSiblings(index)}
        >
          <img
            className="bounce-card-image"
            src={src}
            alt={`视觉内容作品 ${index + 1}`}
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </div>
      ))}
    </div>
  )
}
