/* global React, TOWERS, MAPS, TowerGlyph, EnemyShape, pathLength, pointAt */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// === GamePlay: a working interactive TD prototype ===
function GamePlay({ width=900, height=560, mapKey='zigzag', iconStyle='geometric', compact=false }) {
  const map = MAPS[mapKey];
  const W = width, H = height;
  const path0 = map.paths[0];

  // Convert normalized → px
  const wpToPx = useCallback((wp) => wp.map(([x,y]) => [x*W, y*H]), [W, H]);
  const pxPaths = useMemo(() => map.paths.map(wpToPx), [map, wpToPx]);

  // Game state
  const [hp, setHp] = useState(20);
  const [money, setMoney] = useState(220);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [selectedTower, setSelectedTower] = useState('basic');
  const [selectedPlaced, setSelectedPlaced] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // entities
  const [placed, setPlaced] = useState([]); // {id, towerId, x, y, level}
  const enemiesRef = useRef([]); // mutable list
  const projectilesRef = useRef([]);
  const tickRef = useRef(0);
  const lastFrameRef = useRef(performance.now());
  const spawnRef = useRef({ remaining: 0, every: 0.7, t: 0, type: 'runner' });
  const [, force] = useState(0);
  const rerender = () => force(x => x+1);

  // Disallow placement near path
  const onPath = useCallback((x, y, threshold=22) => {
    for (const points of pxPaths) {
      for (let i=1; i<points.length; i++) {
        const [x1,y1] = points[i-1], [x2,y2] = points[i];
        const dx = x2-x1, dy = y2-y1;
        const len2 = dx*dx + dy*dy || 1;
        const t = Math.max(0, Math.min(1, ((x-x1)*dx + (y-y1)*dy) / len2));
        const px = x1 + dx*t, py = y1 + dy*t;
        if (Math.hypot(x-px, y-py) < threshold) return true;
      }
    }
    return false;
  }, [pxPaths]);

  const tooClose = useCallback((x, y) => {
    return placed.some(p => Math.hypot(p.x-x, p.y-y) < 30);
  }, [placed]);

  // start a wave
  const startWave = () => {
    if (waveActive) return;
    const composition = wave % 5 === 0
      ? { count: 4 + Math.floor(wave/3), every: 1.0, type: 'boss' }
      : wave % 3 === 0
        ? { count: 18 + wave*2, every: 0.35, type: 'swarm' }
        : wave % 2 === 0
          ? { count: 8 + wave, every: 0.7, type: 'tank' }
          : { count: 10 + wave, every: 0.55, type: 'runner' };
    spawnRef.current = { remaining: composition.count, every: composition.every, t: 0, type: composition.type };
    setWaveActive(true);
  };

  const enemyStats = (type) => {
    const wScale = 1 + (wave - 1) * 0.18;
    if (type === 'runner') return { hp: 22 * wScale, speed: 60, reward: 6, kind: 'runner', size: 14 };
    if (type === 'tank')   return { hp: 80 * wScale, speed: 36, reward: 14, kind: 'tank',   size: 18 };
    if (type === 'swarm')  return { hp: 14 * wScale, speed: 78, reward: 4,  kind: 'swarm',  size: 11 };
    if (type === 'boss')   return { hp: 320 * wScale, speed: 30, reward: 80, kind: 'boss',  size: 26 };
    return { hp: 20, speed: 60, reward: 5, kind: 'runner', size: 14 };
  };

  // Game loop
  useEffect(() => {
    let raf;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000) * (running ? speed : 0);
      lastFrameRef.current = now;
      tickRef.current += dt;

      if (!gameOver && running) {
        // spawn
        if (waveActive && spawnRef.current.remaining > 0) {
          spawnRef.current.t += dt;
          if (spawnRef.current.t >= spawnRef.current.every) {
            spawnRef.current.t = 0;
            spawnRef.current.remaining -= 1;
            const stats = enemyStats(spawnRef.current.type);
            // pick a random path
            const pIdx = Math.floor(Math.random() * pxPaths.length);
            enemiesRef.current.push({
              id: Math.random().toString(36).slice(2),
              t: 0,
              hp: stats.hp,
              maxHp: stats.hp,
              speed: stats.speed,
              reward: stats.reward,
              kind: stats.kind,
              size: stats.size,
              pathIdx: pIdx,
              slowUntil: 0,
              poison: 0,
              poisonUntil: 0,
            });
          }
        }

        // move enemies
        const survivors = [];
        let lostHp = 0;
        let earnedMoney = 0;
        let earnedScore = 0;

        for (const e of enemiesRef.current) {
          const total = pathLength(pxPaths[e.pathIdx]);
          const slow = (tickRef.current < e.slowUntil) ? 0.5 : 1;
          e.t += (e.speed * slow * dt) / total;
          // poison DoT
          if (tickRef.current < e.poisonUntil && e.poison > 0) {
            e.hp -= e.poison * dt;
          }
          if (e.hp <= 0) {
            earnedMoney += e.reward;
            earnedScore += Math.round(e.reward * 5);
            continue;
          }
          if (e.t >= 1) {
            lostHp += e.kind === 'boss' ? 5 : 1;
            continue;
          }
          survivors.push(e);
        }
        enemiesRef.current = survivors;

        if (earnedMoney) setMoney(m => m + earnedMoney);
        if (earnedScore) setScore(s => s + earnedScore);
        if (lostHp) setHp(h => Math.max(0, h - lostHp));

        // tower fire
        const towerById = Object.fromEntries(TOWERS.map(t => [t.id, t]));
        for (const tw of placed) {
          const def = towerById[tw.towerId];
          if (!def || def.rof === 0) continue;
          tw._cd = (tw._cd || 0) - dt;

          // beacon = no fire, applies aura passively (already factored in upgrades calc could go here but kept simple)
          if (def.id === 'beacon') continue;

          if (tw._cd <= 0) {
            // damage scaled by level
            const dmg = def.dmg * (1 + (tw.level-1)*0.5);
            const range = def.rng * (1 + (tw.level-1)*0.1);
            // find targets
            const inRange = enemiesRef.current
              .map(e => {
                const [ex, ey] = pointAt(pxPaths[e.pathIdx], e.t);
                return { e, dist: Math.hypot(ex - tw.x, ey - tw.y), pos: [ex,ey] };
              })
              .filter(o => o.dist <= range)
              .sort((a,b) => b.e.t - a.e.t);

            if (inRange.length > 0) {
              tw._cd = 1 / def.rof;
              if (def.id === 'multi') {
                inRange.slice(0, 4).forEach(o => {
                  o.e.hp -= dmg;
                  projectilesRef.current.push({ x: tw.x, y: tw.y, tx: o.pos[0], ty: o.pos[1], life: 0.18, color: def.color, kind:'line' });
                });
              } else if (def.id === 'cannon') {
                const target = inRange[0];
                projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.25, color: def.color, kind:'splash' });
                // splash 50px
                enemiesRef.current.forEach(e2 => {
                  const [ex,ey] = pointAt(pxPaths[e2.pathIdx], e2.t);
                  if (Math.hypot(ex - target.pos[0], ey - target.pos[1]) < 50) e2.hp -= dmg;
                });
              } else if (def.id === 'frost') {
                inRange.slice(0,3).forEach(o => {
                  o.e.hp -= dmg;
                  o.e.slowUntil = tickRef.current + 1.5;
                  projectilesRef.current.push({ x: tw.x, y: tw.y, tx: o.pos[0], ty: o.pos[1], life: 0.2, color: def.color, kind:'line' });
                });
              } else if (def.id === 'venom') {
                const target = inRange[0];
                target.e.hp -= dmg;
                target.e.poison = (target.e.poison || 0) + 4 * tw.level;
                target.e.poisonUntil = tickRef.current + 3;
                projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.2, color: def.color, kind:'line' });
              } else if (def.id === 'shock') {
                let prev = [tw.x, tw.y];
                inRange.slice(0,3).forEach(o => {
                  o.e.hp -= dmg;
                  projectilesRef.current.push({ x: prev[0], y: prev[1], tx: o.pos[0], ty: o.pos[1], life: 0.15, color: def.color, kind:'bolt' });
                  prev = o.pos;
                });
              } else if (def.id === 'sniper') {
                const target = inRange[0];
                target.e.hp -= dmg;
                projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.12, color: def.color, kind:'line' });
              } else {
                const target = inRange[0];
                target.e.hp -= dmg;
                projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.16, color: def.color, kind:'dot' });
              }
            }
          }
        }

        // projectiles decay
        projectilesRef.current = projectilesRef.current
          .map(p => ({ ...p, life: p.life - dt }))
          .filter(p => p.life > 0);

        // wave end
        if (waveActive && spawnRef.current.remaining === 0 && enemiesRef.current.length === 0) {
          setWaveActive(false);
          setMoney(m => m + 40 + wave * 8);
          setWave(w => w + 1);
        }
      }

      rerender();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [waveActive, wave, running, speed, gameOver, placed, pxPaths]);

  // Game over
  useEffect(() => { if (hp <= 0 && !gameOver) { setGameOver(true); setRunning(false); } }, [hp, gameOver]);

  const placeTower = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // click a placed tower?
    const hit = placed.find(p => Math.hypot(p.x - x, p.y - y) < 18);
    if (hit) { setSelectedPlaced(hit.id); return; }

    const def = TOWERS.find(t => t.id === selectedTower);
    if (!def) return;
    if (money < def.cost) return;
    if (onPath(x, y)) return;
    if (tooClose(x, y)) return;

    setPlaced(p => [...p, { id: Math.random().toString(36).slice(2), towerId: def.id, x, y, level: 1, _cd: 0 }]);
    setMoney(m => m - def.cost);
    setSelectedPlaced(null);
  };

  const upgradeSelected = () => {
    if (!selectedPlaced) return;
    const tw = placed.find(p => p.id === selectedPlaced);
    if (!tw) return;
    const def = TOWERS.find(t => t.id === tw.towerId);
    const cost = Math.round(def.cost * 0.6 * tw.level);
    if (money < cost || tw.level >= 4) return;
    setMoney(m => m - cost);
    setPlaced(arr => arr.map(p => p.id === tw.id ? { ...p, level: p.level+1 } : p));
  };

  const sellSelected = () => {
    if (!selectedPlaced) return;
    const tw = placed.find(p => p.id === selectedPlaced);
    if (!tw) return;
    const def = TOWERS.find(t => t.id === tw.towerId);
    setMoney(m => m + Math.round(def.cost * 0.6 * tw.level));
    setPlaced(arr => arr.filter(p => p.id !== tw.id));
    setSelectedPlaced(null);
  };

  // Render path SVG
  const pathD = pxPaths.map(points => {
    return 'M ' + points.map(p => p.join(',')).join(' L ');
  }).join(' ');

  const sel = placed.find(p => p.id === selectedPlaced);
  const selDef = sel ? TOWERS.find(t => t.id === sel.towerId) : null;
  const buyDef = TOWERS.find(t => t.id === selectedTower);

  return (
    <div style={{ display:'grid', gridTemplateColumns: compact ? '1fr' : `${W}px 240px`, gap: 12, color:'var(--ink)' }}>
      {/* Top bar */}
      <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid var(--line)', paddingBottom: 10 }}>
        <div style={{ display:'flex', gap: 18, alignItems:'baseline' }}>
          <div className="h-display" style={{ fontSize: 20 }}>{map.code} <span style={{color:'var(--muted)'}}>/</span> {map.name}</div>
          <div className="eyebrow">{map.difficulty}</div>
        </div>
        <div style={{ display:'flex', gap: 24, alignItems:'center' }}>
          <div className="stat"><div className="v" style={{color:'var(--accent-1)'}}>{hp}</div><div className="k">HP</div></div>
          <div className="stat"><div className="v">${money}</div><div className="k">CREDIT</div></div>
          <div className="stat"><div className="v">{wave}</div><div className="k">WAVE</div></div>
          <div className="stat"><div className="v mono">{score.toString().padStart(5,'0')}</div><div className="k">SCORE</div></div>
          <div style={{ display:'flex', gap: 6 }}>
            <button className="btn" onClick={() => setRunning(r=>!r)} style={{ padding:'8px 12px' }}>{running ? '❚❚' : '▶'}</button>
            <button className="btn" onClick={() => setSpeed(s => s===1 ? 2 : s===2 ? 3 : 1)} style={{ padding:'8px 12px' }}>{speed}×</button>
          </div>
        </div>
      </div>

      {/* Field */}
      <div style={{ position:'relative' }}>
        <div
          className="dot-bg"
          style={{ position:'relative', width: W, height: H, background:'var(--bg-2)', border:'2px solid var(--line)', cursor: 'crosshair', overflow:'hidden' }}
          onClick={placeTower}
          onMouseMove={e => {
            const r = e.currentTarget.getBoundingClientRect();
            setHoverCell([e.clientX - r.left, e.clientY - r.top]);
          }}
          onMouseLeave={() => setHoverCell(null)}
        >
          {/* Path */}
          <svg width={W} height={H} style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            <path d={pathD} stroke="var(--line)" strokeWidth={26} fill="none" strokeLinejoin="miter" strokeLinecap="butt" opacity={0.08} />
            <path d={pathD} stroke="var(--line)" strokeWidth={2} fill="none" strokeDasharray="4 6" />
            {/* start/end markers */}
            {pxPaths.map((pts, i) => (
              <g key={i}>
                <circle cx={pts[0][0]} cy={pts[0][1]} r={9} fill="var(--accent-2)" stroke="var(--line)" strokeWidth={2} />
                <polygon points={`${pts[pts.length-1][0]-7},${pts[pts.length-1][1]-7} ${pts[pts.length-1][0]+7},${pts[pts.length-1][1]} ${pts[pts.length-1][0]-7},${pts[pts.length-1][1]+7}`} fill="var(--accent-1)" stroke="var(--line)" strokeWidth={2} />
              </g>
            ))}

            {/* projectiles */}
            {projectilesRef.current.map((p, idx) => {
              if (p.kind === 'splash') {
                return <circle key={idx} cx={p.tx} cy={p.ty} r={50 * (1 - p.life/0.25)} fill="none" stroke={p.color} strokeWidth={3} opacity={p.life/0.25} />;
              }
              if (p.kind === 'bolt') {
                const mx = (p.x + p.tx)/2 + (Math.random()-0.5) * 10;
                const my = (p.y + p.ty)/2 + (Math.random()-0.5) * 10;
                return <polyline key={idx} points={`${p.x},${p.y} ${mx},${my} ${p.tx},${p.ty}`} fill="none" stroke={p.color} strokeWidth={2} opacity={p.life/0.15} />;
              }
              if (p.kind === 'dot') {
                return <circle key={idx} cx={p.tx} cy={p.ty} r={4} fill={p.color} opacity={p.life/0.16} />;
              }
              return <line key={idx} x1={p.x} y1={p.y} x2={p.tx} y2={p.ty} stroke={p.color} strokeWidth={2} opacity={Math.min(1, p.life*5)} />;
            })}

            {/* tower range when selected or hovering */}
            {sel && (() => {
              const def = TOWERS.find(t => t.id === sel.towerId);
              const rng = def.rng * (1 + (sel.level-1)*0.1);
              return <circle cx={sel.x} cy={sel.y} r={rng} fill={def.color} fillOpacity={0.06} stroke={def.color} strokeWidth={1.5} strokeDasharray="3 4" />;
            })()}
            {hoverCell && !sel && buyDef && money >= buyDef.cost && !onPath(hoverCell[0], hoverCell[1]) && !tooClose(hoverCell[0], hoverCell[1]) && (
              <circle cx={hoverCell[0]} cy={hoverCell[1]} r={buyDef.rng} fill={buyDef.color} fillOpacity={0.06} stroke={buyDef.color} strokeWidth={1} strokeDasharray="3 4" />
            )}
          </svg>

          {/* hover ghost */}
          {hoverCell && !sel && buyDef && (
            <div style={{
              position:'absolute', left: hoverCell[0]-16, top: hoverCell[1]-16,
              width: 32, height: 32, pointerEvents:'none',
              opacity: (onPath(hoverCell[0], hoverCell[1]) || tooClose(hoverCell[0], hoverCell[1]) || money < buyDef.cost) ? 0.3 : 0.7,
              filter: (onPath(hoverCell[0], hoverCell[1]) || tooClose(hoverCell[0], hoverCell[1])) ? 'grayscale(1)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <TowerGlyph id={buyDef.id} size={32} style={iconStyle} color={buyDef.color} />
            </div>
          )}

          {/* enemies */}
          {enemiesRef.current.map(e => {
            const [x,y] = pointAt(pxPaths[e.pathIdx], e.t);
            const isSlow = tickRef.current < e.slowUntil;
            const isPoison = tickRef.current < e.poisonUntil;
            return (
              <div key={e.id} style={{ position:'absolute', left: x - e.size/2, top: y - e.size/2, pointerEvents:'none' }}>
                <EnemyShape kind={e.kind} size={e.size} color={isSlow ? 'var(--accent-4)' : isPoison ? 'var(--accent-6)' : 'var(--ink)'} />
                {/* hp bar */}
                <div style={{ position:'absolute', top: -6, left: 0, width: e.size, height: 3, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ width: `${Math.max(0, (e.hp/e.maxHp)*100)}%`, height: '100%', background: 'var(--accent-1)' }} />
                </div>
              </div>
            );
          })}

          {/* placed towers */}
          {placed.map(tw => {
            const def = TOWERS.find(t => t.id === tw.towerId);
            const isSel = tw.id === selectedPlaced;
            return (
              <div key={tw.id} style={{
                position:'absolute', left: tw.x-18, top: tw.y-18, width: 36, height: 36,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:'var(--paper)', border: `2px solid ${isSel ? def.color : 'var(--line)'}`,
                cursor:'pointer'
              }}
              onClick={(e)=>{ e.stopPropagation(); setSelectedPlaced(tw.id); }}
              >
                <TowerGlyph id={def.id} size={22} style={iconStyle} color={def.color} />
                {/* level pips */}
                <div style={{ position:'absolute', bottom: -7, display:'flex', gap: 2 }}>
                  {Array.from({length: tw.level}).map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, background: def.color, border:'1px solid var(--line)' }} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Game-over overlay */}
          {gameOver && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap: 12 }}>
              <div className="h-display" style={{ fontSize: 56, color:'var(--paper)' }}>BREACH</div>
              <div className="mono" style={{ color:'var(--paper)', fontSize: 12, letterSpacing:'0.2em' }}>SCORE {score} · WAVE {wave}</div>
              <button className="btn btn-accent" onClick={() => {
                setHp(20); setMoney(220); setWave(1); setScore(0); setPlaced([]);
                enemiesRef.current = []; projectilesRef.current = [];
                setGameOver(false); setRunning(true); setWaveActive(false);
              }}>RESTART</button>
            </div>
          )}
        </div>

        {/* Wave control bar */}
        <div style={{ display:'flex', gap: 8, marginTop: 8, alignItems:'center' }}>
          <button className={`btn ${waveActive ? '' : 'btn-primary'}`} disabled={waveActive || gameOver} onClick={startWave} style={{ padding:'10px 16px' }}>
            {waveActive ? `WAVE ${wave} · ACTIVE` : `▶  START WAVE ${wave}`}
          </button>
          <div className="mono" style={{ fontSize: 11, color:'var(--muted)', letterSpacing:'0.15em' }}>
            {waveActive ? `${spawnRef.current.remaining} / ${enemiesRef.current.length} REMAINING` : `NEXT: ${
              (wave+1) % 5 === 0 ? 'BOSS' :
              (wave+1) % 3 === 0 ? 'SWARM' :
              (wave+1) % 2 === 0 ? 'TANK' : 'RUNNERS'
            }`}
          </div>
        </div>
      </div>

      {/* Side panel */}
      {!compact && (
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {/* Tower shop */}
          <div className="panel-bold" style={{ padding: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>BUILD</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6 }}>
              {TOWERS.map(t => {
                const can = money >= t.cost;
                const isSel = selectedTower === t.id;
                return (
                  <button key={t.id}
                    onClick={() => { setSelectedTower(t.id); setSelectedPlaced(null); }}
                    disabled={!can}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 4,
                      padding: 8, background: isSel ? t.color : 'var(--paper)',
                      color: isSel ? 'var(--paper)' : 'var(--ink)',
                      border:`2px solid ${isSel ? t.color : 'var(--line)'}`,
                      opacity: can ? 1 : 0.4, cursor: can ? 'pointer' : 'not-allowed',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 6, width:'100%', justifyContent:'space-between' }}>
                      <TowerGlyph id={t.id} size={20} style={iconStyle} color={isSel ? 'var(--paper)' : t.color} />
                      <span className="mono" style={{ fontSize: 10 }}>${t.cost}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing:'0.12em' }}>{t.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected info */}
          <div className="panel" style={{ padding: 12, minHeight: 160 }}>
            {sel && selDef ? (
              <div>
                <div className="eyebrow">SELECTED · LV {sel.level}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop: 6 }}>
                  <TowerGlyph id={selDef.id} size={26} style={iconStyle} color={selDef.color} />
                  <div className="h-display" style={{ fontSize: 18 }}>{selDef.name}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6, marginTop: 10 }}>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{Math.round(selDef.dmg * (1 + (sel.level-1)*0.5))}</div><div className="k">DMG</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{Math.round(selDef.rng * (1 + (sel.level-1)*0.1))}</div><div className="k">RANGE</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{selDef.rof}</div><div className="k">RoF</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{selDef.type}</div><div className="k">TYPE</div></div>
                </div>
                <div style={{ display:'flex', gap: 6, marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={upgradeSelected} disabled={sel.level>=4 || money < Math.round(selDef.cost*0.6*sel.level)} style={{ padding:'8px 10px', fontSize: 10, flex: 1 }}>
                    {sel.level >= 4 ? 'MAX' : `UP $${Math.round(selDef.cost*0.6*sel.level)}`}
                  </button>
                  <button className="btn" onClick={sellSelected} style={{ padding:'8px 10px', fontSize: 10 }}>SELL</button>
                </div>
              </div>
            ) : buyDef ? (
              <div>
                <div className="eyebrow">PREVIEW</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop: 6 }}>
                  <TowerGlyph id={buyDef.id} size={26} style={iconStyle} color={buyDef.color} />
                  <div className="h-display" style={{ fontSize: 18 }}>{buyDef.name}</div>
                </div>
                <div style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 8, lineHeight: 1.4 }}>{buyDef.desc}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6, marginTop: 10 }}>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{buyDef.dmg}</div><div className="k">DMG</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{buyDef.rng}</div><div className="k">RANGE</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>{buyDef.rof}</div><div className="k">RoF</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: 16 }}>${buyDef.cost}</div><div className="k">COST</div></div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

window.GamePlay = GamePlay;
