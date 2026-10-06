import React, { useState } from 'react';
import { Rider, AnalysisProbs, EVBet, RaceOdds, RaceResult } from '../types/keirin';
import { checkEVBetHit } from '../services/raceResultService';
import { getCarColor, calculateStakes } from '../services/keirinModel';
import { 
  TrendingUp, 
  Coins, 
  DollarSign, 
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  XCircle,
  Target
} from 'lucide-react';

interface OddsAndEVTableProps {
  riders: Rider[];
  probs: AnalysisProbs;
  marks: Record<number, string>;
  evBets: EVBet[];
  odds?: RaceOdds;
  result?: RaceResult;
  darkMode: boolean;
  onRegisterBet?: (bet: EVBet) => void;
  onRegisterMultipleBets?: (bets: EVBet[]) => void;
}

export const OddsAndEVTable: React.FC<OddsAndEVTableProps> = ({
  riders,
  probs,
  marks,
  evBets,
  odds,
  result,
  darkMode,
  onRegisterBet,
  onRegisterMultipleBets,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ev' | 'stakes' | 'details'>('overview');
  const [betTypeFilter, setBetTypeFilter] = useState<string>('all');
  const [minEVFilter, setMinEVFilter] = useState<number>(1.0);
  const [totalBudget, setTotalBudget] = useState<number>(5000);
  const [stakeMode, setStakeMode] = useState<'kelly' | 'equalPayout' | 'equal'>('kelly');

  const filteredEVBets = evBets.filter(b => {
    if (betTypeFilter !== 'all' && b.type !== betTypeFilter) return false;
    if (b.ev < minEVFilter) return false;
    return true;
  });

  const allocatedBets = calculateStakes(filteredEVBets.slice(0, 10), totalBudget, stakeMode);

  // 車番ソート (1着率の降順)
  const rankedIndices = riders
    .map((_, i) => i)
    .sort((a, b) => (probs.win[b] || 0) - (probs.win[a] || 0));

  return (
    <div className="space-y-4">
      {/* Navigation Sub-Tabs */}
      <div className={`flex items-center justify-between border-b pb-1.5 text-xs select-none ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
        <div className="flex space-x-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-t font-extrabold transition flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? darkMode
                  ? 'bg-[#1e293b] text-sky-300 border-b-2 border-sky-400'
                  : 'bg-white text-sky-700 border-b-2 border-sky-600 shadow-xs'
                : darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>選手勝率 & 印一覧</span>
          </button>

          <button
            onClick={() => setActiveTab('ev')}
            className={`px-3.5 py-2 rounded-t font-extrabold transition flex items-center space-x-1.5 ${
              activeTab === 'ev'
                ? darkMode
                  ? 'bg-[#1e293b] text-emerald-300 border-b-2 border-emerald-400'
                  : 'bg-white text-emerald-700 border-b-2 border-emerald-600 shadow-xs'
                : darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>期待値(EV) 分析</span>
            {evBets.some(b => b.ev >= 1.0) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('stakes')}
            className={`px-3.5 py-2 rounded-t font-extrabold transition flex items-center space-x-1.5 ${
              activeTab === 'stakes'
                ? darkMode
                  ? 'bg-[#1e293b] text-amber-300 border-b-2 border-amber-400'
                  : 'bg-white text-amber-700 border-b-2 border-amber-600 shadow-xs'
                : darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>資金配分電卓</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center text-xs text-slate-500 dark:text-slate-300 font-mono font-bold">
          Plackett-Luce Exact Engine
        </div>
      </div>

      {/* TAB 1: 選手勝率 & 印一覧 */}
      {activeTab === 'overview' && (
        <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`${darkMode ? 'bg-[#0f172a] text-white border-b border-slate-700' : 'bg-slate-100 text-slate-900 border-b border-slate-300'} font-bold`}>
                <th className="py-2.5 px-3 text-center w-12 font-extrabold">印</th>
                <th className="py-2.5 px-2 text-center w-12 font-extrabold">車番</th>
                <th className="py-2.5 px-3 font-extrabold">選手名</th>
                <th className="py-2.5 px-3 text-center font-extrabold">ライン位置</th>
                <th className="py-2.5 px-3 text-right font-extrabold">1着率 (単勝)</th>
                <th className="py-2.5 px-3 text-right font-extrabold">2連対率</th>
                <th className="py-2.5 px-3 text-right font-extrabold">3連対率</th>
                <th className="py-2.5 px-3 text-right font-extrabold">損益分岐オッズ</th>
                <th className="py-2.5 px-3 text-center font-extrabold">{result?.isSettled ? '確定着順' : '着順'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
              {rankedIndices.map(idx => {
                const r = riders[idx];
                const carColor = getCarColor(r.no);
                const mark = marks[idx] || '';
                const winP = probs.win[idx] || 0;
                const top2P = probs.top2[idx] || 0;
                const top3P = probs.top3[idx] || 0;
                const breakeven = winP > 0 ? (1 / winP).toFixed(1) : '-';
                const rankIdx = result?.isSettled ? result.order.indexOf(r.no) : -1;

                return (
                  <tr
                    key={r.no}
                    className={`transition ${
                      rankIdx === 0
                        ? darkMode
                          ? 'bg-amber-950/40 text-white font-bold'
                          : 'bg-amber-50/80 text-slate-900 font-bold'
                        : mark === '◎'
                        ? darkMode
                          ? 'bg-red-950/40 text-white'
                          : 'bg-red-50/70 text-slate-900'
                        : darkMode
                        ? 'hover:bg-[#1e293b]/70 bg-[#111827] text-white'
                        : 'hover:bg-slate-50 bg-white text-slate-900'
                    }`}
                  >
                    {/* 印 */}
                    <td className="py-2.5 px-3 text-center font-black text-base">
                      <span
                        className={
                          mark === '◎'
                            ? 'text-red-500 font-black'
                            : mark === '○'
                            ? 'text-blue-500 dark:text-blue-400 font-black'
                            : mark === '▲'
                            ? 'text-amber-500 dark:text-amber-400 font-black'
                            : 'text-slate-700 dark:text-slate-100 font-black'
                        }
                      >
                        {mark}
                      </span>
                    </td>

                    {/* 車番 */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex justify-center">
                        <span
                          style={{
                            backgroundColor: carColor.bg,
                            color: carColor.text,
                            borderColor: carColor.border,
                          }}
                          className="w-5.5 h-5.5 rounded-full flex items-center justify-center font-extrabold text-xs border shadow-xs"
                        >
                          {r.no}
                        </span>
                      </div>
                    </td>

                    {/* 選手名 */}
                    <td className="py-2.5 px-3 font-sans font-bold text-sm text-slate-900 dark:text-white">
                      {r.name}
                      <span className="text-xs text-slate-700 dark:text-slate-100 ml-1.5 font-mono font-bold">({r.style})</span>
                    </td>

                    {/* 位置 */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                        {r.pos}
                      </span>
                    </td>

                    {/* 1着率 */}
                    <td className="py-2.5 px-3 text-right font-black text-sm text-red-600 dark:text-red-400">
                      {(winP * 100).toFixed(1)}%
                    </td>

                    {/* 2連対率 */}
                    <td className="py-2.5 px-3 text-right font-extrabold text-blue-600 dark:text-blue-300">
                      {(top2P * 100).toFixed(1)}%
                    </td>

                    {/* 3連対率 */}
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-300">
                      {(top3P * 100).toFixed(1)}%
                    </td>

                    {/* 損益分岐オッズ */}
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      {breakeven}倍
                    </td>

                    {/* 確定着順 */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      {result?.isSettled ? (
                        rankIdx === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-900 font-black text-xs border border-amber-400 shadow-xs">
                            1着 {result.kimarite ? `(${result.kimarite})` : ''}
                          </span>
                        ) : rankIdx === 1 ? (
                          <span className="px-2 py-0.5 rounded bg-slate-300 text-slate-900 font-black text-xs border border-slate-400">
                            2着
                          </span>
                        ) : rankIdx === 2 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-700 text-white font-black text-xs border border-amber-600">
                            3着
                          </span>
                        ) : rankIdx > 2 ? (
                          <span className="text-slate-600 dark:text-slate-300 font-bold text-xs">
                            {rankIdx + 1}着
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">未確定</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: 期待値(EV) 分析 */}
      {activeTab === 'ev' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className={`p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs border shadow-xs ${
            darkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-sky-500" />
              <span className="font-extrabold">券種:</span>
              {['all', '3連単', '2車単', '2車複', '3連複', 'ワイド'].map(type => (
                <button
                  key={type}
                  onClick={() => setBetTypeFilter(type)}
                  className={`px-2.5 py-1 rounded font-bold transition ${
                    betTypeFilter === type
                      ? 'bg-sky-600 text-white shadow-xs'
                      : darkMode
                      ? 'bg-[#1e293b] text-slate-200 hover:bg-slate-700 border border-slate-600'
                      : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {type === 'all' ? 'すべて' : type}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-extrabold">最低EV:</span>
              {[0.5, 1.0, 1.2, 1.5].map(thresh => (
                <button
                  key={thresh}
                  onClick={() => setMinEVFilter(thresh)}
                  className={`px-2.5 py-1 rounded font-extrabold transition ${
                    minEVFilter === thresh
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : darkMode
                      ? 'bg-[#1e293b] text-slate-200 hover:bg-slate-700 border border-slate-600'
                      : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {thresh === 1.0 ? 'EV 1.0+ (プラス)' : `${thresh}+`}
                </button>
              ))}
            </div>
          </div>

          {/* レース結果確定時の的中判定サマリー */}
          {result?.isSettled && (
            <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs font-bold ${
              filteredEVBets.some(b => checkEVBetHit(b, result).isHit)
                ? darkMode
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-emerald-50 border-emerald-400 text-slate-900'
                : darkMode
                ? 'bg-[#182234] border-slate-700 text-slate-200'
                : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="font-black text-sm">【レース確定】 推奨買い目 的中判定結果:</span>
                <span className={`px-2 py-0.5 rounded font-black text-xs ${
                  filteredEVBets.some(b => checkEVBetHit(b, result).isHit)
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {filteredEVBets.filter(b => checkEVBetHit(b, result).isHit).length} / {filteredEVBets.length} 点的中
                </span>
              </div>
              <span className="text-[11px] font-mono">
                確定着順: 1着 {result.order[0]}番 / 2着 {result.order[1]}番 / 3着 {result.order[2]}番 ({result.kimarite})
              </span>
            </div>
          )}

          {/* EV List */}
          {filteredEVBets.length === 0 ? (
            <div className={`py-10 text-center rounded-lg border text-xs font-semibold ${
              darkMode ? 'bg-[#111827] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
            }`}>
              <AlertCircle className="w-7 h-7 mx-auto mb-2 text-amber-500" />
              指定された条件に合致する買い目がありません。最低EVの閾値を下げるかオッズを確認してください。
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`${darkMode ? 'bg-[#0f172a] text-white border-b border-slate-700' : 'bg-slate-100 text-slate-900 border-b border-slate-300'} font-bold`}>
                    <th className="py-2.5 px-3 font-extrabold">券種</th>
                    <th className="py-2.5 px-3 font-extrabold">買い目</th>
                    <th className="py-2.5 px-3 text-right font-extrabold">モデル確率</th>
                    <th className="py-2.5 px-3 text-right font-extrabold">現オッズ</th>
                    <th className="py-2.5 px-3 text-right font-extrabold">損益分岐</th>
                    <th className="py-2.5 px-3 text-right font-extrabold">期待値 (EV)</th>
                    <th className="py-2.5 px-3 text-center font-extrabold">{result?.isSettled ? '的中判定' : '判定'}</th>
                    <th className="py-2.5 px-3 text-center font-extrabold">収支帳</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {filteredEVBets.map((bet, bIdx) => {
                    const isPositive = bet.ev >= 1.0;
                    const isHighEdge = bet.ev >= 1.3;
                    const hitCheck = checkEVBetHit(bet, result);

                    return (
                      <tr
                        key={bIdx}
                        className={`transition ${
                          hitCheck.isHit
                            ? darkMode
                              ? 'bg-emerald-950/60 text-white font-bold'
                              : 'bg-emerald-50 text-slate-900 font-bold'
                            : isHighEdge
                            ? darkMode
                              ? 'bg-emerald-950/40 text-white'
                              : 'bg-emerald-50/80 text-slate-900'
                            : isPositive
                            ? darkMode
                              ? 'bg-emerald-950/20 text-white'
                              : 'bg-emerald-50/40 text-slate-900'
                            : darkMode
                            ? 'hover:bg-[#1e293b]/70 bg-[#111827] text-white'
                            : 'hover:bg-slate-50 bg-white text-slate-900'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                            bet.type === '3連単'
                              ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-400'
                              : bet.type === '2車単'
                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-400'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-400'
                          }`}>
                            {bet.type}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-black text-sm text-slate-900 dark:text-white">
                          {bet.combination}
                        </td>

                        <td className="py-2.5 px-3 text-right font-extrabold text-sky-700 dark:text-sky-300">
                          {(bet.prob * 100).toFixed(2)}%
                        </td>

                        <td className="py-2.5 px-3 text-right font-black text-amber-700 dark:text-amber-300">
                          {bet.odds.toFixed(1)}倍
                        </td>

                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-100">
                          {bet.breakeven.toFixed(1)}倍
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-black text-base ${
                            isHighEdge
                              ? 'text-emerald-600 dark:text-emerald-300'
                              : isPositive
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {bet.ev.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {result?.isSettled ? (
                            hitCheck.isHit ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 text-white font-sans text-xs font-black shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white inline" />
                                <span>🎯 的中！ (¥{hitCheck.payoutPer100.toLocaleString()})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans text-xs font-bold border border-slate-300 dark:border-slate-700">
                                <XCircle className="w-3.5 h-3.5 text-slate-400 inline" />
                                <span>不的中</span>
                              </span>
                            )
                          ) : isHighEdge ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-600 text-white font-sans text-xs font-black shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>超妙味</span>
                            </span>
                          ) : isPositive ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 font-sans text-xs font-black border border-emerald-400">
                              妙味あり
                            </span>
                          ) : (
                            <span className="text-slate-700 dark:text-slate-200 text-xs font-sans font-bold">
                              適正
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {onRegisterBet && (
                            <button
                              onClick={() => onRegisterBet(bet)}
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-black text-xs inline-flex items-center space-x-1 shadow-xs transition"
                              title="この買い目を収支帳に投資登録"
                            >
                              <Plus className="w-3 h-3" />
                              <span>登録</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed px-1">
            ※ EV(期待値) = モデル予測確率 × オッズ。1.00を超えると統計モデル上の期待値がプラスになります。
          </div>
        </div>
      )}

      {/* TAB 3: 資金配分電卓 */}
      {activeTab === 'stakes' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs ${
            darkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-sm">軍資金総額:</span>
              <input
                type="number"
                step="1000"
                min="100"
                value={totalBudget}
                onChange={e => setTotalBudget(Math.max(100, parseInt(e.target.value, 10) || 1000))}
                className={`w-32 px-2.5 py-1 rounded text-right font-mono font-black text-base border ${
                  darkMode ? 'bg-[#1e293b] border-slate-600 text-amber-300' : 'bg-white border-slate-300 text-amber-700'
                }`}
              />
              <span className="font-sans font-bold text-sm">円</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-extrabold">配分方針:</span>
              <div className="flex rounded-md border overflow-hidden border-slate-300 dark:border-slate-600 shadow-xs">
                <button
                  onClick={() => setStakeMode('kelly')}
                  className={`px-3 py-1.5 text-xs font-extrabold transition ${
                    stakeMode === 'kelly'
                      ? 'bg-amber-500 text-slate-900'
                      : darkMode
                      ? 'bg-[#1e293b] text-slate-200'
                      : 'bg-white text-slate-800'
                  }`}
                >
                  ケリー基準 (EV比)
                </button>
                <button
                  onClick={() => setStakeMode('equalPayout')}
                  className={`px-3 py-1.5 text-xs font-extrabold transition border-l border-slate-300 dark:border-slate-600 ${
                    stakeMode === 'equalPayout'
                      ? 'bg-amber-500 text-slate-900'
                      : darkMode
                      ? 'bg-[#1e293b] text-slate-200'
                      : 'bg-white text-slate-800'
                  }`}
                >
                  払戻均等
                </button>
                <button
                  onClick={() => setStakeMode('equal')}
                  className={`px-3 py-1.5 text-xs font-extrabold transition border-l border-slate-300 dark:border-slate-600 ${
                    stakeMode === 'equal'
                      ? 'bg-amber-500 text-slate-900'
                      : darkMode
                      ? 'bg-[#1e293b] text-slate-200'
                      : 'bg-white text-slate-800'
                  }`}
                >
                  均等配分
                </button>
              </div>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`${darkMode ? 'bg-[#0f172a] text-white border-b border-slate-700' : 'bg-slate-100 text-slate-900 border-b border-slate-300'} font-bold`}>
                  <th className="py-2.5 px-3 font-extrabold">券種</th>
                  <th className="py-2.5 px-3 font-extrabold">買い目</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">現オッズ</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">期待値(EV)</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">推奨購入額</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">的中時払戻見込</th>
                  {result?.isSettled && (
                    <th className="py-2.5 px-3 text-center font-extrabold">的中判定・確定払戻</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {allocatedBets.map((b, i) => {
                  const stake = b.recommendedBet || 100;
                  const estimatedReturn = Math.round(stake * b.odds);
                  const hitCheck = checkEVBetHit(b, result);
                  const actualReturn = hitCheck.isHit ? Math.round((stake * hitCheck.payoutPer100) / 100) : 0;

                  return (
                    <tr
                      key={i}
                      className={`transition ${
                        hitCheck.isHit
                          ? darkMode
                            ? 'bg-emerald-950/60 text-white font-bold'
                            : 'bg-emerald-50 text-slate-900 font-bold'
                          : darkMode
                          ? 'hover:bg-[#1e293b]/70 bg-[#111827] text-white'
                          : 'hover:bg-slate-50 bg-white text-slate-900'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold">{b.type}</td>
                      <td className="py-2.5 px-3 font-black text-sm text-slate-900 dark:text-white">
                        {b.combination}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-700 dark:text-amber-300">
                        {b.odds.toFixed(1)}倍
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {b.ev.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-base text-amber-600 dark:text-amber-400">
                        {stake.toLocaleString()}円
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-100">
                        {estimatedReturn.toLocaleString()}円
                      </td>
                      {result?.isSettled && (
                        <td className="py-2.5 px-3 text-center">
                          {hitCheck.isHit ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 text-white font-sans text-xs font-black shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white inline" />
                              <span>🎯 的中！ ¥{actualReturn.toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans text-xs font-bold border border-slate-300 dark:border-slate-700">
                              <XCircle className="w-3.5 h-3.5 text-slate-400 inline" />
                              <span>不的中</span>
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Result calculation summary for stakes */}
          {result?.isSettled && (
            (() => {
              const totalStakeSum = allocatedBets.reduce((s, b) => s + (b.recommendedBet || 100), 0);
              const totalActualReturn = allocatedBets.reduce((s, b) => {
                const hitCheck = checkEVBetHit(b, result);
                const stake = b.recommendedBet || 100;
                return s + (hitCheck.isHit ? Math.round((stake * hitCheck.payoutPer100) / 100) : 0);
              }, 0);
              const netReturnProfit = totalActualReturn - totalStakeSum;
              const actualRecovery = totalStakeSum > 0 ? (totalActualReturn / totalStakeSum) * 100 : 0;
              const hitCount = allocatedBets.filter(b => checkEVBetHit(b, result).isHit).length;

              return (
                <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs font-bold ${
                  hitCount > 0
                    ? darkMode
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-emerald-50 border-emerald-400 text-slate-900'
                    : darkMode
                    ? 'bg-[#182234] border-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-extrabold text-sm">【推奨配分 確定収支結果】</span>
                    <span className={`px-2 py-0.5 rounded font-black text-xs ${
                      hitCount > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      {hitCount > 0 ? `🎯 的中 (${hitCount}/${allocatedBets.length} 点)` : `不的中 (0/${allocatedBets.length} 点)`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                    <span>
                      投資額: <strong className="text-slate-900 dark:text-white font-black">{totalStakeSum.toLocaleString()}円</strong>
                    </span>
                    <span>
                      払戻金: <strong className="text-amber-600 dark:text-amber-300 font-black">¥{totalActualReturn.toLocaleString()}</strong>
                    </span>
                    <span>
                      損益:{' '}
                      <strong className={`font-black ${
                        netReturnProfit > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : netReturnProfit < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {netReturnProfit >= 0 ? `+${netReturnProfit.toLocaleString()}` : `${netReturnProfit.toLocaleString()}`}円
                      </strong>
                    </span>
                    <span>
                      回収率:{' '}
                      <strong className={`font-black ${
                        actualRecovery >= 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {actualRecovery.toFixed(1)}%
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })()
          )}

          <div className="flex flex-wrap items-center justify-between text-xs px-2 pt-1 font-bold gap-2">
            <span className="text-slate-800 dark:text-slate-100 font-sans">
              合計投資見込:{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm ml-1">
                {allocatedBets.reduce((s, b) => s + (b.recommendedBet || 100), 0).toLocaleString()}円
              </strong>
            </span>

            {onRegisterMultipleBets && allocatedBets.length > 0 && (
              <button
                onClick={() => onRegisterMultipleBets(allocatedBets)}
                className="px-3 py-1.5 rounded bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs flex items-center space-x-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>推奨配分で全件一括購入登録 ({allocatedBets.reduce((s, b) => s + (b.recommendedBet || 100), 0).toLocaleString()}円)</span>
              </button>
            )}

            <span className="text-slate-800 dark:text-slate-100 font-bold font-sans">
              ※車券は100円単位。無理のない範囲でお楽しみください。
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
