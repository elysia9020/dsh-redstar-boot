/* ============================================================================
 * dsh-redstar-boot — 启动动画运行时（浏览器端，零依赖）
 * ----------------------------------------------------------------------------
 * 由 Host 半侧注入到 index.html，在 React 应用挂载之前接管首屏：
 *
 *   第一幕  黑幕 + DeepSeek 鲸鱼标识／"深度求索"／"DEEPSEEK"（字距收紧 + 扫光）
 *   过场    过曝洗白（黑 → 灰 → 暖白底板），对应参考片的硬切洗白
 *   第二幕  暖白"技术档案"底板：左上品牌块左→右擦出、右下 POWERED BY、进度条
 *   序列    需要访问许可 → 身份资料确认 → 接收访问需求 → 读取完毕 → 验证通过
 *           → 欢迎 <身份名称> 访问；每步中文大字 + 英文等宽字幕 + 底部长句日志
 *   交互    第 1、2 步等待用户确认（按钮 / Enter / 空格 / 点击），可跳过
 *   终幕    WELCOME TO / [DEEPSEEK HARNESS] / 鲸鱼标识，青红色散故障后揭幕
 *
 * 配置来自 window.__DSH_REDSTAR__（Host 侧注入），也可用
 * window.__DSH_REDSTAR_API__.replay() 重播。
 * ========================================================================== */
