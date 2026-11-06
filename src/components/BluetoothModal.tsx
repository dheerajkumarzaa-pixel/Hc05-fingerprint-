import React from 'react';
import { Bluetooth, Cpu, Wifi, X, CheckCircle, ShieldAlert, KeyRound, Radio } from 'lucide-react';
import { BluetoothState } from '../types';

interface BluetoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  bluetoothState: BluetoothState;
  deviceName: string;
  isSimulated: boolean;
  onConnectWebBluetooth: () => void;
  onConnectWebSerial: () => void;
  onConnectSimulation: () => void;
  onDisconnect: () => void;
}

export const BluetoothModal: React.FC<BluetoothModalProps> = ({
  isOpen,
  onClose,
  bluetoothState,
  deviceName,
  isSimulated,
  onConnectWebBluetooth,
  onConnectWebSerial,
  onConnectSimulation,
  onDisconnect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">HC-05 Hardware Link</h3>
            <p className="text-xs text-slate-400">
              Connect your mobile phone or browser to the Arduino case
            </p>
          </div>
        </div>

        {/* Current Connection Status Box */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-mono">CONNECTION STATUS</div>
            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
              {bluetoothState === 'CONNECTED' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">
                    Connected to {isSimulated ? 'Simulated HC-05' : deviceName}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="text-slate-400">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {bluetoothState === 'CONNECTED' && (
            <button
              onClick={() => {
                onDisconnect();
              }}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Connection Options */}
        <div className="space-y-3">
          {/* Option 1: Web Bluetooth API */}
          <button
            onClick={() => {
              onConnectWebBluetooth();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-left transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                1. Web Bluetooth (Wireless HC-05 / BLE)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Scan for nearby Bluetooth devices directly from your Chrome browser on Android or PC.
              </p>
            </div>
          </button>

          {/* Option 2: Web Serial API */}
          <button
            onClick={() => {
              onConnectWebSerial();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                2. Web Serial (USB or Paired Bluetooth COM Port)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Direct COM port connection at 9600 baud. Works with paired HC-05 COM port or direct Arduino USB cable.
              </p>
            </div>
          </button>

          {/* Option 3: Virtual Hardware Simulation */}
          <button
            onClick={() => {
              onConnectSimulation();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                3. Virtual HC-05 Simulation (Instant Interactive Test)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Test the full biometric fingerprint unlock, buzzer beeps, and 10-minute lockout without having Arduino plugged in.
              </p>
            </div>
          </button>
        </div>

        {/* Pairing Help Note */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>HC-05 Default Pairing PIN:</span>
          <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
            1234 or 0000
          </span>
        </div>
      </div>
    </div>
  );
};
