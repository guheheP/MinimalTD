import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TowerGlyph, EnemyShape, pathLength, pointAt } from './Towers';
import { TOWER_DEFS, TOWER_LIST, MAPS } from '../game/towers';
import { ENEMIES, scaleHp, scaleReward } from '../game/enemies';
import { getUpgradeCost, getSellValue, getWaveBonus, MAX_LEVEL } from '../game/economy';
import { getWave, buildSpawnSchedule } from '../game/waves';
import { computeAuras, getAuraDmgMul } from '../game/aura';
import { computeAllTowerEffects, computePassiveEffect, emptyEffect, masteryDmgMul } from '../game/items/effects';
import {
  emptyInventory, addItem, recordDraft, equipItem, unequipItem,
  unequipAllFromTower, rarityCounts,
} from '../game/items/inventory';
import { rollDraft, rollBossLoot, rollEnemyDrop } from '../game/items/drops';
import { getItem } from '../game/items/database';
import DraftModal from './DraftModal';
import BossChestModal from './BossChestModal';
import GlobalRelicsBar from './GlobalRelicsBar';
import TotalEffectsPanel from './TotalEffectsPanel';
import ItemSlots from './ItemSlots';
import AnimatedNumber from './AnimatedNumber';
import { formatCurrency, formatNumber, formatScore } from '../util/format';
import { useMetaStore } from '../state/metaStore';
import { calcCoresEarned, calcEssenceEarned } from '../state/rewards';
import { saveRun, clearRun } from '../state/runSave';
import { useViewport } from '../util/useViewport';
import { playSfx } from '../audio/sfx';
import { useT } from '../i18n';

const LOOT_RARITY_COLOR = {
  common: 'var(--ink-2)',
  rare: 'var(--accent-2)',
  epic: 'var(--accent-5)',
  legendary: 'var(--accent-3)',
  mythic: 'var(--accent-1)',
};

