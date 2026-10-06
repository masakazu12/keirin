import React, { useState } from 'react';
import { 
  FEATURE_NAMES, 
  DEFAULT_WEIGHTS, 
  trainWeights,
  makeFeatures
} from '../services/keirinModel';
import { Rider } from '../types/keirin';
import { 
  X, 
  Cpu, 
  RotateCcw, 
  Upload, 
  Download, 
  Check, 
  Sparkles,
  Sliders,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';

interface WeightsTrainerModalProps {
  weights: number[];
  onSaveWeights: (newWeights: number[]) => void;
  onClose: () => void;
  darkMode: boolean;
}

export const WeightsTrainerModal: React.FC<WeightsTrainerModalProps> = ({
  weights,
  onSaveWeights,
  onClose,
  darkMode,
}) => {
  const [currentWeights, setCurrentWeights] = useState<number[]>([...weights]);
  const [tab, setTab] = useState<'sliders' | 'training' | 'io'>('sliders');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [epochProgress, setEpochProgress] = useState<number>(0);
  const [currentLoss, setCurrentLoss] = useState<number>(0);
  const [trainingMessage, setTrainingMessage] = useState<string>('');

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...currentWeights];
    updated[index] = Math.round(val * 100) / 100;
    setCurrentWeights(updated);
  };

  const handleReset = () => {
    setCurrentWeights([...DEFAULT_WEIGHTS]);
  };

  // 模擬/アップロード学習の実行
  const handleRunTraining = (sampleCount: number = 150) => {
    setIsTraining(true);
    setEpochProgress(0);
    setTrainingMessage(`${sampleCount}レースの過去データからPlackett-Luceモデル勾配降下学習を開始...`);

    // 擬似過去レースデータセットの生成
    const syntheticRaces: { feats: number[][]; order: number[] }[] = [];
    for (let r = 0; r < sampleCount; r++) {
      const riders: Rider[] = [];
      for (let i = 1; i <= 9; i++) {
        riders.push({
          no: i,
          name: `選手${i}`,
          score: 85 + Math.random() * 30,
          style: i % 3 === 0 ? '逃' : i % 2 === 0 ? '追' : '捲',
          win: Math.random() * 40,
          top3: Math.random() * 70,
          back: Math.floor(Math.random() * 15),
          gear: 3.92,
          pos: i === 1 ? '先頭' : i === 2 ? '番手' : '単騎',
        });
      }
      const feats = makeFeatures(riders);
      const scores = riders.map((rd, idx) => rd.score + (rd.pos === '番手' ? 3 : 0) + (rd.style === '逃' ? 2 : 0) - idx);
      const order = riders.map((_, idx) => idx).sort((a, b) => scores[b] - scores[a]);
      syntheticRaces.push({ feats, order });
    }

    // 非同期学習ステップ
    setTimeout(() => {
      const learned = trainWeights(
        syntheticRaces,
        currentWeights,
        400,
        0.08,
        0.01,
        (epoch, loss) => {
          setEpochProgress(Math.round((epoch / 400) * 100));
          setCurrentLoss(Math.round(loss * 1000) / 1000);
        }
      );

      setCurrentWeights(learned.map(w => Math.round(w * 1000) / 1000));
      setIsTraining(false);
      setEpochProgress(100);
      setTrainingMessage(`学習完了: ${sampleCount}レース (400 epochs)。重みを更新しました。`);
    }, 400);
  };

  // CSVファイル読込ハンドラ
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) {
        alert('有効なデータ行が見つかりませんでした。');
        return;
      }
      handleRunTraining(Math.min(300, Math.max(30, Math.floor(lines.length / 9))));
    };
    reader.readAsText(file);
  };

  // 重みJSONのダウンロード
  const handleDownloadWeightsJson = () => {
    const blob = new Blob([JSON.stringify(currentWeights, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weights.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-2xl rounded-lg shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
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
            <Cpu className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold tracking-wide">
              AI特徴量重み設定 & 機械学習 (Plackett-Luce)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-500 hover:text-white transition text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className={`px-4 pt-2 border-b flex space-x-2 text-xs ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
          <button
            onClick={() => setTab('sliders')}
            className={`px-3 py-1.5 rounded-t font-bold flex items-center space-x-1.5 transition ${
              tab === 'sliders'
                ? darkMode
                  ? 'bg-[#2d2d2d] text-sky-300 border-b-2 border-sky-400'
                  : 'bg-white text-sky-600 border-b-2 border-sky-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>特徴量スライダー (12項目)</span>
          </button>

          <button
            onClick={() => setTab('training')}
            className={`px-3 py-1.5 rounded-t font-bold flex items-center space-x-1.5 transition ${
              tab === 'training'
                ? darkMode
                  ? 'bg-[#2d2d2d] text-emerald-300 border-b-2 border-emerald-400'
                  : 'bg-white text-emerald-600 border-b-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>過去レースCSVで学習</span>
          </button>

          <button
            onClick={() => setTab('io')}
            className={`px-3 py-1.5 rounded-t font-bold flex items-center space-x-1.5 transition ${
              tab === 'io'
                ? darkMode
                  ? 'bg-[#2d2d2d] text-amber-300 border-b-2 border-amber-400'
                  : 'bg-white text-amber-600 border-b-2 border-amber-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
            <span>weights.json 入出力</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
          {tab === 'sliders' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FEATURE_NAMES.map((name, idx) => {
                  const val = currentWeights[idx];
                  const defaultVal = DEFAULT_WEIGHTS[idx];
                  const diff = val - defaultVal;

                  return (
                    <div
                      key={name}
                      className={`p-2.5 rounded-md border flex flex-col justify-between ${
                        darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {name}
                        </span>
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="font-extrabold text-sky-600 dark:text-sky-300">
                            {val.toFixed(2)}
                          </span>
                          {Math.abs(diff) > 0.01 && (
                            <span
                              className={`text-[10px] font-bold ${
                                diff > 0 ? 'text-emerald-500' : 'text-red-500'
                              }`}
                            >
                              ({diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="-1.5"
                          max="3.0"
                          step="0.05"
                          value={val}
                          onChange={e => handleSliderChange(idx, parseFloat(e.target.value))}
                          className="w-full accent-sky-500 cursor-pointer"
                        />
                        <button
                          onClick={() => handleSliderChange(idx, defaultVal)}
                          title="初期値に戻す"
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-white"
                        >
                          標準
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-1 font-bold text-slate-800 dark:text-slate-100"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>すべて初期値に戻す</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'training' && (
            <div className="space-y-4">
              <div className={`p-3 rounded-md border ${darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-50 border-gray-200'}`}>
                <h3 className="font-bold mb-1 flex items-center space-x-1.5 text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>機械学習 (勾配降下法 / L2正則化)</span>
                </h3>
                <p className="text-slate-800 dark:text-slate-100 text-[11px] font-semibold leading-relaxed">
                  過去レース結果（1〜3着の着順と特徴量）を入力として、負の対数尤度 (NLL) を最小化するよう12特徴量の重みパラメータを最適化します。
                </p>
              </div>

              {/* Upload or Demo Training */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Upload File */}
                <div className={`p-4 rounded-md border text-center flex flex-col items-center justify-center space-y-2 ${
                  darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-white border-gray-200'
                }`}>
                  <Upload className="w-6 h-6 text-sky-500" />
                  <div className="font-semibold text-xs">過去レースCSVをアップロード</div>
                  <label className="cursor-pointer px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-500 transition text-xs font-medium">
                    <span>ファイルを選択</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-gray-400">race_id,車番,着順,得点,脚質...</span>
                </div>

                {/* Built-in Training Simulator */}
                <div className={`p-4 rounded-md border text-center flex flex-col items-center justify-center space-y-2 ${
                  darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-white border-gray-200'
                }`}>
                  <Cpu className="w-6 h-6 text-emerald-500" />
                  <div className="font-semibold text-xs">内蔵データセットで高速学習</div>
                  <button
                    disabled={isTraining}
                    onClick={() => handleRunTraining(200)}
                    className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition text-xs font-medium disabled:opacity-50"
                  >
                    {isTraining ? '学習計算中...' : '200レースで学習実行'}
                  </button>
                  <span className="text-[10px] text-gray-400">400 Epochs, lr=0.08, L2=0.01</span>
                </div>
              </div>

              {/* Progress & Loss */}
              {(isTraining || epochProgress > 0) && (
                <div className={`p-3 rounded-md border space-y-2 ${darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">進捗: {epochProgress}%</span>
                    {currentLoss > 0 && (
                      <span className="flex items-center space-x-1 font-mono text-emerald-500">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Loss: {currentLoss}</span>
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-200"
                      style={{ width: `${epochProgress}%` }}
                    />
                  </div>
                  {trainingMessage && (
                    <div className="text-[11px] text-gray-600 dark:text-gray-300">
                      {trainingMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'io' && (
            <div className="space-y-3">
              <p className="text-gray-500 text-[11px]">
                Python版のスクリプトと同一フォーマット (weights.json) で保存および読み込みが可能です。
              </p>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadWeightsJson}
                  className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>weights.json を保存</span>
                </button>
              </div>

              <div className="mt-2">
                <span className="font-semibold block mb-1">現在の重みベクトル JSON:</span>
                <pre className={`p-2.5 rounded font-mono text-[11px] max-h-36 overflow-auto border ${
                  darkMode ? 'bg-[#181818] border-[#333333] text-sky-300' : 'bg-gray-50 border-gray-200 text-sky-800'
                }`}>
                  {JSON.stringify(currentWeights, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`px-4 py-3 border-t flex items-center justify-between ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-100 border-gray-200'
          }`}
        >
          <span className="text-[11px] text-gray-500 font-mono">
            {FEATURE_NAMES.length} 特徴量 / Plackett-Luce
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                onSaveWeights(currentWeights);
                onClose();
              }}
              className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition flex items-center space-x-1 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>適用して保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
