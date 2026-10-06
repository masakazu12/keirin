import React from 'react';
import { RaceInfo, RaceResult, EVBet } from '../types/keirin';
import { getCarColor } from '../services/keirinModel';
import { checkEVBetHit } from '../services/raceResultService';
import { 
  CheckCircle2, 
  XCircle,
  Clock, 
  RotateCcw, 
  RefreshCw, 
  Award, 
  Coins, 
  Sparkles,
  Zap,
  Target
} from 'lucide-react';

interface RaceResultBannerProps {
  race: RaceInfo;
  result?: RaceResult;
  evBets?: EVBet[];
  autoFetchResult: boolean;
  onToggleAutoFetch: () => void;
  onFetchResult: () => void;
  onResetResult: () => void;
  darkMode: boolean;
}

export const RaceResultBanner: React.FC<RaceResultBannerProps> = ({
  race,
  result,
  evBets = [],
  autoFetchResult,
  onToggleAutoFetch,
  onFetchResult,
  onResetResult,
  darkMode,
}) => {
  const isSettled = result?.isSettled && result.order.length >= 3;

  const getRiderName = (no: number) => {
    const r = race.riders.find(rider => rider.no === no);
    return r ? r.name : `${no}番車`;
  };

  // AI推奨買い目の的中判定集計
  const evHits = (evBets || []).map(b => ({
    bet: b,
    ...checkEVBetHit(b, result),
  }));
  const hitCount = evHits.filter(h => h.isHit).length;
  const anyHit = hitCount > 0;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-lg border text-xs shadow-xs transition-colors ${
        isSettled
          ? darkMode
            ? 'bg-gradient-to-r from-emerald-950/40 via-[#111827] to-[#1e293b] border-emerald-600/50 text-white'
            : 'bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/80 border-emerald-300 text-slate-900 shadow-xs'
          : darkMode
          ? 'bg-[#111827] border-slate-700 text-white'
          : 'bg-white border-slate-300 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            {isSettled ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="font-extrabold text-sm tracking-wide">
              {isSettled ? '公式レース確定結果 & 払戻金' : 'レース結果取得ステータス'}
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded text-xs font-black border ${
              isSettled
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}
          >
            {isSettled ? '【確定】' : '【発走前・結果未確定】'}
          </span>

          {isSettled && result.kimarite && (
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-800 dark:text-sky-300 font-extrabold border border-sky-400/40">
              決まり手: {result.kimarite}
            </span>
          )}
        </div>

        {/* Controls: Auto-fetch toggle and actions */}
        <div className="flex items-center space-x-2">
          {/* Auto fetch toggle button */}
          <button
            onClick={onToggleAutoFetch}
            className={`px-2.5 py-1 rounded text-xs font-extrabold flex items-center space-x-1.5 transition border ${
              autoFetchResult
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : darkMode
                ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
            }`}
            title="レース番号切替時に結果を自動取得・反映するかどうかを切替えます"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoFetchResult ? 'animate-spin' : ''}`} />
            <span>結果自動取得: {autoFetchResult ? 'ON' : 'OFF'}</span>
          </button>

          {!isSettled ? (
            <button
              onClick={onFetchResult}
              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center space-x-1 transition shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>結果を取得・確定する</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={onFetchResult}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
                title="結果を再取得します"
              >
                再取得
              </button>
              <button
                onClick={onResetResult}
                className="px-2 py-1 rounded border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-xs transition"
                title="未確定状態に戻します"
              >
                未確定に戻す
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: Result Display or Unsettled Banner */}
      {isSettled ? (
        <div className="space-y-3 font-sans">
          {/* Podium 1-2-3 cars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[0, 1, 2].map(rankIdx => {
              const carNo = result.order[rankIdx];
              const carColor = getCarColor(carNo);
              const rankLabel = rankIdx === 0 ? '1着' : rankIdx === 1 ? '2着' : '3着';
              const rankColor =
                rankIdx === 0
                  ? 'bg-amber-500 text-slate-900 border-amber-400'
                  : rankIdx === 1
                  ? 'bg-slate-300 text-slate-900 border-slate-400'
                  : 'bg-amber-700 text-white border-amber-600';

              return (
                <div
                  key={rankIdx}
                  className={`p-2.5 rounded-lg border flex items-center space-x-3 shadow-xs ${
                    darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded font-black text-xs border ${rankColor}`}>
                    {rankLabel}
                  </span>

                  <span
                    style={{
                      backgroundColor: carColor.bg,
                      color: carColor.text,
                      borderColor: carColor.border,
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border shrink-0 shadow-xs"
                  >
                    {carNo}
                  </span>

                  <div className="flex flex-col truncate">
                    <span className="font-extrabold text-sm truncate text-slate-900 dark:text-white">
                      {getRiderName(carNo)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-300 font-mono">
                      {rankIdx === 0 && result.kimarite ? `決まり手: ${result.kimarite}` : `車番: ${carNo}番`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payouts Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`${darkMode ? 'bg-[#0f172a] text-white border-b border-slate-700' : 'bg-slate-100 text-slate-900 border-b border-slate-300'} font-bold`}>
                  <th className="py-2 px-3">券種</th>
                  <th className="py-2 px-3">確定目</th>
                  <th className="py-2 px-3 text-right">払戻金 (100円につき)</th>
                  <th className="py-2 px-3 text-right">人気</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {result.payouts.tri && (
                  <tr className={darkMode ? 'bg-[#111827] text-white' : 'bg-white text-slate-900'}>
                    <td className="py-2 px-3 font-sans font-black text-purple-600 dark:text-purple-300">3連単</td>
                    <td className="py-2 px-3 font-black text-sm">{result.payouts.tri.combination}</td>
                    <td className="py-2 px-3 text-right font-black text-amber-600 dark:text-amber-300 text-sm">
                      ¥{result.payouts.tri.payout.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-100 font-bold">
                      {result.payouts.tri.popularity ? `${result.payouts.tri.popularity}番人気` : '-'}
                    </td>
                  </tr>
                )}
                {result.payouts.exa && (
                  <tr className={darkMode ? 'bg-[#111827] text-white' : 'bg-white text-slate-900'}>
                    <td className="py-2 px-3 font-sans font-black text-blue-600 dark:text-blue-300">2車単</td>
                    <td className="py-2 px-3 font-black text-sm">{result.payouts.exa.combination}</td>
                    <td className="py-2 px-3 text-right font-black text-amber-600 dark:text-amber-300 text-sm">
                      ¥{result.payouts.exa.payout.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-100 font-bold">
                      {result.payouts.exa.popularity ? `${result.payouts.exa.popularity}番人気` : '-'}
                    </td>
                  </tr>
                )}
                {result.payouts.quin && (
                  <tr className={darkMode ? 'bg-[#111827] text-white' : 'bg-white text-slate-900'}>
                    <td className="py-2 px-3 font-sans font-black text-blue-600 dark:text-blue-300">2車複</td>
                    <td className="py-2 px-3 font-black text-sm">{result.payouts.quin.combination}</td>
                    <td className="py-2 px-3 text-right font-black text-amber-600 dark:text-amber-300 text-sm">
                      ¥{result.payouts.quin.payout.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-100 font-bold">-</td>
                  </tr>
                )}
                {result.payouts.trio && (
                  <tr className={darkMode ? 'bg-[#111827] text-white' : 'bg-white text-slate-900'}>
                    <td className="py-2 px-3 font-sans font-black text-purple-600 dark:text-purple-300">3連複</td>
                    <td className="py-2 px-3 font-black text-sm">{result.payouts.trio.combination}</td>
                    <td className="py-2 px-3 text-right font-black text-amber-600 dark:text-amber-300 text-sm">
                      ¥{result.payouts.trio.payout.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-100 font-bold">-</td>
                  </tr>
                )}
                {result.payouts.wide && result.payouts.wide.length > 0 && (
                  <tr className={darkMode ? 'bg-[#111827] text-white' : 'bg-white text-slate-900'}>
                    <td className="py-2 px-3 font-sans font-black text-emerald-600 dark:text-emerald-300">ワイド</td>
                    <td className="py-2 px-3 font-black text-sm">
                      {result.payouts.wide.map(w => w.combination).join(' / ')}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-amber-600 dark:text-amber-300 text-sm">
                      {result.payouts.wide.map(w => `¥${w.payout.toLocaleString()}`).join(' / ')}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-100 font-bold">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* AI推奨買い目 的中判定セクション */}
          {evBets && evBets.length > 0 && (
            <div className={`p-3 rounded-lg border shadow-xs space-y-2.5 ${
              anyHit
                ? darkMode
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : 'bg-emerald-50 border-emerald-300'
                : darkMode
                ? 'bg-[#182234] border-slate-700'
                : 'bg-slate-50 border-slate-300'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <Target className={`w-4 h-4 ${anyHit ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="font-black text-sm tracking-wide text-slate-900 dark:text-white">
                    AI推奨買い目 的中判定
                  </span>
                  <span className={`px-2.5 py-0.5 rounded font-black text-xs border ${
                    anyHit
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}>
                    {anyHit ? `🎯 的中！ (${hitCount}/${evBets.length} 点)` : `不的中 (0/${evBets.length} 点)`}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                  {anyHit ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-black">
                      払戻金計: ¥{evHits.filter(h => h.isHit).reduce((sum, h) => sum + h.payoutPer100, 0).toLocaleString()} (100円購入時)
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">
                      判定完了
                    </span>
                  )}
                </div>
              </div>

              {/* 買い目カード一覧 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono">
                {evHits.slice(0, 8).map((h, hIdx) => (
                  <div
                    key={hIdx}
                    className={`p-2 rounded border flex items-center justify-between shadow-2xs ${
                      h.isHit
                        ? darkMode
                          ? 'bg-emerald-900/60 border-emerald-400 text-white'
                          : 'bg-emerald-100/90 border-emerald-400 text-slate-900 font-black'
                        : darkMode
                        ? 'bg-[#111827] border-slate-700 text-slate-200'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className={`text-[10px] px-1 py-0.2 rounded font-sans font-black ${
                        h.bet.type === '3連単' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        {h.bet.type}
                      </span>
                      <span className="font-black text-xs">{h.bet.combination}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-right shrink-0">
                      {h.isHit ? (
                        <span className="inline-flex items-center space-x-0.5 text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-500" />
                          <span>¥{h.payoutPer100.toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <XCircle className="w-3 h-3 inline text-slate-400" />
                          <span>不的中</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-800 dark:text-slate-100 font-bold">
          <p>
            現在このレースは未確定です。「結果を取得・確定する」を押すと公式着順と払戻金が確定し、購入車券の的中判定と収支計算が自動実行されます。
          </p>
          <span className="text-[11px] text-sky-700 dark:text-sky-300 font-black">
            ※「結果自動取得: ON」の場合、レース切替時に自動判定されます
          </span>
        </div>
      )}
    </div>
  );
};