function GamePlay({ width = 900, height = 560, mapKey = 'zigzag', iconStyle = 'geometric', compact = false, onExit, resume }) {
  const map = MAPS[mapKey];
  const W = width;
  const H = height;

  const wpToPx = useCallback((wp) => wp.map(([x, y]) => [x * W, y * H]), [W, H]);
  const pxPaths = useMemo(() => map.paths.map(wpToPx), [map, wpToPx]);

  const [hp, setHp] = useState(() => resume?.hp ?? 20);
  const [money, setMoney] = useState(() => resume?.money ?? 220);
  const [wave, setWave] = useState(() => resume?.wave ?? 1);
  const [score, setScore] = useState(() => resume?.score ?? 0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [selectedTower, setSelectedTower] = useState('basic');
  const [selectedPlaced, setSelectedPlaced] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [placed, setPlaced] = useState(() => (resume?.placed ?? []).map((p) => ({ ...p, _cd: 0 })));

  const [inventory, setInventory] = useState(() => resume?.inventory ?? emptyInventory());
  const [draftPending, setDraftPending] = useState(null);
  const [bossChestPending, setBossChestPending] = useState(null);
  const [endingRun, setEndingRun] = useState(false);
  const endingRunTimerRef = useRef(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const t = useT();
  const viewport = useViewport();
  const runStartRef = useRef(performance.now());
  const seededInitialRef = useRef(!!resume);
  const exitFiredRef = useRef(false);

  const towersUnlocked = useMetaStore((s) => s.unlocks.towers);
  const itemsUnlocked = useMetaStore((s) => s.unlocks.items);
  const mastery = useMetaStore((s) => s.mastery);
  const foundry = useMetaStore((s) => s.foundry);

  const unlockedItemSet = useMemo(() => new Set(itemsUnlocked), [itemsUnlocked]);

  // Seed initial inventory slots once per run from Foundry config.
  useEffect(() => {
    if (seededInitialRef.current) return;
    if (foundry.initialSlots <= 0) return;
    const seeded = rollDraft(Math.random, foundry.initialSlots, { unlocked: unlockedItemSet, boosts: foundry.dropRateBoost });
    setInventory((inv) => seeded.reduce((acc, item) => addItem(acc, item), inv));
    seededInitialRef.current = true;
  }, [foundry.initialSlots, foundry.dropRateBoost, unlockedItemSet]);

  const enemiesRef = useRef([]);
  const projectilesRef = useRef([]);
  const particlesRef = useRef([]);    // kill shards
  const damageTextsRef = useRef([]);  // floating damage numbers
  const lootTextsRef = useRef([]);    // floating "+ITEM" notifications
  const pendingLootRef = useRef([]);  // ItemDefs to flush into inventory once per frame
  const ripplesRef = useRef([]);      // PHASE/SHIELD/BEACON visuals
  const bossWarnRef = useRef({ active: false, until: 0 });
  const tickRef = useRef(0);
  const lastFrameRef = useRef(performance.now());
  const spawnRef = useRef({ schedule: [], idx: 0, t: 0 });
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  // Responsive: outer container fills available width (capped at W); inner is fixed
  // logical W×H pixels with CSS scale transform so all coordinate math stays simple.
  const fieldOuterRef = useRef(null);
  const [fieldScale, setFieldScale] = useState(1);
  useEffect(() => {
    const node = fieldOuterRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const cw = entry.contentRect.width;
      if (cw > 0) setFieldScale(cw / W);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [W]);

  // Boss-wave detection: a wave is "boss" if any active enemy is a boss.
  const isBossWave = waveActive && enemiesRef.current.some((e) => e.kind === 'boss');

  // Per-tower item effects (rebuilt when placed/inventory/isBossWave changes).
  const towerEffects = useMemo(
    () => computeAllTowerEffects(placed, inventory, { isBossWave }),
    [placed, inventory, isBossWave],
  );

  // Passive (relic) effects, used for global behaviors like kill-cash.
  const passiveEff = useMemo(
    () => computePassiveEffect(inventory, { isBossWave }),
    [inventory, isBossWave],
  );

  // Beacon modifiers — items equipped to beacons that change aura range/buff.
  const beaconMods = useMemo(() => {
    const m = new Map();
    for (const t of placed) {
      if (t.towerId !== 'beacon') continue;
      const eff = towerEffects.get(t.id);
      if (!eff) continue;
      m.set(t.id, { rangeMul: eff.beaconRangeMul, buffAdd: eff.beaconBuffAdd });
    }
    return m;
  }, [placed, towerEffects]);

  const auras = useMemo(() => computeAuras(placed, beaconMods), [placed, beaconMods]);

  const onPath = useCallback((x, y, threshold = 22) => {
    for (const points of pxPaths) {
      for (let i = 1; i < points.length; i++) {
        const [x1, y1] = points[i - 1];
        const [x2, y2] = points[i];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        if (Math.hypot(x - px, y - py) < threshold) return true;
      }
    }
    return false;
  }, [pxPaths]);

  const tooClose = useCallback((x, y) => placed.some((p) => Math.hypot(p.x - x, p.y - y) < 30), [placed]);

  const startWave = () => {
    if (waveActive) return;
    const spec = getWave(wave);
    spawnRef.current = { schedule: buildSpawnSchedule(spec), idx: 0, t: 0 };
    setWaveActive(true);
    playSfx('wave-start');
  };

  // Damage application; ignoreArmor lets PIERCE bypass tank armor when equipped with quantum-lens.
  const applyDamage = (e, dmg, source, ignoreArmor, hitPos) => {
    const def = ENEMIES[e.kind];
    if (e.kind === 'phase' && (e.phaseInvuln ?? 0) > 0 && source !== 'dot') return;
    if (e.shielded && source !== 'dot') {
      e.shielded = false;
      // SHIELD shatter burst
      const px = hitPos?.[0] ?? 0;
      const py = hitPos?.[1] ?? 0;
      ripplesRef.current.push({ x: px, y: py, life: 0.4, maxLife: 0.4, kind: 'shield', color: 'var(--accent-8)' });
      return;
    }
    if (def?.armor && !ignoreArmor && source !== 'dot') {
      dmg *= 1 - def.armor;
    }
    if (def?.bossAura) {
      dmg *= 1 - def.bossAura;
    }
    e.hp -= dmg;
    // Hit flash
    e.flashUntil = tickRef.current + 0.12;
    // Damage popup (skip DoT to avoid spam — accumulate instead)
    if (source !== 'dot' && hitPos) {
      const big = dmg >= 25;
      damageTextsRef.current.push({
        x: hitPos[0],
        y: hitPos[1],
        value: Math.max(1, Math.round(dmg)),
        life: 0.7,
        maxLife: 0.7,
        big,
        color: big ? 'var(--accent-1)' : 'var(--paper)',
      });
    }
  };

  useEffect(() => {
    // Stable per-render. Per-enemy drops, the wave-end draft, and the boss
    // chest all need the same options shape, so we build it once instead of
    // re-allocating inside the rAF loop.
    const dropOpts = { unlocked: unlockedItemSet, boosts: foundry.dropRateBoost };
    let raf;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000) * (running ? speed : 0);
      lastFrameRef.current = now;
      tickRef.current += dt;

      if (!gameOver && running) {
        // Spawn from schedule.
        if (waveActive && spawnRef.current.idx < spawnRef.current.schedule.length) {
          spawnRef.current.t += dt;
          while (
            spawnRef.current.idx < spawnRef.current.schedule.length &&
            spawnRef.current.t >= spawnRef.current.schedule[spawnRef.current.idx].spawnAt
          ) {
            const tick = spawnRef.current.schedule[spawnRef.current.idx];
            const def = ENEMIES[tick.kind];
            const hpScaled = scaleHp(def.hpBase, wave);
            const rewardScaled = scaleReward(def.reward, wave);
            const pIdx = Math.floor(Math.random() * pxPaths.length);
            enemiesRef.current.push({
              id: Math.random().toString(36).slice(2),
              t: 0,
              hp: hpScaled,
              maxHp: hpScaled,
              speed: def.speed,
              reward: rewardScaled,
              kind: def.kind,
              size: def.size,
              pathIdx: pIdx,
              slowUntil: 0,
              poison: 0,
              poisonUntil: 0,
              shielded: !!def.shield,
              phaseTimer: 0,
              phaseInvuln: 0,
            });
            spawnRef.current.idx += 1;
          }
        }

        // Move enemies, apply DoT, reap dead/escaped.
        const survivors = [];
        let lostHp = 0;
        let earnedMoney = 0;
        let earnedScore = 0;
        let bonusCashRolls = 0;

        for (const e of enemiesRef.current) {
          if (e.kind === 'phase') {
            e.phaseTimer = (e.phaseTimer + dt) % 1.0;
            e.phaseInvuln = e.phaseTimer >= 0.6 ? 1 : 0;
          }

          const total = pathLength(pxPaths[e.pathIdx]);
          const slow = tickRef.current < e.slowUntil ? e.slowFactor ?? 0.5 : 1;
          e.t += (e.speed * slow * dt) / total;

          if (tickRef.current < e.poisonUntil && e.poison > 0) {
            applyDamage(e, e.poison * dt, 'dot', false);
          }

          if (e.hp <= 0) {
            earnedMoney += e.reward;
            earnedScore += Math.round(e.reward * 5);
            bonusCashRolls += 1;
            playSfx(e.kind === 'boss' ? 'enemy-boss-die' : 'enemy-die');
            // Kill shards
            const [kx, ky] = pointAt(pxPaths[e.pathIdx], e.t);
            // Per-enemy item drop: 2% from the non-relic pool. Relics stay
            // exclusive to the 5-wave draft. Drops are queued and flushed in
            // a single setInventory at the end of the frame.
            if (e.kind !== 'boss' && Math.random() < 0.02) {
              const dropped = rollEnemyDrop(Math.random, dropOpts);
              pendingLootRef.current.push(dropped);
              lootTextsRef.current.push({
                x: kx,
                y: ky - 8,
                name: dropped.name,
                glyph: dropped.glyph ?? '◆',
                rarity: dropped.rarity,
                life: 1.4,
                maxLife: 1.4,
              });
            }
            const shardCount = e.kind === 'boss' ? 10 : e.kind === 'tank' ? 7 : 5;
            for (let s = 0; s < shardCount; s++) {
              const ang = Math.random() * Math.PI * 2;
              const sp = 40 + Math.random() * 80;
              particlesRef.current.push({
                x: kx, y: ky,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp,
                life: 0.55, maxLife: 0.55,
                size: 3 + Math.random() * 2,
                kind: e.kind,
              });
            }
            continue;
          }
          if (e.t >= 1) {
            lostHp += e.kind === 'boss' ? 5 : 1;
            continue;
          }
          survivors.push(e);
        }
        enemiesRef.current = survivors;

        // Kill-cash relic (profit-margin etc): for each kill, roll once.
        if (passiveEff.killCashChance > 0 && bonusCashRolls > 0) {
          for (let i = 0; i < bonusCashRolls; i++) {
            if (Math.random() < passiveEff.killCashChance) {
              earnedMoney += passiveEff.killCashAmount;
            }
          }
        }

        if (earnedMoney) setMoney((m) => m + earnedMoney);
        if (earnedScore) setScore((s) => s + earnedScore);
        if (lostHp) setHp((h) => Math.max(0, h - lostHp));

        // Flush queued enemy drops in a single setInventory so multiple kills
        // in the same frame don't trigger N React updates.
        if (pendingLootRef.current.length > 0) {
          const drops = pendingLootRef.current;
          pendingLootRef.current = [];
          setInventory((inv) => drops.reduce((acc, item) => addItem(acc, item), inv));
        }

        // Tower fire.
        for (const tw of placed) {
          const def = TOWER_DEFS[tw.towerId];
          if (!def || def.rof === 0 || def.isAura) continue;
          const eff = towerEffects.get(tw.id) ?? emptyEffect();
          tw._cd = (tw._cd || 0) - dt;
          if (tw._cd > 0) continue;

          const auraMul = getAuraDmgMul(auras, tw.id);
          const masteryMul = masteryDmgMul(mastery[tw.towerId] ?? 0);
          const baseDmg = (def.dmg * (1 + (tw.level - 1) * 0.5) * auraMul * masteryMul * eff.dmgMul) + eff.dmgAdd;
          const range = def.rng * (1 + (tw.level - 1) * 0.1) * eff.rngMul + eff.rngAdd;
          const effectiveRof = def.rof * eff.rofMul + eff.rofAdd;

          const inRange = enemiesRef.current
            .map((e) => {
              const [ex, ey] = pointAt(pxPaths[e.pathIdx], e.t);
              return { e, dist: Math.hypot(ex - tw.x, ey - tw.y), pos: [ex, ey] };
            })
            .filter((o) => o.dist <= range)
            .sort((a, b) => b.e.t - a.e.t);

          if (inRange.length === 0) continue;
          tw._cd = effectiveRof > 0 ? 1 / effectiveRof : 1;
          playSfx('tower-fire');

          const ignoreArmor = eff.ignoreArmor;

          if (def.id === 'multi') {
            const targets = 4 + eff.scatterTargetsAdd;
            inRange.slice(0, targets).forEach((o) => {
              applyDamage(o.e, baseDmg, 'projectile', ignoreArmor, o.pos);
              projectilesRef.current.push({ x: tw.x, y: tw.y, tx: o.pos[0], ty: o.pos[1], life: 0.32, color: def.color, kind: 'line' });
            });
          } else if (def.id === 'cannon') {
            const target = inRange[0];
            const splash = 50 * eff.splashRangeMul;
            projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.40, color: def.color, kind: 'splash', splash, maxLife: 0.40 });
            enemiesRef.current.forEach((e2) => {
              const [ex, ey] = pointAt(pxPaths[e2.pathIdx], e2.t);
              if (Math.hypot(ex - target.pos[0], ey - target.pos[1]) < splash) applyDamage(e2, baseDmg, 'splash', ignoreArmor, [ex, ey]);
            });
          } else if (def.id === 'frost') {
            const slowFactor = Math.max(0.05, 0.5 - eff.freezeStrengthAdd);
            inRange.slice(0, 3).forEach((o) => {
              applyDamage(o.e, baseDmg, 'projectile', ignoreArmor, o.pos);
              o.e.slowUntil = tickRef.current + 1.5;
              o.e.slowFactor = slowFactor;
              projectilesRef.current.push({ x: tw.x, y: tw.y, tx: o.pos[0], ty: o.pos[1], life: 0.30, color: def.color, kind: 'line' });
            });
          } else if (def.id === 'venom') {
            const target = inRange[0];
            applyDamage(target.e, baseDmg, 'projectile', ignoreArmor, target.pos);
            const stackCap = (32 + 8 * tw.level) * eff.poisonStackMul;
            target.e.poison = Math.min(stackCap, (target.e.poison || 0) + 4 * tw.level);
            target.e.poisonUntil = eff.endlessPoison ? Number.POSITIVE_INFINITY : tickRef.current + 3;
            projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.30, color: def.color, kind: 'line' });
          } else if (def.id === 'shock') {
            const bounces = 3 + eff.chainBouncesAdd;
            let prev = [tw.x, tw.y];
            inRange.slice(0, bounces).forEach((o) => {
              applyDamage(o.e, baseDmg, 'chain', ignoreArmor, o.pos);
              projectilesRef.current.push({ x: prev[0], y: prev[1], tx: o.pos[0], ty: o.pos[1], life: 0.32, color: def.color, kind: 'bolt' });
              prev = o.pos;
            });
          } else if (def.id === 'sniper') {
            const target = inRange[0];
            applyDamage(target.e, baseDmg, 'projectile', ignoreArmor, target.pos);
            projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.30, color: def.color, kind: 'line' });
          } else {
            const target = inRange[0];
            applyDamage(target.e, baseDmg, 'projectile', ignoreArmor, target.pos);
            projectilesRef.current.push({ x: tw.x, y: tw.y, tx: target.pos[0], ty: target.pos[1], life: 0.28, color: def.color, kind: 'dot' });
          }
        }

        // Projectile decay.
        projectilesRef.current = projectilesRef.current
          .map((p) => ({ ...p, life: p.life - dt }))
          .filter((p) => p.life > 0);

        // Kill shards drift + decay.
        particlesRef.current = particlesRef.current
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            vx: p.vx * 0.92,
            vy: p.vy * 0.92,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0);

        // Damage text rise + fade.
        damageTextsRef.current = damageTextsRef.current
          .map((t) => ({ ...t, y: t.y - 28 * dt, life: t.life - dt }))
          .filter((t) => t.life > 0);

        // Loot drop notifications rise + fade (slightly faster than damage).
        lootTextsRef.current = lootTextsRef.current
          .map((d) => ({ ...d, y: d.y - 36 * dt, life: d.life - dt }))
          .filter((d) => d.life > 0);

        // Ripple decay.
        ripplesRef.current = ripplesRef.current
          .map((r) => ({ ...r, life: r.life - dt }))
          .filter((r) => r.life > 0);

        // BOSS-warning trigger
        const bossPresent = enemiesRef.current.some((e) => e.kind === 'boss');
        if (bossPresent && !bossWarnRef.current.active && bossWarnRef.current.until <= tickRef.current) {
          bossWarnRef.current = { active: true, until: tickRef.current + 1.5 };
        }
        if (bossWarnRef.current.active && tickRef.current > bossWarnRef.current.until) {
          bossWarnRef.current = { active: false, until: tickRef.current + 999 };
        }

        // Wave end.
        const allSpawned = waveActive && spawnRef.current.idx >= spawnRef.current.schedule.length;
        if (allSpawned && enemiesRef.current.length === 0) {
          const clearedWave = wave;
          const clearedSpec = getWave(clearedWave);
          const bonus = getWaveBonus(clearedWave);
          setWaveActive(false);
          setMoney((m) => m + bonus);
          setWave((w) => w + 1);
          playSfx('wave-cleared');

          // Autosave between waves so user can Continue from menu.
          saveRun({
            mapKey,
            wave: clearedWave + 1,
            hp,
            money: money + bonus,
            score,
            placed,
            inventory,
            startedAt: new Date(performance.timeOrigin + runStartRef.current).toISOString(),
          });

          // Boss kill: 2 items from the full pool, gated by the wave's
          // rarity floor (rare→epic→legendary→mythic at W30/50/100).
          if (clearedSpec.isBoss) {
            setBossChestPending(rollBossLoot(Math.random, clearedWave, 2, dropOpts));
          }
          // 5-wave draft: relic-only — relics are exclusive to this ritual,
          // so the 6 relics in the database (3 common / 1 rare / 1 epic / 1
          // mythic) are all the player ever sees here.
          if (clearedWave % 5 === 0) {
            setDraftPending({
              wave: clearedWave,
              options: rollDraft(Math.random, 3, { ...dropOpts, category: 'relic' }),
              rerollsLeft: foundry.rerollCount,
            });
          }
        }
      }

      rerender();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [waveActive, wave, running, speed, gameOver, placed, pxPaths, auras, towerEffects, passiveEff, mastery, unlockedItemSet, foundry]);

  useEffect(() => {
    if (hp <= 0 && !gameOver) {
      setGameOver(true);
      setRunning(false);
      clearRun();
      playSfx('breach');
    }
  }, [hp, gameOver]);

  // Auto-transition to Results: compute stats, apply meta once, then call onExit.
  useEffect(() => {
    if (!gameOver || !onExit || exitFiredRef.current) return;
    exitFiredRef.current = true;
    const reachedWave = Math.max(0, wave - 1);
    const localLootCounts = rarityCounts(inventory, getItem);
    const coresEarned = calcCoresEarned(reachedWave, score);
    const essenceEarned = calcEssenceEarned(localLootCounts);
    const durationMs = performance.now() - runStartRef.current;
    const meta = useMetaStore.getState();
    const beforeMaps = new Set(meta.unlocks.maps);
    meta.addCores(coresEarned);
    meta.addEssence(essenceEarned);
    meta.recordRun(mapKey, { wave: reachedWave, score, durationMs });
    const afterMaps = useMetaStore.getState().unlocks.maps;
    const newlyUnlocked = afterMaps
      .filter((k) => !beforeMaps.has(k))
      .map((k) => ({ kind: 'map', label: `${MAPS[k].name} MAP UNLOCKED` }));
    const endReason = endingRun || endingRunTimerRef.current ? 'retired' : 'breach';
    const tid = setTimeout(() => {
      onExit({
        mapKey,
        reachedWave,
        score,
        durationMs,
        endReason,
        coresEarned,
        essenceEarned,
        lootCounts: localLootCounts,
        newlyUnlocked,
      });
    }, 1500);
    return () => clearTimeout(tid);
  }, [gameOver, onExit, wave, score, inventory, mapKey, endingRun]);

  const placeTower = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    const hit = placed.find((p) => Math.hypot(p.x - x, p.y - y) < 18);
    if (hit) {
      setSelectedPlaced(hit.id);
      setPendingPlacement(null);
      return;
    }
    const def = TOWER_DEFS[selectedTower];
    if (!def) return;
    if (money < def.cost) return;
    if (onPath(x, y)) return;
    if (tooClose(x, y)) return;

    if (viewport.isCoarse) {
      const now = performance.now();
      if (
        pendingPlacement &&
        Math.hypot(pendingPlacement.x - x, pendingPlacement.y - y) < 24 &&
        now - pendingPlacement.t > 200
      ) {
        const px = pendingPlacement.x;
        const py = pendingPlacement.y;
        setPlaced((p) => [...p, { id: Math.random().toString(36).slice(2), towerId: def.id, x: px, y: py, level: 1, _cd: 0 }]);
        setMoney((m) => m - def.cost);
        setSelectedPlaced(null);
        setPendingPlacement(null);
        playSfx('tower-place');
        return;
      }
      setPendingPlacement({ x, y, t: now });
      setHoverCell([x, y]);
      return;
    }

    setPlaced((p) => [...p, { id: Math.random().toString(36).slice(2), towerId: def.id, x, y, level: 1, _cd: 0 }]);
    setMoney((m) => m - def.cost);
    setSelectedPlaced(null);
    playSfx('tower-place');
  };

  // Cancel pending placement when tower selection changes.
  useEffect(() => {
    setPendingPlacement(null);
  }, [selectedTower]);

  const upgradeSelected = () => {
    if (!selectedPlaced) return;
    const tw = placed.find((p) => p.id === selectedPlaced);
    if (!tw) return;
    const cost = getUpgradeCost(tw.towerId, tw.level);
    if (money < cost || tw.level >= MAX_LEVEL) return;
    setMoney((m) => m - cost);
    setPlaced((arr) => arr.map((p) => (p.id === tw.id ? { ...p, level: p.level + 1 } : p)));
    playSfx('tower-upgrade');
  };

  const sellSelected = () => {
    if (!selectedPlaced) return;
    const tw = placed.find((p) => p.id === selectedPlaced);
    if (!tw) return;
    setMoney((m) => m + getSellValue(tw.towerId, tw.level));
    setInventory((inv) => unequipAllFromTower(inv, tw.id));
    setPlaced((arr) => arr.filter((p) => p.id !== tw.id));
    setSelectedPlaced(null);
    playSfx('tower-sell');
  };

  const handleDraftPick = (item) => {
    if (!draftPending) return;
    setInventory((inv) => addItem(recordDraft(inv, draftPending.wave, item.id), item));
    setDraftPending(null);
    if (item.rarity === 'mythic') playSfx('loot-rarity-mythic');
  };

  const handleDraftSkip = () => {
    if (!draftPending) return;
    setInventory((inv) => recordDraft(inv, draftPending.wave, null));
    setDraftPending(null);
  };

  const handleDraftReroll = () => {
    if (!draftPending || draftPending.rerollsLeft <= 0) return;
    const dropOpts = { unlocked: unlockedItemSet, boosts: foundry.dropRateBoost, category: 'relic' };
    setDraftPending({
      wave: draftPending.wave,
      options: rollDraft(Math.random, 3, dropOpts),
      rerollsLeft: draftPending.rerollsLeft - 1,
    });
  };

  const handleChestTake = () => {
    if (!bossChestPending) return;
    const items = bossChestPending;
    setInventory((inv) => items.reduce((acc, item) => addItem(acc, item), inv));
    if (items.some((it) => it.rarity === 'mythic')) playSfx('loot-rarity-mythic');
    setBossChestPending(null);
  };

  const handleEquipItem = (uid) => {
    if (!selectedPlaced) return;
    setInventory((inv) => equipItem(inv, uid, selectedPlaced));
  };

  const handleUnequipItem = (uid) => {
    setInventory((inv) => unequipItem(inv, uid));
  };

  const pathD = pxPaths.map((points) => 'M ' + points.map((p) => p.join(',')).join(' L ')).join(' ');

  const sel = placed.find((p) => p.id === selectedPlaced);
  const selDef = sel ? TOWER_DEFS[sel.towerId] : null;
  const buyDef = TOWER_DEFS[selectedTower];

  const upgradeCost = sel ? getUpgradeCost(sel.towerId, sel.level) : Infinity;
  const sellValue = sel ? getSellValue(sel.towerId, sel.level) : 0;

  const nextSpec = getWave(wave + 1);
  const nextWaveLabel = nextSpec.isBoss
    ? 'BOSS'
    : nextSpec.isMiniBoss
      ? 'CHAMPION'
      : (nextSpec.groups[0]?.kind ?? 'mixed').toUpperCase();

  const lootCounts = useMemo(() => rarityCounts(inventory, getItem), [inventory]);
  const essencePreview = useMemo(
    () => lootCounts.common * 1 + lootCounts.rare * 5 + lootCounts.epic * 25 + lootCounts.legendary * 100 + lootCounts.mythic * 500,
    [lootCounts],
  );

  // Game is paused while a modal is open.
  const modalOpen = !!draftPending || !!bossChestPending;
  const effectiveRunning = running && !modalOpen;

  // Sync to existing running flag indirectly via setRunning when modal opens/closes.
  useEffect(() => {
    if (modalOpen && running) setRunning(false);
    // When modal closes we don't auto-resume; user can press play.
  }, [modalOpen, running]);

  const statBlocks = (
    <>
      <div className="stat"><div className="v" style={{ color: 'var(--accent-1)', fontSize: viewport.isMobile ? 20 : 28 }}><AnimatedNumber value={hp} format={formatNumber} /></div><div className="k">HP</div></div>
      <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 20 : 28 }}><AnimatedNumber value={money} format={formatCurrency} /></div><div className="k">CREDIT</div></div>
      <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 20 : 28 }}><AnimatedNumber value={wave} format={formatNumber} duration={150} /></div><div className="k">WAVE</div></div>
      <div className="stat"><div className="v mono" style={{ fontSize: viewport.isMobile ? 20 : 28 }}><AnimatedNumber value={score} format={formatScore} /></div><div className="k">SCORE</div></div>
    </>
  );

  const controlButtons = (
    <div style={{ display: 'flex', gap: 6 }}>
      <button className="btn" onClick={() => setRunning((r) => !r)} style={{ padding: '8px 12px' }}>{effectiveRunning ? '❚❚' : '▶'}</button>
      <button className="btn" onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 3 : 1))} style={{ padding: '8px 12px' }}>{speed}×</button>
      <button
        className="btn"
        disabled={gameOver}
        onClick={() => {
          if (endingRun) {
            if (endingRunTimerRef.current) {
              clearTimeout(endingRunTimerRef.current);
              endingRunTimerRef.current = null;
            }
            setEndingRun(false);
            setHp(0);
          } else {
            setEndingRun(true);
            if (endingRunTimerRef.current) clearTimeout(endingRunTimerRef.current);
            endingRunTimerRef.current = setTimeout(() => {
              setEndingRun(false);
              endingRunTimerRef.current = null;
            }, 3000);
          }
        }}
        style={{
          padding: '8px 12px',
          fontSize: 10,
          letterSpacing: '0.14em',
          background: endingRun ? 'var(--accent-1)' : 'transparent',
          color: endingRun ? 'var(--paper)' : 'var(--ink)',
          borderColor: endingRun ? 'var(--accent-1)' : 'var(--line)',
        }}
      >
        {endingRun ? t('game.endRunConfirm') : t('common.endRun')}
      </button>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : `${W}px 240px`, gap: 12, color: 'var(--ink)' }}>
      {viewport.isMobile ? (
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '2px solid var(--line)', paddingBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', minWidth: 0, flex: 1 }}>
              <div className="h-display" style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{map.code} <span style={{ color: 'var(--muted)' }}>/</span> {map.name}</div>
              <div className="eyebrow" style={{ flexShrink: 0 }}>{map.difficulty}</div>
            </div>
            {controlButtons}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 6 }}>
            {statBlocks}
          </div>
        </div>
      ) : (
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--line)', paddingBottom: 10, flexWrap: 'wrap', rowGap: 8 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
            <div className="h-display" style={{ fontSize: 20 }}>{map.code} <span style={{ color: 'var(--muted)' }}>/</span> {map.name}</div>
            <div className="eyebrow">{map.difficulty}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
            {statBlocks}
            {controlButtons}
          </div>
        </div>
      )}

      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginTop: -6, marginBottom: 4, flexWrap: 'wrap' }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--muted)' }}>RELICS</div>
        <GlobalRelicsBar inventory={inventory} />
        <TotalEffectsPanel inventory={inventory} isBossWave={isBossWave} />
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={fieldOuterRef}
          style={{ position: 'relative', width: '100%', maxWidth: W, aspectRatio: `${W} / ${H}`, overflow: 'hidden' }}
        >
        <div
          className="dot-bg"
          style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, transformOrigin: 'top left', transform: `scale(${fieldScale})`, background: 'var(--bg-2)', border: '2px solid var(--line)', cursor: 'crosshair', overflow: 'hidden' }}
          onClick={placeTower}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHoverCell([
              ((e.clientX - r.left) * W) / r.width,
              ((e.clientY - r.top) * H) / r.height,
            ]);
          }}
          onMouseLeave={() => setHoverCell(null)}
        >
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <path d={pathD} stroke="var(--line)" strokeWidth={26} fill="none" strokeLinejoin="miter" strokeLinecap="butt" opacity={0.08} />
            <path d={pathD} stroke="var(--line)" strokeWidth={2} fill="none" strokeDasharray="4 6" />
            {pxPaths.map((pts, i) => (
              <g key={i}>
                <circle cx={pts[0][0]} cy={pts[0][1]} r={9} fill="var(--accent-2)" stroke="var(--line)" strokeWidth={2} />
                <polygon points={`${pts[pts.length - 1][0] - 7},${pts[pts.length - 1][1] - 7} ${pts[pts.length - 1][0] + 7},${pts[pts.length - 1][1]} ${pts[pts.length - 1][0] - 7},${pts[pts.length - 1][1] + 7}`} fill="var(--accent-1)" stroke="var(--line)" strokeWidth={2} />
              </g>
            ))}

            {projectilesRef.current.map((p, idx) => {
              if (p.kind === 'splash') {
                const max = p.maxLife ?? 0.40;
                const r = (p.splash ?? 50) * (1 - p.life / max);
                return <circle key={idx} cx={p.tx} cy={p.ty} r={r} fill="none" stroke={p.color} strokeWidth={4} opacity={p.life / max} />;
              }
              if (p.kind === 'bolt') {
                const mx = (p.x + p.tx) / 2 + (Math.random() - 0.5) * 18;
                const my = (p.y + p.ty) / 2 + (Math.random() - 0.5) * 18;
                return <polyline key={idx} points={`${p.x},${p.y} ${mx},${my} ${p.tx},${p.ty}`} fill="none" stroke={p.color} strokeWidth={3} opacity={p.life / 0.32} />;
              }
              if (p.kind === 'dot') return <circle key={idx} cx={p.tx} cy={p.ty} r={6} fill={p.color} opacity={p.life / 0.28} />;
              return <line key={idx} x1={p.x} y1={p.y} x2={p.tx} y2={p.ty} stroke={p.color} strokeWidth={3} opacity={Math.min(1, p.life * 3.5)} />;
            })}

            {/* Kill shards */}
            {particlesRef.current.map((p, idx) => (
              <rect
                key={`s${idx}`}
                x={p.x - p.size / 2}
                y={p.y - p.size / 2}
                width={p.size}
                height={p.size}
                fill="var(--ink)"
                opacity={p.life / p.maxLife}
                transform={`rotate(${(p.vx + p.vy) * 0.5} ${p.x} ${p.y})`}
              />
            ))}

            {/* Ripples (SHIELD shatter) */}
            {ripplesRef.current.map((r, idx) => {
              const t = 1 - r.life / r.maxLife;
              if (r.kind === 'shield') {
                const radius = 6 + t * 28;
                return <circle key={`r${idx}`} cx={r.x} cy={r.y} r={radius} fill="none" stroke={r.color} strokeWidth={2} opacity={1 - t} />;
              }
              return null;
            })}

            {/* Damage popups */}
            {damageTextsRef.current.map((d, idx) => (
              <text
                key={`d${idx}`}
                x={d.x}
                y={d.y}
                fontFamily="var(--font-mono)"
                fontWeight="700"
                fontSize={d.big ? 18 : 13}
                fill={d.color}
                stroke="var(--line)"
                strokeWidth={d.big ? 0.8 : 0.5}
                opacity={d.life / d.maxLife}
                textAnchor="middle"
              >
                {d.value}
              </text>
            ))}

            {/* Floating loot drop notifications */}
            {lootTextsRef.current.map((d, idx) => (
              <text
                key={`l${idx}`}
                x={d.x}
                y={d.y}
                fontFamily="var(--font-mono)"
                fontWeight="700"
                fontSize={12}
                fill={LOOT_RARITY_COLOR[d.rarity]}
                stroke="var(--paper)"
                strokeWidth={1.6}
                paintOrder="stroke"
                opacity={d.life / d.maxLife}
                textAnchor="middle"
              >
                {d.glyph} {d.name}
              </text>
            ))}

            {sel && selDef && !selDef.isAura && (() => {
              const eff = towerEffects.get(sel.id) ?? emptyEffect();
              const rng = selDef.rng * (1 + (sel.level - 1) * 0.1) * eff.rngMul + eff.rngAdd;
              return <circle cx={sel.x} cy={sel.y} r={rng} fill={selDef.color} fillOpacity={0.06} stroke={selDef.color} strokeWidth={1.5} strokeDasharray="3 4" />;
            })()}
            {sel && selDef && selDef.isAura && (() => {
              const mod = beaconMods.get(sel.id);
              const rng = (100 + 20 * (sel.level - 1)) * (mod?.rangeMul ?? 1);
              return <circle cx={sel.x} cy={sel.y} r={rng} fill={selDef.color} fillOpacity={0.08} stroke={selDef.color} strokeWidth={1.5} strokeDasharray="2 3" />;
            })()}
            {hoverCell && !sel && buyDef && money >= buyDef.cost && !onPath(hoverCell[0], hoverCell[1]) && !tooClose(hoverCell[0], hoverCell[1]) && (
              <circle cx={hoverCell[0]} cy={hoverCell[1]} r={buyDef.isAura ? 100 : buyDef.rng} fill={buyDef.color} fillOpacity={0.06} stroke={buyDef.color} strokeWidth={1} strokeDasharray="3 4" />
            )}
          </svg>

          {hoverCell && !sel && buyDef && (
            <div style={{
              position: 'absolute', left: hoverCell[0] - 16, top: hoverCell[1] - 16,
              width: 32, height: 32, pointerEvents: 'none',
              opacity: pendingPlacement ? 1 : (onPath(hoverCell[0], hoverCell[1]) || tooClose(hoverCell[0], hoverCell[1]) || money < buyDef.cost) ? 0.3 : 0.7,
              filter: (onPath(hoverCell[0], hoverCell[1]) || tooClose(hoverCell[0], hoverCell[1])) ? 'grayscale(1)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TowerGlyph id={buyDef.id} size={32} style={iconStyle} color={buyDef.color} />
            </div>
          )}

          {pendingPlacement && buyDef && (
            <div
              className="mono"
              style={{
                position: 'absolute',
                left: pendingPlacement.x,
                top: pendingPlacement.y + 24,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                background: 'var(--ink)',
                color: 'var(--paper)',
                padding: '4px 8px',
                fontSize: 10,
                letterSpacing: '0.18em',
                whiteSpace: 'nowrap',
                border: '1px solid var(--accent-1)',
              }}
            >
              {t('game.tapToPlace')}
            </div>
          )}

          {enemiesRef.current.map((e) => {
            const [x, y] = pointAt(pxPaths[e.pathIdx], e.t);
            const isSlow = tickRef.current < e.slowUntil;
            const isPoison = tickRef.current < e.poisonUntil;
            const isInvuln = e.kind === 'phase' && (e.phaseInvuln ?? 0) > 0;
            const isFlash = tickRef.current < (e.flashUntil ?? 0);
            const baseColor = isFlash
              ? 'var(--paper)'
              : e.shielded
                ? 'var(--accent-8)'
                : isInvuln
                  ? 'var(--accent-5)'
                  : isSlow
                    ? 'var(--accent-4)'
                    : isPoison
                      ? 'var(--accent-6)'
                      : 'var(--ink)';
            return (
              <div key={e.id} style={{ position: 'absolute', left: x - e.size / 2, top: y - e.size / 2, pointerEvents: 'none', opacity: isInvuln ? 0.5 : 1, filter: isFlash ? 'drop-shadow(0 0 4px var(--accent-1))' : 'none' }}>
                <EnemyShape kind={e.kind} size={e.size} color={baseColor} />
                {isInvuln && (
                  <div style={{
                    position: 'absolute',
                    left: -e.size * 0.6,
                    top: -e.size * 0.6,
                    width: e.size * 2.2,
                    height: e.size * 2.2,
                    border: '2px solid var(--accent-5)',
                    borderRadius: '50%',
                    opacity: 0.6,
                    animation: 'mtdRipple 1s ease-out infinite',
                  }} />
                )}
                <div style={{ position: 'absolute', top: -6, left: 0, width: e.size, height: 3, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%`, height: '100%', background: 'var(--accent-1)' }} />
                </div>
              </div>
            );
          })}

          {placed.map((tw) => {
            const def = TOWER_DEFS[tw.towerId];
            const isSel = tw.id === selectedPlaced;
            const equippedCount = inventory.items.filter((i) => i.equippedTo === tw.id).length;
            return (
              <div key={tw.id} style={{
                position: 'absolute', left: tw.x - 18, top: tw.y - 18, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--paper)', border: `2px solid ${isSel ? def.color : 'var(--line)'}`,
                cursor: 'pointer',
              }}
                onClick={(ev) => { ev.stopPropagation(); setSelectedPlaced(tw.id); }}
              >
                <TowerGlyph id={def.id} size={22} style={iconStyle} color={def.color} />
                <div style={{ position: 'absolute', bottom: -7, display: 'flex', gap: 2 }}>
                  {Array.from({ length: tw.level }).map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, background: def.color, border: '1px solid var(--line)' }} />
                  ))}
                </div>
                {equippedCount > 0 && (
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 14, height: 14, background: 'var(--accent-3)', border: '1.5px solid var(--line)', fontSize: 9, lineHeight: '11px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {equippedCount}
                  </div>
                )}
              </div>
            );
          })}

          {bossWarnRef.current.active && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 30,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'rgba(0,0,0,0.6)' }} />
              <div className="h-display" style={{
                fontSize: 56, color: 'var(--accent-1)',
                letterSpacing: '0.06em',
                textShadow: '0 0 20px rgba(0,0,0,0.7)',
                animation: 'mtdBossWarn 1.5s ease-out forwards',
              }}>BOSS INCOMING</div>
            </div>
          )}

          {gameOver && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 20 }}>
              <div className="h-display" style={{ fontSize: 56, color: 'var(--paper)' }}>BREACH</div>
              <div className="mono" style={{ color: 'var(--paper)', fontSize: 12, letterSpacing: '0.2em' }}>SCORE {score} · WAVE {wave}</div>
              <div className="eyebrow" style={{ color: 'var(--paper)', opacity: 0.7, marginTop: 6 }}>LOOT COLLECTED</div>
              <div className="mono" style={{ color: 'var(--paper)', fontSize: 11, letterSpacing: '0.16em', display: 'flex', gap: 14 }}>
                <span>C·{lootCounts.common}</span>
                <span>R·{lootCounts.rare}</span>
                <span>E·{lootCounts.epic}</span>
                <span>L·{lootCounts.legendary}</span>
                <span>M·{lootCounts.mythic}</span>
              </div>
              <div className="mono" style={{ color: 'var(--accent-3)', fontSize: 11, letterSpacing: '0.18em' }}>
                ESSENCE +{essencePreview} <span style={{ color: 'var(--paper)', opacity: 0.5 }}>(saved next run)</span>
              </div>
              {onExit ? (
                <div className="mono" style={{ color: 'var(--paper)', fontSize: 10, letterSpacing: '0.2em', opacity: 0.6, marginTop: 4 }}>
                  → RESULTS
                </div>
              ) : (
                <button className="btn btn-accent" onClick={() => {
                  const reachedWave = Math.max(0, wave - 1);
                  const coresEarned = calcCoresEarned(reachedWave, score);
                  const essenceEarned = essencePreview;
                  const durationMs = performance.now() - runStartRef.current;
                  const meta = useMetaStore.getState();
                  meta.addCores(coresEarned);
                  meta.addEssence(essenceEarned);
                  meta.recordRun(mapKey, { wave: reachedWave, score, durationMs });
                  setHp(20); setMoney(220); setWave(1); setScore(0); setPlaced([]);
                  enemiesRef.current = []; projectilesRef.current = [];
                  particlesRef.current = []; damageTextsRef.current = []; ripplesRef.current = [];
                  lootTextsRef.current = []; pendingLootRef.current = [];
                  bossWarnRef.current = { active: false, until: 0 };
                  spawnRef.current = { schedule: [], idx: 0, t: 0 };
                  setInventory(emptyInventory());
                  setDraftPending(null); setBossChestPending(null);
                  setGameOver(false); setRunning(true); setWaveActive(false);
                  runStartRef.current = performance.now();
                  seededInitialRef.current = false;
                }}>RESTART</button>
              )}
            </div>
          )}

          {draftPending && (
            <DraftModal
              wave={draftPending.wave}
              options={draftPending.options}
              rerollsLeft={draftPending.rerollsLeft ?? 0}
              onPick={handleDraftPick}
              onSkip={handleDraftSkip}
              onReroll={handleDraftReroll}
            />
          )}
          {bossChestPending && !draftPending && (
            <BossChestModal
              wave={wave - 1}
              items={bossChestPending}
              onTake={handleChestTake}
            />
          )}
        </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button className={`btn ${waveActive ? '' : 'btn-primary'}`} disabled={waveActive || gameOver || modalOpen} onClick={startWave} style={{ padding: '10px 16px' }}>
            {waveActive ? `WAVE ${wave} · ACTIVE` : `▶  START WAVE ${wave}`}
          </button>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em' }}>
            {waveActive
              ? `${spawnRef.current.schedule.length - spawnRef.current.idx} / ${enemiesRef.current.length} REMAINING`
              : `NEXT: ${nextWaveLabel}`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="panel-bold" style={{ padding: viewport.isMobile ? 10 : 12 }}>
            <div className="eyebrow" style={{ marginBottom: viewport.isMobile ? 6 : 10 }}>BUILD</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TOWER_LIST.map((t) => {
                const isUnlocked = towersUnlocked.includes(t.id);
                const can = isUnlocked && money >= t.cost;
                const isSel = selectedTower === t.id;
                const baseStyle = {
                  background: isSel ? t.color : 'var(--paper)',
                  color: isSel ? 'var(--paper)' : 'var(--ink)',
                  border: `2px solid ${isSel ? t.color : 'var(--line)'}`,
                  opacity: can ? 1 : 0.4,
                  cursor: can ? 'pointer' : 'not-allowed',
                };
                return (
                  <button key={t.id}
                    onClick={() => { if (isUnlocked) { setSelectedTower(t.id); setSelectedPlaced(null); } }}
                    disabled={!can}
                    title={!isUnlocked ? 'Locked — unlock in Research' : undefined}
                    style={viewport.isMobile ? {
                      ...baseStyle,
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                    } : {
                      ...baseStyle,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                      padding: 8,
                    }}
                  >
                    {viewport.isMobile ? (
                      <>
                        <TowerGlyph id={t.id} size={18} style={iconStyle} color={isSel ? 'var(--paper)' : t.color} />
                        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', flex: 1, textAlign: 'left' }}>{t.name}</span>
                        <span className="mono" style={{ fontSize: 10 }}>{isUnlocked ? `$${t.cost}` : '🔒'}</span>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'space-between' }}>
                          <TowerGlyph id={t.id} size={20} style={iconStyle} color={isSel ? 'var(--paper)' : t.color} />
                          <span className="mono" style={{ fontSize: 10 }}>{isUnlocked ? `$${t.cost}` : '🔒'}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em' }}>{t.name}</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel" style={{ padding: viewport.isMobile ? 10 : 12, minHeight: viewport.isMobile ? 0 : 160 }}>
            {sel && selDef ? (
              <div>
                <div className="eyebrow">SELECTED · LV {sel.level}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <TowerGlyph id={selDef.id} size={viewport.isMobile ? 22 : 26} style={iconStyle} color={selDef.color} />
                  <div className="h-display" style={{ fontSize: viewport.isMobile ? 16 : 18 }}>{selDef.name}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: viewport.isMobile ? 'repeat(4, 1fr)' : '1fr 1fr', gap: 6, marginTop: viewport.isMobile ? 8 : 10 }}>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>{Math.round(selDef.dmg * (1 + (sel.level - 1) * 0.5))}</div><div className="k">DMG</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>{Math.round((selDef.isAura ? 100 + 20 * (sel.level - 1) : selDef.rng * (1 + (sel.level - 1) * 0.1)))}</div><div className="k">{selDef.isAura ? 'AURA' : 'RANGE'}</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>{selDef.rof || '—'}</div><div className="k">RoF</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 12 : 16 }}>{selDef.type}</div><div className="k">TYPE</div></div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: viewport.isMobile ? 8 : 12 }}>
                  <button className="btn btn-primary" onClick={upgradeSelected} disabled={sel.level >= MAX_LEVEL || money < upgradeCost} style={{ padding: '8px 10px', fontSize: 10, flex: 1 }}>
                    {sel.level >= MAX_LEVEL ? 'MAX' : `UP $${upgradeCost}`}
                  </button>
                  <button className="btn" onClick={sellSelected} style={{ padding: '8px 10px', fontSize: 10 }}>SELL ${sellValue}</button>
                </div>
              </div>
            ) : buyDef ? (
              <div>
                <div className="eyebrow">PREVIEW</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <TowerGlyph id={buyDef.id} size={viewport.isMobile ? 22 : 26} style={iconStyle} color={buyDef.color} />
                  <div className="h-display" style={{ fontSize: viewport.isMobile ? 16 : 18 }}>{buyDef.name}</div>
                </div>
                <div style={{ fontSize: viewport.isMobile ? 11 : 12, color: 'var(--ink-2)', marginTop: viewport.isMobile ? 6 : 8, lineHeight: 1.4 }}>{buyDef.desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: viewport.isMobile ? 'repeat(4, 1fr)' : '1fr 1fr', gap: 6, marginTop: viewport.isMobile ? 8 : 10 }}>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>{buyDef.dmg || '—'}</div><div className="k">DMG</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>{buyDef.isAura ? 100 : buyDef.rng}</div><div className="k">{buyDef.isAura ? 'AURA' : 'RANGE'}</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>{buyDef.rof || '—'}</div><div className="k">RoF</div></div>
                  <div className="stat"><div className="v" style={{ fontSize: viewport.isMobile ? 14 : 16 }}>${buyDef.cost}</div><div className="k">COST</div></div>
                </div>
              </div>
            ) : null}
          </div>

          {sel && selDef && (
            <ItemSlots
              towerId={sel.id}
              towerDefId={sel.towerId}
              inventory={inventory}
              onEquip={handleEquipItem}
              onUnequip={handleUnequipItem}
            />
          )}
        </div>
    </div>
  );
}

export default GamePlay;
