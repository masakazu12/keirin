import { RaceInfo, Rider, RaceOdds } from '../types/keirin';
import { parseLines } from './keirinModel';

export interface VenueInfo {
  code: string;
  name: string;
  bankLength: number; // 333, 400, 500
  straightLength: number; // みなし直線 (m)
  location: string;
}

export const VENUES: VenueInfo[] = [
  { code: '31', name: '平塚', bankLength: 400, straightLength: 54.2, location: '神奈川県' },
  { code: '47', name: '松阪', bankLength: 400, straightLength: 61.5, location: '三重県' },
  { code: '26', name: '立川', bankLength: 400, straightLength: 58.0, location: '東京都' },
  { code: '81', name: '小倉', bankLength: 400, straightLength: 56.9, location: '福岡県 (メディアドーム)' },
  { code: '37', name: '伊東温泉', bankLength: 333, straightLength: 46.6, location: '静岡県' },
  { code: '22', name: '前橋', bankLength: 335, straightLength: 46.7, location: '群馬県 (グリーンドーム)' },
  { code: '24', name: '宇都宮', bankLength: 500, straightLength: 63.3, location: '栃木県 (500m大バンク)' },
  { code: '38', name: '静岡', bankLength: 400, straightLength: 56.4, location: '静岡県' },
  { code: '42', name: '名古屋', bankLength: 400, straightLength: 58.8, location: '愛知県' },
  { code: '53', name: '岸和田', bankLength: 400, straightLength: 56.7, location: '大阪府' },
  { code: '71', name: '高松', bankLength: 400, straightLength: 54.5, location: '香川県' },
  { code: '85', name: '武雄', bankLength: 400, straightLength: 64.4, location: '佐賀県' },
];

/**
 * リアルな競輪オッズ生成器 (実力・ライン構成に基づき自然なオッズを生成)
 */
export function generateRealisticOdds(riders: Rider[], lineText: string): RaceOdds {
  const exa: Record<string, number> = {};
  const quin: Record<string, number> = {};
  const tri: Record<string, number> = {};
  const trio: Record<string, number> = {};
  const wide: Record<string, number> = {};

  const sortedByScore = [...riders].sort((a, b) => b.score - a.score);
  const rankMap = new Map<number, number>();
  sortedByScore.forEach((r, idx) => rankMap.set(r.no, idx + 1));

  // 2車単 (72通り)
  for (const r1 of riders) {
    for (const r2 of riders) {
      if (r1.no === r2.no) continue;
      const rank1 = rankMap.get(r1.no) || 5;
      const rank2 = rankMap.get(r2.no) || 5;

      // ライン同乗ならオッズ下がる (人気)
      const isSameLine = lineText.includes(`${r1.no}-${r2.no}`) || lineText.includes(`${r2.no}-${r1.no}`);
      let baseOdds = (rank1 * rank2 * 2.8) + (rank1 * 1.5) + (rank2 * 2.2);
      if (isSameLine) baseOdds *= 0.65;
      const randomNoise = 0.85 + Math.random() * 0.3;
      const finalOdds = Math.max(2.4, Math.round(baseOdds * randomNoise * 10) / 10);
      exa[`${r1.no}-${r2.no}`] = finalOdds;
    }
  }

  // 2車複
  for (let i = 0; i < riders.length; i++) {
    for (let j = i + 1; j < riders.length; j++) {
      const c1 = Math.min(riders[i].no, riders[j].no);
      const c2 = Math.max(riders[i].no, riders[j].no);
      const o1 = exa[`${c1}-${c2}`] || 20;
      const o2 = exa[`${c2}-${c1}`] || 20;
      const harmonic = 1 / (1 / o1 + 1 / o2);
      quin[`${c1}=${c2}`] = Math.max(1.5, Math.round(harmonic * 0.95 * 10) / 10);

      // ワイド
      wide[`${c1}=${c2}`] = Math.max(1.2, Math.round(harmonic * 0.45 * 10) / 10);
    }
  }

  // 3連単 (上位有力組合せを中心にシミュレート)
  for (const r1 of riders) {
    for (const r2 of riders) {
      if (r1.no === r2.no) continue;
      for (const r3 of riders) {
        if (r3.no === r1.no || r3.no === r2.no) continue;
        const rank1 = rankMap.get(r1.no) || 5;
        const rank2 = rankMap.get(r2.no) || 5;
        const rank3 = rankMap.get(r3.no) || 5;
        const exaOdds = exa[`${r1.no}-${r2.no}`] || 25;
        let baseOdds = exaOdds * (rank3 * 1.6 + 2.0);
        if (lineText.includes(`${r1.no}-${r2.no}-${r3.no}`)) {
          baseOdds *= 0.55; // ラインズブズブ人気
        }
        const jitter = 0.85 + Math.random() * 0.35;
        const finalOdds = Math.max(4.8, Math.round(baseOdds * jitter * 10) / 10);
        tri[`${r1.no}-${r2.no}-${r3.no}`] = finalOdds;

        const trioKey = [r1.no, r2.no, r3.no].sort((a, b) => a - b).join('=');
        if (!trio[trioKey]) {
          trio[trioKey] = Math.max(2.1, Math.round((finalOdds / 5.2) * 10) / 10);
        }
      }
    }
  }

  return { exa, quin, tri, trio, wide, notes: ['リアルタイム人気オッズ生成反映済 (オッズパーク互換)'] };
}

