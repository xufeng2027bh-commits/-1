import React, { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function AnimatedContent({
  as: Component = 'div',
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  stagger = 0,
  childSelector = '',
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  onComplete,
  onDisappearanceComplete,
  className = '',
  style,
  ...props
}) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const targets = childSelector
      ? [...element.querySelectorAll(childSelector)]
      : [element]

    if (!targets.length) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(targets, { clearProps: 'transform,opacity', visibility: 'visible' })
      return undefined
    }

    let scrollerTarget = container || document.getElementById('snap-main-container') || null
    if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector(scrollerTarget)
    }

    const axis = direction === 'horizontal' ? 'x' : 'y'
    const offset = reverse ? -distance : distance
    const startPct = (1 - threshold) * 100
    let scrollTrigger
    let timeline
    let disappearanceTween

    const context = gsap.context(() => {
      gsap.set(element, {
        visibility: 'visible',
      })

      gsap.set(targets, {
        [axis]: offset,
        scale,
        opacity: animateOpacity ? initialOpacity : 1,
        visibility: 'visible',
        willChange: 'transform, opacity',
      })

      timeline = gsap.timeline({
        paused: true,
        delay,
        onComplete: () => {
          gsap.set(targets, {
            clearProps: 'transform,opacity,willChange',
            visibility: 'visible',
          })
          onComplete?.()

          if (disappearAfter > 0) {
            disappearanceTween = gsap.to(targets, {
              [axis]: reverse ? distance : -distance,
              scale: 0.8,
              opacity: animateOpacity ? initialOpacity : 0,
              stagger,
              delay: disappearAfter,
              duration: disappearDuration,
              ease: disappearEase,
              onComplete: () => onDisappearanceComplete?.(),
            })
          }
        },
      })

      timeline.to(targets, {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        stagger,
        duration,
        ease,
      })

      scrollTrigger = ScrollTrigger.create({
        trigger: element,
        scroller: scrollerTarget,
        start: `top ${startPct}%`,
        once: true,
        onEnter: () => timeline.play(),
      })
    }, element)

    return () => {
      scrollTrigger?.kill()
      timeline?.kill()
      disappearanceTween?.kill()
      context.revert()
    }
  }, [
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    stagger,
    childSelector,
    disappearAfter,
    disappearDuration,
    disappearEase,
    onComplete,
    onDisappearanceComplete,
  ])

  return (
    <Component
      ref={ref}
      className={className}
      style={{ visibility: 'visible', ...style }}
      {...props}
    >
      {children}
    </Component>
  )
}
