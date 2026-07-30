import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUpRight, Mail, Phone, Play, MoveUpRight } from 'lucide-react'
import DotField from './DotField'
import BounceCards from './BounceCards'
import ProjectVideo from './ProjectVideo'
import ClickSpark from './ClickSpark'
import AnimatedContent from './AnimatedContent'
import BorderGlow from './BorderGlow'
import './styles.css'
import './reference.css'

const projects = [
  {
    no: '01',
    type: 'LIVE COMMERCE / 2026',
    title: '直播大促增长',
    desc: '从蓄水、内容到转化与复盘，全权操盘 618 与暑期两大核心节点。',
    stat: '累计 GMV 破亿',
    tone: 'cyan',
    image: '/assets/project-live-dashboard-v2.webp',
  },
  {
    no: '02',
    type: 'VISUAL SYSTEM / 2023—2025',
    title: '政企视觉内容定制',
    desc: '面向 B 端企业、科研学术机构、政务单位提供一体化视觉内容服务。主动对接各类客户深度沟通，精准挖掘宣讲、传播核心需求，区分不同受众与使用场景。',
    stat: '交付通过率 100%',
    tone: 'silver',
    gallery: [
      '/assets/visual-nio.webp',
      '/assets/visual-xcmg.webp',
      '/assets/visual-energy.webp',
      '/assets/visual-milk.webp',
      '/assets/visual-service.webp',
      '/assets/visual-liquor.webp',
    ],
  },
  {
    no: '03',
    type: 'AUTOMATION / 2026',
    title: '直播复盘自动化',
    desc: '自研评论自动抓取与整理工具，利用AI让运营判断更快进入下一轮迭代。',
    stat: '效率提升 500%',
    tone: 'orange',
    video: '/assets/project-review-demo.mp4',
    poster: '/assets/project-review-poster.webp',
  },
]

const strengths = [
  ['01', '视觉叙事', '用结构、节奏与数据视觉化，把复杂信息变成能够被理解和记住的内容。', 'PS / PPT / Blender'],
  ['02', '直播增长', '覆盖选题脚本、排期、中控、互动、私域蓄水与付费转化的全链路操盘。', 'OBS / APP直播 / 私域'],
  ['03', '数据复盘', '围绕观看、评论与付费数据建立标准化复盘，持续迭代话术和促单链路。', 'DATA / INSIGHT'],
  ['04', '项目统筹', '独立对接政企、高校与媒体客户，推动跨团队项目从需求走向稳定交付。', 'PLAN / CONTROL'],
]

const operationExperience = [
  {
    code: 'E-COMMERCE',
    title: '店铺运营',
    role: '个人淘宝店铺 / 项目负责人',
    summary: '独立完成从商品进入店铺到成交复购的完整运营闭环，把视觉表达、平台流量与用户转化放在同一套策略中。',
    items: ['选品测款与竞品拆解', '主图 / 详情页视觉设计', '标题 SEO 与基础直通车', '优惠券、会员社群与复购维护'],
    metrics: ['全链路', '自主运营'],
  },
  {
    code: 'NEW MEDIA',
    title: '新媒体运营',
    role: '内容策划 / 直播与活动运营',
    summary: '围绕内容触达、直播互动和活动传播设计用户路径，并通过观看、评论和转化数据持续优化内容表现。',
    items: ['内容选题、脚本与排期', '短视频剪辑与视觉包装', '社群 / APP 多渠道触达', '用户数据分析与内容复盘'],
    metrics: ['内容 × 数据', '持续迭代'],
  },
]