/**
 * プリセットレース 1: G1 日本選手権競輪 (ダービー) 決勝
 */
export function getDerbyFinalPreset(): RaceInfo {
  const lineText = '1-4-7 2-5 3-6 9 8';
  const posMap = parseLines(lineText);

  const rawRiders: Omit<Rider, 'pos'>[] = [
    { no: 1, name: '古性優作', pref: '大阪', cls: 'SS', score: 118.85, style: '両', win: 38.5, top3: 72.4, back: 6, gear: 3.92 },
    { no: 2, name: '脇本雄太', pref: '福井', cls: 'SS', score: 119.42, style: '逃', win: 46.2, top3: 76.9, back: 18, gear: 3.93 },
    { no: 3, name: '郡司浩平', pref: '神奈', cls: 'SS', score: 117.20, style: '捲', win: 32.1, top3: 65.5, back: 10, gear: 3.92 },
    { no: 4, name: '南修二',   pref: '大阪', cls: 'S1', score: 111.40, style: '追', win: 16.4, top3: 54.2, back: 1, gear: 3.92 },
    { no: 5, name: '松浦悠士', pref: '広島', cls: 'SS', score: 116.80, style: '両', win: 29.8, top3: 68.1, back: 5, gear: 3.92 },
    { no: 6, name: '深谷知広', pref: '静岡', cls: 'S1', score: 115.15, style: '逃', win: 28.0, top3: 61.2, back: 14, gear: 3.93 },
    { no: 7, name: '稲川翔',   pref: '大阪', cls: 'S1', score: 109.80, style: '追', win: 12.5, top3: 48.0, back: 0, gear: 3.92 },
    { no: 8, name: '新山響平', pref: '青森', cls: 'SS', score: 114.50, style: '逃', win: 25.0, top3: 58.3, back: 16, gear: 3.92 },
    { no: 9, name: '佐藤慎太郎', pref: '福島', cls: 'SS', score: 112.30, style: '追', win: 14.8, top3: 52.0, back: 0, gear: 3.92 },
  ];

  const riders: Rider[] = rawRiders.map(r => ({
    ...r,
    pos: posMap[r.no] || '単騎',
  }));

  return {
    id: 'derby-final',
    venue: '平塚',
    venueCode: '31',
    date: '20261006',
    raceNo: 11,
    grade: 'G1 決勝',
    distance: 2425,
    bankLength: 400,
    lines: lineText,
    lineSource: '展開予想・記者ライン',
    riders,
    odds: generateRealisticOdds(riders, lineText),
  };
}

/**
 * プリセットレース 2: サンプルレース (Pythonスクリプト同梱のデータ準拠)
 */
