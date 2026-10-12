import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Clock,
  UserCheck,
  Calendar,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { AuditLog, AuditLogAction, UserRole } from '../types/database';
import { exportAuditLogsToCSV } from '../services/saasService';

interface AuditLogsViewerProps {
  logs: AuditLog[];
  currentRole: UserRole;
}

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({ logs, currentRole }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchRole = selectedRole === 'ALL' || log.user_role === selectedRole;

      return matchSearch && matchAction && matchRole;
    });
  }, [logs, searchQuery, selectedAction, selectedRole]);

  const handleExportCSV = () => {
    const csv = exportAuditLogsToCSV(filteredLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexorg_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#4F46E5]" />
              Institutional Audit Trail & Governance Logs
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Immutable RLS Trace
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Cryptographic ledger tracking authentication, timetable generations, subject allocations, and plan adjustments.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white transition-all self-start sm:self-auto"
        >
          <Download className="h-4 w-4 text-zinc-400" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search audit trail by description, user email, or entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="DEPARTMENT_CREATE">Department Creation</option>
            <option value="FACULTY_CREATE">Faculty Creation</option>
            <option value="SUBJECT_ASSIGNMENT">Subject Allocation</option>
            <option value="TIMETABLE_GENERATE">Timetable Generation</option>
            <option value="TIMETABLE_PUBLISH">Timetable Publishing</option>
            <option value="SUBSCRIPTION_UPGRADE">Subscription Change</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-zinc-800 border border-white/[0.08] text-white px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HEAD">Institutional Head</option>
            <option value="ADMIN">Department Admin</option>
            <option value="FACULTY">Faculty</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-800/40 text-zinc-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Audit Details</th>
                <th className="py-2.5 px-3 rounded-r-lg text-right">IP / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-mono text-zinc-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-zinc-200">{log.user_email}</div>
                      <span className="text-[10px] font-mono text-indigo-400">{log.user_role}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-white/[0.08]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td className="py-3 px-3 text-zinc-300 max-w-md">
                      {log.description}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