(function () {
  'use strict'

  if (window.__DSH_REDSTAR_LOADED__) return
  window.__DSH_REDSTAR_LOADED__ = true

  var ROOT_ID = 'dsh-redstar-root'

  /* ── 默认配置（与 Host 侧 lib/index.js 的 DEFAULTS 保持一致）──────────── */
  var DEFAULTS = {
    enabled: true,
    mode: 'session',            // always | session | daily
    theme: 'light',             // light | dark
    speed: 1,
    requireInteraction: true,   // 第 1、2 步等待用户确认
    allowSkip: true,
    sound: true,                // 界面音效（WebAudio 合成，无音频文件）
    soundVolume: 0.5,
    voice: true,                // 女声播报
    voiceLang: 'en',            // en | zh | both
    voiceName: '',              // '' = 自动挑女声（见 FEMALE_HINTS）
    voiceRate: 0.88,            // 电影旁白档：比朗读慢，字与字之间才有重量
    voicePitch: 0.85,           // 压低音调，深沉的 AI 女声
    voiceVolume: 0.9,
    voiceCue: true,             // 念台词前的一声轻提示
    sfx: 'audio',               // audio=真素材（用户音频里抠的音效）/ synth=现场合成
    voiceSource: 'asset',       // asset=优先用真声素材 / tts=全部 TTS 合成
    voiceLead: 240,             // 提示音之后留一小段空白再开口
    identity: 'JOYCE MOORE',    // ← 设置页可改的"身份名称"
    identityId: '0087',
    accessLevel: '3',
    brand1: 'DEEPSEEK',
    brand2: 'SYNTHESIZE INTELLIGENCE',
    brand3a: 'HARNESS',
    brand3b: 'OS',
    orgZh: '深度求索',
    orgEn: 'DEEPSEEK',
    orgSub: 'DEEPSEEK HARNESS',
    welcomeBox: 'DEEPSEEK HARNESS',
    footer: 'POWERED BY DEEPSEEK',
    accent: '#ff7500',
    glitchA: '#ff3b30',
    glitchB: '#2971b8'
  }

  /* ── 序列脚本：中文主字 + 英文等宽字幕 + 底部日志 ───────────────────────
     `say` 是专门给语音播报用的自然语句（照着参考片里女声念状态行的节奏，
     正好卡在各自文字出现的时间点上）。 */
  /* ── 序列脚本 ──────────────────────────────────────────────────────────
     文字与真声素材一一对应（来自你给的音频）：
       line-1.mp3 = V1 需要访问许可
       line-2.mp3 = V2 身份资料确认
       line-3.mp3 = V4 接收访问需求
       line-4.mp3 = V5 开始读取权限
       line-5.mp3 = V6 读取完毕 · 核验通过
     V3 是用户名字独白，按你的要求不用。
     `say` 是素材拿不到时的 TTS 兜底文本；`audio` 是素材文件名（不含扩展名）。 */
  var STEPS = [
    {
      zh: '需要访问许可',
      en: 'ACCESS PERMISSION REQUIRED',
      say: 'Access permission required.',
      audio: 'line-1',
      log: '等待用户授权…',
      logEn: 'AWAITING OPERATOR CONSENT',
      badge: 'AUTHORIZATION',
      action: 'grant',
      btnZh: '授予访问权限',
      btnEn: 'GRANT ACCESS',
      hold: 900,
      progress: 0.34
    },
    {
      zh: '身份资料确认',
      en: 'IDENTITY VERIFICATION',
      say: 'Identity verification.',
      audio: 'line-2',
      log: '核对身份资料…',
      logEn: 'MATCHING OPERATOR RECORD',
      badge: 'IDENTITY',
      action: 'confirm',
      btnZh: '确认身份',
      btnEn: 'CONFIRM IDENTITY',
      hold: 700,
      progress: 0.5
    },
    {
      zh: '接收访问需求',
      en: 'ACCESS REQUEST RECEIVED',
      say: 'Access request received.',
      audio: 'line-3',
      log: '接收访问需求，建立会话通道…',
      logEn: 'HANDSHAKE ESTABLISHED',
      badge: 'REQUEST',
      action: 'auto',
      hold: 1200,
      progress: 0.66,
      assembleLogo: true
    },
    {
      zh: '开始读取权限',
      en: 'PERMISSION READ STARTED',
      say: 'Beginning permission read.',
      audio: 'line-4',
      log: '开始读取权限，索引工作区与会话…',
      logEn: 'READING PERMISSION SET',
      badge: 'READ',
      action: 'auto',
      hold: 1200,
      progress: 0.8,
      hex: true
    },
    {
      zh: '读取完毕 · 核验通过',
      en: 'READ COMPLETE · VERIFIED',
      say: 'Read complete. Verification passed.',
      audio: 'line-5',
      log: '读取完毕，核验通过，权限已授予',
      logEn: 'PERMISSION AUTHORIZED',
      badge: 'VERIFY',
      action: 'auto',
      hold: 1600,
      progress: 0.93,
      reticle: true
    }
  ]

  function cfg() {
    var raw = (window.__DSH_REDSTAR__ && typeof window.__DSH_REDSTAR__ === 'object')
      ? window.__DSH_REDSTAR__
      : {}
    var out = {}
    for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k]
    for (var k2 in raw) {
      if (Object.prototype.hasOwnProperty.call(raw, k2) && raw[k2] !== undefined && raw[k2] !== null) {
        out[k2] = raw[k2]
      }
    }
    out.speed = Math.min(3, Math.max(0.35, Number(out.speed) || 1))
    out.identity = String(out.identity || DEFAULTS.identity).slice(0, 48)
    /* 代号取身份名称里的字母数字；纯中文名字取不到时退回 OPERATOR */
    out.identityId = String(out.identityId || out.identity).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
    if (!out.identityId) out.identityId = 'OPERATOR'
    return out
  }

  var C = cfg()

  /** 重播：把运行时脚本重新挂一次（配置/身份名称改动后 preview 用它）。 */
  function injectSelf() {
    window.__DSH_REDSTAR_LOADED__ = false
    var old = document.getElementById(ROOT_ID)
    if (old && old.parentNode) old.parentNode.removeChild(old)
    window.__DSH_REDSTAR_SKIP__ = false
    /* 样式也重挂一份带时间戳的：插件文件被改过之后，设置页点「立即预览」
       不用刷新整页也能拿到新 CSS（老样式表仍在，同优先级后挂的覆盖前者）。 */
    if (!window.__DSH_REDSTAR_CSS_URL__) {
      try {
        var css = document.createElement('link')
        css.rel = 'stylesheet'
        css.href = '/dsh-redstar/splash.css?t=' + Date.now()
        document.head.appendChild(css)
      } catch (e) { /* 拿不到样式就用页面上已有的 */ }
    }
    var s = document.createElement('script')
    /* 正式运行时由 Host 路由提供（加时间戳绕开缓存）；
       离线预览页会把相对路径写进 __DSH_REDSTAR_SCRIPT_URL__，file:// 下不加查询串。 */
    if (window.__DSH_REDSTAR_SCRIPT_URL__) {
      s.src = window.__DSH_REDSTAR_SCRIPT_URL__
    } else {
      s.src = '/dsh-redstar/splash.js?t=' + Date.now()
    }
    document.head.appendChild(s)
  }

  /* Host 侧的首屏兜底脚本已经判定"这次不播"（未启用 / 本会话已播 / 今日已播）：
     这里不再建 DOM，但仍然暴露 API，方便设置页按需重播。 */
  if (window.__DSH_REDSTAR_SKIP__ === true) {
    window.__DSH_REDSTAR_API__ = {
      replay: injectSelf,
      skip: function () {},
      finish: function () {},
      config: C
    }
    return
  }

  /* 最后一道保险：无论前面哪一步抛异常，都不许把用户留在黑幕里 */
  setTimeout(function () {
    try {
      var r = document.getElementById(ROOT_ID)
      if (r && r.classList && r.classList.contains('dsu-boot')) {
        if (r.parentNode) r.parentNode.removeChild(r)
        document.documentElement.classList.remove('dsu-lock')
        if (document.body) document.body.style.overflow = ''
        window.__DSH_REDSTAR_FAILED__ = true
      }
    } catch (e) { /* 兜底本身不许再抛 */ }
  }, 9000)

  /* ── 小工具 ───────────────────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }

  /* DeepSeek Harness 官方应用图标（resources/icon.png 320px 版内联成 data URI）：
     白底圆角方块 + 深蓝鲸鱼，和桌面端窗口/任务栏那个图标同一张图；离线可用。 */
  var APP_ICON = 'data:image/png;base64,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'

  function appIcon(cls) {
    var img = document.createElement('img')
    img.setAttribute('class', cls || 'dsu-whale')
    img.setAttribute('alt', '')
    img.setAttribute('draggable', 'false')
    img.src = APP_ICON
    return img
  }

  /** 逐字渐显：比逐字截断更稳（居中排版不会因为字宽变化而抖动） */
  function typeIn(host, text, stagger) {
    host.textContent = ''
    var frag = document.createDocumentFragment()
    var n = 0
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i)
      if (ch === ' ') {
        frag.appendChild(document.createTextNode('\u00a0'))
        continue
      }
      var s = el('span', 'dsu-ch', ch)
      s.style.transitionDelay = Math.round(n * stagger) + 'ms'
      frag.appendChild(s)
      n++
    }
    host.appendChild(frag)
  }

  function setIn(node, on, cls) {
    if (!node) return
    node.classList.toggle(cls || 'dsu-in', !!on)
  }

  /* ── DOM 搭建 ─────────────────────────────────────────────────────────── */
  var root = document.getElementById(ROOT_ID)
  if (!root) {
    root = el('div')
    root.id = ROOT_ID
    root.className = 'dsu-root'
    document.body.appendChild(root)
  }
  root.classList.toggle('dsu-dark', C.theme === 'dark')
  root.style.setProperty('--dsu-speed', String(C.speed))
  root.style.setProperty('--dsu-accent', C.accent)
  root.style.setProperty('--dsu-glitch-a', C.glitchA)
  root.style.setProperty('--dsu-glitch-b', C.glitchB)

  var ui = {}
  var clockTimer = null
  var html =
    '<div class="dsu-plate"></div>' +
    '<div class="dsu-vignette"></div>' +
    '<div class="dsu-watermark"></div>' +
    '<div class="dsu-grain"></div>' +
    '<div class="dsu-black">' +
      '<div class="dsu-black-inner"></div>' +
      '<div class="dsu-sweep"></div>' +
    '</div>' +
    '<div class="dsu-wash"></div>' +
    '<header class="dsu-brand">' +
      '<div class="dsu-brand-1"></div><div class="dsu-brand-2"></div>' +
      '<div class="dsu-brand-3"><b></b><span></span></div>' +
    '</header>' +
    '<div class="dsu-stepcount">[ 00 / 06 ] INIT</div>' +
    '<div class="dsu-center">' +
      '<div class="dsu-status"><span class="dsu-status-zh"></span><i class="dsu-caret"></i></div>' +
      '<div class="dsu-sub-en"></div>' +
      '<div class="dsu-rule"></div>' +
      '<div class="dsu-logo"></div>' +
      '<div class="dsu-dots" hidden></div>' +
    '</div>' +
    '<div class="dsu-idline"></div>' +
    '<div class="dsu-reticle"></div>' +
    '<div class="dsu-hex"></div>' +
    '<div class="dsu-hex-full"></div>' +
    '<div class="dsu-star">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
        '<defs>' +
          '<radialGradient id="dsuStarGrad" cx="42%" cy="34%" r="74%">' +
            '<stop offset="0%" stop-color="#ff9182"/>' +
            '<stop offset="46%" stop-color="#ff2b1c"/>' +
            '<stop offset="100%" stop-color="#9e0701"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<path fill="url(#dsuStarGrad)" stroke="rgba(255,214,206,0.85)" stroke-width="0.7" ' +
          'd="M50 3 L60.6 35.4 L94.7 35.5 L67.1 55.6 L77.6 88 L50 68 L22.4 88 L32.9 55.6 L5.3 35.5 L39.4 35.4 Z"/>' +
      '</svg>' +
    '</div>' +
    '<div class="dsu-bootlog">' +
      '<div class="dsu-boot-lines"></div>' +
      '<div class="dsu-boot-en"></div>' +
    '</div>' +
    '<div class="dsu-welcome">' +
      '<div class="dsu-w1">链接成功</div>' +
      '<div class="dsu-w2"></div>' +
      '<div class="dsu-w3"></div>' +
      '<div class="dsu-w4"></div>' +
    '</div>' +
    '<div class="dsu-action">' +
      '<div class="dsu-card" hidden></div>' +
      '<button class="dsu-btn" type="button">' +
        '<span class="dsu-btn-zh"></span><span class="dsu-btn-en"></span>' +
      '</button>' +
      '<div class="dsu-hint"></div>' +
    '</div>' +
    '<div class="dsu-frame">' +
      '<i class="dsu-corner dsu-c-tl"></i><i class="dsu-corner dsu-c-tr"></i>' +
      '<i class="dsu-corner dsu-c-bl"></i><i class="dsu-corner dsu-c-br"></i>' +
      '<div class="dsu-scanline"></div>' +
    '</div>' +
    '<div class="dsu-slats"></div>' +
    '<div class="dsu-voice"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="dsu-meta"><span class="dsu-meta-1"></span><span class="dsu-meta-2"></span></div>' +
    '<div class="dsu-skip">SKIP ▸</div>' +
    '<footer class="dsu-foot"><span></span><i></i></footer>' +
    '<div class="dsu-subtitle">' +
      '<span class="dsu-sub-zh"></span><span class="dsu-sub-en2"></span>' +
    '</div>' +
    '<div class="dsu-progress"><i></i></div>' +
    '<div class="dsu-bloom"></div>' +
    '<div class="dsu-streak"></div>' +
    '<div class="dsu-flash"></div>'

  root.innerHTML = html

  function q(sel) { return root.querySelector(sel) }
  ui.plate = q('.dsu-plate')
  ui.watermark = q('.dsu-watermark')
  ui.black = q('.dsu-black')
  ui.blackInner = q('.dsu-black-inner')
  ui.sweep = q('.dsu-sweep')
  ui.wash = q('.dsu-wash')
  ui.flash = q('.dsu-flash')
  ui.bloom = q('.dsu-bloom')
  ui.streak = q('.dsu-streak')
  ui.vignette = q('.dsu-vignette')
  ui.brand = q('.dsu-brand')
  ui.center = q('.dsu-center')
  ui.brand1 = q('.dsu-brand-1')
  ui.brand2 = q('.dsu-brand-2')
  ui.brand3b = q('.dsu-brand-3 b')
  ui.brand3s = q('.dsu-brand-3 span')
  ui.stepcount = q('.dsu-stepcount')
  ui.status = q('.dsu-status')
  ui.statusZh = q('.dsu-status-zh')
  ui.caret = q('.dsu-caret')
  ui.subEn = q('.dsu-sub-en')
  ui.rule = q('.dsu-rule')
  ui.logo = q('.dsu-logo')
  ui.dots = q('.dsu-dots')
  ui.idline = q('.dsu-idline')
  ui.reticle = q('.dsu-reticle')
  ui.hex = q('.dsu-hex')
  ui.hexFull = q('.dsu-hex-full')
  ui.star = q('.dsu-star')
  ui.bootlog = q('.dsu-bootlog')
  ui.bootlines = q('.dsu-boot-lines')
  ui.bootEn = q('.dsu-boot-en')
  ui.welcome = q('.dsu-welcome')
  ui.w1 = q('.dsu-w1')
  ui.w2 = q('.dsu-w2')
  ui.w3 = q('.dsu-w3')
  ui.w4 = q('.dsu-w4')
  ui.action = q('.dsu-action')
  ui.card = q('.dsu-card')
  ui.btn = q('.dsu-btn')
  ui.btnZh = q('.dsu-btn-zh')
  ui.btnEn = q('.dsu-btn-en')
  ui.hint = q('.dsu-hint')
  ui.skip = q('.dsu-skip')
  ui.foot = q('.dsu-foot')
  ui.footText = q('.dsu-foot span')
  ui.subZh = q('.dsu-sub-zh')
  ui.subEn2 = q('.dsu-sub-en2')
  ui.progress = q('.dsu-progress')
  ui.bar = q('.dsu-progress i')
  ui.frame = q('.dsu-frame')
  ui.scanline = q('.dsu-scanline')
  ui.slats = q('.dsu-slats')
  ui.voice = q('.dsu-voice')
  ui.meta = q('.dsu-meta')
  ui.meta1 = q('.dsu-meta-1')
  ui.meta2 = q('.dsu-meta-2')

  /* 内容填充 */
  ui.brand1.textContent = C.brand1
  ui.brand2.textContent = C.brand2
  ui.brand3b.textContent = C.brand3a
  ui.brand3s.textContent = C.brand3b
  ui.footText.textContent = C.footer
  ui.w2.textContent = ''
  ui.w4.textContent = ''
  ui.idline.textContent = '· ID CONFIRMED : ' + C.identityId

  ;(function blackStage() {
    var inner = ui.blackInner
    var whale = appIcon('dsu-whale')
    inner.appendChild(whale)
    inner.appendChild(el('div', 'dsu-black-zh', C.orgZh))
    var en = el('div', 'dsu-black-en', C.orgEn)
    inner.appendChild(en)
    inner.appendChild(el('div', 'dsu-black-sub', C.orgSub))
    ui.blackEn = en
  })()

  ;(function logoStage() {
    ui.logo.appendChild(appIcon('dsu-whale'))
    ui.logo.appendChild(el('div', 'dsu-logolabel', 'D E E P S E E K'))
  })()

  ;(function welcomeLogo() {
    ui.w3.appendChild(appIcon('dsu-whale'))
    ui.w3.appendChild(el('span', 'dsu-w3label', 'D E E P S E E K  ·  H A R N E S S'))
  })()

  ;(function watermark() {
    var boxes = [
      [0.60, 0.02, 0.16, 0.96], [0.78, 0.02, 0.16, 0.96], [0.96, 0.02, 0.16, 0.96],
      [0.05, 0.02, 0.10, 0.5]
    ]
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]
      var n = el('div', 'dsu-wm')
      n.style.left = (b[0] * 100) + '%'
      n.style.top = (b[1] * 100) + '%'
      n.style.width = (b[2] * 100) + '%'
      n.style.height = (b[3] * 100) + '%'
      ui.watermark.appendChild(n)
    }
  })()

  /* 左侧六格阶段柱 + 品牌块下方的小字数据行 + 实时时钟 */
  ;(function slatsAndMeta() {
    for (var i = 0; i < STEPS.length + 1; i++) ui.slats.appendChild(el('i', 'dsu-slat'))
    ui.meta1.textContent = 'REV ' + (window.__DSH_REDSTAR_VERSION__ || '0.1.0') + ' · HARNESS'
    paintClock()
    clockTimer = setInterval(paintClock, 1000)
  })()

  ;(function reticle() {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 400 400')
    function arc(cx, cy, r, a0, a1, cls, cap) {
      var rad = function (d) { return (d - 90) * Math.PI / 180 }
      var x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0))
      var x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1))
      var large = (a1 - a0) > 180 ? 1 : 0
      var p = document.createElementNS(ns, 'path')
      p.setAttribute('d', 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
        ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2))
      p.setAttribute('class', cls)
      if (cap) p.setAttribute('stroke-linecap', cap)
      return { node: p, x: x1, y: y1, x0: x0, y0: y0 }
    }
    var gA = document.createElementNS(ns, 'g')
    gA.setAttribute('class', 'dsu-ret-rot-a')
    /* 300° 弧，缺口留在正下方 6 点钟方向：底部字幕永远不会被压到，
       弧末端圆点落在 5 点钟位置，和原片一致。 */
    var a = arc(200, 200, 150, 215, 505, 'dsu-ring-a', 'round')
    gA.appendChild(a.node)
    var da = document.createElementNS(ns, 'circle')
    da.setAttribute('class', 'dsu-dot-a')
    da.setAttribute('cx', a.x.toFixed(2)); da.setAttribute('cy', a.y.toFixed(2)); da.setAttribute('r', '7')
    gA.appendChild(da)
    svg.appendChild(gA)

    var gB = document.createElementNS(ns, 'g')
    gB.setAttribute('class', 'dsu-ret-rot-b')
    var b = arc(200, 200, 104, 200, 490, 'dsu-ring-b', 'round')
    gB.appendChild(b.node)
    var db = document.createElementNS(ns, 'circle')
    db.setAttribute('class', 'dsu-dot-b')
    db.setAttribute('cx', b.x0.toFixed(2)); db.setAttribute('cy', b.y0.toFixed(2)); db.setAttribute('r', '4')
    gB.appendChild(db)
    svg.appendChild(gB)

    var gC = document.createElementNS(ns, 'g')
    var bl = arc(200, 200, 62, 118, 242, 'dsu-bracket', 'round')
    var br = arc(200, 200, 62, 298, 62, 'dsu-bracket', 'round')
    gC.appendChild(bl.node); gC.appendChild(br.node)
    svg.appendChild(gC)

    var pts = [[152, 132], [252, 268], [278, 150]]
    for (var i = 0; i < pts.length; i++) {
      var c = document.createElementNS(ns, 'circle')
      c.setAttribute('class', 'dsu-dot-o')
      c.setAttribute('cx', pts[i][0]); c.setAttribute('cy', pts[i][1]); c.setAttribute('r', '2.8')
      svg.appendChild(c)
    }
    ui.reticle.appendChild(svg)
  })()

  /* ── 时间线引擎 ───────────────────────────────────────────────────────── */
  var timers = []
  var waiters = []
  var skipped = false
  var finished = false
  var hexTimer = null
  var hexFullTimer = null

  function ms(base) { return Math.round(base / C.speed) }

  function wait(base) {
    return new Promise(function (resolve) {
      if (skipped) return resolve()
      var done = false
      function fin() {
        if (done) return
        done = true
        var i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
        resolve()
      }
      var t = setTimeout(fin, Math.max(0, ms(base)))
      timers.push(t)
      waiters.push(fin)
    })
  }

  function waitAction() {
    return new Promise(function (resolve) {
      if (skipped || !C.requireInteraction) return resolve()
      var done = false
      function fin() {
        if (done) return
        done = true
        cleanup()
        resolve()
      }
      function onKey(e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); fin() }
      }
      function onClick(e) { e.preventDefault(); fin() }
      function cleanup() {
        ui.btn.removeEventListener('click', onClick)
        ui.action.removeEventListener('click', onClick)
        document.removeEventListener('keydown', onKey)
        var i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
      }
      ui.btn.addEventListener('click', onClick)
      ui.action.addEventListener('click', onClick)
      document.addEventListener('keydown', onKey)
      waiters.push(fin)
    })
  }

  function releaseAll() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i])
    timers.length = 0
    var list = waiters.slice()
    waiters.length = 0
    for (var j = 0; j < list.length; j++) { try { list[j]() } catch (err) { /* noop */ } }
  }

  function setProgress(p) {
    var pct = Math.max(0, Math.min(1, p))
    ui.bar.style.width = Math.round(pct * 100) + '%'
  }

  /** 六格阶段柱：走过的压暗、当前的拉满并点亮主题橙 */
  function setSlats(active) {
    var items = ui.slats.children
    for (var i = 0; i < items.length; i++) {
      var idx = i + 1
      items[i].classList.toggle('dsu-on', idx === active)
      items[i].classList.toggle('dsu-past', idx < active)
    }
  }

  /** 扫描线自上而下扫一遍（底板洗白后一次，验准时再一次） */
  function sweep() {
    if (!ui.scanline) return
    ui.scanline.classList.remove('dsu-go')
    void ui.scanline.offsetWidth
    ui.scanline.classList.add('dsu-go')
  }

  function paintClock() {
    var d = new Date()
    var pad = function (n) { return (n < 10 ? '0' : '') + n }
    ui.meta2.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }

  function setSubtitle(zh, en) {
    ui.subZh.classList.remove('dsu-in')
    ui.subEn2.classList.remove('dsu-in')
    setTimeout(function () {
      ui.subZh.textContent = zh || ''
      ui.subEn2.textContent = en || ''
      ui.subZh.classList.add('dsu-in')
      if (en) ui.subEn2.classList.add('dsu-in')
    }, ms(140))
  }

  function setStepCount(i, code) {
    var totalSteps = STEPS.length + 1
    ui.stepcount.textContent = '[ ' + String(i).padStart(2, '0') + ' / ' +
      String(totalSteps).padStart(2, '0') + ' ] ' + code
  }

  function startHex() {
    var lines = 12
    function line() {
      var s = ''
      for (var i = 0; i < 26; i++) {
        s += '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
        if (i % 2 === 1) s += ' '
      }
      return s
    }
    function paint() {
      var out = []
      for (var i = 0; i < lines; i++) out.push(line())
      ui.hex.innerHTML = out.join('<br>')
    }
    paint()
    ui.hex.classList.add('dsu-in')
    audio.tickRun()
    hexTimer = setInterval(paint, 110)
  }
  function stopHex() {
    if (hexTimer) { clearInterval(hexTimer); hexTimer = null }
    ui.hex.classList.remove('dsu-in')
  }

  /* 开场数据流：整屏细列自上而下滚动，红暗调、低对比，不抢主体 */
  function startHexFull() {
    var glyphs = '0123456789ABCDEF'
    function line(n) {
      var s = ''
      for (var i = 0; i < n; i++) {
        s += glyphs.charAt(Math.floor(Math.random() * 16))
        if (i % 2 === 1) s += ' '
      }
      return s
    }
    var colW = 86
    var cols = Math.max(10, Math.ceil(window.innerWidth / colW) + 1)
    var rows = Math.max(40, Math.ceil((window.innerHeight * 2.2) / 20) + 4)
    /* 隔行留白：让每一列读起来是"一串串掉下来的数据"，而不是铺满的十六进制墙 */
    function columnText() {
      var out = []
      for (var r = 0; r < rows; r++) out.push(Math.random() < 0.46 ? '' : line(6))
      return out.join('\n')
    }
    ui.hexFull.textContent = ''
    for (var c = 0; c < cols; c++) {
      var col = document.createElement('div')
      col.className = 'dsu-rain-col'
      col.style.left = (c * colW) + 'px'
      col.textContent = columnText()
      col.style.fontSize = (10 + Math.random() * 3).toFixed(1) + 'px'
      col.style.opacity = (0.16 + Math.random() * 0.4).toFixed(2)
      col.style.animationDuration = (2.8 + Math.random() * 5).toFixed(2) + 's'
      col.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's'
      ui.hexFull.appendChild(col)
    }
    ui.hexFull.classList.add('dsu-in')
    audio.tickRun()
    hexFullTimer = setInterval(function () {
      /* 隔一会儿换几列字符，读起来才像数据在跑 */
      var list = ui.hexFull.children
      for (var k = 0; k < 5 && list.length; k++) {
        var node = list[Math.floor(Math.random() * list.length)]
        if (!node) continue
        node.textContent = columnText()
      }
    }, 300)
  }
  function stopHexFull() {
    if (hexFullTimer) { clearInterval(hexFullTimer); hexFullTimer = null }
    ui.hexFull.classList.remove('dsu-in')
  }

  /* ── 声音 ──────────────────────────────────────────────────────────────
   * 两条独立的通道，都不依赖任何音频文件：
   *   audio —— 界面音效，WebAudio 现场合成（咔哒 / 双音确认 / 噪声扫频 / 和声钟）
   *   voice —— 女声播报，Web Speech API 念每一行的英文（照参考片的女声节奏：
   *            7.3-9.3s 念状态行、19.6-21.2s 念 PERMISSION AUTHORIZED）
   * 浏览器策略要求"先有用户手势"，所以第一次点击/按键会补一次解锁 + 补播。 */
  function clamp01(v, lo, hi) {
    var n = Number(v)
    return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo
  }

  var audio = (function () {
    var ctx = null
    function ac(force) {
      /* 语音素材要独立于「界面音效」开关：force=true 时无视 C.sound */
      if (!C.sound && !force) return null
      try {
        var AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return null
        if (!ctx) ctx = new AC()
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume()
        return ctx
      } catch (e) { return null }
    }
    function vol(gain) { return Math.max(0.0002, (gain == null ? 0.05 : gain) * clamp01(C.soundVolume, 0, 1) * 2) }
    function tone(freq, dur, type, gain, delay, glideTo) {
      var c = ac(); if (!c) return
      try {
        var t0 = c.currentTime + (delay || 0)
        var o = c.createOscillator(), g = c.createGain()
        o.type = type || 'sine'
        o.frequency.setValueAtTime(freq, t0)
        if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(vol(gain), t0 + Math.min(0.02, dur * 0.3))
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
        o.connect(g); g.connect(c.destination)
        o.start(t0); o.stop(t0 + dur + 0.03)
      } catch (e) { /* 静默降级 */ }
    }
    function noise(dur, gain) {
      var c = ac(); if (!c) return
      try {
        var n = Math.floor(c.sampleRate * dur)
        var buf = c.createBuffer(1, n, c.sampleRate)
        var d = buf.getChannelData(0)
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
        var src = c.createBufferSource(); src.buffer = buf
        var f = c.createBiquadFilter(); f.type = 'bandpass'
        f.frequency.value = 1500; f.Q.value = 0.6
        var g = c.createGain(); g.gain.value = vol(gain)
        src.connect(f); f.connect(g); g.connect(c.destination)
        src.start()
      } catch (e) { /* 静默降级 */ }
    }
    /* 从 /dsh-redstar/asset/ 拉真素材（用户音频里抠出来的"哒"）并解码缓存；
       拿不到就自动回落到下面合成的音，功能不依赖网络/素材存在与否。 */
    var buffers = {}
    var fetching = {}
    function loadAsset(name) {
      if (C.sfx === 'synth') return
      if (buffers[name] || fetching[name]) return
      fetching[name] = true
      try {
        fetch('/dsh-redstar/asset/' + name + '.mp3')
          .then(function (r) { return r.ok ? r.arrayBuffer() : null })
          .then(function (ab) { return ab ? ac().decodeAudioData(ab) : null })
          .then(function (buf) { if (buf) buffers[name] = buf })
          .catch(function () { /* 没素材就走合成音 */ })
      } catch (e) { /* fetch 不存在也一样降级 */ }
    }
    /* 素材预加载：fetch + decodeAudioData 不需要用户手势，所以加载时就拉，
       这样第一步就能用真声，而不用等用户第一次点击。 */
    var pending = {}
    function ensureAsset(name) {
      if (buffers[name]) return Promise.resolve(true)
      if (pending[name]) return pending[name]
      if (C.voiceSource === 'tts') return Promise.resolve(false)
      pending[name] = new Promise(function (resolve) {
        try {
          fetch('/dsh-redstar/asset/' + name + '.mp3')
            .then(function (r) { return r.ok ? r.arrayBuffer() : null })
            .then(function (ab) { if (!ab) return null; return ac(true).decodeAudioData(ab) })
            .then(function (buf) {
              if (buf) { buffers[name] = buf; resolve(true) } else { resolve(false) }
            })
            .catch(function () { resolve(false) })
        } catch (e) { resolve(false) }
      })
      return pending[name]
    }

    /** 播素材并等它播完，resolve 实际时长(ms)。拿不到素材 resolve 0。 */
    function playAssetAndWait(name, gain) {
      return new Promise(function (resolve) {
        var c = ac(true)
        var buf = buffers[name]
        if (!c || !buf) { resolve(0); return }
        try {
          var src = c.createBufferSource()
          src.buffer = buf
          var g = c.createGain()
          g.gain.value = Math.min(1, (gain == null ? 0.85 : gain) * clamp01(C.voiceVolume, 0, 1) * 1.6)
          src.connect(g); g.connect(c.destination)
          src.onended = function () { resolve(Math.round(buf.duration * 1000)) }
          src.start()
        } catch (e) { resolve(0) }
      })
    }

    function playAsset(name, gain) {
      var c = ac(); if (!c) return false
      var buf = buffers[name]
      if (!buf) { loadAsset(name); return false }
      try {
        var src = c.createBufferSource()
        src.buffer = buf
        var g = c.createGain()
        g.gain.value = Math.min(1, (gain == null ? 0.55 : gain) * clamp01(C.soundVolume, 0, 1) * 2)
        src.connect(g); g.connect(c.destination)
        src.start()
        return true
      } catch (e) { return false }
    }

    return {
      resume: function () { ac(); loadAsset('sfx-tick'); loadAsset('sfx-ticks-run') },
      preload: function () { loadAsset('sfx-tick'); loadAsset('sfx-ticks-run') },
      ensureAsset: ensureAsset,
      playAssetAndWait: playAssetAndWait,
      /* 文字渐显 / 阶段推进 / 按钮确认 —— 优先用真素材 */
      tick: function () { if (!playAsset('sfx-tick', 0.45)) tone(1760, 0.035, 'square', 0.022) },
      confirm: function () { if (!playAsset('sfx-tick', 0.85)) { tone(660, 0.09, 'triangle', 0.07); tone(990, 0.17, 'triangle', 0.055, 0.085) } },
      tickRun: function () { playAsset('sfx-ticks-run', 0.5) },
      step: function () { if (!playAsset('sfx-tick', 0.6)) { tone(880, 0.05, 'sine', 0.05); tone(1320, 0.07, 'sine', 0.028, 0.045) } },
      hover: function () { tone(2200, 0.02, 'sine', 0.018) },
      confirm: function () { tone(660, 0.09, 'triangle', 0.07); tone(990, 0.17, 'triangle', 0.055, 0.085) },
      sweep: function () { noise(0.75, 0.035) },
      /* 念台词之前的两声轻提示：这一笔让 TTS 从"浏览器念字"变成"系统播报" */
      cue: function () { tone(1046.5, 0.05, 'sine', 0.028); tone(1568, 0.06, 'sine', 0.02, 0.075) },
      rise: function () { tone(220, 1.1, 'sine', 0.032, 0, 990) },
      chime: function () {
        tone(659.25, 0.9, 'sine', 0.055)
        tone(830.61, 0.9, 'sine', 0.04, 0.09)
        tone(987.77, 1.3, 'sine', 0.045, 0.18)
      }
    }
  })()

  var voice = (function () {
    var supported = typeof window !== 'undefined' && !!window.speechSynthesis &&
      typeof window.SpeechSynthesisUtterance === 'function'
    var voices = []
    var picked = { en: null, zh: null }
    var meter = null
    var saidOnce = false
    var pending = { en: '', zh: '' }

    /* 想让它听起来像"AI 播报"，音色本身比什么都重要。
       同一台机器上，"Microsoft Zira Desktop" 是上世纪拼接合成，念长句塑料味很重；
       Edge 的 "... Online (Natural)"、Chrome 的 "Google ..."、macOS 的 Siri 才是神经网络音色。
       所以这里按分数挑，而不是挨个名字第一个命中。 */
    var NATURAL_HINTS = ['natural', 'neural', 'online', 'premium', 'enhanced', 'siri', 'google']
    var FEMALE_HINTS = [
      'aria', 'jenny', 'michelle', 'emma', 'ava', 'libby', 'sonia', 'maisie',
      'zira', 'samantha', 'karen', 'moira', 'tessa', 'victoria', 'serena', 'allison',
      'susan', 'fiona', 'hazel', 'female', 'woman',
      'xiaoxiao', 'xiaoyi', 'xiaomo', 'huihui', 'yaoyao', '晓晓', '晓伊', '女声'
    ]
    var MALE_HINTS = ['david', 'mark', 'guy', 'ryan', 'george', 'daniel', 'alex', 'fred',
      'male', 'yunxi', 'yunjian', 'kangkang']

    /** 给一个音色打分：神经网络 > 女声 > 语种吻合 > 本地 */
    function score(v, want) {
      var name = String(v.name || '').toLowerCase()
      var lang = String(v.lang || '').toLowerCase()
      var sc = 0
      for (var i = 0; i < NATURAL_HINTS.length; i++) {
        if (name.indexOf(NATURAL_HINTS[i]) !== -1) { sc += 60; break }
      }
      for (var j = 0; j < FEMALE_HINTS.length; j++) {
        if (name.indexOf(FEMALE_HINTS[j]) !== -1) { sc += 40; break }
      }
      for (var k = 0; k < MALE_HINTS.length; k++) {
        if (name.indexOf(MALE_HINTS[k]) !== -1) { sc -= 45; break }
      }
      if (lang.indexOf(want) === 0) sc += 25
      if (v.localService) sc += 4          /* 本地音色起播快，不会先卡半秒 */
      if (v.default) sc += 3
      return sc
    }

    /** 挑某语种最合适的一个音色（want 传 'en' / 'zh' 这样的两字母前缀） */
    function bestFor(want) {
      if (!voices.length) return null
      if (C.voiceName) {
        for (var i = 0; i < voices.length; i++) {
          var v = voices[i]
          if (v.name === C.voiceName && String(v.lang || '').toLowerCase().indexOf(want) === 0) return v
        }
      }
      var pool = []
      for (var j = 0; j < voices.length; j++) {
        if (String(voices[j].lang || '').toLowerCase().indexOf(want) === 0) pool.push(voices[j])
      }
      if (!pool.length) pool = voices.slice()
      var best = null
      var bs = -1e9
      for (var n = 0; n < pool.length; n++) {
        var sc = score(pool[n], want)
        if (sc > bs) { bs = sc; best = pool[n] }
      }
      return best
    }

    function setMeter(on) { if (meter) meter.classList.toggle('dsu-on', !!on) }

    function load() {
      if (!supported) return
      try { voices = window.speechSynthesis.getVoices() || [] } catch (e) { voices = [] }
      picked.en = bestFor('en')
      picked.zh = bestFor('zh')
    }

    /** 全大写名字有些引擎会一个字母一个字母念，转成 Title Case 更像在叫名字 */
    function spokenName(name) {
      return String(name || '').replace(/\S+/g, function (w) {
        return (/^[A-Z0-9.\-]+$/.test(w) && w.length > 1) ? w.charAt(0) + w.slice(1).toLowerCase() : w
      })
    }

    function utter(text, lang) {
      try {
        var u = new window.SpeechSynthesisUtterance(text)
        var v = lang.indexOf('zh') === 0 ? picked.zh : picked.en
        if (v) { u.voice = v; u.lang = v.lang || lang } else u.lang = lang
        /* 神经网络音色在 .95 / 1.02 这个档位最像"系统在播报"：
           再快就赶，再慢就假；音调略抬一点显得干净利落 */
        u.rate = clamp01(C.voiceRate, 0.5, 2)
        u.pitch = clamp01(C.voicePitch, 0, 2)
        u.volume = clamp01(C.voiceVolume, 0, 1)
        u.onstart = function () { setMeter(true) }
        u.onend = function () { setMeter(false) }
        u.onerror = function () { setMeter(false) }
        window.speechSynthesis.speak(u)
        return true
      } catch (e) { return false }
    }

    /** 一句话的时长估算（个别引擎不触发 onend 时兜底；中文按字、英文按字符） */
    function estimateMs(items) {
      var chars = 0
      var rate = clamp01(C.voiceRate, 0.5, 2) || 1
      for (var i = 0; i < items.length; i++) {
        var t = String(items[i].t || '')
        chars += /[\u4e00-\u9fa5]/.test(t) ? t.length * 1.7 : t.length
      }
      return Math.round((chars / 13) * 1000 / rate) + 460
    }

    function buildUtter(text, lang) {
      var u = new window.SpeechSynthesisUtterance(text)
      var v = lang.indexOf('zh') === 0 ? picked.zh : picked.en
      if (v) { u.voice = v; u.lang = v.lang || lang } else u.lang = lang
      u.rate = clamp01(C.voiceRate, 0.5, 2)
      u.pitch = clamp01(C.voicePitch, 0, 2)
      u.volume = clamp01(C.voiceVolume, 0, 1)
      return u
    }

    return {
      supported: supported,
      load: load,
      attach: function (node) { meter = node },

      /**
       * 念一行，返回"这一行实际花了多久(ms)"的 Promise。
       *
       * 三个关键决定：
       *  - **不 cancel 上一句**。原来每步都 cancel，用户点快一点、或者
       *    hold 短于台词长度，语音就被硬生生掐断 —— 那正是要避免的。
       *    speechSynthesis 本身是队列，不 cancel 就是顺序播报。
       *  - 提示音响过之后留 `voiceLead` 的空白再开口，这是旁白的呼吸感。
       *  - 等 `onend` 才 resolve，动画据此决定这一步停多久；个别引擎不触发
       *    onend 时按估算兜底，绝不把动画卡死。
       */
      line: function (en, zh, asset) {
        /* 有真声素材就优先用素材（音色就是你给的那个）；拿不到再回落 TTS */
        if (asset && C.voice && C.voiceSource !== 'tts' && !finished) {
          return audio.ensureAsset(asset).then(function (ok) {
            if (!ok || finished) return 0
            if (C.voiceCue !== false) audio.cue()
            return audio.playAssetAndWait(asset, 0.85).then(function (ms) {
              if (ms > 0) setMeter(true)
              return ms
            })
          }).then(function (ms) {
            if (ms > 0) { saidOnce = true; return ms }
            return ttsLine(en, zh)
          })
        }
        return ttsLine(en, zh)
      },

      /** TTS 路径：素材缺失 / voiceSource=tts / 终幕那条动态名字 */
      tts: function (en, zh) { return ttsLine(en, zh) },

      /** 不等待的版本：设置页试听 / 任何"念完就行"的场合 */
      say: function (en, zh) { return this.line(en, zh) },

      /** 浏览器要求"先有用户手势"才放声：第一次点击/按键解锁 + 补播当前行 */
      unlock: function () {
        try { if (supported) window.speechSynthesis.resume() } catch (e) {}
        audio.resume()
        /* 预热：先无声念一个空格，把引擎唤醒，避免第一句被吃掉开头半个字 */
        if (supported && !saidOnce) {
          try {
            var w = new window.SpeechSynthesisUtterance(' ')
            w.volume = 0
            var v = picked.en || picked.zh
            if (v) { w.voice = v; w.lang = v.lang }
            window.speechSynthesis.speak(w)
          } catch (e) { /* noop */ }
        }
        if (!saidOnce && C.voice && (pending.en || pending.zh)) this.say(pending.en, pending.zh)
      },
      speakName: spokenName,
      current: function () {
        var a = picked.en ? picked.en.name : ''
        var b = picked.zh ? picked.zh.name : ''
        return a === b ? a : (a + (b ? '  /  ' + b : ''))
      },
      listVoices: function () { return voices.slice() },
      /** 只有这里才真的掐断语音（跳过 / 揭幕） */
      stop: function () { try { if (supported) window.speechSynthesis.cancel() } catch (e) {} setMeter(false) }
    }

    /** TTS 合成并等它念完，resolve 实际时长(ms)；拿不到引擎时 resolve 0。 */
    function ttsLine(en, zh) {
      return new Promise(function (resolve) {
        if (!supported || !C.voice || finished) { resolve(0); return }
        pending = { en: en || '', zh: zh || '' }
        var items = []
        var mode = C.voiceLang
        if (mode === 'zh') { if (zh) items.push({ t: zh, l: 'zh-CN' }) }
        else if (mode === 'both') {
          if (zh) items.push({ t: zh, l: 'zh-CN' })
          if (en) items.push({ t: en, l: 'en-US' })
        } else if (en) { items.push({ t: en, l: 'en-US' }) }
        if (!items.length) { resolve(0); return }

        saidOnce = true
        if (C.voiceCue !== false) audio.cue()

        var startedAt = Date.now()
        var est = estimateMs(items)
        var lead = clamp01(C.voiceLead, 0, 1200)
        var settled = false
        var watchdog = null

        function settle() {
          if (settled) return
          settled = true
          if (watchdog) clearTimeout(watchdog)
          setMeter(false)
          resolve(Math.max(0, Date.now() - startedAt))
        }

        setTimeout(function () {
          if (finished) { settle(); return }
          var last = items.length - 1
          for (var i = 0; i <= last; i++) {
            var u = buildUtter(items[i].t, items[i].l)
            if (i === last) {
              u.onstart = function () { setMeter(true) }
              u.onend = settle
              u.onerror = settle
            }
            try { window.speechSynthesis.speak(u) } catch (e) { if (i === last) settle() }
          }
          watchdog = setTimeout(settle, est + 900)
        }, lead)
      })
    }
  })()

  /* 语音/音效接线：声卡要等用户手势才能出声，这里挂一次性解锁 */
  voice.attach(q('.dsu-voice'))
  ;(function preloadVoices() {
    if (C.voiceSource === 'tts') return
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].audio) audio.ensureAsset(STEPS[i].audio)
  })()
  ;(function wireSound() {
    voice.load()
    if (voice.supported && typeof window.speechSynthesis.addEventListener === 'function') {
      try { window.speechSynthesis.addEventListener('voiceschanged', function () { voice.load() }) } catch (e) {}
    }
    var unlocked = false
    function unlock() {
      if (unlocked) return
      unlocked = true
      voice.unlock()
      document.removeEventListener('pointerdown', unlock, true)
      document.removeEventListener('keydown', unlock, true)
      document.removeEventListener('touchstart', unlock, true)
    }
    document.addEventListener('pointerdown', unlock, true)
    document.addEventListener('keydown', unlock, true)
    document.addEventListener('touchstart', unlock, true)
  })()

  /* ── 时间线 ───────────────────────────────────────────────────────────── */
  function run() {
    return Promise.resolve()
      /* 第一幕：黑幕 --> DeepSeek 标识 */
      .then(function () { return wait(820) })
      .then(function () {
        ui.blackInner.classList.add('dsu-in')
        audio.rise()
        return wait(240)
      })
      .then(function () {
        ui.blackEn.classList.add('dsu-tighten')
        return wait(880)
      })
      .then(function () {
        ui.sweep.classList.add('dsu-go')
        return wait(760)
      })
      /* 过场：过曝洗白 */
      .then(function () {
        ui.blackInner.classList.add('dsu-out')
        audio.sweep()
        ui.wash.style.transition = 'opacity ' + ms(220) + 'ms linear'
        ui.wash.style.opacity = '1'
        return wait(260)
      })
      .then(function () {
        ui.plate.style.transition = 'opacity ' + ms(900) + 'ms ease'
        ui.plate.style.opacity = '1'
        ui.watermark.style.transition = 'opacity ' + ms(1100) + 'ms ease'
        ui.watermark.style.opacity = '1'
        ui.wash.style.transition = 'opacity ' + ms(720) + 'ms cubic-bezier(.2,.9,.2,1)'
        ui.wash.style.opacity = '0'
        ui.black.style.transition = 'opacity ' + ms(720) + 'ms ease'
        ui.black.style.opacity = '0'
        return wait(760)
      })
      /* 第二幕：品牌块 / 页脚 / 进度条 */
      .then(function () {
        ui.brand.classList.add('dsu-in')
        ui.foot.classList.add('dsu-in')
        ui.stepcount.classList.add('dsu-in')
        ui.idline.classList.add('dsu-in')
        ui.frame.classList.add('dsu-in')
        ui.slats.classList.add('dsu-in')
        ui.meta.classList.add('dsu-in')
        ui.vignette.classList.add('dsu-in')
        ui.voice.classList.add('dsu-in')
        setProgress(0.12)
        setStepCount(0, 'BOOT')
        setSlats(0)
        setSubtitle('系统自检中…', 'SYSTEM SELF-CHECK')
        if (C.allowSkip) ui.skip.classList.add('dsu-in')
        return wait(700)
      })
      .then(function () { ui.black.style.display = 'none'; sweep() })
      /* 开场：全屏数据流 + 五角星旋转 + 三行光标打字检查 */
      .then(function () { return bootIntro() })
      /* 六个阶段（原互动授权流程，仅换黑红背景） */
      .then(function () { return stepLoop() })
      /* 终幕 */
      .then(function () { return finale() })
      .catch(function (err) {
        try { console.warn('[dsh-redstar-boot] 动画异常，直接揭幕：', err) } catch (e2) {}
        return finish()
      })
  }

  /* ── 开场：全屏数据流 + 快速旋转五角星 + 三行光标打字检查 ─────────────── */
  function bootIntro() {
    var rows = [
      { zh: '正在检查配置……', en: 'CHECKING CONFIGURATION' },
      { zh: '正在查询文件……', en: 'QUERYING FILES' },
      { zh: '正在链接中央服务器……', en: 'CONNECTING TO CENTRAL SERVER' }
    ]
    setProgress(0.16)
    setStepCount(0, 'BOOT')
    setSubtitle('系统启动中…', 'SYSTEM BOOTING')
    /* 五角星入场，快速旋转 */
    ui.star.classList.add('dsu-in')
    ui.star.classList.add('dsu-spin')
    /* 全屏数据流 + 打字板 */
    startHexFull()
    ui.bootlog.classList.add('dsu-in')
    ui.bootlines.innerHTML = ''
    ui.bootEn.textContent = ''
    var chain = Promise.resolve()
    rows.forEach(function (r, i) {
      chain = chain.then(function () {
        if (finished) return
        /* 上一行读完了：压暗退到背景里，只留当前这行全亮 */
        var past = ui.bootlines.children
        for (var p = 0; p < past.length; p++) past[p].classList.add('dsu-past')
        var row = el('div', 'dsu-boot-row')
        var zh = el('span', 'dsu-boot-zh')
        row.appendChild(zh)
        row.appendChild(el('i', 'dsu-boot-caret'))
        ui.bootlines.appendChild(row)
        typeIn(zh, r.zh, 80)
        void row.offsetWidth
        row.classList.add('dsu-in')
        audio.step()
        var glyphs = r.zh.replace(/\s/g, '').length
        /* 英文副标题：等中文打完再整行淡入，两行字不抢同一个呼吸 */
        ui.bootEn.textContent = r.en
        ui.bootEn.classList.remove('dsu-in')
        setTimeout(function () {
          if (finished || skipped) return
          ui.bootEn.classList.add('dsu-in')
        }, ms(260 + glyphs * 80))
        setProgress(0.16 + (i + 1) * 0.05)
        /* 等逐字打完 + 停顿 */
        return wait(ms(420 + glyphs * 80 + 780))
      })
    })
    return chain
      .then(function () { return wait(ms(500)) })
      .then(function () {
        if (finished) return
        ui.bootlog.classList.remove('dsu-in')
        ui.bootEn.classList.remove('dsu-in')
        stopHexFull()
        setProgress(0.3)
        return wait(ms(360))
      })
  }

  function stepLoop() {
    var chain = Promise.resolve()
    STEPS.forEach(function (step, i) {
      chain = chain.then(function () {
        if (finished) return
        var n = i + 1
        /* 身份读数讲的是「身份已确认」，只属于前两幕。第 3 幕起是「接收访问需求」，
           这句信息已经过期，跟着身份核验一起退场，不再一路挂到终幕。 */
        if (i >= 2) ui.idline.classList.remove('dsu-in')
        setStepCount(n, step.badge)
        setSlats(n)
        setProgress(step.progress)
        setSubtitle(step.log, step.logEn)
        audio.step()
        /* 语音在这里起头，但**不阻塞**下面的文字渐显 —— 两者同时发生 */
        var spoke = voice.line(step.say, step.zh, step.audio)

        ui.status.classList.toggle('dsu-zhline', true)
        /* 先摘掉 dsu-in 并强制一次样式计算，新的逐字 span 才会重新走渐显动画 */
        ui.status.classList.remove('dsu-in')
        ui.subEn.classList.remove('dsu-in')
        void ui.status.offsetWidth
        typeIn(ui.statusZh, step.zh, 46)
        typeIn(ui.subEn, step.en, 13)
        ui.caret.classList.toggle('dsu-on', !!step.action && step.action !== 'auto')
        requestAnimationFrame(function () {
          if (finished) return
          ui.status.classList.add('dsu-in')
          ui.subEn.classList.add('dsu-in')
        })
        ui.rule.classList.add('dsu-in')

        if (step.assembleLogo) assembleLogo()
        if (step.reticle) {
          /* 照原片：准星出现时中央只留状态字，鲸鱼标识和虚线收掉，别挤成一团 */
          ui.logo.classList.remove('dsu-in')
          ui.dots.hidden = true
          ui.reticle.classList.add('dsu-in')
          sweep()
        }
        if (step.hex) startHex()

        /* 这一步停多久 = max(视觉基准, 实际播报时长 + 收尾留白) —— 台词长就多停，
           台词短也不会干等。用户点得快时同样等这一句念完，不掐断。 */
        function holdFor(spoken) {
          var target = Math.max(ms(step.hold), (spoken || 0) + ms(240))
          return wait(Math.max(0, target - (spoken || 0)))
        }

        if (step.action === 'grant' || step.action === 'confirm') {
          showAction(step)
          return wait(520).then(function () { return waitAction() }).then(function () {
            hideAction()
            audio.confirm()
            ui.caret.classList.remove('dsu-on')
            return spoke
          }).then(function () { return wait(ms(320)) })
        }
        if (step.hex) {
          return spoke.then(holdFor).then(function () { stopHex() })
        }
        return spoke.then(holdFor)
      })
    })
    return chain
  }

  function assembleLogo() {
    ui.logo.classList.add('dsu-in')
    ui.dots.hidden = false
    var path = ui.logo.querySelector('path')
    if (path && typeof path.getTotalLength === 'function') {
      try {
        var len = path.getTotalLength()
        path.style.fill = 'none'
        path.style.stroke = 'currentColor'
        path.style.strokeWidth = '1.1'
        path.style.strokeDasharray = len
        path.style.strokeDashoffset = len
        /* 参考片的"一笔画成"：先勾线，再落墨成面 */
        path.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: ms(1400), easing: 'cubic-bezier(.55,.06,.24,1)', fill: 'forwards' }
        )
        setTimeout(function () {
          path.style.transition = 'fill ' + ms(420) + 'ms ease, stroke-width ' + ms(420) + 'ms ease'
          path.style.fill = ''
          path.style.strokeWidth = '0'
        }, ms(1450))
      } catch (err) { /* Web Animations 不可用时直接落墨 */ }
    }
    return wait(300)
  }

  function showAction(step) {
    ui.btnZh.textContent = step.btnZh
    ui.btnEn.textContent = step.btnEn
    ui.card.hidden = step.action !== 'confirm'
    if (step.action === 'confirm') {
      ui.card.innerHTML = ''
      /* 纯中文标签 + 数字/名称，去掉英文双写与主机行，别堆信息 */
      var rows = [
        ['身份名称', C.identity, true],
        ['身份编号', C.identityId, false],
        ['权限等级', C.accessLevel, false]
      ]
      rows.forEach(function (r) {
        var row = el('div', 'dsu-card-row')
        row.appendChild(el('span', null, r[0]))
        row.appendChild(el('b', r[2] ? 'dsu-zhname' : null, r[1]))
        ui.card.appendChild(row)
      })
    }
    ui.hint.innerHTML = '按 <kbd>Enter</kbd> / <kbd>Space</kbd>，或点击按钮继续'
    ui.action.classList.add('dsu-in')
    ui.btn.classList.add('dsu-pulse')
  }

  function hideAction() {
    ui.action.classList.remove('dsu-in')
    ui.btn.classList.remove('dsu-pulse')
  }

  /* 终幕逐字打字：typeIn 逐字渐显 + 末尾闪烁光标，打完摘光标 */
  function typeLine(host, text, stagger) {
    host.textContent = ''
    host.classList.remove('dsu-typed')
    host.classList.add('dsu-typing')
    host.classList.remove('dsu-in')
    void host.offsetWidth
    typeIn(host, text, stagger)
    host.classList.add('dsu-in')
    var glyphs = text.replace(/\s/g, '').length
    return wait(ms(360 + glyphs * stagger + 260)).then(function () {
      host.classList.remove('dsu-typing')
      host.classList.add('dsu-typed')
    })
  }

  /* ── 终幕：链接成功 → 光标打出中俄双语「欢迎上线，同志」→
     五角星停止旋转、移到中央、放大消失 → 揭幕 ───────────────────────── */
  function finale() {
    if (finished) return Promise.resolve()
    setStepCount(6, 'LINKED')
    setSlats(6)
    setProgress(1)
    setSubtitle('', '')
    audio.chime()

    ui.status.classList.remove('dsu-in')
    ui.subEn.classList.remove('dsu-in')
    ui.rule.classList.remove('dsu-in')
    ui.reticle.classList.remove('dsu-in')
    stopHex()
    /* 中央区（状态行/分隔线/鲸鱼/虚线）整体退场 */
    ui.center.classList.add('dsu-off')
    ui.dots.hidden = true

    /* 五角星：停止旋转，移到画面正中央（类名避开中央状态区的 .dsu-center） */
    ui.star.classList.remove('dsu-spin')
    ui.star.classList.add('dsu-mid')

    /* 终幕文字准备 */
    ui.w1.innerHTML = '链接成功<span class="dsu-w1en">CONNECTION ESTABLISHED</span>'
    ui.w2.textContent = ''
    ui.w4.textContent = ''
    ui.w2.classList.remove('dsu-in', 'dsu-typing', 'dsu-typed')
    ui.w4.classList.remove('dsu-in', 'dsu-typing', 'dsu-typed')

    return wait(420)
      .then(function () {
        ui.welcome.classList.add('dsu-in')
        ui.idline.classList.remove('dsu-in')
        return wait(620)
      })
      /* 光标打字：中文「欢迎上线，同志」 */
      .then(function () {
        return typeLine(ui.w2, '欢迎上线，同志', 95)
      })
      .then(function () { return wait(ms(300)) })
      /* 光标打字：俄文「欢迎上线，同志」 */
      .then(function () {
        return typeLine(ui.w4, 'Добро пожаловать на службу, товарищ', 52)
      })
      .then(function () { return wait(ms(620)) })
      /* 五角星放大消失 + 红光爆发（光晕 + 横扫光条 + 极短高光） */
      .then(function () {
        ui.star.classList.add('dsu-burst')
        root.classList.add('dsu-peak')
        ui.bloom.classList.add('dsu-go')
        ui.streak.classList.add('dsu-go')
        ui.flash.style.transition = 'opacity ' + ms(70) + 'ms linear'
        ui.flash.style.opacity = '0.5'
        return wait(160)
      })
      .then(function () {
        ui.flash.style.transition = 'opacity ' + ms(400) + 'ms cubic-bezier(0.4, 0, 0.2, 1)'
        ui.flash.style.opacity = '0'
        return wait(760)
      })
      /* 揭幕：整个机位后撤 + 轻微失焦 */
      .then(function () {
        root.classList.add('dsu-handoff')
        return wait(780)
      })
      .then(function () { return finish() })
  }

  function finish() {
    if (finished) return
    finished = true
    releaseAll()
    stopHex()
    stopHexFull()
    voice.stop()
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
    try {
      if (C.mode === 'session') window.sessionStorage.setItem('dsh-redstar-boot:shown', '1')
      if (C.mode === 'daily') {
        window.localStorage.setItem('dsh-redstar-boot:day', new Date().toISOString().slice(0, 10))
      }
    } catch (err) { /* 隐私模式下不可写，忽略 */ }
    /* 解锁：Host 注入的关键样式用 html.dsu-lock 锁滚动，这里必须一并摘掉，
       否则揭幕后主界面会永远滚不动。 */
    document.documentElement.classList.remove('dsu-lock')
    document.documentElement.style.overflow = ''
    if (document.body) document.body.style.overflow = ''
    root.classList.remove('dsu-boot')
    root.classList.add('dsu-gone')
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root)
      try { window.dispatchEvent(new CustomEvent('dsh-redstar:done')) } catch (err) { /* noop */ }
    }, ms(900))
  }

  function requestSkip() {
    if (skipped || finished) return
    skipped = true
    releaseAll()
    finish()
  }

  if (C.allowSkip && ui.skip) {
    ui.skip.hidden = false
    ui.skip.addEventListener('click', function (e) { e.stopPropagation(); requestSkip() })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') requestSkip()
    })
  } else if (ui.skip) {
    ui.skip.hidden = true
  }

  /* 对外 API：settings 面板里的"立即预览"按钮和重播都走它 */
  window.__DSH_REDSTAR_API__ = {
    /* 设置页试听与冒烟测试用：直接念一行 */
    speak: function (en, zh) { voice.say(en, zh) },
    speakName: function (n) { return voice.speakName(n) },
    get voice() { return voice.current() },
    replay: injectSelf,
    skip: requestSkip,
    finish: finish,
    config: C
  }

  /* 锁滚动，动画期间不露出下面的应用 */
  document.documentElement.classList.add('dsu-lock')
  document.documentElement.style.overflow = 'hidden'
  if (document.body) document.body.style.overflow = 'hidden'
  setProgress(0.05)
  root.classList.remove('dsu-boot')

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run() })
  } else {
    run()
  }
})()