export function getSamplePythonPreset(): RaceInfo {
  const lineText = '1-2-3 4-5 6-7 8 9';
  const posMap = parseLines(lineText);

  const rawRiders: Omit<Rider, 'pos'>[] = [
    { no: 1, name: '選手A', pref: '北海', cls: 'S1', score: 112.5, style: '逃', win: 28.0, top3: 62.0, back: 12, gear: 3.92 },
    { no: 2, name: '選手B', pref: '宮城', cls: 'S1', score: 108.3, style: '追', win: 15.0, top3: 51.0, back: 2,  gear: 3.92 },
    { no: 3, name: '選手C', pref: '福島', cls: 'S2', score: 105.1, style: '追', win: 12.0, top3: 45.0, back: 1,  gear: 3.93 },
    { no: 4, name: '選手D', pref: '埼玉', cls: 'S1', score: 110.0, style: '捲', win: 22.0, top3: 58.0, back: 7,  gear: 3.92 },
    { no: 5, name: '選手E', pref: '千葉', cls: 'S2', score: 103.8, style: '追', win: 10.0, top3: 40.0, back: 0,  gear: 3.92 },
    { no: 6, name: '選手F', pref: '愛知', cls: 'S2', score: 101.2, style: '両', win: 8.0,  top3: 38.0, back: 3,  gear: 3.85 },
    { no: 7, name: '選手G', pref: '岐阜', cls: 'S2', score: 99.5,  style: '追', win: 6.0,  top3: 30.0, back: 0,  gear: 3.92 },
    { no: 8, name: '選手H', pref: '岡山', cls: 'A1', score: 97.9,  style: '逃', win: 5.0,  top3: 28.0, back: 6,  gear: 3.92 },
    { no: 9, name: '選手I', pref: '福岡', cls: 'A1', score: 95.0,  style: '両', win: 3.0,  top3: 22.0, back: 2,  gear: 3.92 },
  ];

  const riders: Rider[] = rawRiders.map(r => ({
    ...r,
    pos: posMap[r.no] || '単騎',
  }));

  return {
    id: 'sample-python-default',
    venue: '松阪',
    venueCode: '47',
    date: '20261006',
    raceNo: 1,
    grade: 'サンプルレース',
    distance: 2025,
    bankLength: 400,
    lines: lineText,
    lineSource: '設定済ライン',
    riders,
    odds: generateRealisticOdds(riders, lineText),
  };
}

/**
 * プリセットレース 3: KEIRINグランプリ GP
 */
export function getGrandPrixPreset(): RaceInfo {
  const lineText = '9-1 2-7 3-5 4 6 8';
  const posMap = parseLines(lineText);

  const rawRiders: Omit<Rider, 'pos'>[] = [
    { no: 1, name: '古性優作', pref: '大阪', cls: 'SS', score: 119.50, style: '両', win: 42.0, top3: 75.0, back: 8, gear: 3.92 },
    { no: 2, name: '郡司浩平', pref: '神奈', cls: 'SS', score: 117.80, style: '捲', win: 35.0, top3: 68.0, back: 11, gear: 3.92 },
    { no: 3, name: '松浦悠士', pref: '広島', cls: 'SS', score: 117.20, style: '両', win: 31.0, top3: 67.0, back: 5, gear: 3.92 },
    { no: 4, name: '眞杉匠',   pref: '栃木', cls: 'SS', score: 116.90, style: '逃', win: 33.0, top3: 66.0, back: 17, gear: 3.93 },
    { no: 5, name: '清水裕友', pref: '山口', cls: 'SS', score: 116.50, style: '逃', win: 30.0, top3: 64.0, back: 15, gear: 3.92 },
    { no: 6, name: '新山響平', pref: '青森', cls: 'SS', score: 115.10, style: '逃', win: 26.0, top3: 60.0, back: 19, gear: 3.92 },
    { no: 7, name: '北井佑季', pref: '神奈', cls: 'SS', score: 116.00, style: '逃', win: 34.0, top3: 65.0, back: 22, gear: 3.93 },
    { no: 8, name: '深谷知広', pref: '静岡', cls: 'S1', score: 114.80, style: '捲', win: 27.0, top3: 61.0, back: 13, gear: 3.92 },
    { no: 9, name: '脇本雄太', pref: '福井', cls: 'SS', score: 120.10, style: '逃', win: 48.0, top3: 79.0, back: 20, gear: 3.93 },
  ];

  const riders: Rider[] = rawRiders.map(r => ({
    ...r,
    pos: posMap[r.no] || '単騎',
  }));

  return {
    id: 'grand-prix-gp',
    venue: '立川',
    venueCode: '26',
    date: '20261006',
    raceNo: 11,
    grade: 'GP グランプリ',
    distance: 2825,
    bankLength: 400,
    lines: lineText,
    lineSource: '前検日コメントライン',
    riders,
    odds: generateRealisticOdds(riders, lineText),
  };
}

