import React from 'react';
import { BettingSummary } from '../types/keirin';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  DollarSign, 
  PieChart, 
  PlusCircle, 
  History,
  CheckCircle2
} from 'lucide-react';

interface BettingLedgerBarProps {
  summary: BettingSummary;
  onOpenLedger: () => void;
  onQuickRegisterBets: () => void;
  hasUnsettledBets: boolean;
  hasEVBets: boolean;
  darkMode: boolean;
}

export const BettingLedgerBar: React.FC<BettingLedgerBarProps> = ({
  summary,
  onOpenLedger,
  onQuickRegisterBets,
  hasUnsettledBets,
  hasEVBets,
  darkMode,
}) => {
  const isProfit = summary.netProfit > 0;
  const isLoss = summary.netProfit < 0;
  const isOver100 = summary.recoveryRate >= 100;

  return (
    <div
      className={`px-3 py-2.5 rounded-lg border text-xs shadow-xs transition-colors flex flex-wrap items-center justify-between gap-3 ${
        darkMode
          ? 'bg-[#0f172a] border-slate-700 text-white'
          : 'bg-gradient-to-r from-slate-50 via-white to-blue-50 border-slate-300 text-slate-900'
      }`}
    >
      {/* Left: Summary Metrics */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        {/* Title */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="p-1 rounded bg-amber-500/20 text-amber-500">
            <Coins className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs tracking-wide">
            競輪収支カウンター
          </span>
        </div>

        {/* 累計投資金額 */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 dark:text-slate-200 font-black leading-tight">
            累計投資金額
          </span>
          <span className="font-mono font-black text-base text-slate-900 dark:text-white">
            ¥{summary.totalStake.toLocaleString()}
          </span>
        </div>

        {/* 累計払戻金額 */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 dark:text-slate-200 font-black leading-tight">
            累計払戻金額
          </span>
          <span className="font-mono font-black text-base text-slate-900 dark:text-white">
            ¥{summary.totalReturn.toLocaleString()}
          </span>
        </div>

        {/* 累計損益 */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 dark:text-slate-200 font-black leading-tight">
            累計損益
          </span>
          <span
            className={`font-mono font-black text-base flex items-center space-x-0.5 ${
              isProfit
                ? 'text-emerald-600 dark:text-emerald-300'
                : isLoss
                ? 'text-red-600 dark:text-red-300'
                : 'text-slate-800 dark:text-white'
            }`}
          >
            {isProfit ? <TrendingUp className="w-4 h-4 inline mr-0.5 text-emerald-500" /> : isLoss ? <TrendingDown className="w-4 h-4 inline mr-0.5 text-red-500" /> : null}
            <span>
              {summary.netProfit > 0 ? '+' : ''}¥{summary.netProfit.toLocaleString()}
            </span>
          </span>
        </div>

        {/* 回収率 */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 dark:text-slate-200 font-black leading-tight">
            回収率 (ROI)
          </span>
          <div className="flex items-center space-x-1">
            <span
              className={`font-mono font-black text-base px-2 py-0.5 rounded ${
                summary.totalStake === 0
                  ? 'text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800'
                  : isOver100
                  ? 'text-emerald-800 dark:text-emerald-200 bg-emerald-500/25 border border-emerald-500/50 shadow-xs'
                  : 'text-red-800 dark:text-red-200 bg-red-500/20 border border-red-500/40 shadow-xs'
              }`}
            >
              {summary.totalStake > 0 ? `${summary.recoveryRate.toFixed(1)}%` : '---%'}
            </span>
          </div>
        </div>

        {/* 的中率 */}
        <div className="hidden md:flex flex-col">
          <span className="text-[11px] text-slate-700 dark:text-slate-200 font-black leading-tight">
            的中率 ({summary.hitCount}/{summary.totalBets})
          </span>
          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
            {summary.totalBets > 0 ? `${summary.hitRate.toFixed(1)}%` : '---%'}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 shrink-0">
        {hasEVBets && (
          <button
            onClick={onQuickRegisterBets}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition"
            title="現在のレースのAI推奨EV買い目を収支帳に一括登録します"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>AI推奨目を一括登録</span>
          </button>
        )}

        <button
          onClick={onOpenLedger}
          className={`px-3 py-1 rounded font-bold text-xs flex items-center space-x-1.5 transition border shadow-xs ${
            darkMode
              ? 'bg-[#1e293b] hover:bg-slate-700 text-sky-300 border-slate-600'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
          title="収支台帳と購入履歴の一覧を開きます"
        >
          <History className="w-3.5 h-3.5 text-sky-500" />
          <span>収支帳・履歴 ({summary.totalBets}件)</span>
          {hasUnsettledBets && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};
