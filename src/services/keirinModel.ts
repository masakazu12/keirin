import { Rider, AnalysisProbs, LinePosition, EVBet, RaceOdds } from '../types/keirin';

export const FEATURE_NAMES = [
  '得点差',
  '勝率',
  '3連対率',
  '逃',
  '捲',
  '追',
  '先頭',
  '番手',
  '3番手',
  '単騎',
  'バック',
  'ギア'
] as const;

export const DEFAULT_WEIGHTS: number[] = [
  1.6,   // 得点差
  0.5,   // 勝率
  0.6,   // 3連対率
  0.15,  // 逃
  0.10,  // 捲
  -0.05, // 追
  0.25,  // 先頭
  0.35,  // 番手
  0.10,  // 3番手
  -0.10, // 単騎
  0.15,  // バック
  0.30   // ギア
];

export const KEIRIN_CAR_COLORS = [
  { no: 1, label: '1', name: '白', bg: '#FFFFFF', text: '#000000', border: '#CBD5E1', ring: 'ring-slate-300' },
  { no: 2, label: '2', name: '黒', bg: '#1E293B', text: '#FFFFFF', border: '#0F172A', ring: 'ring-slate-800' },
  { no: 3, label: '3', name: '赤', bg: '#DC2626', text: '#FFFFFF', border: '#B91C1C', ring: 'ring-red-600' },
  { no: 4, label: '4', name: '青', bg: '#2563EB', text: '#FFFFFF', border: '#1D4ED8', ring: 'ring-blue-600' },
  { no: 5, label: '5', name: '黄', bg: '#EAB308', text: '#000000', border: '#CA8A04', ring: 'ring-yellow-500' },
  { no: 6, label: '6', name: '緑', bg: '#16A34A', text: '#FFFFFF', border: '#15803D', ring: 'ring-green-600' },
  { no: 7, label: '7', name: '橙', bg: '#EA580C', text: '#FFFFFF', border: '#C2410C', ring: 'ring-orange-600' },
  { no: 8, label: '8', name: '桃', bg: '#EC4899', text: '#FFFFFF', border: '#DB2777', ring: 'ring-pink-500' },
  { no: 9, label: '9', name: '紫', bg: '#9333EA', text: '#FFFFFF', border: '#7E22CE', ring: 'ring-purple-600' },
];

export function getCarColor(no: number) {
  return KEIRIN_CAR_COLORS[no - 1] || { no, label: String(no), name: '灰', bg: '#64748B', text: '#FFFFFF', border: '#475569', ring: 'ring-gray-500' };
}

/**
 * 選手特徴量ベクトルの生成 (Python と厳密一致)
 */
export function makeFeatures(riders: Rider[]): number[][] {
  const avg = riders.reduce((s, r) => s + r.score, 0) / Math.max(1, riders.length);
  return riders.map(r => [
    (r.score - avg) / 10.0,
    r.win / 20.0,
    r.top3 / 50.0,
    r.style === '逃' ? 1.0 : 0.0,
    r.style === '捲' ? 1.0 : 0.0,
    r.style === '追' ? 1.0 : 0.0,
    r.pos === '先頭' ? 1.0 : 0.0,
    r.pos === '番手' ? 1.0 : 0.0,
    r.pos === '3番手' ? 1.0 : 0.0,
    r.pos === '単騎' ? 1.0 : 0.0,
    r.back / 10.0,
    (r.gear - 3.9) * 10.0,
  ]);
}

/**
 * ベクトル内積
 */
export function dot(w: number[], x: number[]): number {
  return w.reduce((sum, wi, i) => sum + wi * (x[i] || 0), 0);
}

/**
 * Plackett-Luce モデルによる厳密確率計算
 */
