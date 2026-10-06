import React from 'react';
import { X, HelpCircle, BookOpen, ShieldAlert, Cpu } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
  darkMode: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-xl rounded-lg shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          darkMode ? 'bg-[#1f1f1f] border-[#383838] text-gray-200' : 'bg-white border-gray-300 text-gray-800'
        }`}
      >
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-100 border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold tracking-wide">このアプリについて (AI競輪予想 v2)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white transition text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans leading-relaxed">
          <div>
            <h3 className="font-black text-sm text-sky-600 dark:text-sky-300 mb-1 flex items-center space-x-1">
              <Cpu className="w-4 h-4 text-sky-500" />
              <span>Plackett-Luce (プラケット・ルース) 着順モデルとは</span>
            </h3>
            <p className="text-slate-800 dark:text-slate-100 text-xs font-semibold leading-relaxed">
              競輪のような順序選択・着順予測において国際的な統計・機械学習分野で標準的に用いられる多項ロジット着順確率モデルです。
              各選手の総合能力（効用 u_i）に基づき、モンテカルロ・シミュレーションの試行誤差なく、すべての順列確率（3連単504通り、2車単72通り等）を厳密に計算します。
            </p>
          </div>

          <div className={`p-3 rounded border font-mono text-[11px] font-bold ${
            darkMode ? 'bg-[#0f172a] border-slate-700 text-sky-300' : 'bg-gray-50 border-gray-200 text-slate-900'
          }`}>
            P(1着=a, 2着=b, 3着=c) = [e^(u_a) / S] × [e^(u_b) / (S - e^(u_a))] × [e^(u_c) / (S - e^(u_a) - e^(u_b))]
          </div>

          <div>
            <h3 className="font-black text-sm text-emerald-600 dark:text-emerald-300 mb-1 flex items-center space-x-1">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>期待値 (EV) と 損益分岐オッズ</span>
            </h3>
            <p className="text-slate-800 dark:text-slate-100 text-xs font-semibold leading-relaxed">
              <strong>EV = モデル確率 × オッズ</strong><br />
              控除率（競輪の払戻率は約75%）を上回る期待値1.00超の買い目を検出します。損益分岐オッズは 1 ÷ 予測確率 で求められ、市場オッズが損益分岐を上回っているときに統計的なエッジ（期待値プラス）が存在します。
            </p>
          </div>

          <div className={`p-3 rounded border flex items-start space-x-2 ${
            darkMode ? 'bg-amber-950/40 border-amber-800/60 text-amber-200 font-medium' : 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
          }`}>
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-black">利用上のご注意:</strong><br />
              ・統計モデルは過去データに基づく予測であり、的中や利益を保証するものではありません。<br />
              ・オッズパーク競輪等の公開データは私的使用の範囲内でご利用ください。<br />
              ・車券の購入は20歳になってから、無理のない資金管理のもとで行ってください。
            </div>
          </div>
        </div>

        <div
          className={`px-4 py-3 border-t flex justify-end ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-100 border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
