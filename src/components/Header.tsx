import React from 'react';
import { Bluetooth, BluetoothConnected, Shield, ShieldAlert, Cpu } from 'lucide-react';
import { BluetoothState, CaseStatus } from '../types';

interface HeaderProps {
  activeTab: 'scanner' | 'simulator' | 'terminal' | 'arduino' | 'log';
  setActiveTab: (tab: 'scanner' | 'simulator' | 'terminal' | 'arduino' | 'log') => void;
  bluetoothState: BluetoothState;
  deviceName: string;
  isSimulated: boolean;
  caseStatus: CaseStatus;
  lockoutRemainingSec: number;
  onOpenBluetoothModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  bluetoothState,
  deviceName,
  isSimulated,
  caseStatus,
  lockoutRemainingSec,
  onOpenBluetoothModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white font-mono">
              ARDUINO<span className="text-emerald-400">.CASE</span>
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'scanner'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Mobile Scanner
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Hardware Case
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'terminal'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              HC-05 Terminal
            </button>
            <button
              onClick={() => setActiveTab('arduino')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'arduino'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Arduino Code & Wiring
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'log'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Security Log
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action (Bluetooth State Button) */}
          <div className="flex items-center gap-3 shrink-0">
            {caseStatus === 'LOCKOUT' && (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-semibold px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md">
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  LOCKED {Math.floor(lockoutRemainingSec / 60)}:
                  {(lockoutRemainingSec % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            <button
              onClick={onOpenBluetoothModal}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                bluetoothState === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : bluetoothState === 'CONNECTING' || bluetoothState === 'SCANNING'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {bluetoothState === 'CONNECTED' ? (
                <>
                  <BluetoothConnected className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSimulated ? 'Simulated HC-05' : deviceName}</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-3.5 h-3.5 text-slate-400" />
                  <span>Connect HC-05</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar for small screens */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-800/80 gap-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'scanner' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Scanner
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Case
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'terminal' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            HC-05 BT
          </button>
          <button
            onClick={() => setActiveTab('arduino')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'arduino' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Arduino .ino
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'log' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>
    </header>
  );
};
