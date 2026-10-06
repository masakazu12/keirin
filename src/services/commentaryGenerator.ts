import { Rider, AnalysisProbs } from '../types/keirin';
import { parseLines } from './keirinModel';

export interface TacticalCommentaryResult {
  summaryTitle: string; // 例: "先行争い激化・捲り強襲型"
  pace: 'ハイペース（激戦）' | 'ミドルペース' | 'スローペース（牽制戦）';
  flowType: '先行1車型' | '2分戦・力比べ' | '3分戦・主導権争い' | 'コマ切れ・大混戦';
  fullCommentary: string; // レポート用フルテキスト
  shortComment: string; // 要約1行コメント
  keyRiders: {
    leadPacesetter?: Rider; // 主導権を握る選手
    stalker?: Rider;        // 番手・マーク選手
    striker?: Rider;        // 捲り一撃の選手
  };
}

/**
 * レース名・ライン構成・各選手の勝率・脚質・バンクからレース展開予想コメントを動的に生成
 */
export function generateTacticalCommentary(
  raceName: string,
  linesText: string,
  riders: Rider[],
  probs: AnalysisProbs,
  bankLength: number = 400
): TacticalCommentaryResult {
  const activeRiders = riders.filter(r => r.score > 0);
  if (activeRiders.length === 0) {
    return {
      summaryTitle: '出走情報なし',
      pace: 'ミドルペース',
      flowType: '3分戦・主導権争い',
      fullCommentary: '出走選手が登録されていません。',
      shortComment: '出走選手が登録されていません。',
      keyRiders: {},
    };
  }

  // ライン構成の解析
  const posMap = parseLines(linesText);
  const lineGroups = linesText
    .replace(/,/g, '-')
    .replace(/　/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(g => g.split('-').map(m => parseInt(m.trim(), 10)).filter(n => !isNaN(n)));

  const riderMap = new Map<number, Rider>();
  activeRiders.forEach(r => riderMap.set(r.no, r));

  // 先頭を走る自力型選手 (pos === '先頭' or 単騎で自力)
  const lineLeaders: Rider[] = [];
  const soloRiders: Rider[] = [];

  lineGroups.forEach(group => {
    if (group.length > 1) {
      const leader = riderMap.get(group[0]);
      if (leader) lineLeaders.push(leader);
    } else if (group.length === 1) {
      const solo = riderMap.get(group[0]);
      if (solo) soloRiders.push(solo);
    }
  });

  // 積極逃げ型選手 (スタイルが逃げ、またはバック数が多い選手)
  const aggressiveRunners = activeRiders.filter(
    r => (r.style === '逃' || r.back >= 8) && (r.pos === '先頭' || r.pos === '単騎')
  );

  // 捲り型
  const makuriRunners = activeRiders.filter(
    r => r.style === '捲' && (r.pos === '先頭' || r.pos === '単騎')
  );

  // 1着率順位
  const ranked = [...activeRiders].sort((a, b) => {
    const idxA = activeRiders.indexOf(a);
    const idxB = activeRiders.indexOf(b);
    return (probs.win[idxB] || 0) - (probs.win[idxA] || 0);
  });

  const favorite = ranked[0]; // ◎ 本命
  const secondFav = ranked[1]; // ○ 対抗

  // ライン戦タイプの特定
  const mainLineCount = lineLeaders.length;
  let flowType: TacticalCommentaryResult['flowType'] = '3分戦・主導権争い';
  if (mainLineCount >= 4) {
    flowType = 'コマ切れ・大混戦';
  } else if (mainLineCount === 3) {
    flowType = '3分戦・主導権争い';
  } else if (mainLineCount === 2) {
    flowType = '2分戦・力比べ';
  } else if (aggressiveRunners.length === 1) {
    flowType = '先行1車型';
  }

  // ペース判定
  let pace: TacticalCommentaryResult['pace'] = 'ミドルペース';
  let summaryTitle = '';

  if (aggressiveRunners.length >= 2) {
    pace = 'ハイペース（激戦）';
    if (makuriRunners.length > 0) {
      summaryTitle = '先行争い激化・捲り強襲型';
    } else {
      summaryTitle = '徹底先行のモガき合い・消耗戦';
    }
  } else if (aggressiveRunners.length === 1) {
    pace = 'スローペース（牽制戦）';
    summaryTitle = '先行一車・マイペース逃げ粘り型';
  } else {
    pace = 'ミドルペース';
    summaryTitle = '位置取り重視・瞬発力勝負型';
  }

  // コメント文章の組み立て
  const storyLines: string[] = [];

  // 1. 序盤〜打鐘（ジャン）の主導権争い
  if (aggressiveRunners.length >= 2) {
    const n1 = aggressiveRunners[0];
    const n2 = aggressiveRunners[1];
    storyLines.push(
      `【序盤〜赤板】自力型の${n1.name}（${n1.no}番車）と${n2.name}（${n2.no}番車）による先手を巡る主導権争いが予想され、赤板からピッチが急上昇。互いに突っ張り先行も視野に意地がぶつかり合う。`
    );
    storyLines.push(
      `【打鐘〜最終バック】激しいモガき合いで隊列が縦長となり、前団はハイペースの消耗戦に突入する公算が高い。先行争いが激化すれば、脚を溜める中団勢に絶好の展開が巡る。`
    );
  } else if (aggressiveRunners.length === 1) {
    const singleLead = aggressiveRunners[0];
    storyLines.push(
      `【序盤〜赤板】唯一の本格先行である${singleLead.name}（${singleLead.no}番車）が、無理のないペース配分で主導権を握りやすい「先行一車」の構図。`
    );
    storyLines.push(
      `【打鐘〜最終バック】別線からのプレッシャーも限定的で、マイペースの先行逃げ態勢に持ち込めば後続は仕掛けづらい展開。ライン番手の絶好マークから直線勝負が濃厚。`
    );
  } else {
    storyLines.push(
      `【序盤〜赤板】主導権を強く主張する徹底先行型が不在のため、赤板を過ぎても各ラインが互いの出方をうかがうスローペースの牽制戦。`
    );
    storyLines.push(
      `【打鐘〜最終バック】打鐘から一気にペースが上がる瞬発力勝負。位置取りの巧拙が勝敗を直結し、最終ホームからのカマシ・捲りが決まりやすい。`
    );
  }

  // 2. 本命選手の仕掛けと勝負どころ
  if (favorite) {
    const favWinPct = ((probs.win[activeRiders.indexOf(favorite)] || 0) * 100).toFixed(1);
    if (favorite.pos === '先頭') {
      storyLines.push(
        `【勝負どころ】勝率${favWinPct}%で本命に推される${favorite.name}（${favorite.no}番車）は自ら仕掛けて主導権奪取または快速捲り。力上位のスピードで別線を圧倒し、押し切りを図る。`
      );
    } else if (favorite.pos === '番手') {
      storyLines.push(
        `【勝負どころ】本命の${favorite.name}（${favorite.no}番車）は番手絶好位をキープ。前を走るライン先頭のアシストを活かし、最終直線で抜け出すライン上位独占が本線シナリオ。`
      );
    } else if (favorite.pos === '単騎') {
      storyLines.push(
        `【勝負どころ】本命の${favorite.name}（${favorite.no}番車）は単騎での自在戦。先行争いのもつれを冷静に見極め、直線一気の大外強襲で突き抜けを狙う。`
      );
    } else {
      storyLines.push(
        `【勝負どころ】高い総合力を持つ${favorite.name}（${favorite.no}番車）がレースの主導権を握り、勝率${favWinPct}%に見合う力強い走りで直線勝負に持ち込む。`
      );
    }
  }

  // 3. バンク特性と波乱要因（直線距離・バンク長）
  if (bankLength <= 335) {
    storyLines.push(
      `【バンク傾向（${bankLength}m短走路）】みなし直線が短いため、後方からでは届きにくい。先行ラインおよび前々へ踏み込んだ選手の粘り込みに警戒が必要。`
    );
  } else if (bankLength >= 500) {
    storyLines.push(
      `【バンク傾向（${bankLength}m長走路）】見なし直線が非常に長いため、先行勢がゴール前でタレやすく、番手・3番手からの追い込み強襲や外伸びが警戒される。`
    );
  } else {
    storyLines.push(
      `【バンク傾向（400m標準）】実力が素直に発揮されやすい走路。仕掛けのタイミングとライン連携の完成度が着順を大きく左右する。`
    );
  }

  const fullCommentary = storyLines.join('\n');
  const shortComment = aggressiveRunners.length >= 2
    ? `先行争いが激化し前団消耗戦。中団待機の${favorite?.name || '本命'}の捲り強襲か番手抜け出しが有力。`
    : aggressiveRunners.length === 1
    ? `${aggressiveRunners[0].name}のマイペース先行。番手マークからの抜け出しと先行残りが軸。`
    : `牽制続くスローペース。瞬発力勝負から位置取り巧みな${favorite?.name || '上位陣'}が台頭。`;

  return {
    summaryTitle,
    pace,
    flowType,
    fullCommentary,
    shortComment,
    keyRiders: {
      leadPacesetter: aggressiveRunners[0],
      striker: makuriRunners[0] || (favorite?.style === '捲' ? favorite : undefined),
      stalker: activeRiders.find(r => r.pos === '番手'),
    },
  };
}