export function exactProbs(utils: number[]): AnalysisProbs {
  const n = utils.length;
  const m = Math.max(...utils);
  const e = utils.map(u => Math.exp(u - m));
  const S = e.reduce((sum, val) => sum + val, 0);

  const win = e.map(val => val / S);
  const top2 = new Array(n).fill(0.0);
  const top3 = new Array(n).fill(0.0);

  const tri: Record<string, number> = {};
  const exa: Record<string, number> = {};
  const trio: Record<string, number> = {};
  const quin: Record<string, number> = {};
  const wide: Record<string, number> = {};

  // 全順列 (a, b, c) を全探索 (9車で504通り、ミリ秒未満で即時計算)
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      for (let c = 0; c < n; c++) {
        if (a === c || b === c) continue;

        const denom1 = S;
        const denom2 = S - e[a];
        const denom3 = S - e[a] - e[b];

        if (denom2 <= 0 || denom3 <= 0) continue;

        const p = (e[a] / denom1) * (e[b] / denom2) * (e[c] / denom3);

        const triKey = `${a}-${b}-${c}`;
        tri[triKey] = p;

        const exaKey = `${a}-${b}`;
        exa[exaKey] = (exa[exaKey] || 0) + p;

        const sortedTrio = [a, b, c].sort((x, y) => x - y);
        const trioKey = `${sortedTrio[0]}=${sortedTrio[1]}=${sortedTrio[2]}`;
        trio[trioKey] = (trio[trioKey] || 0) + p;

        const pairs = [
          [a, b].sort((x, y) => x - y),
          [a, c].sort((x, y) => x - y),
          [b, c].sort((x, y) => x - y),
        ];
        for (const pair of pairs) {
          const wideKey = `${pair[0]}=${pair[1]}`;
          wide[wideKey] = (wide[wideKey] || 0) + p;
        }

        top3[a] += p;
        top3[b] += p;
        top3[c] += p;
      }
    }
  }

  for (const [exaKey, p] of Object.entries(exa)) {
    const [aStr, bStr] = exaKey.split('-');
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    top2[a] += p;
    top2[b] += p;

    const pair = [a, b].sort((x, y) => x - y);
    const quinKey = `${pair[0]}=${pair[1]}`;
    quin[quinKey] = (quin[quinKey] || 0) + p;
  }

  return { win, top2, top3, tri, exa, trio, quin, wide };
}

/**
 * 総合分析実行
 */
export function analyzeRiders(riders: Rider[], weights: number[]): AnalysisProbs {
  const feats = makeFeatures(riders);
  const utils = feats.map(x => dot(weights, x));
  return exactProbs(utils);
}

/**
 * ライン文字列のパース ("1-4-7 2-5 3-6 8 9" -> {車番: ライン位置})
 */
export function parseLines(text: string): Record<number, LinePosition> {
  const pos: Record<number, LinePosition> = {};
  const cleaned = text.replace(/,/g, '-').replace(/　/g, ' ').trim();
  if (!cleaned) return pos;

  const groups = cleaned.split(/\s+/).filter(Boolean);
  const posNames: Record<number, LinePosition> = { 0: '先頭', 1: '番手', 2: '3番手', 3: '4番手' };

  for (const group of groups) {
    const members = group.split('-').map(m => parseInt(m.trim(), 10)).filter(n => !isNaN(n));
    if (members.length === 1) {
      pos[members[0]] = '単騎';
    } else {
      members.forEach((m, idx) => {
        pos[m] = posNames[idx] || '4番手';
      });
    }
  }
  return pos;
}

/**
 * 期待値 (EV) 算出
 */
