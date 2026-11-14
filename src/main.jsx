import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUpRight, Mail, Phone, Play, MoveUpRight } from 'lucide-react'
import DotField from './DotField'
import BounceCards from './BounceCards'
import ProjectVideo from './ProjectVideo'
import ClickSpark from './ClickSpark'
import AnimatedContent from './AnimatedContent'
import BorderGlow from './BorderGlow'
import CampusCampaign from './CampusCampaign'
import ProfileStats from './ProfileStats'
import { careerEntries, educationEntries } from './career'
import './base.css'
import './styles.css'
import './reference.css'
import './career.css'

const projects = [
  {
    no: '01',
    id: 'live-commerce',
    type: 'LIVE COMMERCE / 2026',
    title: '直播大促增长',
    desc: '统筹 618 与暑期两场大促，从预热引流到直播复盘，结合用户分层触达与限时优惠推动转化。转化率由约 1.5% 提升至约 3.1%。',
    stat: '累计 GMV 破亿',
    tone: 'cyan',
    image: '/assets/project-live-dashboard-v2.webp',
  },
  {
    no: '02',
    id: 'visual-system',
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
    id: 'live-review',
    type: 'AUTOMATION / 2026',
    title: '直播复盘自动化',
    desc: '自研直播评论自动抓取与整理工具，将评论整理从手动记录改为自动化，并利用 AI 辅助复盘。',
    stat: '整理耗时：180 → 30 分钟',
    tone: 'orange',
    video: '/assets/project-review-demo.mp4',
    poster: '/assets/project-review-poster.webp',
  },
]

const strengths = [
  ['01', '视觉设计', '设计大促会场的页面层级与交互，也为发布会和学术汇报制作视觉内容及数据图表。', 'UI/UX / PS / PPT / Blender / 视频剪辑'],
  ['02', '用户与产品运营', '梳理用户需求、策划 AI 功能和运营活动，关注新增用户、功能使用和停留时长。', '用户分层 / AI 功能策划 / 活动运营'],
  ['03', '直播与数据复盘', '从脚本排期、现场中控到转化复盘，结合观看、评论与付费数据调整话术和促单环节。', 'OBS / Excel / SQL'],
  ['04', '客户沟通与交付', '独立对接政企、高校及媒体客户，梳理需求、沟通方案，并协调项目进度与验收。', '需求沟通 / 客户维护 / 跨部门协作'],
]

