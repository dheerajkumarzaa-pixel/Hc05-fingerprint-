import { ArduinoConfig } from '../types';

export function generateArduinoCode(config: ArduinoConfig): string {
  return `/*
 * =========================================================================
 * ARDUINO BIOMETRIC SECURITY CASE WITH HC-05 BLUETOOTH & MOBILE FINGERPRINT
 * =========================================================================
 * 
 * Target Hardware:
 *   - Arduino Uno / Nano / Pro Mini / Mega
 *   - HC-05 Bluetooth Module (UART 9600 baud)
 *   - 5V / 12V Solenoid Door Lock (via Relay module or TIP120/MOSFET driver)
 *   - Piezo Buzzer (Active or Passive on digital PWM pin)
 *   - Status LEDs (Green: Unlocked, Red: Locked / Lockout)
 * 
 * Exact Buzzer & Lock Logic:
 *   1. Correct Fingerprint:
 *      - Buzzer beeps 1 LONG TIME (1200 ms)
 *      - Solenoid unlocks for ${config.unlockDurationSec} seconds, then re-locks
 *      - Failed attempt counter resets to 0
 *   2. Incorrect Fingerprint:
 *      - Failed attempts incremented
 *      - Buzzer beeps 3 TIMES (200 ms tone, 150 ms silence)
 *   3. After 3 Consecutive Failed Attempts:
 *      - Buzzer beeps 4 TIMES (urgent security alarm)
 *      - CASE LOCKS DOWN FOR ${config.lockoutMinutes} MINUTES (${config.lockoutMinutes * 60} seconds)
 *      - All unlock commands are strictly ignored during lockout
 * 
 * Circuit Wiring:
 *   - HC-05 TX  --> Arduino Pin ${config.rxPin} (SoftwareSerial RX)
 *   - HC-05 RX  --> Arduino Pin ${config.txPin} via Voltage Divider (Arduino 5V TX -> 1kΩ -> HC-05 RX -> 2kΩ -> GND)
 *   - HC-05 VCC --> Arduino 5V
 *   - HC-05 GND --> Arduino GND
 *   - Buzzer (+) --> Arduino Pin ${config.buzzerPin}
 *   - Buzzer (-) --> Arduino GND
 *   - Relay IN   --> Arduino Pin ${config.lockPin} (Active HIGH or LOW, drives Solenoid)
 *   - Green LED  --> Arduino Pin 6 (via 220Ω resistor)
 *   - Red LED    --> Arduino Pin 5 (via 220Ω resistor)
 * =========================================================================
 */

#include <SoftwareSerial.h>
#include <EEPROM.h>

// --- PIN DEFINITIONS ---
const int PIN_HC05_RX = ${config.rxPin};   // Connects to HC-05 TX
const int PIN_HC05_TX = ${config.txPin};   // Connects to HC-05 RX (Use 1k/2k voltage divider!)
const int PIN_BUZZER  = ${config.buzzerPin};   // Piezo Buzzer
const int PIN_LOCK    = ${config.lockPin};   // Solenoid Relay / Driver
const int PIN_LED_GREEN = 6;  // Unlocked Indicator
const int PIN_LED_RED   = 5;  // Locked / Lockout Indicator

// --- TIMING & SECURITY PARAMETERS ---
const unsigned long UNLOCK_DURATION_MS = ${config.unlockDurationSec}000UL; // Solenoid retract duration
const unsigned long LOCKOUT_DURATION_MS = ${config.lockoutMinutes}UL * 60UL * 1000UL; // ${config.lockoutMinutes} Minutes Lockout
const int MAX_FAILED_ATTEMPTS = ${config.maxFailedAttempts}; // 3 attempts

// EEPROM addresses for persistent lockout across power cycles
const int EEPROM_ADDR_LOCKOUT = 10;
const byte EEPROM_LOCKOUT_MAGIC = 0x5A;

// --- STATE VARIABLES ---
SoftwareSerial btSerial(PIN_HC05_RX, PIN_HC05_TX);

int failedAttempts = 0;
bool isLockedOut = false;
unsigned long lockoutStartTime = 0;
bool isUnlocked = false;
unsigned long unlockStartTime = 0;

void setup() {
  // Initialize Hardware Serial (for USB Debugging Monitor)
  Serial.begin(${config.baudRate});
  while (!Serial && millis() < 1000); // Wait for USB connection
  
  // Initialize HC-05 Software Serial
  btSerial.begin(${config.baudRate});
  
  // Configure Output Pins
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LOCK, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  
  // Initial Pin States (Locked)
  digitalWrite(PIN_LOCK, LOW);       // Solenoid locked
  digitalWrite(PIN_LED_GREEN, LOW);  // Green OFF
  digitalWrite(PIN_LED_RED, HIGH);   // Red ON (Secured)
  digitalWrite(PIN_BUZZER, LOW);

  // Check EEPROM to see if case was locked out before a power cycle
  checkPersistentLockout();

  Serial.println(F("========================================"));
  Serial.println(F("ARDUINO SMART CASE CONTROLLER READY"));
  Serial.println(F("HC-05 Bluetooth: 9600 Baud"));
  Serial.println(F("Commands: 'U'=Unlock, 'F'=Fail, 'L'=Lock"));
  Serial.println(F("========================================"));
  
  // Power-on confirmation chirp
  tone(PIN_BUZZER, 2400, 100);
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Handle Solenoid Auto-Relock Timer
  if (isUnlocked && (currentMillis - unlockStartTime >= UNLOCK_DURATION_MS)) {
    relockCase();
  }

  // 2. Handle 10-Minute Lockout Timer
  if (isLockedOut) {
    handleLockoutState(currentMillis);
  }

  // 3. Read Incoming Commands from HC-05 Bluetooth
  if (btSerial.available() > 0) {
    char cmd = btSerial.read();
    
    // Ignore whitespace / newlines
    if (cmd == '\\r' || cmd == '\\n' || cmd == ' ') return;
    
    Serial.print(F("[HC-05 BT RX]: "));
    Serial.println(cmd);
    
    processCommand(cmd);
  }

  // 4. Also support USB Serial Monitor for bench testing
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd != '\\r' && cmd != '\\n') {
      Serial.print(F("[USB Serial RX]: "));
      Serial.println(cmd);
      processCommand(cmd);
    }
  }
}

/**
 * Process received Bluetooth command byte
 */
void processCommand(char cmd) {
  // If system is currently locked out for 10 minutes, reject all unlock commands
  if (isLockedOut) {
    unsigned long remainingSec = (LOCKOUT_DURATION_MS - (millis() - lockoutStartTime)) / 1000UL;
    Serial.print(F("WARNING: Case is LOCKED OUT! Remaining: "));
    Serial.print(remainingSec);
    Serial.println(F("s"));
    
    btSerial.print(F("ERR:LOCKED_OUT:"));
    btSerial.println(remainingSec);
    
    // Warning chirp on tamper attempt during lockout
    tone(PIN_BUZZER, 3000, 150);
    return;
  }

  switch (cmd) {
    case 'U': // UNLOCK - Correct Fingerprint Scanned on Mobile Phone
    case '1':
      handleCorrectFingerprint();
      break;

    case 'F': // FAIL - Unrecognized Fingerprint Scanned on Mobile Phone
    case '0':
      handleIncorrectFingerprint();
      break;

    case 'L': // Explicit Relock Command
      relockCase();
      btSerial.println(F("ACK:LOCKED"));
      break;

    case 'P': // Ping / Health check
      btSerial.println(F("PONG:HC05_OK"));
      break;

    case 'R': // Emergency Reset (via authorized serial command)
      resetLockout();
      btSerial.println(F("ACK:RESET_OK"));
      break;

    default:
      Serial.print(F("Unknown Command: "));
      Serial.println(cmd);
      break;
  }
}

/**
 * User scanned CORRECT fingerprint:
 * - Buzzer beeps 1 LONG TIME (1200ms)
 * - Solenoid unlocks
 * - Reset failed counter
 */
void handleCorrectFingerprint() {
  Serial.println(F(">>> CORRECT FINGERPRINT DETECTED! <<<"));
  failedAttempts = 0; // Reset consecutive strike counter
  
  // 1. BUZZER: 1 LONG BEEP (1200 ms continuous tone)
  beepLong();

  // 2. SOLENOID: Retract bolt (Unlock case)
  digitalWrite(PIN_LOCK, HIGH);
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_RED, LOW);
  
  isUnlocked = true;
  unlockStartTime = millis();

  // 3. Send acknowledgment to phone via HC-05
  btSerial.println(F("ACK:UNLOCKED"));
  Serial.println(F("Case Solenoid UNLOCKED. Will auto-relock in ${config.unlockDurationSec}s."));
}

/**
 * User scanned INCORRECT fingerprint:
 * - Increment failed attempt counter
 * - If attempts < 3: Buzzer beeps 3 TIMES
 * - If attempts >= 3: Buzzer beeps 4 TIMES + LOCK CASE FOR 10 MINUTES
 */
void handleIncorrectFingerprint() {
  failedAttempts++;
  Serial.print(F(">>> INCORRECT FINGERPRINT! Attempt "));
  Serial.print(failedAttempts);
  Serial.print(F(" of "));
  Serial.print(MAX_FAILED_ATTEMPTS);
  Serial.println(F(" <<<"));

  if (failedAttempts < MAX_FAILED_ATTEMPTS) {
    // BUZZER: 3 SHORT BEEPS
    beepThreeTimes();
    
    // Notify phone
    btSerial.print(F("ACK:FAIL:ATTEMPT_"));
    btSerial.println(failedAttempts);
  } else {
    // 3RD ATTEMPT FAILED -> ENTER 10-MINUTE LOCKDOWN!
    triggerLockout();
  }
}

/**
 * Triggers 10-Minute Lockout Mode:
 * - Buzzer beeps 4 TIMES (urgent alarm)
 * - Solenoid is forced locked
 * - Timer begins 10-minute countdown (600 seconds)
 */
void triggerLockout() {
  Serial.println(F("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"));
  Serial.println(F("SECURITY LOCKDOWN: 3 FAILED ATTEMPTS REACHED!"));
  Serial.println(F("CASE WILL BE LOCKED FOR ${config.lockoutMinutes} MINUTES!"));
  Serial.println(F("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"));

  isLockedOut = true;
  lockoutStartTime = millis();
  
  // Save lockout state to EEPROM so power cycling cannot bypass security
  EEPROM.write(EEPROM_ADDR_LOCKOUT, EEPROM_LOCKOUT_MAGIC);

  // Solenoid firmly secured
  digitalWrite(PIN_LOCK, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, HIGH);

  // BUZZER: 4 ALARM BEEPS
  beepFourTimes();

  // Notify phone of lockout status
  btSerial.println(F("ACK:LOCKOUT_ACTIVATED:600"));
}

/**
 * Relock case (solenoid bolt extended)
 */
void relockCase() {
  digitalWrite(PIN_LOCK, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, HIGH);
  isUnlocked = false;
  Serial.println(F("Case auto-relocked and secured."));
}

/**
 * BUZZER PATTERN 1: 1 LONG BEEP (1200ms)
 */
void beepLong() {
  tone(PIN_BUZZER, 2400); // 2.4 kHz piezo resonance
  delay(1200);
  noTone(PIN_BUZZER);
}

/**
 * BUZZER PATTERN 2: 3 SHORT BEEPS (200ms tone, 150ms off)
 */
void beepThreeTimes() {
  for (int i = 0; i < 3; i++) {
    tone(PIN_BUZZER, 2200);
    delay(200);
    noTone(PIN_BUZZER);
    delay(150);
  }
}

/**
 * BUZZER PATTERN 3: 4 URGENT ALARM BEEPS (300ms tone, 120ms off)
 */
void beepFourTimes() {
  for (int i = 0; i < 4; i++) {
    tone(PIN_BUZZER, 2800);
    delay(300);
    noTone(PIN_BUZZER);
    delay(120);
  }
  // Low warning growl
  tone(PIN_BUZZER, 400);
  delay(600);
  noTone(PIN_BUZZER);
}

/**
 * Handle countdown and expiration of the 10-Minute Lockout
 */
void handleLockoutState(unsigned long currentMillis) {
  // Blink RED LED slowly during lockout (1 sec ON, 1 sec OFF)
  if ((currentMillis / 1000) % 2 == 0) {
    digitalWrite(PIN_LED_RED, HIGH);
  } else {
    digitalWrite(PIN_LED_RED, LOW);
  }

  // Check if 10 minutes have elapsed
  if (currentMillis - lockoutStartTime >= LOCKOUT_DURATION_MS) {
    resetLockout();
  }
}

/**
 * Reset lockout state after 10 minutes or manual override
 */
void resetLockout() {
  isLockedOut = false;
  failedAttempts = 0;
  EEPROM.write(EEPROM_ADDR_LOCKOUT, 0x00); // Clear EEPROM lockout
  
  digitalWrite(PIN_LED_RED, HIGH);
  digitalWrite(PIN_LED_GREEN, LOW);
  
  Serial.println(F("Lockout expired. System restored to normal armed mode."));
  btSerial.println(F("ACK:LOCKOUT_CLEARED"));
  
  // Happy confirmation chirp
  tone(PIN_BUZZER, 2000, 100);
  delay(120);
  tone(PIN_BUZZER, 2500, 150);
}

/**
 * Checks EEPROM on boot
 */
void checkPersistentLockout() {
  byte flag = EEPROM.read(EEPROM_ADDR_LOCKOUT);
  if (flag == EEPROM_LOCKOUT_MAGIC) {
    Serial.println(F("WARNING: System was powered off during lockout! Resuming lockout."));
    isLockedOut = true;
    lockoutStartTime = millis();
    failedAttempts = MAX_FAILED_ATTEMPTS;
  }
}
`;
}