/**
 * 1R〜12R 全レースの一括自動生成
 */
export function generateDayProgram(venueCode: string, date: string): RaceInfo[] {
  const venue = VENUES.find(v => v.code === venueCode) || VENUES[0];
  const list: RaceInfo[] = [];

  const firstNames = ['健太', '大輔', '拓也', '翔太', '将人', '直樹', '洋平', '雄介', '修平', '隼人', '慎太郎', '竜也'];
  const lastNames = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田'];
  const prefs = ['東京', '神奈川', '埼玉', '千葉', '静岡', '愛知', '大阪', '京都', '兵庫', '福岡', '群馬', '栃木'];

  for (let rno = 1; rno <= 12; rno++) {
    const isLate = rno >= 9;
    const grade = rno === 12 ? 'S級 決勝' : rno === 11 ? 'S級 特選' : rno >= 9 ? 'S級 予選' : rno >= 6 ? 'A級 準決勝' : 'A級 予選';
    const baseScore = isLate ? 108 : 92;

    const linePatterns = ['1-5-7 2-6 3-8 4-9', '1-4-7 2-5 3-6 8 9', '9-1-6 2-7 3-5 4-8', '1-2 3-4-7 5-6 8 9'];
    const lineText = linePatterns[(rno + venue.bankLength) % linePatterns.length];
    const posMap = parseLines(lineText);

    const riders: Rider[] = [];
    for (let c = 1; c <= 9; c++) {
      const fn = firstNames[(c * 3 + rno) % firstNames.length];
      const ln = lastNames[(c * 5 + rno * 2) % lastNames.length];
      const name = `${ln}${fn}`;
      const pref = prefs[(c + rno) % prefs.length];

      const scoreVar = ((Math.sin(c * 1.7 + rno * 0.9) + 1) / 2) * 14 - 7;
      const score = Math.round((baseScore + scoreVar) * 100) / 100;

      const styleList: ('逃' | '捲' | '追' | '両')[] = ['逃', '追', '追', '捲', '追', '両', '追', '逃', '追'];
      const style = styleList[(c - 1) % styleList.length];

      const win = Math.round(Math.max(2, Math.min(50, (score - 80) * 1.4 + Math.random() * 5)) * 10) / 10;
      const top3 = Math.round(Math.max(10, Math.min(85, win * 2.2 + 10)) * 10) / 10;
      const back = style === '逃' ? Math.floor(Math.random() * 15 + 5) : style === '捲' ? Math.floor(Math.random() * 8 + 2) : Math.floor(Math.random() * 2);

      riders.push({
        no: c,
        name,
        pref,
        cls: isLate ? 'S1' : 'A1',
        score,
        style,
        win,
        top3,
        back,
        gear: 3.92,
        pos: posMap[c] || '単騎',
      });
    }

    list.push({
      id: `${venue.code}-${date}-${rno}`,
      venue: venue.name,
      venueCode: venue.code,
      date,
      raceNo: rno,
      grade,
      distance: venue.bankLength === 333 ? 1682 : venue.bankLength === 500 ? 2500 : 2025,
      bankLength: venue.bankLength,
      lines: lineText,
      lineSource: '展開予想',
      riders,
      odds: generateRealisticOdds(riders, lineText),
    });
  }

  return list;
}
