import React from 'react'
import AnimatedContent from './AnimatedContent'
import './CampusCampaign.css'

export default function CampusCampaign() {
  return (
    <article className="campus-case" id="campus-campaign" aria-labelledby="campus-campaign-title">
      <AnimatedContent as="header" className="campus-case-heading" distance={20} duration={1} threshold={0.1}>
        <div>
          <p className="campus-case-label"><span aria-hidden="true" /> CAMPAIGN MATERIALS / 2026</p>
          <h3 id="campus-campaign-title">天猫校园双 11 主会场</h3>
        </div>
        <div>
          <p className="campus-case-role"><strong>我的职责</strong> 负责「超级学生价」双端主会场搭建与 UI/UX 设计，统筹会场内容和上线，并负责运营资源的分配与管理。</p>
          <div className="campus-case-results">
            <p className="campus-case-result">单日 GMV <strong>超亿</strong></p>
            <p className="campus-case-result">转化率增长 <strong>10%</strong></p>
          </div>
        </div>
      </AnimatedContent>

      <div className="campus-case-media">
        <AnimatedContent as="figure" className="campus-case-figure" distance={22} duration={1.05} threshold={0.1}>
          <img className="campus-case-cover" src="/assets/campus-double11-cover.webp" alt="天猫校园双十一活动总览主视觉" loading="lazy" decoding="async" />
        </AnimatedContent>
        <AnimatedContent as="figure" className="campus-case-figure" distance={22} duration={1.05} delay={0.1} threshold={0.1}>
          <div className="campus-case-popup-stage">
            <img className="campus-case-popup" src="/assets/campus-double11-popup.webp" alt="天猫校园双十一福利活动弹窗" loading="lazy" decoding="async" />
          </div>
        </AnimatedContent>
      </div>
    </article>
  )
}
