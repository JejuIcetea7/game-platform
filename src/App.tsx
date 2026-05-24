import { useEffect, useRef } from 'react'
import './App.css'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'image-slot': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          shape?: string
          placeholder?: string
          fit?: string
          filled?: string
        }
      }
    }
  }
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current!
    const canvas = canvasRef.current!
    const MIN = 0.1, MAX = 5
    let scale = 1, tx = 0, ty = 0

    function apply() {
      canvas.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`
    }
    function reset() {
      scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * 0.95
      scale = Math.max(MIN, Math.min(MAX, scale))
      tx = (window.innerWidth - 1920 * scale) / 2
      ty = (window.innerHeight - 1080 * scale) / 2
      apply()
    }
    reset()

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const mx = e.clientX, my = e.clientY
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
      const next = Math.max(MIN, Math.min(MAX, scale * k))
      const r = next / scale
      tx = mx - (mx - tx) * r
      ty = my - (my - ty) * r
      scale = next
      apply()
    }
    stage.addEventListener('wheel', onWheel, { passive: false })

    let down = false, dragging = false, lx = 0, ly = 0, sx = 0, sy = 0

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      down = true; lx = sx = e.clientX; ly = sy = e.clientY
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!down) return
      if (!dragging) {
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 4) return
        dragging = true
        stage.classList.add('grabbing')
      }
      tx += e.clientX - lx
      ty += e.clientY - ly
      lx = e.clientX; ly = e.clientY
      apply()
    }
    const onMouseUp = () => {
      if (dragging) {
        const block = (ev: Event) => { ev.stopPropagation(); ev.preventDefault() }
        window.addEventListener('click', block, { capture: true, once: true })
      }
      down = false; dragging = false
      stage.classList.remove('grabbing')
    }
    stage.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    let pinchDist = 0, pinchCx = 0, pinchCy = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = Array.from(e.touches)
        pinchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        pinchCx = (a.clientX + b.clientX) / 2
        pinchCy = (a.clientY + b.clientY) / 2
      } else if (e.touches.length === 1) {
        down = true; lx = sx = e.touches[0].clientX; ly = sy = e.touches[0].clientY
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const [a, b] = Array.from(e.touches)
        const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
        const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2
        const next = Math.max(MIN, Math.min(MAX, scale * (d / pinchDist)))
        const r = next / scale
        tx = cx - (cx - tx) * r + (cx - pinchCx)
        ty = cy - (cy - ty) * r + (cy - pinchCy)
        scale = next; pinchDist = d; pinchCx = cx; pinchCy = cy
        apply()
      } else if (e.touches.length === 1 && down) {
        const t = e.touches[0]
        tx += t.clientX - lx; ty += t.clientY - ly
        lx = t.clientX; ly = t.clientY
        apply()
      }
    }
    const onTouchEnd = () => { down = false; pinchDist = 0 }
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })
    stage.addEventListener('touchend', onTouchEnd)

    const onDblClick = (e: MouseEvent) => { e.preventDefault(); reset() }
    stage.addEventListener('dblclick', onDblClick)

    const slot = document.getElementById('hero-character') as HTMLElement
    const ph = document.getElementById('char-ph') as HTMLElement
    if (slot && ph) {
      const syncPlaceholder = () => {
        const filled = slot.hasAttribute('filled') ||
          !!slot.querySelector('img') ||
          getComputedStyle(slot).backgroundImage !== 'none'
        ph.style.display = filled ? 'none' : 'grid'
      }
      setTimeout(syncPlaceholder, 200)
      new MutationObserver(syncPlaceholder).observe(slot, { attributes: true, childList: true, subtree: true })
    }

    document.querySelectorAll<HTMLElement>('.row').forEach(r => {
      r.addEventListener('click', () => {
        const burst = document.createElement('div')
        burst.textContent = '✦'
        burst.style.cssText = `position:absolute;left:${r.offsetLeft + 40}px;top:${r.offsetTop - 10}px;
          font-size:60px;color:#f7b6c4;text-shadow:0 0 10px #fff;pointer-events:none;
          transition:transform .6s ease, opacity .6s ease;`
        r.parentElement!.appendChild(burst)
        requestAnimationFrame(() => {
          burst.style.transform = 'translateY(-40px) scale(1.6) rotate(20deg)'
          burst.style.opacity = '0'
        })
        setTimeout(() => burst.remove(), 650)
      })
    })

    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('dblclick', onDblClick)
    }
  }, [])

  return (
    <div className="stage" ref={stageRef}>
      <div className="canvas" ref={canvasRef} data-screen-label="우당탕탕 학교생활 메인">

        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id="chalkRough">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={1.4} />
          </filter>
        </svg>

        <div className="topbar">
          <div className="logo-pill">
            <div className="dot"></div>
            <div className="name">우당탕탕</div>
          </div>
          <div className="crumb">
            <div className="pin"></div>
            <div>3학년 2반 · 5월 20일 (수) · 맑음</div>
          </div>
          <div className="spacer"></div>
          <div className="iconbtn" title="설정">⚙</div>
          <div className="iconbtn" title="소리">♪</div>
          <div className="iconbtn" title="프로필">👤</div>
        </div>

        <div className="board-wrap">
          <div className="screw s1"></div><div className="screw s2"></div>
          <div className="screw s3"></div><div className="screw s4"></div>

          <div className="board">
            <div className="doodle" style={{ left: '30px', top: '24px', fontSize: '54px' }}>★</div>
            <div className="doodle pink" style={{ left: '84px', top: '36px', fontSize: '34px', transform: 'rotate(20deg)' }}>♡</div>
            <div className="doodle yellow twinkle" style={{ left: '140px', top: '90px', fontSize: '30px' }}>✦</div>
            <div className="doodle" style={{ left: '50px', top: '160px', fontSize: '28px' }}>→</div>
            <div className="doodle blue" style={{ right: '54px', top: '60px', fontSize: '50px', transform: 'rotate(-12deg)' }}>☀</div>
            <div className="doodle pink twinkle d2" style={{ right: '170px', top: '42px', fontSize: '34px' }}>✦</div>
            <div className="doodle" style={{ right: '120px', top: '120px', fontSize: '30px', transform: 'rotate(15deg)' }}>♡</div>
            <div className="doodle pink" style={{ right: '48px', top: '780px', fontSize: '38px', fontFamily: "'Nanum Pen Script',cursive", transform: 'rotate(-6deg)' }}>선생님 몰래!</div>
            <div className="doodle" style={{ right: '80px', top: '740px', fontSize: '34px', fontFamily: "'Dokdo',cursive", transform: 'rotate(8deg)' }}>↓</div>
            <div className="doodle yellow" style={{ left: '780px', top: '36px', fontSize: '40px', transform: 'rotate(-10deg)' }}>✦</div>
            <div className="doodle" style={{ left: '830px', top: '120px', fontSize: '28px', fontFamily: "'Nanum Pen Script',cursive", transform: 'rotate(6deg)' }}>D-13 시험!</div>

            <div className="title-wrap">
              <div className="title">
                <span className="a">우</span><span className="b">당</span><span className="c">탕</span><span className="d">탕</span>
                &nbsp;
                <span className="e">학</span><span className="f">교</span><span className="g">생</span><span className="h">활</span>
              </div>
              <div className="title-underline"></div>
              <div className="subtitle">오늘의 시간표</div>
            </div>

            <div className="spark twinkle" style={{ left: '240px', top: '90px', fontSize: '48px' }}>✧</div>
            <div className="spark twinkle d2" style={{ right: '240px', top: '60px', fontSize: '54px', color: 'var(--chalk-yellow)' }}>✦</div>
            <div className="spark twinkle d3" style={{ left: '540px', top: '30px', fontSize: '38px', color: 'var(--chalk-pink)' }}>✦</div>
            <div className="spark twinkle d2" style={{ right: '380px', top: '240px', fontSize: '32px' }}>✧</div>

            <div className="timetable">
              <div className="row" data-game="hanbutgrigi">
                <div className="check">✓</div>
                <div className="num">1교시</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">한붓그리기</span>
                  <span className="note">(쉬워 보임)</span>
                </div>
              </div>
              <div className="row" data-game="lovebeat">
                <div className="check">✓</div>
                <div className="num">2교시</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">음악시간</span>
                  <span className="note">러브비트 ♪♪</span>
                </div>
              </div>
              <div className="row" data-game="unicycle">
                <div className="check">✓</div>
                <div className="num">점심시간</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">외발자전거</span>
                  <span className="note">우당탕!</span>
                </div>
              </div>
            </div>

            <div className="doodle blue" style={{ left: '780px', bottom: '60px', fontSize: '36px', fontFamily: "'Nanum Pen Script',cursive", transform: 'rotate(-4deg)' }}>청소당번: 5조</div>
            <div className="doodle" style={{ left: '760px', bottom: '30px', fontSize: '28px', transform: 'rotate(-2deg)' }}>→ → →</div>

            <div className="stamp">검 인<span>校長</span></div>

            <div className="char-zone">
              <image-slot
                className="char"
                id="hero-character"
                shape="rect"
                placeholder="여기에 SD 치비 캐릭터 드롭"
              ></image-slot>
              <div className="char-placeholder" id="char-ph">
                <div className="char-card">
                  <div className="tag">MAIN CHARACTER</div>
                  <div className="who">우당탕<br />주인공</div>
                </div>
              </div>
              <div className="char-shadow"></div>
            </div>
          </div>

          <div className="tray">
            <div className="eraser" style={{ left: '140px' }}></div>
            <div className="chalk-stick" style={{ left: '320px', width: '120px', transform: 'rotate(-3deg)' }}></div>
            <div className="chalk-stick pink" style={{ left: '470px', width: '90px', transform: 'rotate(4deg)' }}></div>
            <div className="chalk-stick" style={{ left: '600px', width: '60px', transform: 'rotate(-2deg)' }}></div>
            <div className="chalk-stick yellow" style={{ left: '700px', width: '100px', transform: 'rotate(3deg)' }}></div>
            <div className="chalk-stick" style={{ left: '840px', width: '40px', transform: 'rotate(-5deg)' }}></div>
            <div className="eraser" style={{ right: '200px', width: '100px', transform: 'rotate(2deg)' }}></div>
            <div className="chalk-stick" style={{ right: '340px', width: '80px', transform: 'rotate(-4deg)' }}></div>
            <div className="chalk-stick pink" style={{ right: '440px', width: '50px', transform: 'rotate(6deg)' }}></div>
          </div>
        </div>

        <div className="floor"></div>
        <div className="desks">
          <div className="desk desk1">
            <div className="top"></div>
            <div className="legL"></div><div className="legR"></div>
            <div className="book b3"></div><div className="book"></div><div className="book b2"></div>
            <div className="chair">
              <div className="back"></div><div className="seat"></div>
              <div className="legL"></div><div className="legR"></div>
            </div>
          </div>
          <div className="desk desk2">
            <div className="top"></div>
            <div className="legL"></div><div className="legR"></div>
            <div className="book"></div><div className="book b2"></div>
            <div className="chair">
              <div className="back"></div><div className="seat"></div>
              <div className="legL"></div><div className="legR"></div>
            </div>
          </div>
          <div className="desk desk3">
            <div className="top"></div>
            <div className="legL"></div><div className="legR"></div>
            <div className="book b2"></div><div className="book b3"></div>
            <div className="chair">
              <div className="back"></div><div className="seat"></div>
              <div className="legL"></div><div className="legR"></div>
            </div>
          </div>
          <div className="desk desk4">
            <div className="top"></div>
            <div className="legL"></div><div className="legR"></div>
            <div className="book"></div>
            <div className="chair">
              <div className="back"></div><div className="seat"></div>
              <div className="legL"></div><div className="legR"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
