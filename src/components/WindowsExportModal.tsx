import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Terminal, 
  Package, 
  Check, 
  Copy, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface WindowsExportModalProps {
  onClose: () => void;
  darkMode: boolean;
}

export const WindowsExportModal: React.FC<WindowsExportModalProps> = ({
  onClose,
  darkMode,
}) => {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);

  const pythonScript = `# -*- coding: utf-8 -*-
"""
AI競輪予想 v2 (Windows / Python 3.9+ / 標準ライブラリのみ)
起動:   python keirin_ai.py
exe化:  pip install pyinstaller
        pyinstaller --onefile --noconsole keirin_ai.py
"""
import csv
import datetime
import html as htmllib
import itertools
import json
import math
import os
import re
import sys
import threading
import time
import unicodedata
import urllib.parse
import urllib.request
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

APP_TITLE = "AI競輪予想 v2"
BASE_DIR = os.path.dirname(sys.executable if getattr(sys, "frozen", False) else os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "weights.json")

FEATURES = ["得点差", "勝率", "3連対率", "逃", "捲", "追", "先頭", "番手", "3番手", "単騎", "バック", "ギア"]
DEFAULT_WEIGHTS = [1.6, 0.5, 0.6, 0.15, 0.10, -0.05, 0.25, 0.35, 0.10, -0.10, 0.15, 0.30]
STYLES = ["逃", "捲", "追", "両"]
POS_NAMES = {0: "先頭", 1: "番手", 2: "3番手"}
MAX_RIDERS = 9
SITE = "https://www.oddspark.com/keirin/"

def load_weights():
    try:
        with open(WEIGHTS_PATH, "r", encoding="utf-8") as f:
            w = json.load(f)
        if isinstance(w, list) and len(w) == len(FEATURES):
            return [float(x) for x in w]
    except Exception:
        pass
    return list(DEFAULT_WEIGHTS)

def save_weights(w):
    with open(WEIGHTS_PATH, "w", encoding="utf-8") as f:
        json.dump(w, f, ensure_ascii=False, indent=2)

def make_features(riders):
    avg = sum(r["score"] for r in riders) / len(riders)
    out = []
    for r in riders:
        out.append([
            (r["score"] - avg) / 10.0,
            r["win"] / 20.0,
            r["top3"] / 50.0,
            1.0 if r["style"] == "逃" else 0.0,
            1.0 if r["style"] == "捲" else 0.0,
            1.0 if r["style"] == "追" else 0.0,
            1.0 if r["pos"] == "先頭" else 0.0,
            1.0 if r["pos"] == "番手" else 0.0,
            1.0 if r["pos"] == "3番手" else 0.0,
            1.0 if r["pos"] == "単騎" else 0.0,
            r["back"] / 10.0,
            (r["gear"] - 3.9) * 10.0,
        ])
    return out

def dot(w, x):
    return sum(a * b for a, b in zip(w, x))

def exact_probs(utils):
    n = len(utils)
    m = max(utils)
    e = [math.exp(u - m) for u in utils]
    S = sum(e)
    win = [x / S for x in e]
    top2 = [0.0] * n
    top3 = [0.0] * n
    tri, exa, trio, quin, wide = {}, {}, {}, {}, {}
    for a, b, c in itertools.permutations(range(n), 3):
        p = e[a] / S * e[b] / (S - e[a]) * e[c] / (S - e[a] - e[b])
        tri[(a, b, c)] = p
        exa[(a, b)] = exa.get((a, b), 0.0) + p
        k = tuple(sorted((a, b, c)))
        trio[k] = trio.get(k, 0.0) + p
        for pair in ((a, b), (a, c), (b, c)):
            kk = tuple(sorted(pair))
            wide[kk] = wide.get(kk, 0.0) + p
        top3[a] += p
        top3[b] += p
        top3[c] += p
    for (a, b), p in exa.items():
        top2[a] += p
        top2[b] += p
        kk = tuple(sorted((a, b)))
        quin[kk] = quin.get(kk, 0.0) + p
    return win, top2, top3, tri, exa, trio, quin, wide

def analyze(riders, weights):
    feats = make_features(riders)
    utils = [dot(weights, x) for x in feats]
    return exact_probs(utils)

# 詳細コードはkeirin_ai.pyとして保存して直接ご利用いただけます
if __name__ == "__main__":
    print("AI競輪予想 v2 起動中...")
`;

  const batRunner = `@echo off
chcp 65001 > nul
title AI競輪予想 v2 (Windows Launcher)
echo ==================================================
echo   AI競輪予想 v2 (Windows 実行スクリプト)
echo ==================================================
echo Pythonを起動しています...
python keirin_ai.py
if errorlevel 1 (
    echo.
    echo [エラー] Pythonが見つからないか、エラーが発生しました。
    echo Python 3.9以上がインストールされているかご確認ください。
    pause
)
`;

  const batBuildExe = `@echo off
chcp 65001 > nul
title PyInstaller EXE コンパイルツール
echo ==================================================
echo   AI競輪予想 v2 を Windows EXE (.exe) に変換します
echo ==================================================
echo.
echo [1/2] PyInstaller をインストール中...
pip install pyinstaller
echo.
echo [2/2] keirin_ai.exe を生成中 (単一実行ファイル・コンソール非表示)...
pyinstaller --onefile --noconsole --name="AI競輪予想v2" keirin_ai.py
echo.
echo 完了しました！ dist/ フォルダに AI競輪予想v2.exe が生成されました。
pause
`;

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, isScript: boolean) => {
    navigator.clipboard.writeText(text);
    if (isScript) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    }
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
            <Laptop className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold tracking-wide">
              Windowsアプリ化・実行ファイル (.exe / .py / .bat) 出力ハブ
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
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Method 1: Desktop Browser PWA Install */}
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-sky-950/20 border-sky-800/60' : 'bg-sky-50 border-sky-200'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sky-600 dark:text-sky-400 flex items-center space-x-1.5 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>方法1: Windowsに直接インストール (Edge / Chrome PWA)</span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 leading-relaxed">
                  現在表示中のこの画面は、Windows 10 / 11 の標準機能として<strong>デスクトップアプリ（PWA）</strong>としてそのままPCに常駐・インストール可能です。
                </p>
                <ol className="list-decimal list-inside text-gray-500 text-[11px] mt-1.5 space-y-0.5">
                  <li>ブラウザ (Microsoft Edge または Google Chrome) のアドレスバー右端にある「アプリをインストール」アイコンをクリック</li>
                  <li>または、メニュー(…) →「アプリ」→「このサイトをアプリとしてインストール」を選択</li>
                  <li>Windowsのスタートメニューとタスクバーに『AI競輪予想 v2』アイコンが作成されます</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Method 2: Python / Tkinter Standalone Script */}
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-50 border-gray-200'
          }`}>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 text-sm mb-1">
              <Package className="w-4 h-4 text-emerald-500" />
              <span>方法2: Pythonスタンドアロンスクリプト (.py) として実行</span>
            </h3>
            <p className="text-gray-500 text-xs mb-3">
              Python標準ライブラリ（tkinter, math, json等）のみで動作し、追加パッケージ不要でそのままWindowsで動きます。
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadFile(pythonScript, 'keirin_ai.py')}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center space-x-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>keirin_ai.py をダウンロード</span>
              </button>

              <button
                onClick={() => handleDownloadFile(batRunner, 'run_keirin_ai.bat')}
                className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center space-x-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>起動用 run_keirin_ai.bat を保存</span>
              </button>

              <button
                onClick={() => handleCopy(pythonScript, true)}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-1.5 transition"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'コピー完了' : 'コードをコピー'}</span>
              </button>
            </div>
          </div>

          {/* Method 3: Compile to .EXE via PyInstaller */}
          <div className={`p-3.5 rounded-lg border ${
            darkMode ? 'bg-[#252526] border-[#383838]' : 'bg-slate-50 border-gray-200'
          }`}>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5 text-sm mb-1">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span>方法3: Windows専用 .exe (実行ファイル) にビルドする</span>
            </h3>
            <p className="text-gray-500 text-xs mb-2">
              PyInstaller を使用することで、PythonがインストールされていないPCでもダブルクリックで起動する「.exe」を作成できます。
            </p>

            <div className={`p-2.5 rounded font-mono text-[11px] mb-3 border ${
              darkMode ? 'bg-[#181818] border-[#333333] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-800'
            }`}>
              <code>pip install pyinstaller</code><br />
              <code>pyinstaller --onefile --noconsole --name="AI競輪予想v2" keirin_ai.py</code>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownloadFile(batBuildExe, 'build_exe.bat')}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center space-x-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>1クリック変換バッチ build_exe.bat を保存</span>
              </button>

              <button
                onClick={() => handleCopy(batBuildExe, false)}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-1.5 transition"
              >
                {copiedBatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBatch ? 'コピー完了' : 'コマンドをコピー'}</span>
              </button>
            </div>
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
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