export function computeEVBets(
  riders: Rider[],
  probs: AnalysisProbs,
  odds?: RaceOdds,
  options: { minEV?: number; limit?: number } = {}
): EVBet[] {
  if (!odds) return [];

  const { minEV = 0.5, limit = 20 } = options;
  const noToIdx = new Map<number, number>();
  riders.forEach((r, idx) => noToIdx.set(r.no, idx));

  const list: EVBet[] = [];

  // 3連単
  if (odds.tri) {
    for (const [comb, od] of Object.entries(odds.tri)) {
      const parts = comb.split('-').map(Number);
      if (parts.length === 3) {
        const i1 = noToIdx.get(parts[0]);
        const i2 = noToIdx.get(parts[1]);
        const i3 = noToIdx.get(parts[2]);
        if (i1 !== undefined && i2 !== undefined && i3 !== undefined) {
          const key = `${i1}-${i2}-${i3}`;
          const p = probs.tri[key] || 0;
          if (p >= 0.001) {
            const ev = p * od;
            if (ev >= minEV) {
              list.push({
                type: '3連単',
                combination: comb,
                cars: parts,
                prob: p,
                odds: od,
                ev,
                breakeven: p > 0 ? 1 / p : 9999,
              });
            }
          }
        }
      }
    }
  }

  // 2車単
  if (odds.exa) {
    for (const [comb, od] of Object.entries(odds.exa)) {
      const parts = comb.split('-').map(Number);
      if (parts.length === 2) {
        const i1 = noToIdx.get(parts[0]);
        const i2 = noToIdx.get(parts[1]);
        if (i1 !== undefined && i2 !== undefined) {
          const key = `${i1}-${i2}`;
          const p = probs.exa[key] || 0;
          if (p >= 0.005) {
            const ev = p * od;
            if (ev >= minEV) {
              list.push({
                type: '2車単',
                combination: comb,
                cars: parts,
                prob: p,
                odds: od,
                ev,
                breakeven: p > 0 ? 1 / p : 9999,
              });
            }
          }
        }
      }
    }
  }

  // 2車複
  if (odds.quin) {
    for (const [comb, od] of Object.entries(odds.quin)) {
      const parts = comb.split('=').map(Number);
      if (parts.length === 2) {
        const i1 = noToIdx.get(parts[0]);
        const i2 = noToIdx.get(parts[1]);
        if (i1 !== undefined && i2 !== undefined) {
          const [minIdx, maxIdx] = [i1, i2].sort((a, b) => a - b);
          const key = `${minIdx}=${maxIdx}`;
          const p = probs.quin[key] || 0;
          if (p >= 0.005) {
            const ev = p * od;
            if (ev >= minEV) {
              list.push({
                type: '2車複',
                combination: comb,
                cars: parts,
                prob: p,
                odds: od,
                ev,
                breakeven: p > 0 ? 1 / p : 9999,
              });
            }
          }
        }
      }
    }
  }

  // 3連複
  if (odds.trio) {
    for (const [comb, od] of Object.entries(odds.trio)) {
      const parts = comb.split('=').map(Number);
      if (parts.length === 3) {
        const idxs = parts.map(c => noToIdx.get(c)).filter(idx => idx !== undefined) as number[];
        if (idxs.length === 3) {
          idxs.sort((a, b) => a - b);
          const key = `${idxs[0]}=${idxs[1]}=${idxs[2]}`;
          const p = probs.trio[key] || 0;
          if (p >= 0.002) {
            const ev = p * od;
            if (ev >= minEV) {
              list.push({
                type: '3連複',
                combination: comb,
                cars: parts,
                prob: p,
                odds: od,
                ev,
                breakeven: p > 0 ? 1 / p : 9999,
              });
            }
          }
        }
      }
    }
  }

  // ワイド
  if (odds.wide) {
    for (const [comb, od] of Object.entries(odds.wide)) {
      const parts = comb.split('=').map(Number);
      if (parts.length === 2) {
        const i1 = noToIdx.get(parts[0]);
        const i2 = noToIdx.get(parts[1]);
        if (i1 !== undefined && i2 !== undefined) {
          const [minIdx, maxIdx] = [i1, i2].sort((a, b) => a - b);
          const key = `${minIdx}=${maxIdx}`;
          const p = probs.wide[key] || 0;
          if (p >= 0.01) {
            const ev = p * od;
            if (ev >= minEV) {
              list.push({
                type: 'ワイド',
                combination: comb,
                cars: parts,
                prob: p,
                odds: od,
                ev,
                breakeven: p > 0 ? 1 / p : 9999,
              });
            }
          }
        }
      }
    }
  }

  list.sort((a, b) => b.ev - a.ev);
  return list.slice(0, limit);
}

/**
 * 資金配分計算（ケリー基準 / 均等 / 払戻均等）
 */
