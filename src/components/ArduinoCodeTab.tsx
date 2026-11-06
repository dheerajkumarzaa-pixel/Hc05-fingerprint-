import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Cpu, Zap, Shield, HelpCircle, ChevronRight, Settings2 } from 'lucide-react';
import { ArduinoConfig } from '../types';
import { generateArduinoCode } from '../utils/arduinoCode';

interface ArduinoCodeTabProps {
  config: ArduinoConfig;
  onUpdateConfig: (newConfig: ArduinoConfig) => void;
}

export const ArduinoCodeTab: React.FC<ArduinoCodeTabProps> = ({ config, onUpdateConfig }) => {
  const [copied, setCopied] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const arduinoCode = generateArduinoCode(config);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([arduinoCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Arduino_Biometric_Security_Case.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Firmware & Hardware Assembly</span>
            <span aria-hidden="true">·</span>
            <span>Arduino IDE Ready Sketch</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <FileCode className="w-6 h-6 text-emerald-400" />
            Arduino Firmware (.ino) & Wiring Guide
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Customize Pins</span>
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownloadIno}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-lg shadow-emerald-950/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ino File</span>
          </button>
        </div>
      </div>

      {/* Hardware Schematic & Pinout Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Pinout Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-3">
            <Zap className="w-4 h-4" />
            <span>HC-05 Bluetooth Wiring</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Connect HC-05 to Arduino using SoftwareSerial. Notice the 3.3V voltage divider!
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">HC-05 TX</span>
              <span className="text-cyan-400">Arduino Pin {config.rxPin}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">HC-05 RX</span>
              <span className="text-purple-400">Pin {config.txPin} via 1k/2k Divider</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">HC-05 VCC</span>
              <span className="text-rose-400">Arduino 5V</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">HC-05 GND</span>
              <span className="text-slate-200">Arduino GND</span>
            </div>
          </div>
        </div>

        {/* Buzzer & Solenoid Wiring */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-3">
            <Cpu className="w-4 h-4" />
            <span>Lock & Buzzer Wiring</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Piezo buzzer and 5V/12V Solenoid lock connected to Arduino digital outputs.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Piezo Buzzer (+)</span>
              <span className="text-emerald-400">Arduino Pin {config.buzzerPin}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Piezo Buzzer (-)</span>
              <span className="text-slate-200">Arduino GND</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Relay / Solenoid IN</span>
              <span className="text-amber-400">Arduino Pin {config.lockPin}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Relay Power</span>
              <span className="text-rose-400">External 12V/5V DC</span>
            </div>
          </div>
        </div>

        {/* Security & Lockout Rules */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold mb-3">
            <Shield className="w-4 h-4" />
            <span>Security Specifications</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Strict timing and sound patterns programmed in Arduino sketch:
          </p>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Right Fingerprint:</strong> Buzzer 1 LONG BEEP (1200ms) + Solenoid retracts for {config.unlockDurationSec}s.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Wrong Fingerprint:</strong> Buzzer 3 SHORT BEEPS (200ms x 3).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>3rd Failed Attempt:</strong> Buzzer 4 BEEPS + Case locks down for <strong>{config.lockoutMinutes} MINUTES</strong>!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Voltage Divider Notice */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-200">Hardware Protection Note:</strong> The HC-05 RX pin is 3.3V logic tolerant! While Arduino VCC (5V) powers HC-05 VCC safely, you should add a simple 2-resistor voltage divider (1kΩ from Arduino Pin {config.txPin} to HC-05 RX, and 2kΩ from HC-05 RX to GND) to prevent over-voltage damage to your HC-05 module.
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Arduino_Biometric_Security_Case.ino</span>
            <span className="text-slate-500 text-[11px] ml-2">C++ (Arduino 1.8.x & 2.x)</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[600px] select-all bg-slate-950">
          <code>{arduinoCode}</code>
        </pre>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-emerald-400" />
              Configure Arduino Pins & Durations
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Customize the digital pins to match your physical Arduino wiring. The code updates automatically.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Buzzer Pin</label>
                  <input
                    type="number"
                    value={config.buzzerPin}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, buzzerPin: parseInt(e.target.value) || 8 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Lock (Solenoid) Pin</label>
                  <input
                    type="number"
                    value={config.lockPin}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, lockPin: parseInt(e.target.value) || 7 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">HC-05 TX to Pin (RX)</label>
                  <input
                    type="number"
                    value={config.rxPin}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, rxPin: parseInt(e.target.value) || 10 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Arduino TX to HC-05</label>
                  <input
                    type="number"
                    value={config.txPin}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, txPin: parseInt(e.target.value) || 11 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Lockout Time (Mins)</label>
                  <input
                    type="number"
                    value={config.lockoutMinutes}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, lockoutMinutes: parseInt(e.target.value) || 10 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unlock Duration (Sec)</label>
                  <input
                    type="number"
                    value={config.unlockDurationSec}
                    onChange={(e) =>
                      onUpdateConfig({ ...config, unlockDurationSec: parseInt(e.target.value) || 5 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold rounded-xl transition-colors"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
