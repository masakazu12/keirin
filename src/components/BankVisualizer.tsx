import React from 'react';
import { Rider } from '../types/keirin';
import { getCarColor } from '../services/keirinModel';
import { Flag, Compass } from 'lucide-react';

interface BankVisualizerProps {
  lineText: string;
  riders: Rider[];
  bankLength: number;
  darkMode: boolean;
}

export const BankVisualizer: React.FC<BankVisualizerProps> = ({
  lineText,
  riders,
  bankLength,
  darkMode,
}) => {
  const riderMap = new Map<number, Rider>();
  riders.forEach(r => riderMap.set(r.no, r));

  const lineGroups = lineText
    .replace(/,/g, '-')
    .replace(/　/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(groupStr => groupStr.split('-').map(m => parseInt(m.trim(), 10)).filter(n => !isNaN(n)));

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-lg border transition-colors shadow-xs ${
        darkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-slate-50 border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
            周回・最終バック展開予想図 (ライン隊列)
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono font-bold border border-sky-400/30">
            {bankLength}m バンク
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center space-x-1">
            <Flag className="w-3.5 h-3.5 text-red-500" />
            <span>ゴール直前 / 先頭誘導員退避後想定</span>
          </span>
        </div>
      </div>

      {/* Line Trains Visual Representation */}
      <div className="space-y-2.5">
        {lineGroups.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-300 font-medium">
            ライン構成を入力してください（例: 1-4-7 2-5 3-6 8 9）
          </div>
        ) : (
          lineGroups.map((group, groupIdx) => {
            const isSolo = group.length === 1;
            const leadRider = riderMap.get(group[0]);

            return (
              <div
                key={groupIdx}
                className={`p-3 rounded-md border flex flex-wrap items-center justify-between gap-2 shadow-xs ${
                  darkMode
                    ? 'bg-[#1e293b] border-slate-600'
                    : 'bg-white border-slate-300'
                }`}
              >
                {/* Line Header */}
                <div className="flex items-center space-x-2 min-w-[95px]">
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded shadow-xs ${
                      isSolo
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white'
                        : groupIdx === 0
                        ? 'bg-red-600 text-white'
                        : groupIdx === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isSolo ? '単騎' : `${groupIdx + 1}分戦`}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                    {group.join('-')}
                  </span>
                </div>

                {/* Rider Cars Train */}
                <div className="flex items-center space-x-2 flex-1 overflow-x-auto py-0.5">
                  {group.map((carNo, posIdx) => {
                    const rider = riderMap.get(carNo);
                    const carColor = getCarColor(carNo);

                    return (
                      <React.Fragment key={carNo}>
                        <div
                          className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md border shadow-xs transition-transform hover:scale-102 ${
                            darkMode ? 'bg-[#0f172a] border-slate-600' : 'bg-slate-50 border-slate-300'
                          }`}
                        >
                          {/* Car Number Ball */}
                          <span
                            style={{
                              backgroundColor: carColor.bg,
                              color: carColor.text,
                              borderColor: carColor.border,
                            }}
                            className="w-5.5 h-5.5 rounded-full flex items-center justify-center font-extrabold text-xs border shrink-0 shadow-xs"
                          >
                            {carNo}
                          </span>

                          {/* Rider Info */}
                          <div className="flex flex-col text-left">
                            <div className="flex items-center space-x-1">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[80px]">
                                {rider?.name || `${carNo}番`}
                              </span>
                              <span className="text-[11px] text-slate-600 dark:text-slate-200 font-mono font-bold">
                                ({rider?.style || '両'})
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-[11px]">
                              <span className="font-bold text-sky-700 dark:text-sky-300 font-sans">
                                {posIdx === 0 ? (isSolo ? '単騎' : '先頭') : posIdx === 1 ? '番手' : `${posIdx + 1}番手`}
                              </span>
                              <span className="font-mono font-extrabold text-amber-600 dark:text-amber-300">
                                {rider?.score ? `${rider.score.toFixed(1)}点` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {posIdx < group.length - 1 && (
                          <div className="text-slate-500 dark:text-slate-200 font-mono text-sm font-bold select-none">
                            →
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Tactical Role Badge */}
                <div className="text-right text-xs shrink-0 font-bold">
                  {leadRider?.style === '逃' && !isSolo ? (
                    <span className="text-red-600 dark:text-red-400 font-extrabold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">先制主導権候補</span>
                  ) : leadRider?.style === '捲' ? (
                    <span className="text-amber-600 dark:text-amber-300 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">捲り一発勝負</span>
                  ) : isSolo ? (
                    <span className="text-slate-600 dark:text-slate-200 font-semibold bg-slate-500/10 px-2 py-0.5 rounded">位置取り自在</span>
                  ) : (
                    <span className="text-sky-600 dark:text-sky-300 font-semibold bg-sky-500/10 px-2 py-0.5 rounded">差し・抜け出し</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
