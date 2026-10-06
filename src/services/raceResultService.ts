import { 
  RaceInfo, 
  RaceResult, 
  BetSlipItem, 
  BettingSummary, 
  Rider,
  EVBet 
} from '../types/keirin';

/**
 * レース結果を生成・確定する（実力・展開・オッズに基づいた自然な着順と公式払戻金）
 */
export function generateRaceResult(race: RaceInfo): RaceResult {
  const riders = race.riders.filter(r => r.score > 0);
  if (riders.length < 3) {
    return {
      isSettled: false,
      order: [],
      kimarite: '差し',
      payouts: {},
    };
  }

  // レースIDまたは車番構成に基づき一貫性のある着順を算出
  // シード値としてIDや出走情報を使用（同じレースなら常に一貫した確定結果が返る）
  const seedString = `${race.venueCode}-${race.date}-${race.raceNo}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const pseudoRand = Math.abs(hash % 1000) / 1000;

  // 上位候補の抽出 (競走得点および勝率の高い選手)
  const sortedByScore = [...riders].sort((a, b) => b.score - a.score);
  
  let firstCar: Rider;
  let secondCar: Rider;
  let thirdCar: Rider;

  if (pseudoRand < 0.65) {
    // 堅調決着: 1番人気・2番人気中心（本命・対抗）
    firstCar = sortedByScore[0];
    secondCar = sortedByScore[1];
    thirdCar = sortedByScore[2] || sortedByScore[0];
  } else if (pseudoRand < 0.88) {
    // 中穴決着: 2番人気や番手選手が差し抜け
    firstCar = sortedByScore[1];
    secondCar = sortedByScore[0];
    thirdCar = sortedByScore[3] || sortedByScore[2];
  } else {
    // 波乱決着: 3〜4番人気の捲り強襲
    firstCar = sortedByScore[2] || sortedByScore[0];
    secondCar = sortedByScore[0];
    thirdCar = sortedByScore[4] || sortedByScore[1];
  }

  // 車番の重複回避
  const chosenCars = [firstCar.no, secondCar.no, thirdCar.no];
  const uniqueCars: number[] = [];
  chosenCars.forEach(c => {
    if (!uniqueCars.includes(c)) uniqueCars.push(c);
  });
  // 不足分を補完
  riders.forEach(r => {
    if (!uniqueCars.includes(r.no)) uniqueCars.push(r.no);
  });

  const [c1, c2, c3] = uniqueCars.slice(0, 3);
  const winnerRider = riders.find(r => r.no === c1);

  // 決まり手の判定
  let kimarite: RaceResult['kimarite'] = '差し';
  if (winnerRider?.style === '逃') {
    kimarite = '逃げ';
  } else if (winnerRider?.style === '捲') {
    kimarite = '捲り';
  } else if (winnerRider?.pos === '3番手') {
    kimarite = 'マーク';
  } else {
    kimarite = '差し';
  }

  // 払戻金テーブルの生成 (オッズと連動)
  const odds = race.odds;
  const triKey = `${c1}-${c2}-${c3}`;
  const exaKey = `${c1}-${c2}`;
  const quinKey = [c1, c2].sort((a, b) => a - b).join('=');
  const trioKey = [c1, c2, c3].sort((a, b) => a - b).join('=');

  const triOdds = odds?.tri?.[triKey] || (pseudoRand < 0.65 ? 24.5 : pseudoRand < 0.88 ? 88.2 : 210.0);
  const exaOdds = odds?.exa?.[exaKey] || (pseudoRand < 0.65 ? 8.2 : pseudoRand < 0.88 ? 22.4 : 64.0);
  const quinOdds = odds?.quin?.[quinKey] || (pseudoRand < 0.65 ? 5.4 : 14.8);
  const trioOdds = odds?.trio?.[trioKey] || (pseudoRand < 0.65 ? 9.8 : 34.0);

  // ワイド3組
  const pair1 = [c1, c2].sort((a, b) => a - b).join('=');
  const pair2 = [c1, c3].sort((a, b) => a - b).join('=');
  const pair3 = [c2, c3].sort((a, b) => a - b).join('=');

  const w1Odds = odds?.wide?.[pair1] || 2.4;
  const w2Odds = odds?.wide?.[pair2] || 4.2;
  const w3Odds = odds?.wide?.[pair3] || 6.8;

  return {
    isSettled: true,
    order: [c1, c2, c3, ...uniqueCars.slice(3)],
    kimarite,
    payouts: {
      tri: { combination: triKey, payout: Math.round(triOdds * 100), popularity: Math.max(1, Math.floor(triOdds / 3)) },
      exa: { combination: exaKey, payout: Math.round(exaOdds * 100), popularity: Math.max(1, Math.floor(exaOdds / 2)) },
      quin: { combination: quinKey, payout: Math.round(quinOdds * 100) },
      trio: { combination: trioKey, payout: Math.round(trioOdds * 100) },
      wide: [
        { combination: pair1, payout: Math.round(w1Odds * 100) },
        { combination: pair2, payout: Math.round(w2Odds * 100) },
        { combination: pair3, payout: Math.round(w3Odds * 100) },
      ],
    },
    raceTime: '11.4秒',
    settledAt: '確定済',
  };
}

/**
 * 購入車券を結果と突き合わせて的中判定・払戻金を算出する
 */
export function settleBetItem(bet: BetSlipItem, result: RaceResult): BetSlipItem {
  if (!result.isSettled || result.order.length < 3) {
    return { ...bet, isSettled: false, isHit: false, payout: 0, profit: -bet.stake };
  }

  const [first, second, third] = result.order;
  let isHit = false;
  let payoutPer100 = 0;

  switch (bet.type) {
    case '3連単': {
      // 1着-2着-3着
      if (bet.cars.length >= 3 && bet.cars[0] === first && bet.cars[1] === second && bet.cars[2] === third) {
        isHit = true;
        payoutPer100 = result.payouts.tri?.payout || Math.round(bet.odds * 100);
      }
      break;
    }
    case '2車単': {
      // 1着-2着
      if (bet.cars.length >= 2 && bet.cars[0] === first && bet.cars[1] === second) {
        isHit = true;
        payoutPer100 = result.payouts.exa?.payout || Math.round(bet.odds * 100);
      }
      break;
    }
    case '2車複': {
      // 1着と2着の組合せ (順不同)
      if (bet.cars.length >= 2) {
        const top2 = [first, second].sort((a, b) => a - b);
        const bet2 = [bet.cars[0], bet.cars[1]].sort((a, b) => a - b);
        if (top2[0] === bet2[0] && top2[1] === bet2[1]) {
          isHit = true;
          payoutPer100 = result.payouts.quin?.payout || Math.round(bet.odds * 100);
        }
      }
      break;
    }
    case '3連複': {
      // 1着, 2着, 3着の組合せ (順不同)
      if (bet.cars.length >= 3) {
        const top3 = [first, second, third].sort((a, b) => a - b);
        const bet3 = [bet.cars[0], bet.cars[1], bet.cars[2]].sort((a, b) => a - b);
        if (top3[0] === bet3[0] && top3[1] === bet3[1] && top3[2] === bet3[2]) {
          isHit = true;
          payoutPer100 = result.payouts.trio?.payout || Math.round(bet.odds * 100);
        }
      }
      break;
    }
    case 'ワイド': {
      // 3着以内に入った2車の組合せ (1-2, 1-3, 2-3)
      if (bet.cars.length >= 2) {
        const cA = bet.cars[0];
        const cB = bet.cars[1];
        const top3Set = new Set([first, second, third]);
        if (top3Set.has(cA) && top3Set.has(cB)) {
          isHit = true;
          const pairKey = [cA, cB].sort((a, b) => a - b).join('=');
          const matchedWide = result.payouts.wide?.find(w => w.combination === pairKey);
          payoutPer100 = matchedWide?.payout || Math.round(bet.odds * 100);
        }
      }
      break;
    }
  }

  const payout = isHit ? Math.round((bet.stake * payoutPer100) / 100) : 0;
  const profit = payout - bet.stake;

  return {
    ...bet,
    isSettled: true,
    isHit,
    payout,
    profit,
  };
}

export interface EVBetHitResult {
  isSettled: boolean;
  isHit: boolean;
  payoutPer100: number; // 100円あたりの払戻金
  actualOdds: number;   // 確定オッズ
}

/**
 * 推奨買い目(EVBet)が確定着順に対して的中しているか判定する
 */
export function checkEVBetHit(bet: EVBet, result?: RaceResult): EVBetHitResult {
  if (!result || !result.isSettled || result.order.length < 3) {
    return { isSettled: false, isHit: false, payoutPer100: 0, actualOdds: bet.odds };
  }

  const [first, second, third] = result.order;
  let isHit = false;
  let payoutPer100 = 0;

  switch (bet.type) {
    case '3連単': {
      if (bet.cars.length >= 3 && bet.cars[0] === first && bet.cars[1] === second && bet.cars[2] === third) {
        isHit = true;
        payoutPer100 = result.payouts.tri?.payout || Math.round(bet.odds * 100);
      }
      break;
    }
    case '2車単': {
      if (bet.cars.length >= 2 && bet.cars[0] === first && bet.cars[1] === second) {
        isHit = true;
        payoutPer100 = result.payouts.exa?.payout || Math.round(bet.odds * 100);
      }
      break;
    }
    case '2車複': {
      if (bet.cars.length >= 2) {
        const top2 = [first, second].sort((a, b) => a - b);
        const bet2 = [bet.cars[0], bet.cars[1]].sort((a, b) => a - b);
        if (top2[0] === bet2[0] && top2[1] === bet2[1]) {
          isHit = true;
          payoutPer100 = result.payouts.quin?.payout || Math.round(bet.odds * 100);
        }
      }
      break;
    }
    case '3連複': {
      if (bet.cars.length >= 3) {
        const top3 = [first, second, third].sort((a, b) => a - b);
        const bet3 = [bet.cars[0], bet.cars[1], bet.cars[2]].sort((a, b) => a - b);
        if (top3[0] === bet3[0] && top3[1] === bet3[1] && top3[2] === bet3[2]) {
          isHit = true;
          payoutPer100 = result.payouts.trio?.payout || Math.round(bet.odds * 100);
        }
      }
      break;
    }
    case 'ワイド': {
      if (bet.cars.length >= 2) {
        const cA = bet.cars[0];
        const cB = bet.cars[1];
        const top3Set = new Set([first, second, third]);
        if (top3Set.has(cA) && top3Set.has(cB)) {
          isHit = true;
          const pairKey = [cA, cB].sort((a, b) => a - b).join('=');
          const matchedWide = result.payouts.wide?.find(w => w.combination === pairKey);
          payoutPer100 = matchedWide?.payout || Math.round(bet.odds * 100);
        }
      }
      break;
    }
  }

  const actualOdds = payoutPer100 > 0 ? payoutPer100 / 100 : bet.odds;

  return {
    isSettled: true,
    isHit,
    payoutPer100,
    actualOdds,
  };
}

/**
 * 累計投資金額、累計払戻金、損益、回収率の集計
 */
export function calculateBettingSummary(bets: BetSlipItem[]): BettingSummary {
  let totalStake = 0;
  let totalReturn = 0;
  let hitCount = 0;
  let settledCount = 0;

  for (const bet of bets) {
    totalStake += bet.stake;
    if (bet.isSettled) {
      settledCount++;
      totalReturn += bet.payout;
      if (bet.isHit) {
        hitCount++;
      }
    }
  }

  const netProfit = totalReturn - totalStake;
  const recoveryRate = totalStake > 0 ? (totalReturn / totalStake) * 100 : 0;
  const hitRate = settledCount > 0 ? (hitCount / settledCount) * 100 : 0;

  return {
    totalStake,
    totalReturn,
    netProfit,
    recoveryRate: Math.round(recoveryRate * 10) / 10,
    totalBets: bets.length,
    hitCount,
    hitRate: Math.round(hitRate * 10) / 10,
  };
}

/**
 * ローカルストレージからの購入履歴読込
 */
export function loadBettingHistory(): BetSlipItem[] {
  try {
    const raw = localStorage.getItem('keirin_bet_history_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load betting history:', e);
  }
  return [];
}

/**
 * ローカルストレージへの購入履歴保存
 */
export function saveBettingHistory(bets: BetSlipItem[]): void {
  try {
    localStorage.setItem('keirin_bet_history_v2', JSON.stringify(bets));
  } catch (e) {
    console.error('Failed to save betting history:', e);
  }
}
