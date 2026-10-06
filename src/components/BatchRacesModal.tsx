import React, { useState } from 'react';
import { RaceInfo } from '../types/keirin';
import { generateDayProgram } from '../services/presetRaces';
import { analyzeRiders, computeEVBets, assignMarks } from '../services/keirinModel';
import { generateTacticalCommentary } from '../services/commentaryGenerator';
import { 
  X, 
  LayoutGrid, 
  Play, 
  Copy, 
  Check, 
  Sparkles,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';

interface BatchRacesModalProps {
  venueCode: string;
  venueName: string;
  date: string;
  weights: number[];
  onClose: () => void;
  onSelectRace: (race: RaceInfo) => void;
  darkMode: boolean;
}

export const BatchRacesModal: React.FC<BatchRacesModalProps> = ({
  venueCode,
  venueName,
  date,
  weights,
  onClose,
  onSelectRace,
  darkMode,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const races = generateDayProgram(venueCode, date);

  // 全レース解析の実行
  const analyzedRaces = races.map(r => {
    const probs = analyzeRiders(r.riders, weights);
    const marks = assignMarks(probs.win);
    const evBets = computeEVBets(r.riders, probs, r.odds, { minEV: 1.0, limit: 3 });
    const commentary = generateTacticalCommentary(r.grade, r.lines, r.riders, probs, r.bankLength);

    const topIndices = r.riders
      .map((_, i) => i)
      .sort((a, b) => probs.win[b] - probs.win[a])
      .slice(0, 3);

    return {
      race: r,
      probs,
      marks,
      evBets,
      topIndices,
      commentary,
    };
  });

  const generateFullReport = () => {
    const lines = [
      `【${venueName} ${date}】 全12R一括予想レポート (Plackett-Luce 厳密モデル)`,
      '='.repeat(60),
      '',
    ];

    analyzedRaces.forEach(({ race, marks, topIndices, evBets, commentary }) => {
      const picks = topIndices
        .map(i => `${marks[i] || ''}${race.riders[i].no}${race.riders[i].name}`)
        .join(' ');
      lines.push(`${race.raceNo}R ${race.grade}  ${picks}   [ライン: ${race.lines}]`);
      lines.push(`   展開予想: ${commentary.shortComment} (${commentary.summaryTitle})`);
      if (evBets.length > 0) {
        evBets.forEach(b => {
          lines.push(`   └ EV ${b.ev.toFixed(2)}  ${b.type} ${b.combination} (オッズ ${b.odds.toFixed(1)}倍 / 確率 ${(b.prob * 100).toFixed(1)}%)`);
        });
      } else {
        lines.push('   └ 有望EV買い目なし（人気過熱）');
      }
      lines.push('');
    });

    lines.push('※車券の購入はご自身の判断で行ってください。');
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-4xl rounded-lg shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          darkMode ? 'bg-[#1f1f1f] border-[#383838] text-gray-200' : 'bg-white border-gray-300 text-gray-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-100 border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold tracking-wide">
              {venueName}競輪 全12レース一括AI予想ダイアログ ({date})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white transition text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 dark:text-slate-100 font-bold">
              全12レースの出走表・ライン・オッズをPlackett-Luceモデルで一括計算しました。
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center space-x-1.5 transition shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了' : '全R予想を一括コピー'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analyzedRaces.map(({ race, marks, topIndices, evBets, commentary }) => (
              <div
                key={race.raceNo}
                className={`p-3 rounded-lg border transition ${
                  darkMode ? 'bg-[#182234] border-slate-700 text-white' : 'bg-slate-50 border-gray-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-black text-sm text-indigo-600 dark:text-indigo-300 font-mono">
                      {race.raceNo}R
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {race.grade}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectRace(race);
                      onClose();
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-extrabold transition shadow-xs"
                  >
                    このRを編集/展開
                  </button>
                </div>

                {/* ライン */}
                <div className="text-[11px] text-slate-700 dark:text-slate-200 mb-1 font-mono font-bold">
                  ライン: <span className="text-slate-900 dark:text-sky-300 font-black">{race.lines}</span>
                </div>

                {/* 展開予想要約 */}
                <div className="text-[11px] text-sky-900 dark:text-sky-200 bg-sky-100 dark:bg-sky-950/60 px-2 py-1 rounded border border-sky-300 dark:border-sky-800 mb-1.5 flex items-start space-x-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="font-sans line-clamp-2 font-bold">
                    <strong className="font-black">【{commentary.summaryTitle}】</strong> {commentary.shortComment}
                  </span>
                </div>

                {/* 本命・対抗・単穴 */}
                <div className="flex items-center space-x-2 my-1.5 py-1 px-2 rounded bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div className="flex items-center space-x-2 truncate text-xs">
                    {topIndices.map(i => (
                      <span key={i} className="truncate font-black text-slate-900 dark:text-white">
                        <span className={marks[i] === '◎' ? 'text-red-500 font-black mr-0.5' : marks[i] === '○' ? 'text-blue-500 dark:text-blue-400 font-black mr-0.5' : 'text-amber-500 font-black mr-0.5'}>
                          {marks[i]}
                        </span>
                        {race.riders[i].no}{race.riders[i].name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 期待値 EV 買い目 */}
                {evBets.length > 0 ? (
                  <div className="space-y-1 mt-1 text-[11px]">
                    {evBets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                        <span>{b.type} {b.combination}</span>
                        <div className="space-x-1.5">
                          <span className="text-slate-700 dark:text-slate-200">{b.odds.toFixed(1)}倍</span>
                          <span className="font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-1 py-0.2 rounded border border-emerald-500/40">
                            EV {b.ev.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold mt-1">
                    推奨高EV買い目なし
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-3 border-t flex justify-end ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-100 border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