function MagneticLink({ href, children, className = '' }) {
  return <a className={`magnetic ${className}`} href={href}>{children}<ArrowUpRight size={16} /></a>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handlePortraitMove = (event) => {
    const element = event.currentTarget
    const bounds = element.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))

    element.style.setProperty('--portrait-x', `${x * 100}%`)
    element.style.setProperty('--portrait-y', `${y * 100}%`)
    element.style.setProperty('--portrait-tilt-x', `${(0.5 - y) * 4}deg`)
    element.style.setProperty('--portrait-tilt-y', `${(x - 0.5) * 4}deg`)
  }

  const resetPortrait = (event) => {
    const element = event.currentTarget
    element.style.setProperty('--portrait-x', '50%')
    element.style.setProperty('--portrait-y', '42%')
    element.style.setProperty('--portrait-tilt-x', '0deg')
    element.style.setProperty('--portrait-tilt-y', '0deg')
  }

  const handleExperienceMove = (event) => {
    const element = event.currentTarget
    const bounds = element.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))

    element.style.setProperty('--card-x', `${x * 100}%`)
    element.style.setProperty('--card-y', `${y * 100}%`)
    element.style.setProperty('--card-tilt-x', `${(0.5 - y) * 3}deg`)
    element.style.setProperty('--card-tilt-y', `${(x - 0.5) * 3}deg`)
  }

  const resetExperience = (event) => {
    const element = event.currentTarget
    element.style.setProperty('--card-x', '72%')
    element.style.setProperty('--card-y', '24%')
    element.style.setProperty('--card-tilt-x', '0deg')
    element.style.setProperty('--card-tilt-y', '0deg')
  }

  return (
    <main>
      <section className="hero" id="top">
        <DotField
          className="hero-dot-field"
          dotRadius={1.6}
          dotSpacing={22}
          cursorRadius={360}
          bulgeStrength={48}
          glowRadius={180}
          sparkle
          gradientFrom="rgba(255,255,255,.28)"
          gradientTo="rgba(225,37,44,.42)"
          glowColor="rgba(225,37,44,.16)"
        />
        <div className="hero-red-disc" />
        <img
          className="hero-person"
          src="/assets/xufeng-hero-cutout.webp"
          alt="徐锋个人形象抠图"
          width="1024"
          height="1536"
          fetchPriority="high"
          decoding="async"
        />
        <div className="noise" />
        <nav>
          <a className="logo" href="#top"><img src="/assets/xf-logo-cutout.webp" alt="XF 标志" width="256" height="256" decoding="async" /></a>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#about">关于</a><a href="#works">项目</a><a href="#skills">能力</a>
          </div>
          <button className="menu" onClick={() => setMenuOpen(!menuOpen)}>MENU</button>
          <MagneticLink href="#contact">联系我</MagneticLink>
        </nav>
        <div className="hero-copy">
          <AnimatedContent
            className="hero-copy-content"
            distance={46}
            duration={1.45}
            delay={0.18}
            threshold={0.02}
            scale={0.985}
            ease="power2.out"
          >
            <p className="eyebrow"><span /> CREATIVE PORTFOLIO / 2026</p>
            <h1>I DESIGN<br/><em>LIVE</em> GROWTH</h1>
            <div className="hero-foot">
              <p>视觉设计、运营与增长策略。<br/>让好内容被看见，也让每一次触达产生结果。</p>
              <a href="#about" className="scroll"><ArrowDown size={18}/> SCROLL TO EXPLORE</a>
            </div>
          </AnimatedContent>
        </div>
        <div className="hero-stamp"><b>200%</b><span>GROWTH<br/>THROUGH DESIGN</span></div>
        <div className="hero-cross hero-cross-a">+</div>
        <div className="hero-cross hero-cross-b">+</div>
        <div className="hero-index">PORTFOLIO / 2026</div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div>VISUAL IMPACT <i>✦</i> LIVE GROWTH <i>✦</i> DATA DRIVEN <i>✦</i> VISUAL IMPACT <i>✦</i> LIVE GROWTH <i>✦</i> DATA DRIVEN <i>✦</i></div>
      </div>

      <section className="about wrap" id="about">
        <div className="section-tag">01 / PROFILE</div>
        <div className="about-grid">
          <AnimatedContent
            className="portrait"
            direction="horizontal"
            reverse
            distance={42}
            duration={1.2}
            threshold={0.16}
            scale={0.985}
            ease="power2.out"
          >
            <div
              className="portrait-art"
              onPointerMove={handlePortraitMove}
              onPointerLeave={resetPortrait}
            >
              <div className="portrait-tech-grid" aria-hidden="true" />
              <div className="portrait-person-layer">
                <img
                  className="portrait-person-image"
                  src="/assets/xufeng-chess-cutout.webp"
                  alt="徐锋手拿棋子的个人形象抠图"
                  width="800"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="portrait-spotlight" aria-hidden="true" />
              <div className="portrait-reticle" aria-hidden="true" />
              <img className="portrait-logo" src="/assets/xf-logo-cutout.webp" alt="XF 标志" width="256" height="256" loading="lazy" decoding="async" />
              <div className="scan" />
            </div>
            <div className="portrait-label">BASED IN CHINA<br/>AVAILABLE FOR OPPORTUNITIES</div>
          </AnimatedContent>
          <AnimatedContent
            className="bio"
            direction="horizontal"
            distance={42}
            duration={1.25}
            delay={0.12}
            threshold={0.16}
            scale={0.99}
            ease="power2.out"
          >
            <p className="eyebrow">ABOUT ME</p>
            <div className="bio-kicker">DESIGN<br/>WITH<br/>TEETH.</div>
            <h2>怀千里马之志，<br/>做深耕者之事，<br/>凭实干破局。</h2>
            <p className="bio-copy">你好，我是徐锋，一名视觉设计师与直播运营。就读于渤海大学市场营销专业，拥有教育直播大促、自主电商、AI 教育运营与商业视觉设计的复合经验。我擅长把审美、数据和转化逻辑放进同一套解决方案里。</p>
            <div className="contact-inline">
              <a href="tel:15117418161"><Phone size={15}/> 151 1741 8161</a>
              <a href="mailto:xufeng2027bh@163.com"><Mail size={15}/> xufeng2027bh@163.com</a>
            </div>
            <div className="stats">
              <div><strong>1<span>亿+</span></strong><small>累计操盘 GMV</small></div>
              <div><strong>200<span>%</span></strong><small>核心大促业绩增长</small></div>
              <div><strong>500<span>%</span></strong><small>直播复盘效率提升</small></div>
            </div>
          </AnimatedContent>
        </div>
      </section>

      <section className="experience wrap" id="experience">
        <AnimatedContent
          as="header"
          className="section-head"
          distance={34}
          duration={1.1}
          threshold={0.15}
          scale={0.99}
          ease="power2.out"
        >
          <div><div className="section-tag">02 / OPERATION EXPERIENCE</div><h2>不只做内容，<br/>更经营结果。</h2></div>
          <p>从货品、内容到渠道与用户，<br/>建立可以持续迭代的运营闭环。</p>
        </AnimatedContent>
        <AnimatedContent
          className="experience-grid"
          childSelector=":scope > article"
          distance={46}
          duration={1.05}
          stagger={0.16}
          threshold={0.12}
          scale={0.985}
          ease="power2.out"
        >
          {operationExperience.map((item, index) => (
            <article
              className="experience-card"
              key={item.code}
              onPointerMove={handleExperienceMove}
              onPointerLeave={resetExperience}
            >
              <BorderGlow
                className="experience-border-glow"
                edgeSensitivity={18}
                glowColor="357 76 51"
                backgroundColor="#101010"
                borderRadius={0}
                glowRadius={32}
                glowIntensity={0.78}
                coneSpread={18}
                animated
                colors={['#e1252c', '#ff6b70', '#f2f1ed']}
                fillOpacity={0.14}
              >
                <div className="experience-glow" aria-hidden="true" />
                <div className="experience-top">
                  <span>{item.code}</span><b>0{index + 1}</b>
                </div>
                <h3>{item.title}</h3>
                <small>{item.role}</small>
                <p>{item.summary}</p>
                <ul>{item.items.map(detail => <li key={detail}>{detail}</li>)}</ul>
                <div className="experience-metrics">
                  {item.metrics.map(metric => <span key={metric}>{metric}</span>)}
                </div>
              </BorderGlow>
            </article>
          ))}
        </AnimatedContent>
      </section>

      <section className="works wrap" id="works">
        <AnimatedContent
          as="header"
          className="section-head"
          distance={34}
          duration={1.1}
          threshold={0.15}
          scale={0.99}
          ease="power2.out"
        >
          <div><div className="section-tag">03 / SELECTED WORK</div><h2>精选项目</h2></div>
          <p>跨越直播、电商与视觉设计，<br/>寻找创意与商业结果的交点。</p>
        </AnimatedContent>
        <div className="project-list">
          {projects.map((p, index) => (
            <article className={`project ${p.tone}`} key={p.no}>
              <AnimatedContent
                className={`project-visual ${p.gallery ? 'project-visual-gallery' : ''} ${p.video ? 'project-visual-video' : ''}`}
                direction="horizontal"
                reverse={index % 2 === 0}
                distance={34}
                duration={1.15}
                threshold={0.18}
                scale={0.99}
                ease="power2.out"
              >
                {p.gallery ? (
                  <BounceCards
                    className="project-bounce"
                    images={p.gallery}
                    containerWidth={820}
                    containerHeight={520}
                    animationDelay={0.3}
                    animationStagger={0.14}
                    easeType="elastic.out(1, 0.55)"
                    transformStyles={[
                      'rotate(-8deg) translate(-170px)',
                      'rotate(6deg) translate(-105px)',
                      'rotate(-4deg) translate(-35px)',
                      'rotate(3deg) translate(35px)',
                      'rotate(-5deg) translate(105px)',
                      'rotate(8deg) translate(170px)',
                    ]}
                    enableHover
                  />
                ) : p.video ? (
                  <ProjectVideo
                    src={p.video}
                    poster={p.poster}
                    title={p.title}
                  />
                ) : p.image ? (
                  <img className="project-image" src={p.image} alt={`${p.title}项目展示`} loading="lazy" decoding="async" />
                ) : (
                  <div className="orb" />
                )}
                <div className="grid-lines"/><span className="project-num">{p.no}</span>
                {!p.gallery && !p.video && <div className="play"><Play size={16} fill="currentColor"/></div>}
              </AnimatedContent>
              <AnimatedContent
                className="project-info"
                distance={28}
                duration={1.05}
                threshold={0.2}
                delay={0.14}
                scale={0.995}
                ease="power2.out"
              >
                <span>{p.type}</span><h3>{p.title}</h3><p>{p.desc}</p>
                <div className="project-bottom"><strong>{p.stat}</strong><MoveUpRight/></div>
              </AnimatedContent>
            </article>
          ))}
        </div>
        <p className="works-disclaimer">数据已脱敏处理，素材已隐去企业品牌标识，仅为个人展示，不构成任何商业价值及参考。</p>
      </section>

      <section className="skills wrap" id="skills">
        <AnimatedContent
          as="header"
          className="section-head"
          distance={34}
          duration={1.1}
          threshold={0.15}
          scale={0.99}
          ease="power2.out"
        >
          <div><div className="section-tag">04 / CAPABILITIES</div><h2>能力不是标签，<br/>是解决问题的方式。</h2></div>
        </AnimatedContent>
        <AnimatedContent
          className="skill-grid"
          childSelector=":scope > article"
          distance={42}
          duration={1}
          stagger={0.13}
          threshold={0.12}
          scale={0.985}
          ease="power2.out"
        >
          {strengths.map(([no,title,desc,tools]) => <article key={no}>
            <span>{no}</span><h3>{title}</h3><p>{desc}</p><small>{tools}</small>
          </article>)}
        </AnimatedContent>
      </section>

      <section className="philosophy wrap">
        <div className="section-tag">05 / MY PHILOSOPHY</div>
        <div className="philosophy-grid">
          <AnimatedContent
            className="philosophy-title"
            distance={32}
            duration={1.15}
            threshold={0.18}
            ease="power2.out"
          >
            GOOD DESIGN<br/>IS CLEAR THINKING<br/>MADE <em>VISIBLE.</em>
          </AnimatedContent>
          <AnimatedContent
            className="philosophy-copy"
            distance={28}
            duration={1.1}
            threshold={0.18}
            delay={0.18}
            ease="power2.out"
          >
            <span>STRATEGY / STORYTELLING / IMPACT</span>
            <p>我相信设计不只是审美，而是沟通、连接和改变的工具。好的运营也不只是执行，而是让内容、用户和商业目标形成一条清晰的路径。</p>
            <b>以清晰对抗复杂，<br/>以行动回应目标。</b>
          </AnimatedContent>
        </div>
      </section>

      <footer id="contact">
        <div className="footer-inner">
          <div className="footer-orbit">AVAILABLE<br/>FOR<br/>2026</div>
          <p className="eyebrow"><span/> START A CONVERSATION</p>
          <AnimatedContent
            as="h2"
            distance={44}
            duration={1.25}
            threshold={0.12}
            scale={0.985}
            ease="power2.out"
          >
            设计驱动运营<br/><em>内容实现增长</em>
          </AnimatedContent>
          <AnimatedContent
            distance={24}
            duration={1.05}
            delay={0.2}
            threshold={0.1}
            ease="power2.out"
          >
            <ClickSpark
              sparkColor="#fff"
              sparkSize={8}
              sparkRadius={18}
              sparkCount={7}
              duration={520}
            >
              <a className="big-mail" href="mailto:xufeng2027bh@163.com">LET'S TALK <ArrowUpRight/></a>
            </ClickSpark>
          </AnimatedContent>
          <div className="footer-bottom"><span>© 2026 XUFENG</span><span>VISUAL DESIGN × LIVE OPERATIONS</span><a href="#top">BACK TO TOP ↑</a></div>
        </div>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
