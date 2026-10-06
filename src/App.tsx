/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { Rider, RaceInfo, BetSlipItem, BettingSummary, RaceResult, EVBet } from './types/keirin';
import { 
  DEFAULT_WEIGHTS, 
  analyzeRiders, 
  assignMarks, 
  computeEVBets, 
  parseLines 
} from './services/keirinModel';
import { 
  VENUES, 
  getDerbyFinalPreset, 
  getSamplePythonPreset, 
  getGrandPrixPreset, 
  generateRealisticOdds 
} from './services/presetRaces';
import { generateTacticalCommentary } from './services/commentaryGenerator';
import { 
  generateRaceResult, 
  settleBetItem, 
  calculateBettingSummary, 
  loadBettingHistory, 
  saveBettingHistory,
  checkEVBetHit
} from './services/raceResultService';

import { WindowsTitleBar } from './components/WindowsTitleBar';
import { WindowsMenuBar } from './components/WindowsMenuBar';
import { RiderGrid } from './components/RiderGrid';
import { BankVisualizer } from './components/BankVisualizer';
import { OddsAndEVTable } from './components/OddsAndEVTable';
import { WeightsTrainerModal } from './components/WeightsTrainerModal';
import { WindowsExportModal } from './components/WindowsExportModal';
import { BatchRacesModal } from './components/BatchRacesModal';
import { AboutModal } from './components/AboutModal';
import { BettingLedgerBar } from './components/BettingLedgerBar';
import { RaceResultBanner } from './components/RaceResultBanner';
import { BettingLedgerModal } from './components/BettingLedgerModal';

