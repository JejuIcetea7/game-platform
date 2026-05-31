import { createElement, useEffect, useRef, useState } from 'react'
import './App.css'

const hallOfFameGames = [
  {
    period: '1교시',
    subject: '칠판 낙서 왕',
    metric: '완료 시간',
    records: [
      { rank: 1, name: '지우', score: '18.42초', date: '05.29' },
      { rank: 2, name: '도윤', score: '19.08초', date: '05.27' },
      { rank: 3, name: '서아', score: '20.11초', date: '05.30' },
      { rank: 4, name: '민준', score: '21.36초', date: '05.28' },
      { rank: 5, name: '하린', score: '22.04초', date: '05.26' },
    ],
  },
  {
    period: '2교시',
    subject: '선생님 몰래 춤추기',
    metric: '최고 점수',
    records: [
      { rank: 1, name: '민서', score: '98,400점', date: '05.30' },
      { rank: 2, name: '하준', score: '96,850점', date: '05.29' },
      { rank: 3, name: '유나', score: '95,200점', date: '05.28' },
      { rank: 4, name: '시우', score: '93,900점', date: '05.25' },
      { rank: 5, name: '라온', score: '92,700점', date: '05.27' },
    ],
  },
  {
    period: '점심시간',
    subject: '급식 RUN!',
    metric: '최장 거리',
    records: [],
  },
]

function readLunchrunScores() {
  try {
    const raw = localStorage.getItem('lunchrun_scores')
    const scores: Array<{ name: string; score: number; date: string }> = JSON.parse(raw || '[]')
    return scores.slice(0, 5).map((s, i) => ({
      rank: i + 1,
      name: s.name,
      score: `${s.score}m`,
      date: s.date,
    }))
  } catch {
    return []
  }
}

export default function App() {
  const heroFrameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showGame, setShowGame] = useState(false)
  const [lunchrunRecords, setLunchrunRecords] = useState(() => readLunchrunScores())

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'closeGame') setShowGame(false)
      if (e.data?.type === 'lunchrunScoreAdded') setLunchrunRecords(readLunchrunScores())
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

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
        if (r.dataset.game === 'unicycle') { setShowGame(true); return; }
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
          {showGame && (
            <iframe
              src="/games/lunch-run.html"
              style={{
                position: 'absolute', inset: 0, zIndex: 100,
                width: '100%', height: '100%', border: 'none',
              }}
              title="급식 RUN!"
              allowFullScreen
            />
          )}
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
                  <span className="name">칠판 낙서 왕</span>
                  <span className="note">(분필 금지)</span>
                </div>
              </div>
              <div className="row" data-game="lovebeat">
                <div className="check">✓</div>
                <div className="num">2교시</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">선생님 몰래</span>
                  <span className="note">춤추기 ♪♪</span>
                </div>
              </div>
              <div className="row" data-game="unicycle">
                <div className="check">✓</div>
                <div className="num">점심시간</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">급식 RUN!</span>
                  <span className="note">먼저 도착!</span>
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
              <div className="char-profile">
                <strong>아라</strong>
                <span>밝고 명량한 트러블 메이커</span>
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

      <section className="site-section hall-section">
        <div className="section-heading">
          <div>
            <h2>게임별 명예의 전당</h2>
          </div>
        </div>
        <div className="report-cards">
          {hallOfFameGames.map((game) => (
            <article className="report-card" key={game.subject}>
              <header className="report-card-head">
                <span className="period-badge">{game.period}</span>
                <div>
                  <p>성적 우수자</p>
                  <h3>{game.subject}</h3>
                </div>
              </header>

              <div className="record-labels">
                <span>순위</span>
                <span>이름</span>
                <span>{game.metric}</span>
                <span>날짜</span>
              </div>

              <ol className="record-list" aria-label={`${game.subject} 명예의 전당 TOP 5`}>
                {(game.subject === '급식 RUN!' ? lunchrunRecords : game.records).map((record) => (
                  <li className={record.rank === 1 ? 'top-record' : undefined} key={`${game.subject}-${record.rank}`}>
                    <span className="rank">{record.rank}</span>
                    <strong>{record.name}</strong>
                    <span>{record.score}</span>
                    <time dateTime={`2026-${record.date.replace('.', '-')}`}>{record.date}</time>
                  </li>
                ))}
                {game.subject === '급식 RUN!' && lunchrunRecords.length === 0 && (
                  <li style={{ textAlign: 'center', color: '#aaa', padding: '12px 0', listStyle: 'none' }}>
                    아직 기록이 없어요. 첫 번째 주자가 되어보세요!
                  </li>
                )}
              </ol>

              <div className="teacher-stamp">참 잘했어요</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
