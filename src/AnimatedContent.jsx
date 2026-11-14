import React, { useEffect, useRef } from 'react'

const easeOut = {
  'power2.out': 'cubic-bezier(.22,.61,.36,1)',
  'power3.out': 'cubic-bezier(.16,1,.3,1)',
}

export default function AnimatedContent({
  as: Component = 'div',
  children,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  scale = 1,
  threshold = 0.1,
  delay = 0,
  stagger = 0,
  childSelector = '',
  ...props
}) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element?.animate || !('IntersectionObserver' in window)
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const offset = (reverse ? -1 : 1) * (coarsePointer ? Math.min(distance, 24) : distance)
    const speed = coarsePointer ? Math.min(duration, 0.9) : duration
    const spacing = coarsePointer ? Math.min(stagger, 0.08) : stagger
    const animations = new Set()
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < threshold) return
      observer.disconnect()
      const targets = childSelector ? element.querySelectorAll(childSelector) : [element]
      targets.forEach((target, index) => {
        const animation = target.animate([
          { translate: direction === 'horizontal' ? `${offset}px 0` : `0 ${offset}px`, scale, opacity: 0.35 },
          { translate: '0 0', scale: 1, opacity: 1 },
        ], {
          duration: speed * 1000,
          delay: (delay + index * spacing) * 1000,
          easing: easeOut[ease] ?? easeOut['power3.out'],
          fill: 'backwards',
        })
        animations.add(animation)
        animation.onfinish = () => animations.delete(animation)
      })
    }, { threshold })

    observer.observe(element)
    return () => {
      observer.disconnect()
      animations.forEach(animation => animation.cancel())
    }
  }, [childSelector, delay, direction, distance, duration, ease, reverse, scale, stagger, threshold])

  return <Component ref={ref} {...props}>{children}</Component>
}
