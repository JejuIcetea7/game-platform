import { createElement, useEffect, useRef } from 'react'
import './App.css'

export default function App() {
  const heroFrameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const heroFrame = heroFrameRef.current!
    const canvas = canvasRef.current!
    const scaleCanvas = () => {
      canvas.style.transform = `scale(${heroFrame.clientWidth / 1920})`
    }
    scaleCanvas()
    const observer = new ResizeObserver(scaleCanvas)
    observer.observe(heroFrame)

    const slot = document.getElementById('hero-character') as HTMLElement
    const ph = document.getElementById('char-ph') as HTMLElement
    let placeholderObserver: MutationObserver | undefined
    if (slot && ph) {
      const syncPlaceholder = () => {
        const filled = slot.hasAttribute('filled') ||
          slot.hasAttribute('src') ||
          !!slot.querySelector('img') ||
          getComputedStyle(slot).backgroundImage !== 'none'
        ph.style.display = filled ? 'none' : 'grid'
      }
      setTimeout(syncPlaceholder, 200)
      placeholderObserver = new MutationObserver(syncPlaceholder)
      placeholderObserver.observe(slot, { attributes: true, childList: true, subtree: true })
    }

    const rowCleanups: Array<() => void> = []
    document.querySelectorAll<HTMLElement>('.row').forEach(r => {
      const onClick = () => {
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
      }
      r.addEventListener('click', onClick)
      rowCleanups.push(() => r.removeEventListener('click', onClick))
    })

    return () => {
      observer.disconnect()
      placeholderObserver?.disconnect()
      rowCleanups.forEach(cleanup => cleanup())
    }
  }, [])

  return (
    <main className="site">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            <img src="/images/main-logo.png" alt="우당탕탕 학교생활" className="hero-logo" />
          </h1>
        </div>

        <div className="hero-frame" ref={heroFrameRef}>
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

            <div className="title-wrap">
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

            <div className="doodle" style={{ left: '760px', bottom: '30px', fontSize: '28px', transform: 'rotate(-2deg)' }}>→ → →</div>

            <div className="stamp">검 인<span>校長</span></div>

            <div className="char-zone">
              {createElement('image-slot', {
                className: 'char',
                id: 'hero-character',
                shape: 'rect',
                fit: 'contain',
                placeholder: '여기에 SD 치비 캐릭터 드롭',
                src: '/characters/character.png',
              })}
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
      </section>

      <section className="site-section games-section">
        <div className="section-heading">
          <p className="eyebrow">오늘의 수업</p>
          <h2>바로 들어갈 게임</h2>
        </div>
        <div className="game-cards">
          <article className="game-card">
            <span>1교시</span>
            <h3>한붓그리기</h3>
            <p>쉬워 보여도 마지막 선 하나가 승부를 가릅니다.</p>
          </article>
          <article className="game-card">
            <span>2교시</span>
            <h3>음악시간 러브비트</h3>
            <p>분필 박자에 맞춰 리듬을 타는 교실형 미니게임.</p>
          </article>
          <article className="game-card">
            <span>점심시간</span>
            <h3>외발자전거</h3>
            <p>복도 끝까지 넘어지지 않고 달리면 오늘의 주인공.</p>
          </article>
        </div>
      </section>

      <section className="site-section notice-section">
        <div>
          <p className="eyebrow">다음 업데이트</p>
          <h2>새 시간표 준비 중</h2>
        </div>
        <p>캐릭터, 교실 소품, 게임 입장 버튼을 이 디자인 안에서 계속 확장할 수 있게 웹페이지 구조로 정리했습니다.</p>
      </section>
    </main>
  )
}
