import React, { useState } from 'react';
import { Volume2, Lock, Unlock, Cpu, Radio, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { CaseStatus, BuzzerPattern, BluetoothState } from '../types';

interface CaseSimulatorProps {
  caseStatus: CaseStatus;
  failedAttempts: number;
  maxAttempts: number;
  lockoutRemainingSec: number;
  lastBuzzerPattern: BuzzerPattern;
  bluetoothState: BluetoothState;
  onTriggerBuzzerTest: (pattern: BuzzerPattern) => void;
  onManualRelock: () => void;
}

export const CaseSimulator: React.FC<CaseSimulatorProps> = ({
  caseStatus,
  failedAttempts,
  maxAttempts,
  lockoutRemainingSec,
  lastBuzzerPattern,
  bluetoothState,
  onTriggerBuzzerTest,
  onManualRelock,
}) => {
  const [isLidOpen, setIsLidOpen] = useState(false);

  // If case locks or locks out, force lid closed
  const actualLidOpen = caseStatus === 'UNLOCKED' ? isLidOpen : false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Physical Hardware Simulator</span>
            <span aria-hidden="true">·</span>
            <span>Arduino + HC-05 + Solenoid + Buzzer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Smart Case Hardware Twin
          </h2>
        </div>

        {/* Live Status Indicator */}
        <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs">
          <span className="text-slate-400">Lock State:</span>
          {caseStatus === 'UNLOCKED' ? (
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-md font-mono font-medium">
              SOLENOID RETRACTED (OPEN)
            </span>
          ) : caseStatus === 'LOCKOUT' ? (
            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-md font-mono font-medium animate-pulse">
              10-MIN LOCKDOWN ACTIVE
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-md font-mono font-medium">
              SOLENOID EXTENDED (SECURED)
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive Case Model + Hardware Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive 3D Case Enclosure */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          {/* Case Outer Chassis */}
          <div className="relative mx-auto max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl">
            {/* Top Latch & Solenoid Pin Assembly */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    caseStatus === 'UNLOCKED'
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : caseStatus === 'LOCKOUT'
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-mono font-semibold text-slate-300">
                  SOLENOID LOCK PIN 7
                </span>
              </div>

              {/* Physical Bolt Retraction Visual */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {caseStatus === 'UNLOCKED' ? 'RETRACTED' : 'BOLTED'}
                </span>
                <div className="w-16 h-5 bg-slate-950 rounded-full p-0.5 border border-slate-700 flex items-center">
                  <div
                    className={`h-4 w-7 rounded-full transition-all duration-300 font-mono text-[9px] flex items-center justify-center font-bold ${
                      caseStatus === 'UNLOCKED'
                        ? 'translate-x-0 bg-emerald-500 text-slate-950'
                        : 'translate-x-8 bg-slate-600 text-white'
                    }`}
                  >
                    {caseStatus === 'UNLOCKED' ? 'FREE' : 'LOCK'}
                  </div>
                </div>
              </div>
            </div>

            {/* Case Body & Lid Container */}
            <div
              className={`relative h-64 sm:h-72 rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col justify-between p-5 ${
                caseStatus === 'LOCKOUT'
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : caseStatus === 'UNLOCKED'
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800 bg-slate-950/80'
              }`}
            >
              {/* Internal Circuit Board View */}
              <div className="grid grid-cols-2 gap-4">
                {/* Microcontroller & HC-05 */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> ARDUINO
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">UNO / NANO</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400">Pins:</span>
                    <span className="font-mono text-emerald-400">8 (Buzzer)</span>
                    <span className="font-mono text-cyan-400">7 (Lock)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>TX/RX UART</span>
                    <span className="text-emerald-400 font-mono">Pins 10, 11</span>
                  </div>
                </div>

                {/* HC-05 Bluetooth Module */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                      <Radio className="w-3 h-3" /> HC-05 BT
                    </span>
                    {/* Blinking HC-05 LED */}
                    <div
                      className={`w-2 h-2 rounded-full ${
                        bluetoothState === 'CONNECTED'
                          ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa]'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {bluetoothState === 'CONNECTED' ? 'PAIRED (00:18:E4)' : 'BEACON DISCOVERABLE'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Baud: <span className="text-white font-mono">9600 bps</span>
                  </div>
                </div>
              </div>

              {/* Middle: Piezo Buzzer with Sound Waves */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="relative flex flex-col items-center">
                  {/* Expanding Sound Wave Rings when buzzer beeps */}
                  {lastBuzzerPattern !== 'NONE' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full border border-emerald-400/50 animate-ping" />
                      <div className="w-28 h-28 rounded-full border border-cyan-400/30 animate-pulse" />
                    </div>
                  )}

                  {/* Physical Piezo Buzzer Component Icon */}
                  <div
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                      lastBuzzerPattern === 'SUCCESS_1_LONG'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 scale-110'
                        : lastBuzzerPattern === 'FAIL_3_SHORT'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-400 scale-105'
                        : lastBuzzerPattern === 'LOCKOUT_4_BEEPS'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-400 scale-110'
                        : 'border-slate-700 bg-slate-900 text-slate-500'
                    }`}
                  >
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <span className="mt-1 text-[10px] font-mono text-slate-400">
                    PIEZO BUZZER (PIN 8)
                  </span>
                </div>
              </div>

              {/* Bottom: Vault Compartment Status */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="text-xs">
                  {caseStatus === 'UNLOCKED' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" /> Access Granted · Case Unsealed
                    </span>
                  ) : caseStatus === 'LOCKOUT' ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Case Heavily Locked · 10 Min Penalty
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Case Sealed & Armed
                    </span>
                  )}
                </div>

                {caseStatus === 'UNLOCKED' && (
                  <button
                    onClick={() => setIsLidOpen(!isLidOpen)}
                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/30 transition-colors"
                  >
                    {isLidOpen ? 'Close Lid' : 'Open Lid'}
                  </button>
                )}
              </div>
            </div>

            {/* Lid Open Secret Compartment */}
            {actualLidOpen && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Vault Interior Accessible
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">VALUABLES SECURED</span>
                </div>
                <p className="text-xs text-slate-300">
                  Case lid is unlatched. When the 5-second unlock timer expires, the Arduino solenoid will automatically re-engage the bolt.
                </p>
                <button
                  onClick={onManualRelock}
                  className="mt-3 w-full py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Click to Manually Re-lock Solenoid
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Audio Synthesizer Manual Test Bench */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Buzzer Audio Test Bench
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Listen to the exact buzzer sound synthesized according to your Arduino case specifications:
            </p>

            <div className="mt-4 space-y-3">
              {/* Pattern 1 Test */}
              <button
                onClick={() => onTriggerBuzzerTest('SUCCESS_1_LONG')}
                className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-emerald-500/30 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">1 Long Beep (1200ms)</span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400">TEST AUDIO</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Triggered when right fingerprint is verified on phone.
                </p>
              </button>

              {/* Pattern 2 Test */}
              <button
                onClick={() => onTriggerBuzzerTest('FAIL_3_SHORT')}
                className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-amber-500/30 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">3 Short Beeps (200ms x 3)</span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400">TEST AUDIO</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Triggered on failed attempt 1 and 2.
                </p>
              </button>

              {/* Pattern 3 Test */}
              <button
                onClick={() => onTriggerBuzzerTest('LOCKOUT_4_BEEPS')}
                className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-rose-500/30 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-400">4 Urgent Beeps (300ms x 4)</span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-rose-400">TEST AUDIO</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Triggered on 3rd failed attempt + starts 10-minute lockout.
                </p>
              </button>
            </div>
          </div>

          {/* Arduino Hardware Pinout Quick Sheet */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Arduino Pin Map
            </h3>
            <div className="mt-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Digital Pin 8</span>
                <span className="text-emerald-400">Buzzer (+)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Digital Pin 7</span>
                <span className="text-cyan-400">Solenoid Relay IN</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Digital Pin 10</span>
                <span className="text-blue-400">HC-05 TX (SoftSerial RX)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Digital Pin 11</span>
                <span className="text-purple-400">HC-05 RX (SoftSerial TX)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Baud Rate</span>
                <span className="text-amber-400">9600 8-N-1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
