import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Copy, Check, Bluetooth, Cpu, RefreshCw, AlertCircle, Wifi } from 'lucide-react';
import { SerialLogEntry, BluetoothState } from '../types';

interface BluetoothTerminalProps {
  logs: SerialLogEntry[];
  bluetoothState: BluetoothState;
  deviceName: string;
  isSimulated: boolean;
  onSendCommand: (cmd: string) => void;
  onClearLogs: () => void;
  onConnectWebBluetooth: () => void;
  onConnectWebSerial: () => void;
  onConnectSimulation: () => void;
  onDisconnect: () => void;
}

export const BluetoothTerminal: React.FC<BluetoothTerminalProps> = ({
  logs,
  bluetoothState,
  deviceName,
  isSimulated,
  onSendCommand,
  onClearLogs,
  onConnectWebBluetooth,
  onConnectWebSerial,
  onConnectSimulation,
  onDisconnect,
}) => {
  const [inputCmd, setInputCmd] = useState('');
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'TX' | 'RX' | 'SYS'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    onSendCommand(inputCmd.trim());
    setInputCmd('');
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.direction}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.direction === filter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title & Connection Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>UART Serial Communication</span>
            <span aria-hidden="true">·</span>
            <span>HC-05 Bluetooth Transceiver</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            HC-05 Serial Console
          </h2>
        </div>

        {/* Connection Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {bluetoothState === 'CONNECTED' ? (
            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors"
            >
              Disconnect ({isSimulated ? 'Sim' : deviceName})
            </button>
          ) : (
            <>
              <button
                onClick={onConnectWebBluetooth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Web Bluetooth</span>
              </button>
              <button
                onClick={onConnectWebSerial}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>USB / COM Port</span>
              </button>
              <button
                onClick={onConnectSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Virtual HC-05</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Command Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Quick Commands:</span>
        <button
          onClick={() => onSendCommand('U')}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
        >
          'U' (Unlock / Right Finger)
        </button>
        <button
          onClick={() => onSendCommand('F')}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
        >
          'F' (Fail / Wrong Finger)
        </button>
        <button
          onClick={() => onSendCommand('L')}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          'L' (Lock Solenoid)
        </button>
        <button
          onClick={() => onSendCommand('P')}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          'P' (Ping)
        </button>
        <button
          onClick={() => onSendCommand('R')}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
        >
          'R' (Reset Lockout)
        </button>
      </div>

      {/* Terminal Display */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Terminal Header Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2">
              UART Serial Monitor · 9600-8-N-1
            </span>
          </div>

          {/* Filter Tabs & Utility */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
              {(['ALL', 'TX', 'RX', 'SYS'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded ${
                    filter === f ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyLogs}
              title="Copy terminal logs"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClearLogs}
              title="Clear terminal logs"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Log Stream */}
        <div ref={scrollRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 bg-slate-950">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-center">
              <div>
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No serial packets recorded yet.</p>
                <p className="text-[11px] mt-1 text-slate-500">
                  Connect to HC-05 or use the fingerprint scanner to begin data exchange.
                </p>
              </div>
            </div>
          ) : (
            filteredLogs.map((entry) => {
              let badgeColor = 'text-slate-400 bg-slate-800/80';
              let textColor = 'text-slate-300';

              if (entry.direction === 'TX') {
                badgeColor = 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/40';
                textColor = 'text-cyan-200';
              } else if (entry.direction === 'RX') {
                badgeColor = 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40';
                textColor = 'text-emerald-200';
              } else if (entry.type === 'error') {
                badgeColor = 'text-rose-400 bg-rose-950/60 border border-rose-800/40';
                textColor = 'text-rose-300';
              } else if (entry.type === 'warning') {
                badgeColor = 'text-amber-400 bg-amber-950/60 border border-amber-800/40';
                textColor = 'text-amber-300';
              }

              return (
                <div key={entry.id} className="flex items-start gap-2.5 py-0.5 hover:bg-slate-900/50 rounded px-1">
                  <span className="text-[11px] text-slate-600 select-none tabular-nums">
                    {entry.timestamp}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold select-none ${badgeColor}`}>
                    {entry.direction}
                  </span>
                  <span className={`flex-1 break-all ${textColor}`}>
                    {entry.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-sm pl-2 select-none">&gt;</span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder={
              bluetoothState === 'CONNECTED'
                ? 'Type command (e.g. U, F, L, PING)...'
                : 'Connect HC-05 first or use Virtual HC-05...'
            }
            className="flex-1 bg-transparent border-0 text-white font-mono text-xs focus:outline-none placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!inputCmd.trim() || bluetoothState !== 'CONNECTED'}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
