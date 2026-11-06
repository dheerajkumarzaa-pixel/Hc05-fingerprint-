/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ScannerPanel } from './components/ScannerPanel';
import { CaseSimulator } from './components/CaseSimulator';
import { BluetoothTerminal } from './components/BluetoothTerminal';
import { ArduinoCodeTab } from './components/ArduinoCodeTab';
import { AuditLogTab } from './components/AuditLogTab';
import { BluetoothModal } from './components/BluetoothModal';
import {
  CaseStatus,
  BluetoothState,
  BuzzerPattern,
  SerialLogEntry,
  AttemptLogEntry,
  ArduinoConfig,
} from './types';
import { triggerBuzzer, playSolenoidSound } from './utils/audio';
import { checkBiometricsSupport, authenticateWithNativeBiometrics } from './utils/webauthn';
import { HC05BluetoothManager } from './utils/bluetooth';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'scanner' | 'simulator' | 'terminal' | 'arduino' | 'log'>('scanner');
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);

  // Security Case State
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('LOCKED');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const maxAttempts = 3;
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(600); // 10 minutes default
  const [lastBuzzerPattern, setLastBuzzerPattern] = useState<BuzzerPattern>('NONE');

  // Logs
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>([]);
  const [attemptLogs, setAttemptLogs] = useState<AttemptLogEntry[]>([]);

  // Bluetooth State
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('DISCONNECTED');
  const [deviceName, setDeviceName] = useState('HC-05');
  const [isSimulated, setIsSimulated] = useState(true);

  // Platform Biometrics
  const [hasPlatformBiometric, setHasPlatformBiometric] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState('Checking biometric capabilities...');

  // Arduino Configuration
  const [arduinoConfig, setArduinoConfig] = useState<ArduinoConfig>({
    buzzerPin: 8,
    lockPin: 7,
    rxPin: 10,
    txPin: 11,
    unlockDurationSec: 5,
    lockoutMinutes: 10,
    maxFailedAttempts: 3,
    baudRate: 9600,
    useEepromPersistence: true,
  });

  const btManagerRef = useRef<HC05BluetoothManager | null>(null);
  const autoRelockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Append serial log helper
  const addSerialLog = useCallback(
    (direction: 'TX' | 'RX' | 'SYS', message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
      const entry: SerialLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        direction,
        message,
        type,
      };
      setSerialLogs((prev) => [...prev.slice(-150), entry]);
    },
    []
  );

  // Append attempt log helper
  const addAttemptLog = useCallback(
    (result: 'SUCCESS' | 'FAIL' | 'LOCKOUT', attemptNum: number, buzzerPattern: string, details: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const entry: AttemptLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        result,
        attemptNumber: attemptNum,
        maxAttempts,
        buzzerPattern,
        details,
      };
      setAttemptLogs((prev) => [entry, ...prev.slice(0, 50)]);
    },
    []
  );

  // Initialize Bluetooth Manager
  useEffect(() => {
    const manager = new HC05BluetoothManager({
      onStateChange: (state, dName) => {
        setBluetoothState(state);
        if (dName) setDeviceName(dName);
        if (manager) setIsSimulated(manager.isSimulatedMode());
      },
      onDataReceived: (data) => {
        // Handle incoming data if needed
      },
      onLog: (direction, message, type) => {
        addSerialLog(direction, message, type);
      },
    });

    btManagerRef.current = manager;
    // Auto-connect virtual simulation on first load for friction-free out-of-the-box testing
    manager.connectSimulation();

    // Check device biometrics capability
    checkBiometricsSupport().then((res) => {
      setHasPlatformBiometric(res.platformAuthenticator);
      setBiometricMessage(res.message);
    });

    return () => {
      manager.disconnect();
    };
  }, [addSerialLog]);

  // Handle 10-Minute Lockout Countdown Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (caseStatus === 'LOCKOUT') {
      interval = setInterval(() => {
        setLockoutRemainingSec((prev) => {
          if (prev <= 1) {
            // Lockout expired!
            setCaseStatus('LOCKED');
            setFailedAttempts(0);
            setLastBuzzerPattern('NONE');
            addSerialLog('SYS', '10-Minute security lockdown expired. Case restored to armed state.', 'info');
            addAttemptLog('SUCCESS', 0, 'Restored', '10-minute lockout expired naturally. Armed.');
            btManagerRef.current?.sendCommand('R');
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [caseStatus, addSerialLog, addAttemptLog]);

  // Fingerprint Scan Handler (Authorized or Unauthorized)
  const handleFingerprintScan = useCallback(
    (isAuthorized: boolean) => {
      if (caseStatus === 'LOCKOUT') {
        triggerBuzzer('FAIL_3_SHORT');
        addSerialLog('SYS', `TAMPER DETECTED: Unlock attempt blocked during 10-min lockout!`, 'error');
        return;
      }

      if (isAuthorized) {
        // SUCCESS: RIGHT FINGERPRINT
        // 1. Buzzer beeps 1 long time
        setLastBuzzerPattern('SUCCESS_1_LONG');
        triggerBuzzer('SUCCESS_1_LONG');
        playSolenoidSound(true);

        // 2. Set Case Unlocked
        setCaseStatus('UNLOCKED');
        setFailedAttempts(0);

        // 3. Send 'U' to HC-05
        btManagerRef.current?.sendCommand('U');

        addAttemptLog('SUCCESS', 0, '1 Long Beep (1200ms)', 'Authorized fingerprint matched. Solenoid unlocked.');

        // 4. Auto-relock after duration
        if (autoRelockTimerRef.current) clearTimeout(autoRelockTimerRef.current);
        autoRelockTimerRef.current = setTimeout(() => {
          setCaseStatus('LOCKED');
          playSolenoidSound(false);
          setLastBuzzerPattern('NONE');
          addSerialLog('SYS', `Auto-relock timer expired (${arduinoConfig.unlockDurationSec}s). Case secured.`, 'info');
          btManagerRef.current?.sendCommand('L');
        }, arduinoConfig.unlockDurationSec * 1000);
      } else {
        // FAIL: INCORRECT FINGERPRINT
        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);

        if (newAttemptCount < maxAttempts) {
          // Attempt 1 or 2: Buzzer beeps 3 times
          setLastBuzzerPattern('FAIL_3_SHORT');
          triggerBuzzer('FAIL_3_SHORT');
          btManagerRef.current?.sendCommand('F');
          addAttemptLog(
            'FAIL',
            newAttemptCount,
            '3 Short Beeps',
            `Unrecognized fingerprint (Attempt ${newAttemptCount} of ${maxAttempts}).`
          );
        } else {
          // 3rd Attempt: Buzzer beeps 4 times + 10-Minute Lockout!
          setLastBuzzerPattern('LOCKOUT_4_BEEPS');
          triggerBuzzer('LOCKOUT_4_BEEPS');
          setCaseStatus('LOCKOUT');
          setLockoutRemainingSec(arduinoConfig.lockoutMinutes * 60);
          btManagerRef.current?.sendCommand('X');
          addAttemptLog(
            'LOCKOUT',
            newAttemptCount,
            '4 Urgent Beeps',
            `3 consecutive failed attempts! Case LOCKED DOWN for ${arduinoConfig.lockoutMinutes} minutes.`
          );
          addSerialLog(
            'SYS',
            `CRITICAL: 3 failed attempts reached! Engaging ${arduinoConfig.lockoutMinutes}-minute security lockdown.`,
            'error'
          );
        }
      }
    },
    [caseStatus, failedAttempts, maxAttempts, arduinoConfig, addAttemptLog, addSerialLog]
  );

  // Native WebAuthn Mobile Biometric Trigger
  const handleNativeBiometricScan = async () => {
    addSerialLog('SYS', 'Calling native phone biometric scanner (WebAuthn Platform Authenticator)...', 'info');
    const result = await authenticateWithNativeBiometrics();

    if (result.success) {
      addSerialLog('SYS', 'Phone biometric verified: Match confirmed!', 'success');
      handleFingerprintScan(true);
    } else {
      addSerialLog('SYS', `Phone biometric scan result: ${result.error || 'Failed/Cancelled'}`, 'warning');
      handleFingerprintScan(false);
    }
  };

  // Emergency PIN Override (e.g. "1234")
  const handleEmergencyPinOverride = (pin: string): boolean => {
    if (pin.trim() === '1234') {
      setCaseStatus('UNLOCKED');
      setFailedAttempts(0);
      setLastBuzzerPattern('SUCCESS_1_LONG');
      triggerBuzzer('SUCCESS_1_LONG');
      playSolenoidSound(true);

      addSerialLog('SYS', 'MASTER OVERRIDE PIN ACCEPTED: Lockout cleared & solenoid retracted!', 'success');
      addAttemptLog('SUCCESS', 0, '1 Long Beep (Override)', 'Master PIN override entered. Case unlocked.');
      btManagerRef.current?.sendCommand('R');

      if (autoRelockTimerRef.current) clearTimeout(autoRelockTimerRef.current);
      autoRelockTimerRef.current = setTimeout(() => {
        setCaseStatus('LOCKED');
        playSolenoidSound(false);
        setLastBuzzerPattern('NONE');
        btManagerRef.current?.sendCommand('L');
      }, arduinoConfig.unlockDurationSec * 1000);

      return true;
    }
    return false;
  };

  // Manual relock button
  const handleManualRelock = () => {
    if (autoRelockTimerRef.current) clearTimeout(autoRelockTimerRef.current);
    setCaseStatus('LOCKED');
    playSolenoidSound(false);
    setLastBuzzerPattern('NONE');
    addSerialLog('SYS', 'Manual relock commanded. Solenoid bolted.', 'info');
    btManagerRef.current?.sendCommand('L');
  };

  // Buzzer test trigger from audio test bench
  const handleTriggerBuzzerTest = (pattern: BuzzerPattern) => {
    setLastBuzzerPattern(pattern);
    triggerBuzzer(pattern);
    addSerialLog('SYS', `Simulating Buzzer Pattern: ${pattern}`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Bar Contract Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bluetoothState={bluetoothState}
        deviceName={deviceName}
        isSimulated={isSimulated}
        caseStatus={caseStatus}
        lockoutRemainingSec={lockoutRemainingSec}
        onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
      />

      {/* Main Tab View */}
      <main className="flex-1 pb-16">
        {activeTab === 'scanner' && (
          <ScannerPanel
            caseStatus={caseStatus}
            failedAttempts={failedAttempts}
            maxAttempts={maxAttempts}
            lockoutRemainingSec={lockoutRemainingSec}
            lastBuzzerPattern={lastBuzzerPattern}
            onScanFingerprint={handleFingerprintScan}
            onNativeBiometricScan={handleNativeBiometricScan}
            onEmergencyPinOverride={handleEmergencyPinOverride}
            hasPlatformBiometric={hasPlatformBiometric}
            biometricMessage={biometricMessage}
          />
        )}

        {activeTab === 'simulator' && (
          <CaseSimulator
            caseStatus={caseStatus}
            failedAttempts={failedAttempts}
            maxAttempts={maxAttempts}
            lockoutRemainingSec={lockoutRemainingSec}
            lastBuzzerPattern={lastBuzzerPattern}
            bluetoothState={bluetoothState}
            onTriggerBuzzerTest={handleTriggerBuzzerTest}
            onManualRelock={handleManualRelock}
          />
        )}

        {activeTab === 'terminal' && (
          <BluetoothTerminal
            logs={serialLogs}
            bluetoothState={bluetoothState}
            deviceName={deviceName}
            isSimulated={isSimulated}
            onSendCommand={(cmd) => btManagerRef.current?.sendCommand(cmd)}
            onClearLogs={() => setSerialLogs([])}
            onConnectWebBluetooth={() => btManagerRef.current?.connectWebBluetooth()}
            onConnectWebSerial={() => btManagerRef.current?.connectWebSerial()}
            onConnectSimulation={() => btManagerRef.current?.connectSimulation()}
            onDisconnect={() => btManagerRef.current?.disconnect()}
          />
        )}

        {activeTab === 'arduino' && (
          <ArduinoCodeTab
            config={arduinoConfig}
            onUpdateConfig={setArduinoConfig}
          />
        )}

        {activeTab === 'log' && (
          <AuditLogTab
            logs={attemptLogs}
            onClearLogs={() => setAttemptLogs([])}
          />
        )}
      </main>

      {/* Bluetooth Connection Modal */}
      <BluetoothModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        bluetoothState={bluetoothState}
        deviceName={deviceName}
        isSimulated={isSimulated}
        onConnectWebBluetooth={() => btManagerRef.current?.connectWebBluetooth()}
        onConnectWebSerial={() => btManagerRef.current?.connectWebSerial()}
        onConnectSimulation={() => btManagerRef.current?.connectSimulation()}
        onDisconnect={() => btManagerRef.current?.disconnect()}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Arduino HC-05 Biometric Smart Vault</span>
            <span aria-hidden="true">·</span>
            <span>Piezo Buzzer & Solenoid Controller</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Pass: 1 Long Beep</span>
            <span aria-hidden="true">·</span>
            <span>Fail: 3 Short Beeps</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-400">3 Strikes: 4 Beeps + 10 Min Lockout</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
