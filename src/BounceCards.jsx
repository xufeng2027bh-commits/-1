import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let hasAnimated = false
    let observer
    const ctx = gsap.context(() => {
      const reveal = () => {
        if (hasAnimated) return
        hasAnimated = true
        if (reducedMotion) {
          gsap.set('.bounce-card', { opacity: 1 })
          return
        }
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
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            reveal()
            observer.disconnect()
          }
        },
        { threshold: 0.18 },
      )

      observer.observe(container)
    }, containerRef)

    return () => {
      observer?.disconnect()
      ctx.revert()
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
    if (
      !enableHover
      || !containerRef.current
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(hover: none)').matches
    ) return
    const q = gsap.utils.selector(containerRef)

    images.forEach((_, index) => {
      const target = q(`.bounce-card-${index}`)
      const baseTransform = transformStyles[index] || 'none'
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
    if (
      !enableHover
      || !containerRef.current
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(hover: none)').matches
    ) return
    const q = gsap.utils.selector(containerRef)

    images.forEach((_, index) => {
      const target = q(`.bounce-card-${index}`)
      gsap.killTweensOf(target)
      gsap.to(target, {
        transform: transformStyles[index] || 'none',
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
            transform: transformStyles[index] ?? 'none',
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
