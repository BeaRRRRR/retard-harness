/** `dino` namespace dictionaries. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'game.title': '小恐龙在线（模型思考中）',
  'game.subtitle': '等模型的空档，跳到多少分算多少分。',
  'game.play': '开始（空格 / 点击）',
  'game.jump': '按空格或 ↑ 跳跃',
  'game.duck': '按 ↓ 蹲下',
  'game.restart': '按 R 或点击重新开始',
  'game.score': '分数',
  'game.best': '最佳',
  'game.hide': '收起游戏',
  'game.comingsoon': '即将上线',
  'game.flappy': 'Flappy Bird',
  'game.tiktok': 'TikTok',
  'game.paused': '模型已回复，游戏暂停',
  'game.select': '选择游戏',
} satisfies Record<string, string>

/** The dino namespace key union. */
export type DinoKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'game.title': 'Chrome Dino (while the model thinks)',
  'game.subtitle': 'How far can you run before the model replies?',
  'game.play': 'Start (Space / tap)',
  'game.jump': 'Space or ↑ to jump',
  'game.duck': '↓ to duck',
  'game.restart': 'R or tap to restart',
  'game.score': 'Score',
  'game.best': 'Best',
  'game.hide': 'Hide game',
  'game.comingsoon': 'Coming soon',
  'game.flappy': 'Flappy Bird',
  'game.tiktok': 'TikTok',
  'game.paused': 'Model replied — game paused',
  'game.select': 'Pick a game',
} satisfies Record<DinoKey, string>
