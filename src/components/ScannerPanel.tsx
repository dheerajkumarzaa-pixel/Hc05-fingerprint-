import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, Unlock, AlertTriangle, ShieldCheck, KeyRound, Smartphone, Volume2, Sparkles } from 'lucide-react';
import { CaseStatus, BuzzerPattern } from '../types';

interface ScannerPanelProps {
  caseStatus: CaseStatus;
  failedAttempts: number;
  maxAttempts: number;
  lockoutRemainingSec: number;
  lastBuzzerPattern: BuzzerPattern;
  onScanFingerprint: (isAuthorized: boolean) => void;
  onNativeBiometricScan: () => void;
  onEmergencyPinOverride: (pin: string) => boolean;
  hasPlatformBiometric: boolean;
  biometricMessage: string;
}

export const ScannerPanel: React.FC<ScannerPanelProps> = ({
  caseStatus,
  failedAttempts,
  maxAttempts,
  lockoutRemainingSec,
  lastBuzzerPattern,
  onScanFingerprint,
  onNativeBiometricScan,
  onEmergencyPinOverride,
  hasPlatformBiometric,
  biometricMessage,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'IDLE' | 'SUCCESS' | 'FAIL'>('IDLE');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Reset scan visual state after 2.5s
  useEffect(() => {
    if (scanResult !== 'IDLE') {
      const timer = setTimeout(() => {
        setScanResult('IDLE');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  const handleFingerprintPress = (authorized: boolean) => {
    if (caseStatus === 'LOCKOUT') return;
    setIsScanning(true);
    setScanResult('IDLE');

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(authorized ? 'SUCCESS' : 'FAIL');
      onScanFingerprint(authorized);
    }, 700);
  };

  const handleNativeScanClick = () => {
    if (caseStatus === 'LOCKOUT') return;
    setIsScanning(true);
    onNativeBiometricScan();
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onEmergencyPinOverride(pinInput);
    if (ok) {
      setPinInput('');
      setPinError(false);
      setShowPinModal(false);
    } else {
      setPinError(true);
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Status Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span>Arduino HC-05 Security Vault</span>
          <span aria-hidden="true">·</span>
          <span>Mobile Phone Biometric Client</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Mobile Fingerprint Scanner
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          Scan your fingerprint on this phone to transmit an encrypted unlock token over HC-05 Bluetooth to the Arduino case.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Biometric Scanner Pad */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            className={`w-full relative rounded-3xl p-8 border transition-all duration-300 flex flex-col items-center justify-center text-center ${
              caseStatus === 'LOCKOUT'
                ? 'bg-rose-950/20 border-rose-500/40 shadow-2xl shadow-rose-950/50'
                : caseStatus === 'UNLOCKED'
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-2xl shadow-emerald-950/50'
                : scanResult === 'FAIL'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            {/* Status Header Badge */}
            <div className="mb-6">
              {caseStatus === 'LOCKOUT' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                  Security Lockout Active (10 Min)
                </div>
              ) : caseStatus === 'UNLOCKED' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  Case Unlocked · Solenoid Retracted
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Armed & Secured · Awaiting Fingerprint
                </div>
              )}
            </div>

            {/* Lockout Countdown Timer */}
            {caseStatus === 'LOCKOUT' ? (
              <div className="my-6 text-center animate-in fade-in duration-300">
                <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-rose-400 tabular-nums">
                  {formatLockoutTime(lockoutRemainingSec)}
                </div>
                <div className="text-xs text-rose-300/80 mt-2 font-mono">
                  3 INCORRECT ATTEMPTS EXCEEDED · BUZZER SOUNDED 4 TIMES
                </div>
                <p className="text-xs text-slate-400 mt-4 max-w-sm mx-auto">
                  The Arduino hardware has engaged a 10-minute security lockdown. All Bluetooth unlock commands are rejected.
                </p>

                <button
                  onClick={() => setShowPinModal(true)}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Emergency Master PIN Override
                </button>
              </div>
            ) : (
              /* Biometric Sensor Disc */
              <div className="relative my-4 flex flex-col items-center">
                {/* Glowing Target Ring */}
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleFingerprintPress(true)}
                  className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 ${
                    isScanning
                      ? 'border-cyan-400 bg-cyan-950/30 ring-cyan-500/20 shadow-lg shadow-cyan-500/20'
                      : scanResult === 'SUCCESS' || caseStatus === 'UNLOCKED'
                      ? 'border-emerald-400 bg-emerald-950/40 ring-emerald-500/20 shadow-xl shadow-emerald-500/20'
                      : scanResult === 'FAIL'
                      ? 'border-amber-500 bg-amber-950/40 ring-amber-500/20 shadow-xl shadow-amber-500/20'
                      : 'border-slate-700 bg-slate-950/70 hover:border-slate-500 hover:bg-slate-900/80'
                  }`}
                  aria-label="Touch fingerprint scanner to unlock case"
                >
                  {/* Outer Concentric Sensor Wave */}
                  <div
                    className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 ${
                      isScanning
                        ? 'border-cyan-400/60 animate-spin'
                        : scanResult === 'SUCCESS'
                        ? 'border-emerald-400/40'
                        : 'border-slate-800'
                    }`}
                  />

                  {/* Fingerprint Grooves SVG Icon */}
                  <Fingerprint
                    className={`w-24 h-24 sm:w-28 sm:h-28 transition-colors duration-300 ${
                      isScanning
                        ? 'text-cyan-400'
                        : scanResult === 'SUCCESS' || caseStatus === 'UNLOCKED'
                        ? 'text-emerald-400'
                        : scanResult === 'FAIL'
                        ? 'text-amber-400 animate-pulse'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />

                  {/* Animated Laser Scanning Line */}
                  {isScanning && (
                    <div className="absolute inset-x-6 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />
                  )}
                </button>

                <div className="mt-4 text-xs font-medium text-slate-300">
                  {isScanning ? (
                    <span className="text-cyan-400 font-mono">Reading biometric pattern...</span>
                  ) : scanResult === 'SUCCESS' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Fingerprint Verified! Buzzer: 1 Long Beep
                    </span>
                  ) : scanResult === 'FAIL' ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Not Recognized! Buzzer: 3 Short Beeps
                    </span>
                  ) : (
                    <span className="text-slate-400">Touch pad or use phone biometric sensor</span>
                  )}
                </div>
              </div>
            )}

            {/* Attempt Dots */}
            {caseStatus !== 'LOCKOUT' && (
              <div className="w-full mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Security Attempts</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono border ${
                        num <= failedAttempts
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span>Try {num}</span>
                      {num <= failedAttempts && <span>✕</span>}
                    </div>
                  ))}
                  <span className="text-slate-500 text-[11px] ml-1">
                    ({failedAttempts}/{maxAttempts})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons for Testing & Phone Sensor */}
          <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Real Native Phone Biometrics Button */}
            <button
              onClick={handleNativeScanClick}
              disabled={caseStatus === 'LOCKOUT'}
              className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Prompt Phone Native Fingerprint Sensor (WebAuthn)</span>
            </button>

            {/* Test Simulation Controls */}
            <button
              onClick={() => handleFingerprintPress(true)}
              disabled={caseStatus === 'LOCKOUT' || isScanning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-emerald-400 font-medium text-xs rounded-xl border border-emerald-500/30 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Right Fingerprint (Pass)</span>
            </button>

            <button
              onClick={() => handleFingerprintPress(false)}
              disabled={caseStatus === 'LOCKOUT' || isScanning}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-400 font-medium text-xs rounded-xl border border-amber-500/30 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Wrong Fingerprint (Fail)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Hardware Logic & Live Specs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Exact User Specification Rules Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Arduino Hardware Buzzer Logic
            </h2>
            <div className="mt-4 space-y-4 text-xs">
              {/* Rule 1 */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  lastBuzzerPattern === 'SUCCESS_1_LONG'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="font-semibold text-emerald-400 flex items-center justify-between">
                  <span>1. Right Fingerprint:</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 bg-emerald-500/10 rounded">1200 ms</span>
                </div>
                <p className="mt-1 text-slate-400">
                  Buzzer in case beeps <strong>1 LONG TIME</strong>, solenoid retracts to open the case lid, and attempts counter resets.
                </p>
              </div>

              {/* Rule 2 */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  lastBuzzerPattern === 'FAIL_3_SHORT'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="font-semibold text-amber-400 flex items-center justify-between">
                  <span>2. Wrong Fingerprint:</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 bg-amber-500/10 rounded">3 Beeps</span>
                </div>
                <p className="mt-1 text-slate-400">
                  Buzzer in case beeps <strong>3 TIMES</strong> (short pulses). Strike recorded ({failedAttempts}/3).
                </p>
              </div>

              {/* Rule 3 */}
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  lastBuzzerPattern === 'LOCKOUT_4_BEEPS' || caseStatus === 'LOCKOUT'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="font-semibold text-rose-400 flex items-center justify-between">
                  <span>3. After 3 Attempts:</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 bg-rose-500/10 rounded">4 Beeps + 10 Min</span>
                </div>
                <p className="mt-1 text-slate-400">
                  Buzzer in case beeps <strong>4 TIMES</strong> and case completely locks down for <strong>10 MINUTES</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Device Hardware Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Phone Sensor Environment
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Web Authentication API</span>
                <span className="text-emerald-400 font-mono">Available</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Platform Biometric</span>
                <span className={hasPlatformBiometric ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                  {hasPlatformBiometric ? 'Phone Fingerprint Ready' : 'Simulated / Passkey'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>HC-05 Communication</span>
                <span className="text-cyan-400 font-mono">UART (9600 Baud)</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                {biometricMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency PIN Override Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Emergency Master PIN</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              If locked out, enter the master hardware override PIN (default: <strong className="text-white">1234</strong>) to cancel the 10-minute lockout.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter 4-digit PIN..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-rose-400 text-center font-mono">
                  Incorrect override PIN. Try again.
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 px-3 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 font-semibold rounded-xl transition-colors"
                >
                  Unlock Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
