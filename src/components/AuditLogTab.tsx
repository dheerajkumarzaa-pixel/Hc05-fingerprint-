import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Clock, Trash2, Volume2, Lock } from 'lucide-react';
import { AttemptLogEntry } from '../types';

interface AuditLogTabProps {
  logs: AttemptLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Security Audit Trail</span>
            <span aria-hidden="true">·</span>
            <span>Biometric Attempt History</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            Security & Access Logs
          </h2>
        </div>

        <button
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors disabled:opacity-40 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-400">No access events recorded yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Events will appear here whenever a fingerprint is scanned or verified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Timestamp</th>
                  <th className="px-5 py-3.5 font-medium">Result</th>
                  <th className="px-5 py-3.5 font-medium">Buzzer Behavior</th>
                  <th className="px-5 py-3.5 font-medium">Attempt Strike</th>
                  <th className="px-5 py-3.5 font-medium">Hardware Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-400 tabular-nums">
                        {log.timestamp}
                      </td>
                      <td className="px-5 py-3.5">
                        {log.result === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Access Granted
                          </span>
                        ) : log.result === 'LOCKOUT' ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" /> 10-Min Lockout
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                            <Shield className="w-3.5 h-3.5" /> Failed Verification
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                          {log.buzzerPattern}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {log.result === 'SUCCESS' ? (
                          <span className="text-emerald-400">Reset to 0</span>
                        ) : (
                          <span className={log.attemptNumber >= 3 ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                            {log.attemptNumber} / {log.maxAttempts}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
