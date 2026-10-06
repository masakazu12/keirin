import React, { useState } from 'react';
import { BetSlipItem, BettingSummary } from '../types/keirin';
import { 
  X, 
  Download, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter,
  DollarSign
} from 'lucide-react';

interface BettingLedgerModalProps {
  bets: BetSlipItem[];
  summary: BettingSummary;
  onClose: () => void;
  onClearHistory: () => void;
  onDeleteBet: (id: string) => void;
  onAddManualBet: (bet: Omit<BetSlipItem, 'id' | 'timestamp' | 'isSettled' | 'payout' | 'profit'>) => void;
  darkMode: boolean;
}

export const BettingLedgerModal: React.FC<BettingLedgerModalProps> = ({
  bets,
  summary,
  onClose,
  onClearHistory,
  onDeleteBet,
  onAddManualBet,
  darkMode,
}) => {
  const [filter, setFilter] = useState<'all' | 'hit' | 'miss' | 'unsettled'>('all');
  const [isAddingBet, setIsAddingBet] = useState<boolean>(false);

  // New Bet form state
  const [newType, setNewType] = useState<BetSlipItem['type']>('3連単');
  const [newComb, setNewComb] = useState<string>('1-4-7');
  const [newStake, setNewStake] = useState<number>(1000);
  const [newOdds, setNewOdds] = useState<number>(25.0);

  const filteredBets = bets.filter(b => {
    if (filter === 'hit') return b.isSettled && b.isHit;
    if (filter === 'miss') return b.isSettled && !b.isHit;
    if (filter === 'unsettled') return !b.isSettled;
    return true;
  });

  const handleExportCSV = () => {
    if (bets.length === 0) return;
    const header = '日時,レース,券種,買い目,オッズ,投資金額,状態,払戻金額,損益\n';
    const rows = bets.map(b => {
      const status = !b.isSettled ? '未確定' : b.isHit ? '的中' : '不的中';
      return `"${new Date(b.timestamp).toLocaleString()}","${b.raceTitle}","${b.type}","${b.combination}",${b.odds},${b.stake},"${status}",${b.payout},${b.profit}`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keirin_bets_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitManualBet = (e: React.FormEvent) => {
    e.preventDefault();
    const cars = newComb.split(/[-=]/).map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
    if (cars.length < 2) {
      alert('車番をハイフンまたはイコールで区切って入力してください（例: 1-4-7 または 1=4）');
      return;
    }

    onAddManualBet({
      raceId: 'manual-entry',
      raceTitle: '手動登録車券',
      date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      venue: '任意',
      raceNo: 1,
      type: newType,
      combination: newComb,
      cars,
      stake: newStake,
      odds: newOdds,
    });

    setIsAddingBet(false);
  };

  const isProfit = summary.netProfit > 0;
  const isLoss = summary.netProfit < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none font-sans">
      <div
        className={`w-full max-w-4xl rounded-xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
          darkMode ? 'bg-[#111827] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-black tracking-wide">
              競輪 収支管理台帳 & 回収率分析
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white transition text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className={`p-4 border-b grid grid-cols-2 sm:grid-cols-5 gap-3 ${
          darkMode ? 'bg-[#182234] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* 累計投資金額 */}
          <div className={`p-3 rounded-lg border shadow-xs ${darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'}`}>
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block">
              累計投資金額
            </span>
            <span className="font-mono font-black text-lg block text-slate-900 dark:text-white">
              ¥{summary.totalStake.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-mono font-bold">
              購入 {summary.totalBets} 点
            </span>
          </div>

          {/* 累計払戻金額 */}
          <div className={`p-3 rounded-lg border shadow-xs ${darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'}`}>
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block">
              累計払戻金額
            </span>
            <span className="font-mono font-black text-lg block text-slate-900 dark:text-white">
              ¥{summary.totalReturn.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-mono font-bold">
              的中 {summary.hitCount} 点
            </span>
          </div>

          {/* 累計損益 */}
          <div className={`p-3 rounded-lg border shadow-xs ${darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'}`}>
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block">
              累計損益
            </span>
            <span
              className={`font-mono font-black text-lg block ${
                isProfit
                  ? 'text-emerald-600 dark:text-emerald-300'
                  : isLoss
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {summary.netProfit > 0 ? '+' : ''}¥{summary.netProfit.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-sans font-bold">
              {isProfit ? 'プラス収支' : isLoss ? 'マイナス' : '収支プラマイゼロ'}
            </span>
          </div>

          {/* 回収率 (ROI) */}
          <div className={`p-3 rounded-lg border shadow-xs ${darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'}`}>
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block">
              回収率 (ROI)
            </span>
            <span
              className={`font-mono font-black text-xl block ${
                summary.totalStake === 0
                  ? 'text-slate-500 dark:text-slate-300'
                  : summary.recoveryRate >= 100
                  ? 'text-emerald-600 dark:text-emerald-300'
                  : 'text-red-600 dark:text-red-300'
              }`}
            >
              {summary.totalStake > 0 ? `${summary.recoveryRate.toFixed(1)}%` : '---%'}
            </span>
            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-sans font-bold">
              {summary.recoveryRate >= 100 ? '100%超え達成' : '100%未満'}
            </span>
          </div>

          {/* 的中率 */}
          <div className={`p-3 rounded-lg border shadow-xs col-span-2 sm:col-span-1 ${darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'}`}>
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block">
              的中率
            </span>
            <span className="font-mono font-black text-lg block text-slate-900 dark:text-white">
              {summary.totalBets > 0 ? `${summary.hitRate.toFixed(1)}%` : '---%'}
            </span>
            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-mono font-bold">
              {summary.hitCount} / {summary.totalBets}
            </span>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          {/* Filter tabs */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                filter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : darkMode
                  ? 'bg-[#1e293b] text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              全て ({bets.length})
            </button>
            <button
              onClick={() => setFilter('hit')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                filter === 'hit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : darkMode
                  ? 'bg-[#1e293b] text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              的中 ({bets.filter(b => b.isSettled && b.isHit).length})
            </button>
            <button
              onClick={() => setFilter('miss')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                filter === 'miss'
                  ? 'bg-red-600 text-white shadow-xs'
                  : darkMode
                  ? 'bg-[#1e293b] text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              不的中 ({bets.filter(b => b.isSettled && !b.isHit).length})
            </button>
            <button
              onClick={() => setFilter('unsettled')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                filter === 'unsettled'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : darkMode
                  ? 'bg-[#1e293b] text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-300'
              }`}
            >
              未確定 ({bets.filter(b => !b.isSettled).length})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddingBet(!isAddingBet)}
              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center space-x-1 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>手動で買い目追加</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={bets.length === 0}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold flex items-center space-x-1 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV保存</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('すべての購入履歴をリセットしてもよろしいですか？')) {
                  onClearHistory();
                }
              }}
              disabled={bets.length === 0}
              className="px-2 py-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-300 dark:border-red-900/60 font-bold transition disabled:opacity-40"
              title="履歴を全消去"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Manual Bet Input Form */}
        {isAddingBet && (
          <form
            onSubmit={handleSubmitManualBet}
            className={`p-3 border-b flex flex-wrap items-center gap-2 text-xs ${
              darkMode ? 'bg-[#182234] border-slate-700' : 'bg-sky-50 border-sky-200'
            }`}
          >
            <span className="font-bold text-sky-600 dark:text-sky-300">手動登録:</span>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as BetSlipItem['type'])}
              className={`px-2 py-1 rounded border font-bold ${
                darkMode ? 'bg-[#0f172a] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="3連単">3連単</option>
              <option value="2車単">2車単</option>
              <option value="2車複">2車複</option>
              <option value="3連複">3連複</option>
              <option value="ワイド">ワイド</option>
            </select>

            <input
              type="text"
              value={newComb}
              onChange={e => setNewComb(e.target.value)}
              placeholder="1-4-7"
              className={`w-28 px-2 py-1 rounded border font-mono font-bold ${
                darkMode ? 'bg-[#0f172a] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />

            <span className="text-slate-500 font-bold">投資額:</span>
            <input
              type="number"
              step="100"
              value={newStake}
              onChange={e => setNewStake(Math.max(100, parseInt(e.target.value, 10) || 100))}
              className={`w-24 px-2 py-1 rounded border font-mono font-bold text-right ${
                darkMode ? 'bg-[#0f172a] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <span className="font-bold">円</span>

            <span className="text-slate-500 font-bold">オッズ:</span>
            <input
              type="number"
              step="0.1"
              value={newOdds}
              onChange={e => setNewOdds(parseFloat(e.target.value) || 1.0)}
              className={`w-20 px-2 py-1 rounded border font-mono font-bold text-right ${
                darkMode ? 'bg-[#0f172a] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <span className="font-bold">倍</span>

            <button
              type="submit"
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs transition"
            >
              登録
            </button>
            <button
              type="button"
              onClick={() => setIsAddingBet(false)}
              className="px-2 py-1 rounded border border-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
            >
              取消
            </button>
          </form>
        )}

        {/* Bets History Table */}
        <div className="overflow-y-auto flex-1 p-3">
          {filteredBets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-700 dark:text-slate-200 font-bold">
              購入履歴がありません。「AI推奨目を一括登録」または「手動で買い目追加」から登録してください。
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`${darkMode ? 'bg-[#0f172a] text-white border-b border-slate-700' : 'bg-slate-100 text-slate-900 border-b border-slate-300'} font-bold`}>
                    <th className="py-2.5 px-3">レース</th>
                    <th className="py-2.5 px-2">券種</th>
                    <th className="py-2.5 px-3 font-mono">買い目</th>
                    <th className="py-2.5 px-3 text-right">オッズ</th>
                    <th className="py-2.5 px-3 text-right">投資金額</th>
                    <th className="py-2.5 px-3 text-center">判定</th>
                    <th className="py-2.5 px-3 text-right">払戻金額</th>
                    <th className="py-2.5 px-3 text-right">損益</th>
                    <th className="py-2.5 px-2 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {filteredBets.map(b => (
                    <tr
                      key={b.id}
                      className={`transition ${
                        !b.isSettled
                          ? darkMode ? 'bg-[#111827] text-white' : 'bg-white text-slate-900'
                          : b.isHit
                          ? darkMode ? 'bg-emerald-950/40 text-white' : 'bg-emerald-50/70 text-slate-900'
                          : darkMode ? 'bg-[#111827] text-slate-100' : 'bg-white text-slate-800'
                      }`}
                    >
                      {/* レース */}
                      <td className="py-2 px-3 font-sans font-bold">
                        <span className="truncate block max-w-[140px] text-slate-900 dark:text-white" title={b.raceTitle}>
                          {b.raceTitle}
                        </span>
                      </td>

                      {/* 券種 */}
                      <td className="py-2 px-2 font-sans">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white">
                          {b.type}
                        </span>
                      </td>

                      {/* 買い目 */}
                      <td className="py-2 px-3 font-black text-sm text-slate-900 dark:text-white">
                        {b.combination}
                      </td>

                      {/* オッズ */}
                      <td className="py-2 px-3 text-right font-black text-amber-700 dark:text-amber-300">
                        {b.odds.toFixed(1)}倍
                      </td>

                      {/* 投資金額 */}
                      <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white">
                        ¥{b.stake.toLocaleString()}
                      </td>

                      {/* 判定 */}
                      <td className="py-2 px-3 text-center font-sans">
                        {!b.isSettled ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-500/40">
                            <Clock className="w-3 h-3" />
                            <span>未確定</span>
                          </span>
                        ) : b.isHit ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-600 text-white shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>的中</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                            <XCircle className="w-3 h-3" />
                            <span>不的中</span>
                          </span>
                        )}
                      </td>

                      {/* 払戻金額 */}
                      <td className="py-2 px-3 text-right font-black">
                        {b.isSettled && b.isHit ? (
                          <span className="text-emerald-600 dark:text-emerald-300">
                            ¥{b.payout.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-300 font-bold">¥0</span>
                        )}
                      </td>

                      {/* 損益 */}
                      <td className="py-2 px-3 text-right font-black">
                        {b.isSettled ? (
                          <span
                            className={
                              b.profit > 0
                                ? 'text-emerald-600 dark:text-emerald-300'
                                : b.profit < 0
                                ? 'text-red-600 dark:text-red-300'
                                : 'text-slate-500 dark:text-slate-300 font-bold'
                            }
                          >
                            {b.profit > 0 ? '+' : ''}¥{b.profit.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      {/* 削除 */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => onDeleteBet(b.id)}
                          className="p-1 rounded text-slate-500 dark:text-slate-300 hover:text-red-500 transition"
                          title="この明細を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-3 border-t flex justify-end ${
            darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-xs transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
