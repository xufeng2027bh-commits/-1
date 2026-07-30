import React, { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

export default function ProjectVideo({ src, poster, title }) {
  const shellRef = useRef(null)
  const videoRef = useRef(null)
  const activatedRef = useRef(false)
  const isInViewRef = useRef(false)
  const [isActivated, setIsActivated] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const shell = shellRef.current
    const video = videoRef.current
    if (!shell || !video) return undefined

    video.defaultMuted = true
    video.muted = true
    video.volume = 0

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting

        if (!entry.isIntersecting) {
          video.pause()
          return
        }

        if (!activatedRef.current) {
          activatedRef.current = true
          setIsActivated(true)
          return
        }

        const playAttempt = video.play()
        playAttempt?.catch(() => setIsPlaying(false))
      },
      { rootMargin: '320px 0px', threshold: 0.01 },
    )

    observer.observe(shell)
    return () => observer.disconnect()
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isActivated || !isInViewRef.current) return

    video.muted = true
    video.volume = 0
    const playAttempt = video.play()
    playAttempt?.catch(() => setIsPlaying(false))
  }, [isActivated, src])

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (!video.paused) {
      video.pause()
      return
    }

    if (!activatedRef.current) {
      activatedRef.current = true
      isInViewRef.current = true
      setIsActivated(true)
      return
    }

    video.muted = true
    video.volume = 0
    const playAttempt = video.play()
    playAttempt?.catch(() => setIsPlaying(false))
  }

  const buttonLabel = isPlaying ? '暂停视频' : '播放视频'

  return (
    <div ref={shellRef} className="project-video-shell">
      {!isActivated && (
        <img
          className="project-video-poster"
          src={poster}
          alt={`${title}视频封面`}
          loading="lazy"
          decoding="async"
        />
      )}
      <video
        ref={videoRef}
        className="project-video"
        src={isActivated ? src : undefined}
        poster={isActivated ? poster : undefined}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        aria-hidden="true"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        className={`project-video-toggle ${isPlaying ? 'is-playing' : ''}`}
        type="button"
        onClick={togglePlayback}
        aria-label={`${buttonLabel}：${title}`}
      >
        <span className="project-video-toggle-icon" aria-hidden="true">
          {isPlaying
            ? <Pause size={20} fill="currentColor" />
            : <Play size={20} fill="currentColor" />}
        </span>
        <span className="project-video-toggle-label">{buttonLabel}</span>
      </button>
    </div>
  )
}