const operationExperience = [
  {
    code: 'E-COMMERCE',
    title: '店铺运营',
    role: '个人淘宝店铺 / 项目负责人',
    summary: '独立运营个人淘宝店铺，从选品、视觉设计到客服转化和售后复购。分析平台流量与竞品，优化自然搜索，并用优惠券和会员社群维护老客。',
    items: ['选品测款与竞品拆解', '主图 / 详情页视觉设计', '标题 SEO 与基础直通车', '优惠券、会员社群与复购维护'],
    metrics: ['流水达百万', '全链路自主运营'],
  },
  {
    code: 'NEW MEDIA',
    title: '新媒体运营',
    role: '校园美食公众号 / 项目负责人',
    summary: '运营校园美食公众号，策划探店和测评内容，为餐饮商户引流，并根据阅读数据调整后续选题。',
    items: ['探店测评与选题策划', '公众号推文制作', '餐饮商户内容引流', '阅读数据复盘'],
    metrics: ['单篇阅读破万', '校园内容运营'],
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
          <div className={`nav-links ${menuOpen ? 'open' : ''}`} id="site-nav-links" onClick={() => setMenuOpen(false)}>
            <a href="#about">关于</a><a href="#career">经历</a><a href="#works">项目</a><a href="#skills">能力</a>
          </div>
          <button className="menu" type="button" aria-controls="site-nav-links" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '关闭' : '菜单'}</button>
          <MagneticLink href="#contact">联系我</MagneticLink>
        </nav>
        <div className="hero-copy">
          <div className="hero-copy-content">
            <p className="eyebrow"><span /> CREATIVE PORTFOLIO / 2026</p>
            <h1>I DESIGN<br/><em>LIVE</em> GROWTH</h1>
            <div className="hero-foot">
              <p>视觉设计、运营与增长策略。<br/>让好内容被看见，也让每一次触达产生结果。</p>
              <a href="#about" className="scroll"><ArrowDown size={18}/> SCROLL TO EXPLORE</a>
            </div>
          </div>
        </div>
        <div className="hero-stamp"><b>1 亿+</b><span>GMV</span></div>
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
            <p className="bio-copy">你好，我是徐锋，渤海大学市场营销专业本科生。主要做用户与产品运营，擅长结合视觉设计与数据复盘，优化大促会场和直播转化。</p>
            <div className="contact-inline">
              <a href="tel:15117418161"><Phone size={15}/> 151 1741 8161</a>
              <a href="mailto:xufeng2027bh@163.com"><Mail size={15}/> xufeng2027bh@163.com</a>
            </div>
            <ProfileStats />
          </AnimatedContent>
        </div>
      </section>

      <section className="career wrap" id="career" aria-labelledby="career-heading">
        <AnimatedContent as="header" className="section-head" distance={28} duration={1.1} threshold={0.12}>
          <div><div className="section-tag">02 / CAREER</div><h2 id="career-heading">重点经历</h2></div>
        </AnimatedContent>
        <ol className="career-list">
          {careerEntries.map((entry) => (
            <AnimatedContent as="li" className={`career-entry${entry.metric ? ' career-entry-featured' : ''}`} key={entry.company} distance={22} duration={0.95} threshold={0.1}>
              <div className="career-entry-meta">
                <span>{entry.period}</span>
                <h3>{entry.company}</h3>
                <p>{entry.role}</p>
              </div>
              <div className="career-entry-body">
                {entry.metric ? (
                  <>
                    <div className="career-result">
                      <strong>{entry.metric}</strong>
                      <span>{entry.result}</span>
                    </div>
                    <p>{entry.summary}</p>
                  </>
                ) : <p>{entry.result}</p>}
                {entry.caseLinks?.length > 0 && (
                  <div className="career-case-links">
                    {entry.caseLinks.map(({ id, label }) => (
                      <a className="career-case-link" key={id} href={`#${id}`}>{label} <span aria-hidden="true">↘</span></a>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedContent>
          ))}
        </ol>
        <div className="career-background">
          {educationEntries.map((entry) => (
            <AnimatedContent as="article" className="career-background-card" key={entry.label} distance={22} duration={0.95} threshold={0.1}>
              <span>{entry.label}</span>
              <h3>{entry.title}</h3>
              <p className="career-background-subtitle">{entry.subtitle}</p>
            </AnimatedContent>
          ))}
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
          <div><div className="section-tag">03 / INDEPENDENT PROJECTS</div><h2>自主运营项目</h2></div>
          <p>自主运营淘宝店铺和校园美食公众号的实践。</p>
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
          <div><div className="section-tag">04 / SELECTED WORK</div><h2>精选项目</h2></div>
          <p>跨越直播、电商与视觉设计，<br/>寻找创意与商业结果的交点。</p>
        </AnimatedContent>
        <CampusCampaign />
        <div className="project-list">
          {projects.map((p, index) => (
            <article className={`project ${p.tone}`} id={p.id} key={p.id}>
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
        <article className="sales-case" id="key-account-sales" aria-labelledby="sales-case-title">
          <AnimatedContent as="header" distance={20} duration={1} threshold={0.1}>
            <p className="sales-case-label">KEY ACCOUNT SALES / 2025—2026</p>
            <h3 id="sales-case-title">AI 教育产品大客户销售</h3>
          </AnimatedContent>
          <AnimatedContent className="sales-case-body" distance={20} duration={1} threshold={0.1}>
            <p>通过活动触达和线上沟通开发客户，梳理需求并协助调整方案，跟进商务沟通和签约。成交后持续收集使用反馈，跟进续费和增购机会。</p>
            <p className="sales-case-result">累计成交 <strong>50 万+</strong></p>
          </AnimatedContent>
        </article>
        <p className="works-disclaimer">项目数据已做脱敏处理，部分素材隐去了品牌标识。所有素材仅供个人作品展示，不作商业参考。</p>
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
          <div><div className="section-tag">05 / CAPABILITIES</div><h2>能力不是标签，<br/>是解决问题的方式。</h2></div>
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
        <p className="skills-languages"><span>语言能力</span> 日语资料阅读与校对 · 基础商务英语沟通</p>
      </section>

      <section className="philosophy wrap">
        <div className="section-tag">06 / MY PHILOSOPHY</div>
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
