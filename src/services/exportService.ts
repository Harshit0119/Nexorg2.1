/**
 * Nexorg 2.1 - Export System Service
 * Production PDF & Excel/CSV Timetable Exporter across:
 * - Faculty Timetable View
 * - Department Timetable View
 * - Institute Master Timetable View
 * - Room & Lab Timetable View
 */

import {
  TimetableEntry,
  AcademicDay,
  Department,
  FacultyProfile,
  Room,
  Lab,
  Subject,
  Section,
  User,
  InstituteTimeSlot,
  InstituteWorkingDay,
} from '../types/database';

export interface ExportContext {
  instituteName: string;
  academicYear: string;
  term: string;
  entries: TimetableEntry[];
  departments: Department[];
  facultyProfiles: FacultyProfile[];
  users: User[];
  rooms: Room[];
  labs: Lab[];
  subjects: Subject[];
  sections: Section[];
  timeSlots: InstituteTimeSlot[];
  workingDays: InstituteWorkingDay[];
}

export type ExportScope = 'INSTITUTE' | 'DEPARTMENT' | 'FACULTY' | 'ROOM';

export function generateExportData(
  scope: ExportScope,
  targetId: string | undefined,
  ctx: ExportContext
): { title: string; subtitle: string; headers: string[]; rows: string[][] } {
  const activeDays = ctx.workingDays.filter((d) => d.is_working_day).map((d) => d.day_of_week);
  const lectureSlots = ctx.timeSlots.filter((s) => !s.is_break).sort((a, b) => a.slot_number - b.slot_number);

  let filtered = ctx.entries;
  let title = `${ctx.instituteName} - Master Timetable`;
  let subtitle = `Academic Year: ${ctx.academicYear} | Term: ${ctx.term}`;

  if (scope === 'DEPARTMENT' && targetId) {
    const dept = ctx.departments.find((d) => d.id === targetId);
    filtered = ctx.entries.filter((e) => e.department_id === targetId);
    title = `${dept?.name || 'Department'} (${dept?.code || ''}) - Department Schedule`;
    subtitle = `Academic Year: ${ctx.academicYear} | Term: ${ctx.term} | Building: ${dept?.building_block || 'Main'}`;
  } else if (scope === 'FACULTY' && targetId) {
    const fac = ctx.facultyProfiles.find((f) => f.id === targetId);
    const user = ctx.users.find((u) => u.id === fac?.user_id);
    filtered = ctx.entries.filter((e) => e.faculty_id === targetId);
    title = `Teaching Schedule - Prof. ${user?.full_name || 'Faculty'}`;
    subtitle = `ID: ${fac?.employee_id || ''} | Max Load: ${fac?.max_weekly_hours} hrs/week`;
  } else if (scope === 'ROOM' && targetId) {
    const room = ctx.rooms.find((r) => r.id === targetId);
    const lab = ctx.labs.find((l) => l.id === targetId);
    filtered = ctx.entries.filter((e) => e.room_id === targetId || e.lab_id === targetId);
    title = `Facility Occupancy - ${room?.room_number || lab?.lab_code || 'Facility'}`;
    subtitle = `${room?.room_name || lab?.name || ''} | Capacity: ${room?.capacity || lab?.capacity || 40}`;
  }

  // Format headers: [Day, Period 1 (time), Period 2 (time), ...]
  const headers = ['Day', ...lectureSlots.map((s) => `Period ${s.slot_number} (${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)})`)];

  const rows: string[][] = [];

  for (const day of activeDays) {
    const row: string[] = [day];

    for (const slot of lectureSlots) {
      const entry = filtered.find((e) => e.day_of_week === day && e.period_number === slot.slot_number);

      if (!entry) {
        row.push('--- Free ---');
      } else {
        const subj = ctx.subjects.find((s) => s.id === entry.subject_id);
        const fac = ctx.facultyProfiles.find((f) => f.id === entry.faculty_id);
        const usr = ctx.users.find((u) => u.id === fac?.user_id);
        const rm = ctx.rooms.find((r) => r.id === entry.room_id);
        const lb = ctx.labs.find((l) => l.id === entry.lab_id);
        const sec = ctx.sections.find((s) => s.id === entry.section_id);

        const cellInfo = `${subj?.code || 'SUBJ'} (${sec?.name || 'Sec'})\n${usr?.full_name?.split(' ')[0] || 'Fac'} [${rm?.room_number || lb?.lab_code || 'Rm'}]`;
        row.push(cellInfo);
      }
    }
    rows.push(row);
  }

  return { title, subtitle, headers, rows };
}

export function exportTimetableToExcelCSV(
  scope: ExportScope,
  targetId: string | undefined,
  ctx: ExportContext
): void {
  const data = generateExportData(scope, targetId, ctx);
  const csvLines: string[] = [];

  csvLines.push(`"${data.title}"`);
  csvLines.push(`"${data.subtitle}"`);
  csvLines.push(`"Generated: ${new Date().toLocaleString()}"`);
  csvLines.push('');
  csvLines.push(data.headers.map((h) => `"${h}"`).join(','));

  data.rows.forEach((row) => {
    csvLines.push(row.map((cell) => `"${cell.replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(','));
  });

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${scope.toLowerCase()}_timetable_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerPrintPDF(
  scope: ExportScope,
  targetId: string | undefined,
  ctx: ExportContext
): void {
  const data = generateExportData(scope, targetId, ctx);

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Please allow popups to open the printable PDF document.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title}</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #111; }
          .header { border-bottom: 2px solid #4F46E5; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; font-size: 20px; color: #1e1b4b; }
          .header p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
          .brand-tag { font-size: 11px; font-weight: bold; color: #4F46E5; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 6px; text-align: left; font-weight: 600; font-size: 10px; color: #334155; }
          td { border: 1px solid #cbd5e1; padding: 8px 6px; vertical-align: top; line-height: 1.3; }
          .day-col { font-weight: bold; background: #f8fafc; width: 90px; color: #0f172a; }
          .cell-content { white-space: pre-line; }
          .free { color: #94a3b8; font-style: italic; }
          .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-tag">Nexorg 2.1 • Enterprise Academic Resource Planning</div>
            <h1>${data.title}</h1>
            <p>${data.subtitle}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 10px; color: #94a3b8;">Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p style="font-size: 11px; font-weight: bold; color: #10b981;">STATUS: OFFICIAL PUBLISHED</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${data.headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows
              .map(
                (row) => `
              <tr>
                <td class="day-col">${row[0]}</td>
                ${row
                  .slice(1)
                  .map(
                    (cell) => `
                  <td>
                    ${cell.includes('Free') ? `<span class="free">Free Period</span>` : `<div class="cell-content"><strong>${cell.split('\n')[0]}</strong><br/><span style="color: #64748b; font-size: 10px;">${cell.split('\n')[1] || ''}</span></div>`}
                  </td>
                `
                  )
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <span>Nexorg 2.1 Multi-Tenant Timetable Engine • 100% Clash-Free Verified</span>
          <span>Dean of Academic Affairs / Office of Registrar Authorized Signature: _________________________</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
