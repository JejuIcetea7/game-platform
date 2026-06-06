import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { fetchAllTopScores, submitScore, type GameKey, type ScoreRecord } from './lib/scores'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const hallOfFameGames = [
  {
    period: '1교시',
    subject: '칠판 낙서 왕',
    metric: '완료 시간',
    records: [],
  },
  {
    period: '2교시',
    subject: '선생님 몰래 춤추기',
    metric: '최고 점수',
    records: [],
  },
  {
    period: '점심시간',
    subject: '급식 RUN!',
    metric: '최장 거리',
    records: [],
  },
]

const emptyScoreRecords: Record<GameKey, ScoreRecord[]> = {
  'one-line': [],
  'dance-teacher': [],
  'lunch-run': [],
}

const CHAR_FRAMES = [
  { src: '/characters/scribbling_character.png', duration: 3200 },
  { src: '/characters/surprised_character.png', duration: 700 },
  { src: '/characters/running_away_character.png', duration: 800 },
]

// ── 메인화면 배경음악 (우당탕탕 학교생활 테마) ─────────────────────────────
type StopFn = () => void
function startMainBGM(actx: AudioContext): StopFn {
  // 마스터 볼륨
  const master = actx.createGain(); master.gain.value = 0.17; master.connect(actx.destination)
  const BPM = 136, B = 60 / BPM  // 신나는 빠른 템포
  const F: Record<string,number> = {
    C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,
    C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
    C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,_:0
  }
  // ── 우당탕탕 학교 행진곡 멜로디 ──
  // 8마디 × 8박 = 64스텝 (스텝 = 8분음표)
  const MEL: string[] = [
    // 마디 1-2: 팡파르 느낌 도입
    'C5','_','C5','E5','G5','_','E5','_',
    'C5','E5','G5','C5','_','G4','A4','_',
    // 마디 3-4: 달리는 느낌
    'C5','D5','E5','F5','G5','_','G5','A5',
    'G5','E5','C5','_','D5','E5','F5','_',
    // 마디 5-6: 익살스러운 구간
    'E5','_','D5','_','C5','D5','E5','C5',
    'F5','_','E5','_','D5','E5','F5','D5',
    // 마디 7-8: 클라이맥스 → 처음으로
    'G5','_','G5','_','A5','G5','F5','E5',
    'D5','E5','F5','E5','D5','C5','_','_',
  ]
  const BASS: string[] = [
    'C3','_','G3','_','E3','_','G3','_',
    'C3','_','G3','_','C3','_','_','_',
    'C3','_','G3','_','C3','_','G3','_',
    'F3','_','C3','_','G3','_','G3','_',
    'C3','_','G3','_','C3','_','E3','_',
    'F3','_','C3','_','G3','_','D3','_',
    'G3','_','D3','_','G3','_','B3','_',
    'C3','_','G3','_','C3','_','_','_',
  ]
  let stopped = false, loop = 0
  function playNote(freq: number, t: number, dur: number, type: OscillatorType, vol: number, vib=false) {
    if(!freq || stopped) return
    const o = actx.createOscillator(), g = actx.createGain()
    o.connect(g); g.connect(master)
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t+0.015)
    g.gain.linearRampToValueAtTime(vol*0.7, t+dur*0.5)
    g.gain.linearRampToValueAtTime(0, t+dur*0.88)
    o.start(t); o.stop(t+dur)
    // 비브라토 (멜로디에만)
    if(vib) {
      const lfo = actx.createOscillator(), lfoG = actx.createGain()
      lfo.frequency.value = 5.5; lfoG.gain.value = 6
      lfo.connect(lfoG); lfoG.connect(o.frequency)
      lfo.start(t+dur*0.4); lfo.stop(t+dur)
    }
  }
  function kick(t: number) {
    const o=actx.createOscillator(), g=actx.createGain()
    o.connect(g); g.connect(master); o.type='sine'
    o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(35,t+0.12)
    g.gain.setValueAtTime(0.55,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18)
    o.start(t); o.stop(t+0.2)
  }
  function snare(t: number) {
    const buf=actx.createBuffer(1,actx.sampleRate*0.15,actx.sampleRate)
    const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(actx.sampleRate*0.05))
    const src=actx.createBufferSource(), g=actx.createGain()
    src.connect(g); g.connect(master); src.buffer=buf
    g.gain.setValueAtTime(0.35,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15)
    src.start(t); src.stop(t+0.16)
  }
  function schedule() {
    if(stopped) return
    const step = B * 0.5  // 8분음표
    const loopLen = MEL.length * step
    const s = actx.currentTime + 0.05 + loop * loopLen
    // 멜로디 (square → 브라스 느낌)
    MEL.forEach((n,i) => playNote(F[n]||0, s+i*step, step*0.78, 'square', 0.28, false))
    // 베이스 (triangle)
    BASS.forEach((n,i) => playNote(F[n]||0, s+i*step, step*0.9, 'triangle', 0.22))
    // 화음 (멜로디 3도 아래 - 따라가는 느낌)
    MEL.forEach((n,i) => {
      const f = F[n]||0; if(!f) return
      playNote(f*0.794, s+i*step, step*0.7, 'sine', 0.12)
    })
    // 드럼 패턴 (4/4박자, 8마디)
    const beats = MEL.length / 2  // 비트 수 (4분음표)
    for(let i=0;i<beats;i++) {
      const bt = s + i * B
      kick(bt)                          // 모든 박에 킥
      if(i%2===1) snare(bt)             // 2,4박에 스네어
    }
    loop++
    setTimeout(schedule, (loopLen - 0.25) * 1000)
  }
  schedule()
  return () => { stopped = true }
}

