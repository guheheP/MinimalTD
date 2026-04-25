/* global React, TOWERS, MAPS, TowerGlyph, EnemyShape */

// ============ MENU SCREEN ============
function MenuScreen({ width=900, height=560, iconStyle='geometric' }) {
  return (
    <div style={{ width, height, position:'relative', background:'var(--bg)', border:'2px solid var(--line)', overflow:'hidden' }}>
      {/* abstract composition - kandinsky-ish */}
      <svg width={width} height={height} style={{ position:'absolute', inset:0 }}>
        <defs>
          <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(17,17,17,0.18)" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#dots)" />
        {/* large abstract shapes — composition */}
        <circle cx={width*0.78} cy={height*0.30} r={120} fill="var(--accent-3)" stroke="var(--line)" strokeWidth="3" />
        <rect x={width*0.62} y={height*0.55} width="180" height="60" fill="var(--accent-2)" stroke="var(--line)" strokeWidth="3" />
        <polygon points={`${width*0.85},${height*0.78} ${width*0.95},${height*0.95} ${width*0.75},${height*0.95}`} fill="var(--accent-1)" stroke="var(--line)" strokeWidth="3" />
        <circle cx={width*0.55} cy={height*0.18} r="18" fill="var(--accent-1)" />
        <line x1={width*0.04} y1={height*0.85} x2={width*0.55} y2={height*0.85} stroke="var(--line)" strokeWidth="3" />
        <line x1={width*0.04} y1={height*0.85} x2={width*0.55} y2={height*0.85} stroke="var(--accent-1)" strokeWidth="1.5" strokeDasharray="2 4" />
      </svg>

      {/* top header */}
      <div style={{ position:'absolute', top: 24, left: 28, right: 28, display:'flex', justifyContent:'space-between' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing:'0.2em' }}>v1.0 · BUILD 0426</div>
        <div className="mono" style={{ fontSize: 11, letterSpacing:'0.2em' }}>SAVE / 02</div>
      </div>

      {/* logo */}
      <div style={{ position:'absolute', top: height*0.18, left: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>GEOMETRIC TOWER DEFENSE</div>
        <div className="h-display" style={{ fontSize: 110, lineHeight: 0.85 }}>MINIMAL<br/>TD<span style={{ color:'var(--accent-1)' }}>.</span></div>
        <div style={{ marginTop: 14, maxWidth: 380, fontSize: 13, color:'var(--ink-2)', lineHeight: 1.5 }}>
          Eight forms. Endless waves. Build, place, hold the line — abstract tower defense distilled to pure geometry.
        </div>
      </div>

      {/* menu */}
      <div style={{ position:'absolute', bottom: 36, left: 40, display:'flex', flexDirection:'column', gap: 8 }}>
        <button className="btn btn-primary" style={{ padding:'14px 26px', fontSize: 13, justifyContent:'space-between', minWidth: 240 }}>
          <span>NEW RUN</span><span>→</span>
        </button>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="btn" style={{ padding:'10px 16px', fontSize: 11, flex: 1 }}>CONTINUE</button>
          <button className="btn" style={{ padding:'10px 16px', fontSize: 11, flex: 1 }}>OPTIONS</button>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>STATS</button>
          <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>CODEX</button>
          <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>QUIT</button>
        </div>
      </div>

      {/* tower roster */}
      <div style={{ position:'absolute', right: 32, bottom: 36 }}>
        <div className="eyebrow" style={{ textAlign:'right', marginBottom: 10 }}>ARSENAL · 8</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 36px)', gap: 8 }}>
          {TOWERS.map(t => (
            <div key={t.id} style={{ width: 36, height: 36, border:'2px solid var(--line)', background:'var(--paper)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TowerGlyph id={t.id} size={22} style={iconStyle} color={t.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ MAP SELECT ============
function MapSelectScreen({ width=900, height=560, iconStyle='geometric' }) {
  const mapKeys = Object.keys(MAPS);
  return (
    <div style={{ width, height, background:'var(--bg)', border:'2px solid var(--line)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'18px 24px', borderBottom:'2px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="eyebrow">SELECT THEATER</div>
          <div className="h-display" style={{ fontSize: 28, marginTop: 4 }}>MAP REGISTRY</div>
        </div>
        <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>← BACK</button>
      </div>
      <div style={{ flex: 1, padding: 20, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14 }}>
        {mapKeys.map((k, idx) => {
          const m = MAPS[k];
          const W = 200, H = 130;
          const isSelected = idx === 1;
          return (
            <div key={k} style={{
              border:`${isSelected ? '3px' : '2px'} solid var(--line)`,
              background:'var(--paper)',
              padding: 12, display:'flex', flexDirection:'column', gap: 8,
              outline: isSelected ? '3px solid var(--accent-1)' : 'none',
              outlineOffset: isSelected ? '4px' : 0,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing:'0.18em' }}>{m.code}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing:'0.18em', color:'var(--accent-1)' }}>{m.difficulty}</div>
              </div>
              <div className="h-display" style={{ fontSize: 22 }}>{m.name}</div>
              {/* mini-map */}
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ background:'var(--bg-2)', border:'1.5px solid var(--line)' }}>
                {m.paths.map((pts, i) => {
                  const d = 'M ' + pts.map(p => `${p[0]*W},${p[1]*H}`).join(' L ');
                  return <g key={i}>
                    <path d={d} stroke="var(--line)" strokeWidth="14" opacity="0.1" fill="none" />
                    <path d={d} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
                  </g>;
                })}
                {m.paths.map((pts, i) => (
                  <g key={i}>
                    <circle cx={pts[0][0]*W} cy={pts[0][1]*H} r="4" fill="var(--accent-2)" />
                    <circle cx={pts[pts.length-1][0]*W} cy={pts[pts.length-1][1]*H} r="4" fill="var(--accent-1)" />
                  </g>
                ))}
              </svg>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 10 }} className="mono">
                <span>WAVES · ∞</span>
                <span>BEST · {idx === 0 ? 'W42' : idx === 1 ? 'W18' : '--'}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:'14px 24px', borderTop:'2px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--paper)' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing:'0.16em', color:'var(--ink-2)' }}>SELECTED · M-02 SPIRAL · MEDIUM</div>
        <button className="btn btn-primary" style={{ padding:'10px 18px', fontSize: 11 }}>DEPLOY  →</button>
      </div>
    </div>
  );
}

// ============ UPGRADE / META PROGRESSION ============
function UpgradeScreen({ width=900, height=560, iconStyle='geometric' }) {
  const upgrades = [
    { id:'basic',  lv: 4, max: 5, label:'POINT MASTERY', desc:'+10% damage per upgrade' },
    { id:'sniper', lv: 2, max: 5, label:'PIERCE MASTERY', desc:'+8% range per upgrade' },
    { id:'cannon', lv: 3, max: 5, label:'BLAST MASTERY', desc:'+15% splash radius per upgrade' },
    { id:'frost',  lv: 1, max: 5, label:'FREEZE MASTERY', desc:'+0.3s slow duration per upgrade' },
    { id:'multi',  lv: 0, max: 5, label:'SCATTER MASTERY', desc:'+1 target per upgrade' },
    { id:'venom',  lv: 2, max: 5, label:'VENOM MASTERY', desc:'+10% DoT per upgrade' },
    { id:'shock',  lv: 0, max: 5, label:'CHAIN MASTERY', desc:'+1 chain target per upgrade' },
    { id:'beacon', lv: 1, max: 5, label:'BEACON MASTERY', desc:'+5% aura buff per upgrade' },
  ];
  return (
    <div style={{ width, height, background:'var(--bg)', border:'2px solid var(--line)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'18px 24px', borderBottom:'2px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="eyebrow">META PROGRESSION</div>
          <div className="h-display" style={{ fontSize: 28, marginTop: 4 }}>RESEARCH</div>
        </div>
        <div style={{ display:'flex', gap: 18, alignItems:'baseline' }}>
          <div className="stat" style={{ alignItems:'flex-end' }}>
            <div className="v" style={{ color:'var(--accent-3)' }}>3,420</div>
            <div className="k">CORES</div>
          </div>
          <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>← BACK</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 22, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, overflowY:'auto' }}>
        {upgrades.map(u => {
          const t = TOWERS.find(x => x.id === u.id);
          return (
            <div key={u.id} className="panel" style={{ padding: 14, display:'flex', gap: 14, alignItems:'center' }}>
              <div style={{ width: 56, height: 56, border:'2px solid var(--line)', background:'var(--bg-2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }}>
                <TowerGlyph id={t.id} size={32} style={iconStyle} color={t.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 4 }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing:'0.14em', fontWeight: 600 }}>{u.label}</div>
                  <div className="mono" style={{ fontSize: 10, color:'var(--ink-2)' }}>{u.lv}/{u.max}</div>
                </div>
                <div style={{ fontSize: 11, color:'var(--ink-2)', marginBottom: 8 }}>{u.desc}</div>
                <div style={{ display:'flex', gap: 3 }}>
                  {Array.from({ length: u.max }).map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 8,
                      background: i < u.lv ? t.color : 'var(--bg-2)',
                      border:'1.5px solid var(--line)',
                    }} />
                  ))}
                </div>
              </div>
              <button className="btn" disabled={u.lv >= u.max} style={{ padding:'8px 12px', fontSize: 10, flexShrink: 0, opacity: u.lv >= u.max ? 0.4 : 1 }}>
                {u.lv >= u.max ? 'MAX' : `+ 250`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ RESULTS / VICTORY ============
function ResultsScreen({ width=900, height=560 }) {
  return (
    <div style={{ width, height, background:'var(--bg)', border:'2px solid var(--line)', position:'relative', overflow:'hidden' }}>
      <svg width={width} height={height} style={{ position:'absolute', inset:0 }}>
        <circle cx={width*0.85} cy={height*0.18} r="80" fill="var(--accent-1)" />
        <rect x={width*0.06} y={height*0.65} width="100" height="100" fill="var(--accent-2)" stroke="var(--line)" strokeWidth="3" />
        <line x1="0" y1={height*0.5} x2={width} y2={height*0.5} stroke="var(--line)" strokeWidth="2" />
      </svg>

      <div style={{ position:'absolute', top: 36, left: 40 }}>
        <div className="eyebrow" style={{ color:'var(--accent-1)' }}>RUN TERMINATED</div>
        <div className="h-display" style={{ fontSize: 88, marginTop: 8 }}>VICTORY<span style={{color:'var(--accent-1)'}}>.</span></div>
        <div className="mono" style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 10, letterSpacing:'0.16em' }}>M-02 SPIRAL · 18 WAVES · 23:14</div>
      </div>

      <div style={{ position:'absolute', bottom: 40, left: 40, right: 40, display:'flex', gap: 32, alignItems:'flex-end' }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto auto auto auto', gap:'18px 36px' }}>
          <div className="stat"><div className="v">128,420</div><div className="k">SCORE</div></div>
          <div className="stat"><div className="v">847</div><div className="k">KILLS</div></div>
          <div className="stat"><div className="v">14</div><div className="k">TOWERS</div></div>
          <div className="stat"><div className="v" style={{color:'var(--accent-3)'}}>+ 420</div><div className="k">CORES</div></div>
          <div className="stat"><div className="v">98%</div><div className="k">ACCURACY</div></div>
          <div className="stat"><div className="v">12</div><div className="k">HP LEFT</div></div>
          <div className="stat"><div className="v">$ 3,820</div><div className="k">SPENT</div></div>
          <div className="stat"><div className="v">x4</div><div className="k">COMBO</div></div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', gap: 8 }}>
          <button className="btn btn-primary" style={{ padding:'12px 22px', fontSize: 12 }}>NEXT RUN  →</button>
          <button className="btn" style={{ padding:'10px 18px', fontSize: 10 }}>RESEARCH</button>
          <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>MAIN MENU</button>
        </div>
      </div>
    </div>
  );
}

// ============ TOWER ENCYCLOPEDIA / CODEX ============
function CodexScreen({ width=900, height=560, iconStyle='geometric' }) {
  return (
    <div style={{ width, height, background:'var(--bg)', border:'2px solid var(--line)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'18px 24px', borderBottom:'2px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div className="eyebrow">ARSENAL</div>
          <div className="h-display" style={{ fontSize: 28, marginTop: 4 }}>CODEX</div>
        </div>
        <button className="btn btn-ghost" style={{ padding:'8px 14px', fontSize: 10 }}>← BACK</button>
      </div>
      <div style={{ flex: 1, padding: 18, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10 }}>
        {TOWERS.map(t => (
          <div key={t.id} className="panel" style={{ padding: 14, display:'flex', flexDirection:'column', gap: 10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing:'0.16em', color:'var(--ink-2)' }}>{`#0${TOWERS.indexOf(t)+1}`}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing:'0.16em', color: t.color }}>{t.type}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'center', padding:'10px 0' }}>
              <TowerGlyph id={t.id} size={48} style={iconStyle} color={t.color} />
            </div>
            <div className="h-display" style={{ fontSize: 18 }}>{t.name}</div>
            <div style={{ fontSize: 11, color:'var(--ink-2)', lineHeight: 1.4, minHeight: 44 }}>{t.desc}</div>
            <div style={{ borderTop:'1.5px solid var(--line)', paddingTop: 8, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 4 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing:'0.12em' }}>DMG <span style={{ color: t.color, marginLeft: 4 }}>{t.dmg}</span></div>
              <div className="mono" style={{ fontSize: 9, letterSpacing:'0.12em' }}>RNG <span style={{ color: t.color, marginLeft: 4 }}>{t.rng}</span></div>
              <div className="mono" style={{ fontSize: 9, letterSpacing:'0.12em' }}>RoF <span style={{ color: t.color, marginLeft: 4 }}>{t.rof}</span></div>
              <div className="mono" style={{ fontSize: 9, letterSpacing:'0.12em' }}>$ <span style={{ color: t.color, marginLeft: 4 }}>{t.cost}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ MOBILE PORTRAIT ============
function MobileScreen({ width=360, height=720, iconStyle='geometric' }) {
  // mini gameplay screenshot-like static view
  const fieldH = 380;
  const W = width;
  const m = MAPS.zigzag;
  const path = m.paths[0];
  const d = 'M ' + path.map(p => `${p[0]*W},${p[1]*fieldH}`).join(' L ');
  return (
    <div style={{ width, height, background:'var(--bg)', border:'2px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      {/* status bar */}
      <div style={{ height: 28, padding:'0 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1.5px solid var(--line)', flexShrink: 0 }} className="mono">
        <span style={{ fontSize: 10 }}>9:41</span>
        <span style={{ fontSize: 9, letterSpacing:'0.18em' }}>MINIMAL TD</span>
        <span style={{ fontSize: 10 }}>●●●</span>
      </div>
      {/* HUD */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderBottom:'2px solid var(--line)', flexShrink: 0 }}>
        <div className="stat"><div className="v" style={{ fontSize: 18, color:'var(--accent-1)' }}>20</div><div className="k">HP</div></div>
        <div className="stat"><div className="v" style={{ fontSize: 18 }}>$220</div><div className="k">CR</div></div>
        <div className="stat"><div className="v" style={{ fontSize: 18 }}>W3</div><div className="k">WAVE</div></div>
        <div className="stat"><div className="v" style={{ fontSize: 18 }}>1×</div><div className="k">SPD</div></div>
      </div>
      {/* field */}
      <div className="dot-bg" style={{ width: W, height: fieldH, background:'var(--bg-2)', borderBottom:'2px solid var(--line)', position:'relative', flexShrink: 0 }}>
        <svg width={W} height={fieldH} style={{ position:'absolute', inset: 0 }}>
          <path d={d} stroke="var(--line)" strokeWidth="20" opacity="0.08" fill="none" />
          <path d={d} stroke="var(--line)" strokeWidth="2" strokeDasharray="3 5" fill="none" />
          <circle cx={path[0][0]*W} cy={path[0][1]*fieldH} r="7" fill="var(--accent-2)" stroke="var(--line)" strokeWidth="2" />
        </svg>
        {/* placed towers */}
        {[
          { id:'basic', x:120, y:90 }, { id:'sniper', x:200, y:200 },
          { id:'cannon', x:80, y:240 }, { id:'frost', x:260, y:140 },
        ].map((p, i) => {
          const def = TOWERS.find(t => t.id === p.id);
          return (
            <div key={i} style={{ position:'absolute', left: p.x-14, top: p.y-14, width: 28, height: 28, background:'var(--paper)', border:'2px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TowerGlyph id={def.id} size={16} style={iconStyle} color={def.color} />
            </div>
          );
        })}
        {/* enemies */}
        <div style={{ position:'absolute', left: 60, top: 70 }}><EnemyShape kind="runner" size={14} /></div>
        <div style={{ position:'absolute', left: 110, top: 200 }}><EnemyShape kind="runner" size={14} /></div>
        <div style={{ position:'absolute', left: 240, top: 220 }}><EnemyShape kind="tank" size={18} /></div>
      </div>
      {/* tower shop */}
      <div style={{ padding:'12px 14px 8px', flex: 1, display:'flex', flexDirection:'column', gap: 8 }}>
        <div className="eyebrow">BUILD</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6 }}>
          {TOWERS.map((t, i) => {
            const isSel = i === 0;
            return (
              <div key={t.id} style={{
                aspectRatio: '1', background: isSel ? t.color : 'var(--paper)',
                border:`2px solid ${isSel ? t.color : 'var(--line)'}`,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 3, padding: 4
              }}>
                <TowerGlyph id={t.id} size={18} style={iconStyle} color={isSel ? 'var(--paper)' : t.color} />
                <div className="mono" style={{ fontSize: 8, letterSpacing:'0.08em', color: isSel ? 'var(--paper)' : 'var(--ink)' }}>${t.cost}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* bottom action */}
      <div style={{ padding:'10px 14px', borderTop:'2px solid var(--line)', display:'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ flex: 1, padding:'12px 8px', fontSize: 11 }}>▶ START W3</button>
        <button className="btn" style={{ padding:'12px 12px', fontSize: 11 }}>❚❚</button>
      </div>
    </div>
  );
}

// ============ DESIGN SYSTEM CARD ============
function SystemCard({ width=900, height=560, iconStyle='geometric' }) {
  const swatches = [
    ['--bg', 'BG'], ['--paper', 'PAPER'], ['--line', 'LINE'], ['--ink-2', 'INK-2'],
    ['--accent-1', 'A·1'], ['--accent-2', 'A·2'], ['--accent-3', 'A·3'], ['--accent-4', 'A·4'],
    ['--accent-5', 'A·5'], ['--accent-6', 'A·6'], ['--accent-7', 'A·7'], ['--accent-8', 'A·8'],
  ];
  return (
    <div style={{ width, height, background:'var(--bg)', border:'2px solid var(--line)', padding: 28, display:'flex', flexDirection:'column', gap: 18 }}>
      <div>
        <div className="eyebrow">FOUNDATION</div>
        <div className="h-display" style={{ fontSize: 40, marginTop: 4 }}>System</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap: 28, flex: 1, minHeight: 0 }}>
        <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>PALETTE</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 4 }}>
              {swatches.map(([v, label]) => (
                <div key={v} style={{ aspectRatio:'1', background:`var(${v})`, border:'2px solid var(--line)', position:'relative' }}>
                  <div className="mono" style={{ position:'absolute', bottom: 2, left: 4, fontSize: 8, letterSpacing:'0.1em', mixBlendMode:'difference', color:'#fff' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>TYPE</div>
            <div className="h-display" style={{ fontSize: 36 }}>Aa Bb 0123</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing:'0.12em', marginTop: 4 }}>SPACE GROTESK · INTER · JETBRAINS MONO</div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>COMPONENTS</div>
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center' }}>
              <button className="btn btn-primary" style={{ padding:'10px 14px', fontSize: 10 }}>PRIMARY</button>
              <button className="btn" style={{ padding:'10px 14px', fontSize: 10 }}>DEFAULT</button>
              <button className="btn btn-ghost" style={{ padding:'10px 14px', fontSize: 10 }}>GHOST</button>
              <span className="tag">TAG</span>
              <div className="stat"><div className="v" style={{ fontSize: 22 }}>128</div><div className="k">STAT</div></div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          <div className="eyebrow">SHAPE LANGUAGE</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6 }}>
            {TOWERS.map(t => (
              <div key={t.id} style={{ aspectRatio:'1', background:'var(--paper)', border:'2px solid var(--line)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 4 }}>
                <TowerGlyph id={t.id} size={28} style={iconStyle} color={t.color} />
                <div className="mono" style={{ fontSize: 8, letterSpacing:'0.12em' }}>{t.name}</div>
              </div>
            ))}
          </div>
          <div className="eyebrow" style={{ marginTop: 6 }}>ENEMY · 4 TYPES</div>
          <div style={{ display:'flex', gap: 14, padding:'10px 12px', background:'var(--paper)', border:'2px solid var(--line)' }}>
            {['runner','swarm','tank','boss'].map(k => (
              <div key={k} style={{ display:'flex', flexDirection:'column', gap: 4, alignItems:'center' }}>
                <EnemyShape kind={k} size={k==='boss'?22:k==='tank'?18:14} />
                <div className="mono" style={{ fontSize: 8, letterSpacing:'0.12em' }}>{k.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MenuScreen, MapSelectScreen, UpgradeScreen, ResultsScreen, CodexScreen, MobileScreen, SystemCard });