import { 
  Play, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  LayoutGrid, 
  Calendar, 
  Check, 
  FileText, 
  Activity, 
  Layers, 
  ChevronRight, 
  Zap,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('keirin_theme');
      if (saved !== null) return saved === 'dark';
    } catch {}
    return false; // デフォルトを視認性の高い白基調（ライトモード）に設定
  });

  const toggleTheme = (val?: boolean) => {
    const next = val !== undefined ? val : !darkMode;
    setDarkMode(next);
    try {
      localStorage.setItem('keirin_theme', next ? 'dark' : 'light');
    } catch {}
  };

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBankVisualizerOpen, setIsBankVisualizerOpen] = useState<boolean>(true);

  // Weights (Plackett-Luce)
  const [weights, setWeights] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('keirin_weights_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_WEIGHTS.length) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [...DEFAULT_WEIGHTS];
  });

  // Race State (Initial: Sample race from Python script)
  const [currentRace, setCurrentRace] = useState<RaceInfo>(() => getDerbyFinalPreset());
  const [selectedDate, setSelectedDate] = useState<string>('20261006');
  const [selectedVenueCode, setSelectedVenueCode] = useState<string>('31'); // 平塚
  const selectedVenue = useMemo(() => VENUES.find(v => v.code === selectedVenueCode) || VENUES[0], [selectedVenueCode]);
  const [selectedRaceNo, setSelectedRaceNo] = useState<number>(11);
  const [wantOdds, setWantOdds] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>(
    '準備完了: 平塚 11R G1 日本選手権競輪 (ダービー) 決勝'
  );
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Modals
  const [isTrainerOpen, setIsTrainerOpen] = useState<boolean>(false);
  const [isWindowsExportOpen, setIsWindowsExportOpen] = useState<boolean>(false);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);

  // Betting Ledger & Auto Results State
  const [bets, setBets] = useState<BetSlipItem[]>(() => {
    const loaded = loadBettingHistory();
    if (loaded.length > 0) return loaded;
    // 初期サンプル購入履歴（リアルな投資データ例）
    const initialBets: BetSlipItem[] = [
      {
        id: 'bet-sample-1',
        raceId: 'derby-final',
        raceTitle: '平塚 11R G1 決勝',
        date: '20261006',
        venue: '平塚',
        raceNo: 11,
        type: '3連単',
        combination: '1-4-7',
        cars: [1, 4, 7],
        stake: 2000,
        odds: 24.5,
        isSettled: true,
        isHit: true,
        payout: 49000,
        profit: 47000,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'bet-sample-2',
        raceId: 'derby-final',
        raceTitle: '平塚 11R G1 決勝',
        date: '20261006',
        venue: '平塚',
        raceNo: 11,
        type: '2車単',
        combination: '2-1',
        cars: [2, 1],
        stake: 1500,
        odds: 12.8,
        isSettled: true,
        isHit: false,
        payout: 0,
        profit: -1500,
        timestamp: Date.now() - 3500000,
      },
      {
        id: 'bet-sample-3',
        raceId: 'derby-final',
        raceTitle: '平塚 11R G1 決勝',
        date: '20261006',
        venue: '平塚',
        raceNo: 11,
        type: '3連複',
        combination: '1=4=7',
        cars: [1, 4, 7],
        stake: 1500,
        odds: 9.8,
        isSettled: true,
        isHit: true,
        payout: 14700,
        profit: 13200,
        timestamp: Date.now() - 3400000,
      },
    ];
    saveBettingHistory(initialBets);
    return initialBets;
  });

  const [autoFetchResult, setAutoFetchResult] = useState<boolean>(() => {
    return localStorage.getItem('keirin_auto_fetch_result') !== 'false';
  });

  const [currentResult, setCurrentResult] = useState<RaceResult | undefined>(() => {
    return generateRaceResult(getDerbyFinalPreset());
  });

  // 累計収支統計の集計
  const bettingSummary = useMemo(() => calculateBettingSummary(bets), [bets]);

  // 履歴の自動保存
  useEffect(() => {
    saveBettingHistory(bets);
  }, [bets]);

  // 結果自動取得切替
  const handleToggleAutoFetch = () => {
    const next = !autoFetchResult;
    setAutoFetchResult(next);
    localStorage.setItem('keirin_auto_fetch_result', String(next));
    setStatusMessage(`結果自動取得を ${next ? 'ON (自動確定)' : 'OFF (手動確定)'} に設定しました`);
  };

  // レース変更時の結果自動取得と車券の的中・損益自動反映
  useEffect(() => {
    if (autoFetchResult) {
      const res = generateRaceResult(currentRace);
      setCurrentResult(res);

      // 当該レースに関連する車券の自動清算
      setBets(prevBets => {
        let changed = false;
        const updated = prevBets.map(bet => {
          const isTargetRace = 
            (bet.venue === currentRace.venue && bet.raceNo === currentRace.raceNo) ||
            bet.raceId === `${currentRace.venueCode}-${currentRace.date}-${currentRace.raceNo}` ||
            (currentRace.grade.includes('ダービー') && bet.raceId === 'derby-final');

          if (isTargetRace && !bet.isSettled) {
            changed = true;
            return settleBetItem(bet, res);
          }
          return bet;
        });
        return changed ? updated : prevBets;
      });
    } else {
      // 自動取得がOFFの場合は未確定状態に
      setCurrentResult(undefined);
    }
  }, [currentRace.venue, currentRace.raceNo, currentRace.lines, autoFetchResult]);

  // 手動でレース結果を取得・確定する
  const handleFetchResult = () => {
    const res = generateRaceResult(currentRace);
    setCurrentResult(res);
    setBets(prevBets => {
      return prevBets.map(bet => {
        const isTargetRace = 
          (bet.venue === currentRace.venue && bet.raceNo === currentRace.raceNo) ||
          bet.raceId === `${currentRace.venueCode}-${currentRace.date}-${currentRace.raceNo}` ||
          (currentRace.grade.includes('ダービー') && bet.raceId === 'derby-final');

        if (isTargetRace) {
          return settleBetItem(bet, res);
        }
        return bet;
      });
    });
    setStatusMessage(`${currentRace.venue} ${currentRace.raceNo}R の公式着順・払戻金を確定しました (1着: ${res.order[0]}番車)`);
  };

  // レース結果を未確定状態に戻す
  const handleResetResult = () => {
    setCurrentResult(undefined);
    setBets(prevBets => {
      return prevBets.map(bet => {
        const isTargetRace = 
          (bet.venue === currentRace.venue && bet.raceNo === currentRace.raceNo) ||
          bet.raceId === `${currentRace.venueCode}-${currentRace.date}-${currentRace.raceNo}`;
        if (isTargetRace) {
          return { ...bet, isSettled: false, isHit: false, payout: 0, profit: -bet.stake };
        }
        return bet;
      });
    });
    setStatusMessage(`${currentRace.venue} ${currentRace.raceNo}R の結果を未確定状態に戻しました`);
  };

  // AI推奨EV買い目を収支帳に一括登録
  const handleQuickRegisterBets = () => {
    const candidates = evBets.filter(b => b.ev >= 0.8).slice(0, 4);
    if (candidates.length === 0) {
      setStatusMessage('登録対象の期待値(EV)買い目がありません');
      return;
    }
    const raceKey = `${currentRace.venueCode}-${currentRace.date}-${currentRace.raceNo}`;
    const newItems: BetSlipItem[] = candidates.map(b => {
      const cars = b.combination.split(/[-=]/).map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
      const item: BetSlipItem = {
        id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        raceId: raceKey,
        raceTitle: `${currentRace.venue} ${currentRace.raceNo}R ${currentRace.grade || ''}`,
        date: currentRace.date || selectedDate,
        venue: currentRace.venue,
        raceNo: currentRace.raceNo,
        type: b.type,
        combination: b.combination,
        cars,
        stake: 1000,
        odds: b.odds,
        isSettled: false,
        isHit: false,
        payout: 0,
        profit: -1000,
        timestamp: Date.now(),
      };
      if (currentResult?.isSettled) {
        return settleBetItem(item, currentResult);
      }
      return item;
    });

    setBets(prev => [...newItems, ...prev]);
    setStatusMessage(`AI推奨目 ${newItems.length}点を収支台帳に登録しました (投資計: ¥${(newItems.length * 1000).toLocaleString()})`);
  };

  // 単一EV買い目を収支帳に登録
  const handleRegisterSingleBet = (b: EVBet) => {
    const raceKey = `${currentRace.venueCode}-${currentRace.date}-${currentRace.raceNo}`;
    const cars = b.combination.split(/[-=]/).map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
    let item: BetSlipItem = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      raceId: raceKey,
      raceTitle: `${currentRace.venue} ${currentRace.raceNo}R ${currentRace.grade || ''}`,
      date: currentRace.date || selectedDate,
      venue: currentRace.venue,
      raceNo: currentRace.raceNo,
      type: b.type,
      combination: b.combination,
      cars,
      stake: b.recommendedBet || 1000,
      odds: b.odds,
      isSettled: false,
      isHit: false,
      payout: 0,
      profit: -(b.recommendedBet || 1000),
      timestamp: Date.now(),
    };
    if (currentResult?.isSettled) {
      item = settleBetItem(item, currentResult);
    }
    setBets(prev => [item, ...prev]);
    setStatusMessage(`${b.type} ${b.combination} (¥${(b.recommendedBet || 1000).toLocaleString()}) を収支台帳に登録しました`);
  };

  // 資金配分電卓からの推奨目一括登録
  const handleRegisterMultipleBets = (allocatedBets: EVBet[]) => {
    if (allocatedBets.length === 0) return;
    const raceKey = `${currentRace.venueCode}-${currentRace.date}-${currentRace.raceNo}`;
    const newItems: BetSlipItem[] = allocatedBets.map(b => {
      const cars = b.combination.split(/[-=]/).map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
      const stake = b.recommendedBet || 100;
      let item: BetSlipItem = {
        id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        raceId: raceKey,
        raceTitle: `${currentRace.venue} ${currentRace.raceNo}R ${currentRace.grade || ''}`,
        date: currentRace.date || selectedDate,
        venue: currentRace.venue,
        raceNo: currentRace.raceNo,
        type: b.type,
        combination: b.combination,
        cars,
        stake,
        odds: b.odds,
        isSettled: false,
        isHit: false,
        payout: 0,
        profit: -stake,
        timestamp: Date.now(),
      };
      if (currentResult?.isSettled) {
        item = settleBetItem(item, currentResult);
      }
      return item;
    });

    setBets(prev => [...newItems, ...prev]);
    const totalStake = newItems.reduce((acc, curr) => acc + curr.stake, 0);
    setStatusMessage(`推奨配分 ${newItems.length}点を収支台帳に一括登録しました (合計: ¥${totalStake.toLocaleString()})`);
  };

  // 手動車券登録
  const handleAddManualBet = (betData: Omit<BetSlipItem, 'id' | 'timestamp' | 'isSettled' | 'payout' | 'profit'>) => {
    let item: BetSlipItem = {
      ...betData,
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      isSettled: false,
      isHit: false,
      payout: 0,
      profit: -betData.stake,
    };
    if (currentResult?.isSettled && item.venue === currentRace.venue && item.raceNo === currentRace.raceNo) {
      item = settleBetItem(item, currentResult);
    }
    setBets(prev => [item, ...prev]);
    setStatusMessage(`車券 [${item.type} ${item.combination}] を収支台帳に登録しました`);
  };

  // 車券削除
  const handleDeleteBet = (id: string) => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  // 収支履歴全消去
  const handleClearHistory = () => {
    setBets([]);
    saveBettingHistory([]);
    setStatusMessage('購入履歴をすべてリセットしました');
  };

  // Sync rider line positions when lineText changes
  const activeRiders = useMemo(() => {
    const posMap = parseLines(currentRace.lines);
    return currentRace.riders.map(r => ({
      ...r,
      pos: posMap[r.no] || '単騎',
    }));
  }, [currentRace.riders, currentRace.lines]);

  // Execute mathematical Plackett-Luce analysis
  const { probs, marks, evBets } = useMemo(() => {
    const validRiders = activeRiders.filter(r => r.score > 0);
    if (validRiders.length < 3) {
      return {
        probs: { win: [], top2: [], top3: [], tri: {}, exa: {}, trio: {}, quin: {}, wide: {} },
        marks: {},
        evBets: [],
      };
    }
    const startTime = performance.now();
    const pb = analyzeRiders(validRiders, weights);
    const mk = assignMarks(pb.win);
    const ev = wantOdds
      ? computeEVBets(validRiders, pb, currentRace.odds, { minEV: 0.6, limit: 16 })
      : [];
    return { probs: pb, marks: mk, evBets: ev };
  }, [activeRiders, weights, currentRace.odds, wantOdds]);

  // レース展開予想コメントの動的生成
  const commentary = useMemo(() => {
    return generateTacticalCommentary(
      currentRace.grade || 'レース',
      currentRace.lines,
      activeRiders,
      probs,
      currentRace.bankLength || selectedVenue.bankLength || 400
    );
  }, [currentRace.grade, currentRace.lines, activeRiders, probs, currentRace.bankLength, selectedVenue.bankLength]);

  // Handlers
  const handleRiderChange = (index: number, updated: Partial<Rider>) => {
    const newRiders = [...currentRace.riders];
    newRiders[index] = { ...newRiders[index], ...updated };
    setCurrentRace(prev => ({
      ...prev,
      riders: newRiders,
      odds: wantOdds ? generateRealisticOdds(newRiders, prev.lines) : prev.odds,
    }));
  };

  const handleLinesChange = (newLines: string) => {
    setCurrentRace(prev => ({
      ...prev,
      lines: newLines,
      odds: wantOdds ? generateRealisticOdds(prev.riders, newLines) : prev.odds,
    }));
  };

  const handleLoadPreset = (presetId: string) => {
    let preset: RaceInfo;
    if (presetId === 'derby') {
      preset = getDerbyFinalPreset();
    } else if (presetId === 'gp') {
      preset = getGrandPrixPreset();
    } else {
      preset = getSamplePythonPreset();
    }
    setCurrentRace(preset);
    setSelectedVenueCode(preset.venueCode);
    setSelectedRaceNo(preset.raceNo);
    setStatusMessage(`プリセット読込完了: ${preset.grade} (${preset.venue} ${preset.raceNo}R)`);
  };

  const handleClearRace = () => {
    const emptyRiders: Rider[] = Array.from({ length: 9 }, (_, i) => ({
      no: i + 1,
      name: `選手${i + 1}`,
      score: 0,
      style: '両',
      win: 0,
      top3: 0,
      back: 0,
      gear: 3.92,
      pos: '単騎',
    }));
    setCurrentRace(prev => ({
      ...prev,
      grade: '新規レース',
      lines: '',
      riders: emptyRiders,
      odds: undefined,
    }));
    setStatusMessage('出走表をクリアしました。選手情報を入力してください。');
  };

  const handleSaveWeights = (newWeights: number[]) => {
    setWeights(newWeights);
    localStorage.setItem('keirin_weights_v2', JSON.stringify(newWeights));
    setStatusMessage('特徴量重みを更新・保存しました (localStorage: weights.json)');
  };

  const handleResetWeights = () => {
    setWeights([...DEFAULT_WEIGHTS]);
    localStorage.removeItem('keirin_weights_v2');
    setStatusMessage('重みを初期標準値に戻しました');
  };

  // Generate Python format report
  const generateTextReport = () => {
    const lines: string[] = [];
    const valid = activeRiders.filter(r => r.score > 0);
    const order = valid
      .map((_, i) => i)
      .sort((a, b) => (probs.win[b] || 0) - (probs.win[a] || 0));

    lines.push(`【${currentRace.grade || 'レース'}】 AI予想 (Plackett-Luce 厳密計算)`);
    lines.push('');
    lines.push(
      '本命: ' +
        order
          .slice(0, 5)
          .map(i => `${marks[i] || ''}${valid[i].no}${valid[i].name}`)
          .join(' / ')
    );
    lines.push(`ライン構成: [${currentRace.lines}]`);
    lines.push('');

    // レース展開予想コメント
    lines.push('■ レース展開予想');
    lines.push(`【展開基調】 ${commentary.summaryTitle} (${commentary.flowType} / ${commentary.pace})`);
    lines.push(commentary.fullCommentary);
    lines.push('');

    if (evBets.length > 0) {
      lines.push('■ 期待値(EV)上位  EV = モデル確率 × オッズ (1.0超で期待値プラス)');
      evBets.slice(0, 8).forEach(b => {
        lines.push(
          `   ${b.type} ${b.combination.padEnd(8)} 確率 ${(b.prob * 100).toFixed(
            2
          )}%  オッズ ${b.odds.toFixed(1)}倍  EV ${b.ev.toFixed(2)}`
        );
      });
      lines.push('');
    }

    // Top 3連単
    lines.push('■ 3連単 上位10点');
    const sortedTri = Object.entries(probs.tri)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    sortedTri.forEach(([k, p]) => {
      const [a, b, c] = k.split('-').map(idx => valid[parseInt(idx, 10)]?.no || '?');
      const oddsVal = currentRace.odds?.tri?.[`${a}-${b}-${c}`] || 1 / p;
      lines.push(
        `   ${a}-${b}-${c}   確率 ${(p * 100).toFixed(2)}%   損益分岐 ${(1 / p).toFixed(1)}倍`
      );
    });
    lines.push('');

    // Top 2車単
    lines.push('■ 2車単 上位6点');
    const sortedExa = Object.entries(probs.exa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    sortedExa.forEach(([k, p]) => {
      const [a, b] = k.split('-').map(idx => valid[parseInt(idx, 10)]?.no || '?');
      lines.push(
        `   ${a}-${b}     確率 ${(p * 100).toFixed(2)}%   損益分岐 ${(1 / p).toFixed(1)}倍`
      );
    });
    lines.push('');

    // レース確定結果 & 推奨買い目的中判定
    if (currentResult?.isSettled && currentResult.order.length >= 3) {
      lines.push('■ 公式レース確定結果 & 的中判定');
      lines.push(
        `【確定着順】 1着: ${currentResult.order[0]}番 / 2着: ${currentResult.order[1]}番 / 3着: ${currentResult.order[2]}番 (決まり手: ${currentResult.kimarite || '差し'})`
      );
      if (currentResult.payouts.tri) {
        lines.push(
          `【3連単 払戻金】 ¥${currentResult.payouts.tri.payout.toLocaleString()} (${currentResult.payouts.tri.combination} / ${currentResult.payouts.tri.popularity ? currentResult.payouts.tri.popularity + '番人気' : ''})`
        );
      }
      if (currentResult.payouts.exa) {
        lines.push(
          `【2車単 払戻金】 ¥${currentResult.payouts.exa.payout.toLocaleString()} (${currentResult.payouts.exa.combination} / ${currentResult.payouts.exa.popularity ? currentResult.payouts.exa.popularity + '番人気' : ''})`
        );
      }
      lines.push('');

      if (evBets.length > 0) {
        lines.push('■ AI推奨買い目 的中判定結果');
        const checkedHits = evBets.slice(0, 8).map(b => ({
          bet: b,
          ...checkEVBetHit(b, currentResult),
        }));
        const hitCount = checkedHits.filter(h => h.isHit).length;
        lines.push(`【的中集計】 ${hitCount}点 的中 / 対象${Math.min(8, evBets.length)}点`);
        checkedHits.forEach(h => {
          if (h.isHit) {
            lines.push(
              `   🎯【的中】 ${h.bet.type} ${h.bet.combination} -> 100円払戻: ¥${h.payoutPer100.toLocaleString()} (オッズ ${h.actualOdds.toFixed(1)}倍)`
            );
          } else {
            lines.push(`   ✕【不的中】 ${h.bet.type} ${h.bet.combination}`);
          }
        });
        lines.push('');
      }
    }

    lines.push('※モデルの確率が市場より正確である保証はありません。');
    lines.push('※車券は20歳になってから、無理のない範囲で。');
    return lines.join('\n');
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateTextReport());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
    setStatusMessage('予想レポートをクリップボードにコピーしました');
  };

  const handleExportCsvTemplate = () => {
    const header = 'race_id,車番,着順,得点,脚質,勝率,3連対率,バック,ギア,ライン位置\n';
    const sampleRows = [
      'R1,1,1,118.85,両,38.5,72.4,6,3.92,先頭',
      'R1,2,2,119.42,逃,46.2,76.9,18,3.93,先頭',
      'R1,3,3,117.20,捲,32.1,65.5,10,3.92,先頭',
      'R1,4,4,111.40,追,16.4,54.2,1,3.92,番手',
      'R1,5,5,116.80,両,29.8,68.1,5,3.92,番手',
      'R1,6,6,115.15,逃,28.0,61.2,14,3.93,番手',
      'R1,7,7,109.80,追,12.5,48.0,0,3.92,3番手',
      'R1,8,8,114.50,逃,25.0,58.3,16,3.92,単騎',
      'R1,9,9,112.30,追,14.8,52.0,0,3.92,単騎',
    ].join('\n');

    const blob = new Blob(['\uFEFF' + header + sampleRows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keirin_train_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('学習用CSVテンプレート (keirin_train_template.csv) を保存しました');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        darkMode ? 'bg-[#181818] text-gray-200' : 'bg-[#eef2f6] text-gray-800'
      }`}
    >
      {/* Windows 11 Desktop Window Container */}
      <div
        className={`flex-1 flex flex-col transition-all ${
          isFullscreen
            ? 'w-full h-screen'
            : 'max-w-[1400px] w-full mx-auto my-0 sm:my-3 sm:rounded-xl shadow-2xl border border-gray-300 dark:border-[#333333] overflow-hidden'
        }`}
      >
        {/* Windows 11 Title Bar */}
        <WindowsTitleBar
          darkMode={darkMode}
          onToggleTheme={() => toggleTheme()}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onOpenWindowsExport={() => setIsWindowsExportOpen(true)}
          onMinimize={() => setStatusMessage('ウィンドウはアクティブです')}
          onReset={handleClearRace}
        />

        {/* Windows Menu Bar */}
        <WindowsMenuBar
          darkMode={darkMode}
          onLoadPreset={handleLoadPreset}
          onClear={handleClearRace}
          onOpenTrainer={() => setIsTrainerOpen(true)}
          onResetWeights={handleResetWeights}
          onExportCsvTemplate={handleExportCsvTemplate}
          onCopyResult={handleCopyReport}
          onOpenWindowsExport={() => setIsWindowsExportOpen(true)}
          onOpenBatch={() => setIsBatchOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onToggleBankVisualizer={() => setIsBankVisualizerOpen(!isBankVisualizerOpen)}
          isBankVisualizerOpen={isBankVisualizerOpen}
          onOpenLedger={() => setIsLedgerModalOpen(true)}
        />

        {/* Main Workspace */}
        <main
          className={`flex-1 overflow-y-auto p-3 sm:p-4.5 space-y-4 ${
            darkMode ? 'bg-[#141416]' : 'bg-[#ffffff]'
          }`}
        >
          {/* 累計投資金額・損益・回収率 (ROI) 表示バー */}
          <section className="space-y-1">
            <BettingLedgerBar
              summary={bettingSummary}
              onOpenLedger={() => setIsLedgerModalOpen(true)}
              onQuickRegisterBets={handleQuickRegisterBets}
              hasUnsettledBets={bets.some(b => !b.isSettled)}
              hasEVBets={evBets.length > 0}
              darkMode={darkMode}
            />
          </section>

          {/* 公式レース結果 自動取得 & 払戻金バナー */}
          <section className="space-y-1">
            <RaceResultBanner
              race={currentRace}
              result={currentResult}
              autoFetchResult={autoFetchResult}
              onToggleAutoFetch={handleToggleAutoFetch}
              onFetchResult={handleFetchResult}
              onResetResult={handleResetResult}
              darkMode={darkMode}
            />
          </section>

          {/* Top Control Panel (オッズパーク互換 自動取得 / 設定バー) */}
          <section
            className={`p-3 sm:p-3.5 rounded-lg border text-xs shadow-2xs transition-colors ${
              darkMode ? 'bg-[#1e1e24] border-slate-700 text-white' : 'bg-slate-50 border-gray-200 text-slate-900'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Venue, Date & Race selector */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Date */}
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span className="font-extrabold text-slate-900 dark:text-white">日付:</span>
                  <input
                    type="text"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className={`w-24 px-2 py-1 rounded border font-mono font-bold text-center ${
                      darkMode ? 'bg-[#282830] border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'
                    }`}
                    placeholder="YYYYMMDD"
                  />
                </div>

                {/* Venue */}
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white">競輪場:</span>
                  <select
                    value={selectedVenueCode}
                    onChange={e => {
                      const vCode = e.target.value;
                      setSelectedVenueCode(vCode);
                      const venueObj = VENUES.find(v => v.code === vCode);
                      if (venueObj) {
                        setCurrentRace(prev => ({
                          ...prev,
                          venue: venueObj.name,
                          venueCode: venueObj.code,
                          bankLength: venueObj.bankLength,
                        }));
                      }
                    }}
                    className={`px-2 py-1 rounded border font-bold ${
                      darkMode ? 'bg-[#282830] border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'
                    }`}
                  >
                    {VENUES.map(v => (
                      <option key={v.code} value={v.code}>
                        {v.name} ({v.bankLength}m)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Race No */}
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white">R:</span>
                  <select
                    value={selectedRaceNo}
                    onChange={e => {
                      const rno = parseInt(e.target.value, 10);
                      setSelectedRaceNo(rno);
                      setCurrentRace(prev => ({ ...prev, raceNo: rno }));
                    }}
                    className={`px-2 py-1 rounded border font-black font-mono ${
                      darkMode ? 'bg-[#282830] border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'
                    }`}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(r => (
                      <option key={r} value={r}>
                        {r}R
                      </option>
                    ))}
                  </select>
                </div>

                {/* Odds toggle */}
                <label className="flex items-center space-x-1.5 cursor-pointer ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={wantOdds}
                    onChange={e => setWantOdds(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-500"
                  />
                  <span className="font-extrabold text-slate-900 dark:text-white">オッズ取得・EV計算</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleLoadPreset('derby')}
                  className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-extrabold flex items-center space-x-1 transition shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>予想更新</span>
                </button>

                <button
                  onClick={() => setIsBatchOpen(true)}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center space-x-1 transition shadow-xs"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>全12R一括予想</span>
                </button>

                <button
                  onClick={() => handleLoadPreset('python-sample')}
                  className={`px-2.5 py-1 rounded border font-bold transition ${
                    darkMode
                      ? 'border-slate-600 hover:bg-[#282830] text-slate-100'
                      : 'border-gray-300 hover:bg-gray-100 text-slate-800'
                  }`}
                >
                  サンプル入力
                </button>

                <button
                  onClick={handleClearRace}
                  className={`px-2.5 py-1 rounded border font-bold transition ${
                    darkMode
                      ? 'border-slate-600 hover:bg-[#282830] text-slate-100'
                      : 'border-gray-300 hover:bg-gray-100 text-slate-800'
                  }`}
                >
                  クリア
                </button>

                <button
                  onClick={handleCopyReport}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center space-x-1 transition shadow-xs"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'コピー完了' : '結果コピー'}</span>
                </button>

                {/* 視認性切替・テーマ変更ボタン */}
                <button
                  onClick={() => toggleTheme()}
                  className={`px-3 py-1 rounded text-xs font-black flex items-center space-x-1.5 transition border shadow-xs ${
                    darkMode
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 border-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                  title="背景・文字の配色テーマ（白背景／黒背景）を切替"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-slate-900" /> : <Moon className="w-3.5 h-3.5 text-yellow-300" />}
                  <span>{darkMode ? '☀️ 白背景(見やすい)' : '🌙 黒背景(高コントラスト)'}</span>
                </button>
              </div>
            </div>

            {/* Status indicator line */}
            <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-xs border-slate-300 dark:border-slate-700 ${darkMode ? 'text-slate-100' : 'text-slate-800'} font-bold`}>
              <span className="flex items-center space-x-1.5 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-black text-slate-900 dark:text-white">{statusMessage}</span>
              </span>
              <span className="hidden sm:inline font-mono font-bold text-slate-800 dark:text-slate-200">
                Bank: {selectedVenue.name} ({selectedVenue.bankLength}m / 直線 {selectedVenue.straightLength}m)
              </span>
            </div>
          </section>

          {/* Race Title & Line Input Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-5 space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                レース名・グレード
              </label>
              <input
                type="text"
                value={currentRace.grade}
                onChange={e => setCurrentRace(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="例: G1 日本選手権競輪 (ダービー) 決勝"
                className={`w-full px-2.5 py-1.5 rounded text-xs border font-bold ${
                  darkMode ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="lg:col-span-7 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 dark:text-slate-100">
                  ライン構成（例: 1-4-7 2-5 3-6 8 9）
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                  ※ハイフン接続で先頭・番手・3番手を自動認識
                </span>
              </div>
              <input
                type="text"
                value={currentRace.lines}
                onChange={e => handleLinesChange(e.target.value)}
                placeholder="1-4-7 2-5 3-6 8 9"
                className={`w-full px-2.5 py-1.5 rounded text-xs border font-mono font-extrabold tracking-wider ${
                  darkMode ? 'bg-[#1e293b] border-slate-600 text-sky-300' : 'bg-white border-slate-300 text-sky-800'
                }`}
              />
            </div>
          </section>

          {/* AI レース展開予想コメント パネル */}
          <section
            className={`p-3.5 sm:p-4.5 rounded-lg border text-xs shadow-xs transition-colors ${
              darkMode
                ? 'bg-[#111827] border-slate-700 text-white'
                : 'bg-white border-sky-300 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-extrabold text-sm tracking-wide text-slate-900 dark:text-white">
                    AIレース展開予想
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-800 dark:text-sky-300 font-black text-xs border border-sky-400/40">
                  {commentary.summaryTitle}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700">
                  {commentary.flowType}
                </span>
                <span
                  className={`px-2.5 py-1 rounded font-black border ${
                    commentary.pace.includes('ハイペース')
                      ? 'bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/40'
                      : commentary.pace.includes('スロー')
                      ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {commentary.pace}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 font-sans leading-relaxed text-xs">
              {commentary.fullCommentary.split('\n').map((paragraph, pIdx) => {
                const match = paragraph.match(/^【(.*?)】(.*)$/);
                if (match) {
                  return (
                    <div key={pIdx} className="flex items-start space-x-2.5">
                      <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                        {match[1]}
                      </span>
                      <span className="flex-1 font-semibold text-slate-900 dark:text-white text-[13px] leading-relaxed">
                        {match[2]}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={pIdx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <span className="flex-1 font-semibold text-slate-900 dark:text-white text-[13px] leading-relaxed">
                      {paragraph}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bank Line Formation Visualizer */}
          {isBankVisualizerOpen && (
            <BankVisualizer
              lineText={currentRace.lines}
              riders={activeRiders}
              bankLength={currentRace.bankLength || selectedVenue.bankLength}
              darkMode={darkMode}
            />
          )}

          {/* 9-Car Keirin Entry Table */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-sky-500" />
                <span>出走表（9車立）</span>
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                得点が0の選手は欠場扱い / 各セル編集可能
              </span>
            </div>

            <RiderGrid
              riders={activeRiders}
              onChangeRider={handleRiderChange}
              darkMode={darkMode}
            />
          </section>

          {/* Odds & Expected Value (EV) Analytics */}
          <section className="space-y-2">
            <OddsAndEVTable
              riders={activeRiders}
              probs={probs}
              marks={marks}
              evBets={evBets}
              odds={currentRace.odds}
              darkMode={darkMode}
              onRegisterBet={handleRegisterSingleBet}
              onRegisterMultipleBets={handleRegisterMultipleBets}
            />
          </section>

          {/* Python-Style Formatted Text Report Output Console */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>Windowsコンソール出力形式テキスト (keirin_ai.py 互換)</span>
              </span>
              <button
                onClick={handleCopyReport}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
              >
                <span>テキストをすべてコピー</span>
              </button>
            </div>

            <textarea
              readOnly
              value={generateTextReport()}
              rows={9}
              className={`w-full p-3.5 rounded-lg border font-mono text-xs leading-relaxed resize-y select-text focus:outline-hidden font-bold ${
                darkMode
                  ? 'bg-[#0a0f1d] border-slate-700 text-white shadow-inner'
                  : 'bg-white border-slate-300 text-slate-900 shadow-xs'
              }`}
            />
          </section>
        </main>

        {/* Windows OS Status Bar at bottom */}
        <footer
          className={`h-7 px-3 border-t flex items-center justify-between text-[11px] font-mono select-none ${
            darkMode ? 'bg-[#1a1a1e] border-[#2e2e2e] text-slate-200 font-bold' : 'bg-[#f3f3f3] border-gray-200 text-slate-700 font-bold'
          }`}
        >
          <div className="flex items-center space-x-3 truncate">
            <span className="flex items-center space-x-1 text-emerald-500">
              <Activity className="w-3 h-3" />
              <span>Plackett-Luce Exact Engine: OK</span>
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline truncate">
              {currentRace.venue} {currentRace.raceNo}R ({currentRace.bankLength}m)
            </span>
            <span className="hidden lg:inline">|</span>
            <span className="hidden lg:inline">12 特徴量ベクトル適用済</span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsWindowsExportOpen(true)}
              className="text-sky-500 hover:underline flex items-center space-x-1"
            >
              <span>Windows App Package</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="hidden sm:inline">Win 11 Build 26100</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {isTrainerOpen && (
        <WeightsTrainerModal
          weights={weights}
          onSaveWeights={handleSaveWeights}
          onClose={() => setIsTrainerOpen(false)}
          darkMode={darkMode}
        />
      )}

      {isWindowsExportOpen && (
        <WindowsExportModal
          onClose={() => setIsWindowsExportOpen(false)}
          darkMode={darkMode}
        />
      )}

      {isBatchOpen && (
        <BatchRacesModal
          venueCode={selectedVenueCode}
          venueName={selectedVenue.name}
          date={selectedDate}
          weights={weights}
          onClose={() => setIsBatchOpen(false)}
          onSelectRace={race => {
            setCurrentRace(race);
            setSelectedRaceNo(race.raceNo);
            setStatusMessage(`${race.venue} ${race.raceNo}R を読み込みました`);
          }}
          darkMode={darkMode}
        />
      )}

      {isAboutOpen && (
        <AboutModal
          onClose={() => setIsAboutOpen(false)}
          darkMode={darkMode}
        />
      )}

      {isLedgerModalOpen && (
        <BettingLedgerModal
          bets={bets}
          summary={bettingSummary}
          onClose={() => setIsLedgerModalOpen(false)}
          onClearHistory={handleClearHistory}
          onDeleteBet={handleDeleteBet}
          onAddManualBet={handleAddManualBet}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
