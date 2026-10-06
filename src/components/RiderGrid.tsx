import React from 'react';
import { Rider, RiderStyle, LinePosition } from '../types/keirin';
import { getCarColor } from '../services/keirinModel';

interface RiderGridProps {
  riders: Rider[];
  onChangeRider: (index: number, updated: Partial<Rider>) => void;
  darkMode: boolean;
}

export const RiderGrid: React.FC<RiderGridProps> = ({
  riders,
  onChangeRider,
  darkMode,
}) => {
  const styles: RiderStyle[] = ['逃', '捲', '追', '両'];

  const getPositionBadge = (pos: LinePosition) => {
    switch (pos) {
      case '先頭':
        return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40 font-bold';
      case '番手':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 font-bold';
      case '3番手':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold';
      case '4番手':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 font-bold';
      case '単騎':
      default:
        return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-400 font-bold';
    }
  };

  return (
    <div className="overflow-x-auto select-none rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className={`${darkMode ? 'bg-[#0f172a] text-white border-b border-slate-700' : 'bg-slate-100 text-slate-900 border-b border-slate-300'} font-bold`}>
            <th className="py-2.5 px-2 text-center w-12">車番</th>
            <th className="py-2.5 px-2 min-w-[130px]">選手名</th>
            <th className="py-2.5 px-2 text-center w-16">ライン位置</th>
            <th className="py-2.5 px-2 text-center w-20">競走得点</th>
            <th className="py-2.5 px-2 text-center w-16">脚質</th>
            <th className="py-2.5 px-2 text-center w-20">勝率 (%)</th>
            <th className="py-2.5 px-2 text-center w-20">3連対率 (%)</th>
            <th className="py-2.5 px-2 text-center w-16">バック(B)</th>
            <th className="py-2.5 px-2 text-center w-20">ギア倍数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
          {riders.map((rider, index) => {
            const carColor = getCarColor(rider.no);
            const isInactive = rider.score <= 0;

            return (
              <tr
                key={rider.no}
                className={`transition-colors ${
                  isInactive
                    ? 'opacity-40 bg-gray-50/50 dark:bg-gray-900/40'
                    : darkMode
                    ? 'hover:bg-[#1e293b]/70 bg-[#111827]'
                    : 'hover:bg-blue-50/50 bg-white'
                }`}
              >
                {/* 車番 (公式配色バッジ) */}
                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center">
                    <span
                      style={{
                        backgroundColor: carColor.bg,
                        color: carColor.text,
                        borderColor: carColor.border,
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center font-extrabold text-xs shadow-xs border"
                    >
                      {rider.no}
                    </span>
                  </div>
                </td>

                {/* 選手名 */}
                <td className="py-2 px-2 font-sans">
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={rider.name}
                      onChange={e => onChangeRider(index, { name: e.target.value })}
                      placeholder={`選手${rider.no}`}
                      className={`w-full px-2 py-1 rounded text-xs border font-bold transition focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                        darkMode
                          ? 'bg-[#1e293b] border-slate-600 text-white placeholder-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 font-bold'
                      }`}
                    />
                    {rider.cls && (
                      <span className="shrink-0 text-[10px] px-1 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-mono">
                        {rider.cls}
                      </span>
                    )}
                  </div>
                </td>

                {/* ライン内位置 (自動算定バッジ) */}
                <td className="py-2 px-2 text-center font-sans">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[11px] border ${getPositionBadge(
                      rider.pos
                    )}`}
                  >
                    {rider.pos}
                  </span>
                </td>

                {/* 競走得点 */}
                <td className="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="0.01"
                    value={rider.score || ''}
                    onChange={e => onChangeRider(index, { score: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={`w-20 px-1.5 py-1 text-right rounded text-xs border font-extrabold ${
                      rider.score >= 115
                        ? 'text-red-500 dark:text-red-400'
                        : rider.score >= 105
                        ? 'text-sky-600 dark:text-sky-400'
                        : darkMode
                        ? 'text-white'
                        : 'text-slate-900'
                    } ${
                      darkMode ? 'bg-[#1e293b] border-slate-600' : 'bg-white border-slate-300'
                    }`}
                  />
                </td>

                {/* 脚質 */}
                <td className="py-2 px-2 text-center font-sans">
                  <select
                    value={rider.style}
                    onChange={e => onChangeRider(index, { style: e.target.value as RiderStyle })}
                    className={`px-1.5 py-1 rounded text-xs border cursor-pointer font-bold ${
                      darkMode ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900 font-bold'
                    }`}
                  >
                    {styles.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 勝率 */}
                <td className="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="0.1"
                    value={rider.win || ''}
                    onChange={e => onChangeRider(index, { win: parseFloat(e.target.value) || 0 })}
                    placeholder="0.0"
                    className={`w-16 px-1.5 py-1 text-right rounded text-xs border font-bold ${
                      darkMode ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900 font-bold'
                    }`}
                  />
                </td>

                {/* 3連対率 */}
                <td className="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="0.1"
                    value={rider.top3 || ''}
                    onChange={e => onChangeRider(index, { top3: parseFloat(e.target.value) || 0 })}
                    placeholder="0.0"
                    className={`w-16 px-1.5 py-1 text-right rounded text-xs border font-bold ${
                      darkMode ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900 font-bold'
                    }`}
                  />
                </td>

                {/* バック数 (B) */}
                <td className="py-2 px-2 text-center">
                  <input
                    type="number"
                    value={rider.back || ''}
                    onChange={e => onChangeRider(index, { back: parseInt(e.target.value, 10) || 0 })}
                    placeholder="0"
                    className={`w-14 px-1.5 py-1 text-right rounded text-xs border font-extrabold ${
                      rider.back >= 10
                        ? 'text-amber-500 font-extrabold'
                        : darkMode
                        ? 'text-white'
                        : 'text-slate-900'
                    } ${
                      darkMode ? 'bg-[#1e293b] border-slate-600' : 'bg-white border-slate-300'
                    }`}
                  />
                </td>

                {/* ギア倍数 */}
                <td className="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="0.01"
                    value={rider.gear || ''}
                    onChange={e => onChangeRider(index, { gear: parseFloat(e.target.value) || 3.92 })}
                    placeholder="3.92"
                    className={`w-16 px-1.5 py-1 text-right rounded text-xs border font-bold ${
                      darkMode ? 'bg-[#1e293b] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900 font-bold'
                    }`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