export default function App() {
  const heroFrameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showGame, setShowGame] = useState<null | 'oneLine' | 'lunch' | 'dance'>(null)
  const bgmRef = useRef<{ actx: AudioContext; stop: StopFn } | null>(null)
  const [scoreRecords, setScoreRecords] = useState(emptyScoreRecords)
  const [charFrame, setCharFrame] = useState(0)

  const refreshScores = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setScoreRecords(await fetchAllTopScores())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setCharFrame(f => (f + 1) % CHAR_FRAMES.length), CHAR_FRAMES[charFrame].duration)
    return () => clearTimeout(t)
  }, [charFrame])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void refreshScores()
    }, 0)

    const channel = supabase
      ?.channel('game-scores-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_scores' },
        () => {
          void refreshScores()
        },
      )
      .subscribe()

    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'closeGame') setShowGame(null)
      if (e.data?.type === 'submitScore') {
        const { game, name, score } = e.data as { game?: GameKey; name?: string; score?: number }
        if (!game || typeof name !== 'string' || typeof score !== 'number') return
        void submitScore(game, name, score)
          .then(refreshScores)
          .catch((error) => console.error('Failed to submit score', error))
      }
    }
    window.addEventListener('message', onMsg)
    return () => {
      window.clearTimeout(loadTimer)
      window.removeEventListener('message', onMsg)
      if (channel) void supabase?.removeChannel(channel)
    }
  }, [refreshScores])

  // 메인화면일 때만 BGM 재생 (게임 진입 시 정지)
  useEffect(() => {
    if (showGame !== null) {
      bgmRef.current?.stop()
      bgmRef.current = null
      return
    }
    // 첫 클릭 시 AudioContext 생성 (브라우저 정책)
    const start = () => {
      if (bgmRef.current) return
      const actx = new AudioContext()
      const stop = startMainBGM(actx)
      bgmRef.current = { actx, stop }
      document.removeEventListener('click', start)
      document.removeEventListener('keydown', start)
    }
    document.addEventListener('click', start)
    document.addEventListener('keydown', start)
    return () => {
      document.removeEventListener('click', start)
      document.removeEventListener('keydown', start)
    }
  }, [showGame])

  useEffect(() => {
    const heroFrame = heroFrameRef.current!
    const canvas = canvasRef.current!
    const scaleCanvas = () => {
      canvas.style.transform = `scale(${heroFrame.clientWidth / 1920})`
    }
    scaleCanvas()
    const observer = new ResizeObserver(scaleCanvas)
    observer.observe(heroFrame)

    const rowCleanups: Array<() => void> = []
    document.querySelectorAll<HTMLElement>('.row').forEach(r => {
      const onClick = () => {
        if (r.dataset.game === 'hanbutgrigi') { setShowGame('oneLine'); return; }
        if (r.dataset.game === 'unicycle') { setShowGame('lunch'); return; }
        if (r.dataset.game === 'lovebeat') { setShowGame('dance'); return; }
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
          {showGame === 'oneLine' && (
            <iframe
              src="/games/one-line.html"
              style={{
                position: 'absolute', inset: 0, zIndex: 100,
                width: '100%', height: '100%', border: 'none',
              }}
              title="칠판 낙서 왕"
              allowFullScreen
            />
          )}
          {showGame === 'lunch' && (
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
          {showGame === 'dance' && (
            <iframe
              src="/games/dance-teacher.html"
              style={{
                position: 'absolute', inset: 0, zIndex: 100,
                width: '100%', height: '100%', border: 'none',
              }}
              title="선생님 몰래 춤추기"
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
          <div className="topbar-welcome">
            미니게임 플랫폼 우당탕탕 학교생활에 오신 걸 환영합니다!
          </div>
          <div className="spacer"></div>
          <div className="iconbtn" title="소리">♪</div>
        </div>

        <div className="board-wrap">
          <div className="screw s1"></div><div className="screw s2"></div>
          <div className="screw s3"></div><div className="screw s4"></div>

          <div className="board">
            <div className="doodle" style={{ left: '30px', top: '24px', fontSize: '54px' }}>★</div>
            <div className="doodle pink" style={{ left: '84px', top: '36px', fontSize: '34px', transform: 'rotate(20deg)' }}>♡</div>
            <div className="doodle yellow twinkle" style={{ left: '140px', top: '90px', fontSize: '30px' }}>✦</div>
            <div className="doodle blue" style={{ right: '54px', top: '60px', fontSize: '50px', transform: 'rotate(-12deg)' }}>☀</div>
            <div className="doodle pink twinkle d2" style={{ right: '170px', top: '42px', fontSize: '34px' }}>✦</div>
            <div className="doodle" style={{ right: '120px', top: '120px', fontSize: '30px', transform: 'rotate(15deg)' }}>♡</div>
            <div className="doodle pink" style={{ right: '48px', top: '780px', fontSize: '38px', fontFamily: "'Nanum Pen Script',cursive", transform: 'rotate(-6deg)' }}>선생님 몰래!</div>
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
                </div>
              </div>
              <div className="row" data-game="lovebeat">
                <div className="check">✓</div>
                <div className="num">2교시</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">선생님 몰래 춤추기</span>
                </div>
              </div>
              <div className="row" data-game="unicycle">
                <div className="check">✓</div>
                <div className="num">점심시간</div>
                <div className="dash">—</div>
                <div>
                  <span className="name">급식 RUN!</span>
                </div>
              </div>
            </div>


            <div className="stamp">검 인<span>校長</span></div>

            <div className="chalk-scene-doodles">
              <span style={{ left: '1100px', top: '310px', fontSize: '52px', animationDelay: '0.2s' }}>♡</span>
              <span style={{ left: '1260px', top: '240px', fontSize: '44px', animationDelay: '0.5s' }}>★</span>
              <span style={{ left: '1440px', top: '295px', fontSize: '56px', animationDelay: '0.8s' }}>✦</span>
              <span style={{ left: '1090px', top: '465px', fontSize: '40px', animationDelay: '1.1s' }}>♪</span>
              <span style={{ left: '1370px', top: '515px', fontSize: '48px', animationDelay: '1.4s' }}>♡</span>
              <span style={{ left: '1160px', top: '590px', fontSize: '48px', animationDelay: '1.7s' }}>✧</span>
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

        <div className="char-zone">
              <img
                key={charFrame}
                src={CHAR_FRAMES[charFrame].src}
                className={`char-anim${charFrame === 2 ? ' char-anim--exit' : charFrame === 1 ? ' char-anim--surprise' : ''}`}
                alt=""
              />
              <div className="char-shadow"></div>
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
                {(game.subject === '급식 RUN!'
                  ? scoreRecords['lunch-run']
                  : game.subject === '선생님 몰래 춤추기'
                    ? scoreRecords['dance-teacher']
                    : scoreRecords['one-line']
                ).map((record) => (
                  <li className={record.rank === 1 ? 'top-record' : undefined} key={`${game.subject}-${record.rank}`}>
                    <span className="rank">{record.rank}</span>
                    <strong>{record.name}</strong>
                    <span>{record.score}</span>
                    <time dateTime={`2026-${record.date.replace('.', '-')}`}>{record.date}</time>
                  </li>
                ))}
                {game.subject === '급식 RUN!' && scoreRecords['lunch-run'].length === 0 && (
                  <li className="empty-record">
                    <strong>아직 기록이 없어요.</strong>
                    <span>첫 번째 주자가 되어보세요!</span>
                  </li>
                )}
                {game.subject === '선생님 몰래 춤추기' && scoreRecords['dance-teacher'].length === 0 && (
                  <li className="empty-record">
                    <strong>아직 기록이 없어요.</strong>
                    <span>첫 번째 댄서가 되어보세요!</span>
                  </li>
                )}
                {game.subject === '칠판 낙서 왕' && scoreRecords['one-line'].length === 0 && (
                  <li className="empty-record">
                    <strong>아직 기록이 없어요.</strong>
                    <span>첫 번째 낙서 왕이 되어보세요!</span>
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