export function calculateStakes(
  bets: EVBet[],
  totalBudget: number,
  mode: 'kelly' | 'equal' | 'equalPayout' = 'kelly'
): EVBet[] {
  if (bets.length === 0 || totalBudget <= 0) return bets;

  const out = [...bets];
  if (mode === 'equal') {
    const stakePerBet = Math.max(100, Math.floor(totalBudget / bets.length / 100) * 100);
    out.forEach(b => {
      b.recommendedBet = stakePerBet;
    });
    return out;
  }

  if (mode === 'equalPayout') {
    const invOddsSum = bets.reduce((s, b) => s + 1 / Math.max(1.1, b.odds), 0);
    out.forEach(b => {
      const raw = totalBudget * (1 / Math.max(1.1, b.odds)) / invOddsSum;
      b.recommendedBet = Math.max(100, Math.round(raw / 100) * 100);
    });
    return out;
  }

  // Fractional Kelly (Quarter Kelly: 0.25)
  // f* = (p * b - (1 - p)) / b = (ev - 1) / (odds - 1)
  const rawStakes = bets.map(b => {
    if (b.ev <= 1.0 || b.odds <= 1.0) return 100;
    const kellyFraction = (b.ev - 1.0) / (b.odds - 1.0);
    const quarterKelly = Math.max(0.01, kellyFraction * 0.25);
    return quarterKelly * totalBudget;
  });

  const rawSum = rawStakes.reduce((s, v) => s + v, 0);
  out.forEach((b, i) => {
    const normalized = rawSum > 0 ? (rawStakes[i] / rawSum) * totalBudget : 100;
    b.recommendedBet = Math.max(100, Math.round(normalized / 100) * 100);
  });

  return out;
}

/**
 * 過去レースデータからの勾配降下学習 (Gradient Descent on Plackett-Luce)
 */
export function trainWeights(
  races: { feats: number[][]; order: number[] }[],
  initialWeights: number[],
  epochs: number = 400,
  lr: number = 0.08,
  l2: number = 0.01,
  onProgress?: (epoch: number, loss: number) => void
): number[] {
  const w = [...initialWeights];
  const F = w.length;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const g = new Array(F).fill(0.0);
    let totalNLL = 0;

    for (const { feats, order } of races) {
      const remaining = feats.map((_, i) => i);
      const top3Winners = order.slice(0, 3);

      for (const winner of top3Winners) {
        if (!remaining.includes(winner)) continue;

        const us = remaining.map(i => dot(w, feats[i]));
        const m = Math.max(...us);
        const ex = us.map(u => Math.exp(u - m));
        const s = ex.reduce((acc, val) => acc + val, 0);

        if (s > 0) {
          const winnerIdxInRem = remaining.indexOf(winner);
          if (winnerIdxInRem >= 0 && ex[winnerIdxInRem] > 0) {
            totalNLL -= Math.log(ex[winnerIdxInRem] / s);
          }

          for (let k = 0; k < F; k++) {
            let expected = 0;
            for (let j = 0; j < remaining.length; j++) {
              expected += (ex[j] / s) * feats[remaining[j]][k];
            }
            g[k] += feats[winner][k] - expected;
          }
        }

        const remIdx = remaining.indexOf(winner);
        if (remIdx > -1) remaining.splice(remIdx, 1);
      }
    }

    const nRaces = Math.max(1, races.length);
    for (let k = 0; k < F; k++) {
      w[k] += lr * (g[k] / nRaces - l2 * w[k]);
    }

    if (onProgress && (epoch % 20 === 0 || epoch === epochs - 1)) {
      onProgress(epoch, totalNLL / nRaces);
    }
  }

  return w;
}

/**
 * 印の自動決定
 * 1着率の高い順に ◎(本命), ○(対抗), ▲(単穴), △(連下), ×(注意)
 */
export function assignMarks(winProbs: number[]): Record<number, string> {
  const indices = winProbs.map((p, i) => ({ i, p })).sort((a, b) => b.p - a.p);
  const markChars = ['◎', '○', '▲', '△', '×'];
  const res: Record<number, string> = {};
  indices.forEach((item, rank) => {
    if (rank < markChars.length) {
      res[item.i] = markChars[rank];
    } else {
      res[item.i] = '';
    }
  });
  return res;
}
