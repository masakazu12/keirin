import React from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Download, 
  Sun, 
  Moon, 
  Maximize2, 
  Minimize2,
  Sparkles
} from 'lucide-react';

interface WindowsTitleBarProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenWindowsExport: () => void;
  onMinimize: () => void;
  onReset: () => void;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  darkMode,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  onOpenWindowsExport,
  onMinimize,
  onReset,
}) => {
  return (
    <div
      className={`h-10 select-none flex items-center justify-between px-3 border-b text-xs font-sans transition-colors ${
        darkMode
          ? 'bg-[#1f1f1f] text-gray-200 border-[#2e2e2e]'
          : 'bg-[#f3f3f3] text-gray-800 border-[#e5e5e5]'
      }`}
    >
      {/* Left: Windows App Icon & Title */}
      <div className="flex items-center space-x-2.5 overflow-hidden">
        {/* Windows 11 style 4-pane icon with Keirin accent */}
        <div className="w-4 h-4 grid grid-cols-2 gap-0.5 shrink-0">
          <div className="bg-sky-500 rounded-[1px]" />
          <div className="bg-sky-500 rounded-[1px]" />
          <div className="bg-sky-500 rounded-[1px]" />
          <div className="bg-sky-500 rounded-[1px]" />
        </div>
        <div className="flex items-center space-x-2 truncate">
          <span className="font-semibold tracking-wide text-sm truncate">
            AI競輪予想 v2 (Windows Edition)
          </span>
          <span
            className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
              darkMode ? 'bg-sky-950/70 text-sky-300 border border-sky-800' : 'bg-sky-100 text-sky-800 border border-sky-200'
            }`}
          >
            Plackett-Luce 厳密計算
          </span>
        </div>
      </div>

      {/* Middle/Right Quick Actions */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={onOpenWindowsExport}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition shadow-xs ${
            darkMode
              ? 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white'
              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white'
          }`}
          title="Windows用 .exe / .py / .bat ファイルのダウンロード・作成手順"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Windowsアプリ出力 (.exe/.py)</span>
          <span className="md:hidden">Win出力</span>
          <Sparkles className="w-3 h-3 text-yellow-300 ml-0.5 animate-pulse" />
        </button>

        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded transition ${
            darkMode ? 'hover:bg-[#2f2f2f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title={darkMode ? 'ライトモードに切替' : 'ダークモードに切替'}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onToggleFullscreen}
          className={`p-1.5 rounded transition hidden sm:inline-flex ${
            darkMode ? 'hover:bg-[#2f2f2f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'
          }`}
          title={isFullscreen ? '通常表示' : '全画面表示'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Windows Window Controls */}
        <div className="flex items-center ml-1 border-l pl-1 border-gray-300 dark:border-gray-700">
          <button
            onClick={onMinimize}
            className={`w-8 h-7 flex items-center justify-center transition ${
              darkMode ? 'hover:bg-[#2d2d2d] text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="最小化"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className={`w-8 h-7 flex items-center justify-center transition ${
              darkMode ? 'hover:bg-[#2d2d2d] text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="最大化 / 元のサイズ"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={onReset}
            className="w-8 h-7 flex items-center justify-center transition hover:bg-red-600 hover:text-white text-gray-400"
            title="出走表のリセット"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
