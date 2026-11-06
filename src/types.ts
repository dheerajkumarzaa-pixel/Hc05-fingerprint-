export type CaseStatus = 'LOCKED' | 'UNLOCKED' | 'LOCKOUT';

export type BluetoothState = 'DISCONNECTED' | 'SCANNING' | 'CONNECTING' | 'CONNECTED';

export type BuzzerPattern = 'NONE' | 'SUCCESS_1_LONG' | 'FAIL_3_SHORT' | 'LOCKOUT_4_BEEPS';

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'SYS';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AttemptLogEntry {
  id: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAIL' | 'LOCKOUT';
  attemptNumber: number;
  maxAttempts: number;
  buzzerPattern: string;
  details: string;
}

export interface ArduinoConfig {
  buzzerPin: number;
  lockPin: number;
  rxPin: number; // Arduino RX (connects to HC-05 TX)
  txPin: number; // Arduino TX (connects to HC-05 RX via divider)
  unlockDurationSec: number;
  lockoutMinutes: number;
  maxFailedAttempts: number;
  baudRate: number;
  useEepromPersistence: boolean;
}

export interface EnrolledProfile {
  id: string;
  name: string;
  finger: string;
  credentialId?: string;
  enrolledAt: string;
  isMaster: boolean;
}
