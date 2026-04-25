// Source-of-truth English dictionary. The keys here form the canonical set;
// dict.ja.ts may omit any of them, in which case the en fallback is used.
export const dictEn = {
  // Common labels
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.locked': 'LOCKED',
  'common.max': 'MAX',
  'common.unlock': 'UNLOCK',
  'common.purchase': 'PURCHASE',
  'common.upgrade': 'UPGRADE',
  'common.equip': 'EQUIP',
  'common.unequip': 'Unequip',
  'common.skip': 'SKIP',
  'common.take': 'TAKE',
  'common.reroll': 'RE-ROLL',
  'common.continue': 'CONTINUE',
  'common.newRun': 'NEW RUN',
  'common.playAgain': 'PLAY AGAIN',
  'common.endRun': 'END RUN',

  // Top nav
  'nav.play': 'PLAY',
  'nav.research': 'RESEARCH',
  'nav.foundry': 'FOUNDRY',
  'nav.codex': 'CODEX',
  'nav.settings': 'SETTINGS',

  // HUD
  'hud.hp': 'HP',
  'hud.credit': 'CREDIT',
  'hud.wave': 'WAVE',
  'hud.score': 'SCORE',
  'hud.cores': 'CORES',
  'hud.essence': 'ESSENCE',
  'hud.relics': 'RELICS',
  'hud.totalEffects': 'TOTAL EFFECTS',
  'hud.itemSlots': 'ITEM SLOTS',
  'hud.build': 'BUILD',
  'hud.preview': 'PREVIEW',
  'hud.selected': 'SELECTED',

  // Game labels
  'game.startWave': 'START WAVE {n}',
  'game.waveActive': 'WAVE {n} · ACTIVE',
  'game.next': 'NEXT',
  'game.remaining': '{spawned} / {alive} REMAINING',
  'game.breach': 'BREACH',
  'game.lootCollected': 'LOOT COLLECTED',
  'game.essenceEarned': 'ESSENCE +{n}',
  'game.savedNextRun': '(saved next run)',
  'game.bossIncoming': 'BOSS INCOMING',
  'game.endRunConfirm': 'CONFIRM END',
  'game.tapToPlace': 'TAP AGAIN TO PLACE',

  // Draft
  'draft.title': 'CHOOSE ONE.',
  'draft.subtitle': 'WAVE {n} CLEAR · DRAFT',
  'draft.rerollLabel': 'RE-ROLL ({n})',

  // Boss chest
  'chest.bossDefeated': 'WAVE {n} BOSS DEFEATED',
  'chest.clickToOpen': 'CLICK TO OPEN',

  // Menu
  'menu.tagline': 'Geometric endless tower defense.',
  'menu.statsRuns': 'TOTAL RUNS',
  'menu.statsBestWave': 'BEST WAVE',
  'menu.statsMythic': 'MYTHIC FOUND',

  // Map select
  'map.title': 'SELECT MAP',
  'map.best': 'BEST',
  'map.unlockHint.spiral': 'Unlocks after {n} runs',
  'map.unlockHint.fork': 'Unlocks at wave {n}',
  'map.unlockHint.cross': 'Unlocks at wave {n}',
  'map.diff.easy': 'EASY',
  'map.diff.medium': 'MEDIUM',
  'map.diff.hard': 'HARD',
  'map.diff.expert': 'EXPERT',

  // Results
  'results.title': 'RUN COMPLETE',
  'results.titleBreach': 'BREACH',
  'results.titleRetired': 'RETIRED',
  'results.reachedWave': 'REACHED WAVE',
  'results.duration': 'DURATION',
  'results.coresEarned': 'CORES EARNED',
  'results.essenceEarned': 'ESSENCE EARNED',
  'results.unlocked': 'UNLOCKED',
  'results.backToMenu': 'BACK TO MENU',

  // Codex
  'codex.title': 'CODEX',
  'codex.tabTowers': 'TOWERS',
  'codex.tabEnemies': 'ENEMIES',
  'codex.tabItems': 'ITEMS',

  // Research
  'research.title': 'Tower Mastery',
  'research.subtitle': 'META · RESEARCH',
  'research.dmgBonus': 'Damage bonus',

  // Foundry
  'foundry.title': 'Loot Workshop',
  'foundry.subtitle': 'META · FOUNDRY',
  'foundry.upgrades': 'UPGRADES',
  'foundry.boosts': 'DROP RATE BOOSTS',
  'foundry.unlockItems': 'UNLOCK ITEMS',
  'foundry.allUnlocked': 'All items unlocked.',
  'foundry.initialSlots': 'Initial item slots',
  'foundry.initialSlotsDesc': 'Items granted at run start.',
  'foundry.rerolls': 'Reroll count',
  'foundry.rerollsDesc': 'Re-rolls per draft.',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'META · SETTINGS',
  'settings.theme': 'COLOR THEME',
  'settings.language': 'LANGUAGE',
  'settings.sfxVolume': 'SFX VOLUME',
  'settings.bgmVolume': 'BGM VOLUME',
  'settings.danger': 'DANGER ZONE',
  'settings.resetAll': 'RESET ALL DATA',
  'settings.resetConfirm': 'This permanently erases all progress. Continue?',
  'settings.theme.default': 'Bauhaus',
  'settings.theme.dark': 'Dark',
  'settings.theme.mono': 'Mono',
  'settings.theme.pastel': 'Pastel',
  'settings.theme.neon': 'Neon',
  'settings.lang.en': 'English',
  'settings.lang.ja': '日本語',

  // Error / system
  'error.title': 'SOMETHING BROKE',
  'error.message': 'The game hit an unexpected error. Reload to recover.',
  'error.reload': 'RELOAD',
  'storage.unavailable': 'Save unavailable: progress will not persist.',

  // Tower descriptions
  'tower.basic.desc': 'Single-target. Cheap, reliable, fast fire-rate.',
  'tower.sniper.desc': 'Long range. High damage, slow reload.',
  'tower.cannon.desc': 'AoE damage on impact.',
  'tower.frost.desc': 'Slows targets in radius.',
  'tower.multi.desc': 'Hits up to 4 targets at once.',
  'tower.venom.desc': 'Damage-over-time. Stacks.',
  'tower.shock.desc': 'Chains lightning between 3 enemies.',
  'tower.beacon.desc': '+15-55% damage to towers in radius.',

  // Enemy descriptions
  'enemy.runner.desc': 'Standard. Balanced HP and speed.',
  'enemy.swarm.desc': 'Fast and fragile, comes in numbers.',
  'enemy.tank.desc': 'High HP, 30% projectile armor.',
  'enemy.shield.desc': 'Absorbs the first projectile hit.',
  'enemy.phase.desc': 'Cycles invulnerability. DoT bypasses.',
  'enemy.boss.desc': '20% damage reduction. Heavy.',
} as const;

export type DictKey = keyof typeof dictEn;
