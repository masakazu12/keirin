import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Cpu, 
  RotateCcw, 
  HelpCircle, 
  LayoutGrid, 
  Sparkles, 
  Download, 
  Copy, 
  ChevronDown,
  Coins
} from 'lucide-react';

interface WindowsMenuBarProps {
  darkMode: boolean;
  onLoadPreset: (presetId: string) => void;
  onClear: () => void;
  onOpenTrainer: () => void;
  onResetWeights: () => void;
  onExportCsvTemplate: () => void;
  onCopyResult: () => void;
  onOpenWindowsExport: () => void;
  onOpenBatch: () => void;
  onOpenAbout: () => void;
  onToggleBankVisualizer: () => void;
  isBankVisualizerOpen: boolean;
  onOpenLedger?: () => void;
}

export const WindowsMenuBar: React.FC<WindowsMenuBarProps> = ({
  darkMode,
  onLoadPreset,
  onClear,
  onOpenTrainer,
  onResetWeights,
  onExportCsvTemplate,
  onCopyResult,
  onOpenWindowsExport,
  onOpenBatch,
  onOpenAbout,
  onToggleBankVisualizer,
  isBankVisualizerOpen,
  onOpenLedger,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (name: string) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  const menuButtonClass = (name: string) => `
    px-3 py-1 rounded text-xs transition cursor-pointer select-none flex items-center space-x-1
    ${openMenu === name 
      ? (darkMode ? 'bg-[#333333] text-white' : 'bg-[#e5e5e5] text-black')
      : (darkMode ? 'hover:bg-[#2a2a2a] text-gray-300' : 'hover:bg-[#f0f0f0] text-gray-700')
    }
  `;

  const dropdownClass = `
    absolute top-full left-0 mt-0.5 py-1 min-w-[220px] rounded-md shadow-xl border z-50 text-xs backdrop-blur-md
    ${darkMode 
      ? 'bg-[#252526]/95 border-[#3e3e42] text-gray-200 shadow-black/60' 
      : 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-400/40'
    }
  `;

  const itemClass = `
    w-full px-3 py-1.5 flex items-center justify-between text-left transition hover:bg-sky-500 hover:text-white
  `;

  return (
    <div 
      ref={menuRef}
      className={`h-7 px-2 border-b flex items-center space-x-0.5 text-xs select-none ${
        darkMode ? 'bg-[#252526] border-[#333333]' : 'bg-[#f8f8f8] border-gray-200'
      }`}
    >
      {/* File / Training Menu */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('file')} 
          className={menuButtonClass('file')}
        >
          <span>ファイル / 学習 (F)</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {openMenu === 'file' && (
          <div className={dropdownClass}>
            <div className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200">
              レースプリセット
            </div>
            <button 
              onClick={() => { onLoadPreset('derby'); setOpenMenu(null); }}
              className={itemClass}
            >
              <span>G1 日本選手権 (平塚 11R)</span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-300">ダービー</span>
            </button>
            <button 
              onClick={() => { onLoadPreset('gp'); setOpenMenu(null); }}
              className={itemClass}
            >
              <span>KEIRINグランプリ GP (立川)</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">最高峰</span>
            </button>
            <button 
              onClick={() => { onLoadPreset('python-sample'); setOpenMenu(null); }}
              className={itemClass}
            >
              <span>サンプルレース (松阪 1R)</span>
              <span className="text-[10px] font-bold opacity-80">初期設定</span>
            </button>

            <div className={`my-1 border-t ${darkMode ? 'border-[#3e3e42]' : 'border-gray-100'}`} />

            <div className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200">
              機械学習 & 重み
            </div>
            <button 
              onClick={() => { onExportCsvTemplate(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-green-500" />
                <span>学習用CSVテンプレート保存</span>
              </span>
              <span className="text-[10px] opacity-70">.csv</span>
            </button>
            <button 
              onClick={() => { onOpenTrainer(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
                <span>過去レースCSVでAIを学習 / 重み調整</span>
              </span>
              <span className="text-[10px] opacity-70">Ctrl+T</span>
            </button>
            <button 
              onClick={() => { onResetWeights(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>重みを初期値に戻す</span>
              </span>
            </button>

            <div className={`my-1 border-t ${darkMode ? 'border-[#3e3e42]' : 'border-gray-100'}`} />

            <button 
              onClick={() => { onOpenWindowsExport(); setOpenMenu(null); }}
              className={`${itemClass} text-sky-600 dark:text-sky-400 font-medium`}
            >
              <span className="flex items-center space-x-2">
                <Download className="w-3.5 h-3.5" />
                <span>Windowsアプリ (.exe / .py / .bat) 保存</span>
              </span>
              <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.2 rounded font-sans">推奨</span>
            </button>
            <button 
              onClick={() => { onClear(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span>出走表をクリア</span>
              <span className="text-[10px] opacity-70">空欄化</span>
            </button>
          </div>
        )}
      </div>

      {/* Race Operations */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('race')} 
          className={menuButtonClass('race')}
        >
          <span>レース操作 (R)</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {openMenu === 'race' && (
          <div className={dropdownClass}>
            <button 
              onClick={() => { onOpenBatch(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                <span>全12R一括予想ダイアログ</span>
              </span>
              <span className="text-[10px] bg-indigo-500 text-white px-1 rounded">1R〜12R</span>
            </button>
            <button 
              onClick={() => { onToggleBankVisualizer(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>バンク展開図の表示切替</span>
              </span>
              <span className="text-[10px] opacity-70">{isBankVisualizerOpen ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('tools')} 
          className={menuButtonClass('tools')}
        >
          <span>ツール (T)</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {openMenu === 'tools' && (
          <div className={dropdownClass}>
            {onOpenLedger && (
              <button 
                onClick={() => { onOpenLedger(); setOpenMenu(null); }}
                className={itemClass}
              >
                <span className="flex items-center space-x-2">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>収支管理台帳・回収率分析</span>
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-900 px-1 rounded font-bold">収支</span>
              </button>
            )}
            <button 
              onClick={() => { onCopyResult(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>予想結果レポートをクリップボードにコピー</span>
              </span>
              <span className="text-[10px] opacity-70">Ctrl+C</span>
            </button>
            <button 
              onClick={() => { onOpenTrainer(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span>特徴量ウェイトスライダー</span>
              <span className="text-[10px] opacity-70">12項目</span>
            </button>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="relative">
        <button 
          onClick={() => toggleMenu('help')} 
          className={menuButtonClass('help')}
        >
          <span>ヘルプ (H)</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {openMenu === 'help' && (
          <div className={dropdownClass}>
            <button 
              onClick={() => { onOpenAbout(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span className="flex items-center space-x-2">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>このアプリについて (AI競輪予想 v2)</span>
              </span>
            </button>
            <button 
              onClick={() => { onOpenWindowsExport(); setOpenMenu(null); }}
              className={itemClass}
            >
              <span>Windowsでのexe化手順 (PyInstaller)</span>
              <span className="text-[10px] opacity-70">解説</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
