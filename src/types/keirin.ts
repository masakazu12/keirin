export type RiderStyle = '逃' | '捲' | '追' | '両';
export type LinePosition = '先頭' | '番手' | '3番手' | '4番手' | '単騎';

export interface Rider {
  no: number;          // 車番 (1-9)
  name: string;        // 選手名
  pref?: string;       // 府県
  cls?: string;        // 級班 (S1, S2, A1, etc.)
  score: number;       // 競走得点
  style: RiderStyle;   // 脚質
  win: number;         // 勝率 (%)
  top3: number;        // 3連対率 (%)
  back: number;        // バック数 (B)
  gear: number;        // ギア倍数
  pos: LinePosition;   // ライン位置
}

export interface AnalysisProbs {
  win: number[];       // 各選手の1着率
  top2: number[];      // 各選手の連対率 (1 or 2着)
  top3: number[];      // 各選手の3連対率 (1, 2 or 3着)
  tri: Record<string, number>;   // 3連単 (key: "a-b-c", p: prob)
  exa: Record<string, number>;   // 2車単 (key: "a-b", p: prob)
  trio: Record<string, number>;  // 3連複 (key: "a=b=c", p: prob)
  quin: Record<string, number>;  // 2車複 (key: "a=b", p: prob)
  wide: Record<string, number>;  // ワイド (key: "a=b", p: prob)
}

export interface EVBet {
  type: '3連単' | '2車単' | '2車複' | '3連複' | 'ワイド';
  combination: string;
  cars: number[];
  prob: number;
  odds: number;
  ev: number;          // prob * odds
  breakeven: number;   // 1 / prob
  recommendedBet?: number; // 資金配分（円）
}

export interface RaceOdds {
  exa: Record<string, number>;   // 2車単: "1-2" -> odds
  quin: Record<string, number>;  // 2車複: "1=2" -> odds
  tri: Record<string, number>;   // 3連単: "1-2-3" -> odds
  trio: Record<string, number>;  // 3連複: "1=2=3" -> odds
  wide: Record<string, number>;  // ワイド: "1=2" -> odds
  notes?: string[];
}

export interface PayoutDetail {
  combination: string;
  payout: number;      // 払戻金 (100円あたり 円)
  popularity?: number; // 人気順
}

export interface RaceResult {
  isSettled: boolean;   // 確定しているか
  order: number[];      // [1着車番, 2着車番, 3着車番, ...]
  kimarite: '逃げ' | '捲り' | '差し' | 'マーク'; // 決まり手
  payouts: {
    tri?: PayoutDetail;          // 3連単
    exa?: PayoutDetail;          // 2車単
    quin?: PayoutDetail;         // 2車複
    trio?: PayoutDetail;         // 3連複
    wide?: PayoutDetail[];       // ワイド (通常3組)
  };
  raceTime?: string;    // 上がりタイム
  settledAt?: string;   // 確定時刻
}

export interface RaceInfo {
  id: string;
  venue: string;
  venueCode: string;
  date: string;
  raceNo: number;
  grade: string;
  distance: number;
  bankLength: number;  // 333, 400, 500m
  lines: string;       // 例: "1-4-7 2-5 3-6 8 9"
  lineSource: string;
  riders: Rider[];
  odds?: RaceOdds;
  result?: RaceResult; // レース結果情報
}

export interface BetSlipItem {
  id: string;
  raceId: string;
  raceTitle: string;
  date: string;
  venue: string;
  raceNo: number;
  type: '3連単' | '2車単' | '2車複' | '3連複' | 'ワイド';
  combination: string; // 例: "1-4-7"
  cars: number[];
  stake: number;       // 投資金額 (円)
  odds: number;        // 購入時オッズ
  isSettled: boolean;  // 結果確定済か
  isHit?: boolean;     // 的中したか
  payout: number;      // 払戻金額 (円)
  profit: number;      // 損益 (円 = payout - stake)
  timestamp: number;
}

export interface BettingSummary {
  totalStake: number;   // 累計投資金額
  totalReturn: number;  // 累計払戻金額
  netProfit: number;    // 累計損益
  recoveryRate: number; // 回収率 (%) = totalReturn / totalStake * 100
  totalBets: number;    // 購入件数
  hitCount: number;     // 的中件数
  hitRate: number;      // 的中率 (%) = hitCount / totalBets * 100
}

export interface FeatureWeights {
  scoreDiff: number;   // 得点差
  winRate: number;     // 勝率
  top3Rate: number;    // 3連対率
  styleNige: number;   // 逃
  styleMaki: number;   // 捲
  styleTsui: number;   // 追
  posLead: number;     // 先頭
  posSecond: number;   // 番手
  posThird: number;    // 3番手
  posSolo: number;     // 単騎
  backCount: number;   // バック
  gearRatio: number;   // ギア
}
