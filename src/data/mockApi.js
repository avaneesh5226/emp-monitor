import { localDateString } from '../utils/dates';

const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return localDateString(date);
};

const shot = (file) => `${import.meta.env.BASE_URL}mock/${file}`;

const employees = [
  { id: 'EMP-2026-001-F452', name: 'Ava Shah', role: 'Engineer', department: 'Product', location: 'Remote', status: 'Active', joinDate: '2026-01-15' },
  { id: 'EMP-2026-002-6AA5', name: 'Nia Bose', role: 'Editor', department: 'Desk', location: 'Pune', status: 'Active', joinDate: '2026-11-20' }
];

const closed = (employeeId, offset, clockIn, clockOut, activeHours) => ({
  employeeId,
  status: 'Inactive',
  clockIn,
  clockOut,
  activeHours,
  date: day(offset)
});

const attendance = [
  closed('EMP-2026-001-F452', 5, '09:06:18 AM', '05:41:02 PM', '8h 35m'),
  closed('EMP-2026-001-F452', 4, '09:11:40 AM', '05:28:16 PM', '8h 17m'),
  closed('EMP-2026-002-6AA5', 4, '09:33:02 AM', '04:46:28 PM', '7h 13m'),
  closed('EMP-2026-002-6AA5', 3, '09:22:51 AM', '04:58:09 PM', '7h 35m'),
  closed('EMP-2026-001-F452', 2, '09:02:27 AM', '05:36:44 PM', '8h 34m'),
  closed('EMP-2026-002-6AA5', 2, '09:41:13 AM', '05:06:02 PM', '7h 25m'),
  closed('EMP-2026-001-F452', 1, '09:18:55 AM', '05:22:31 PM', '8h 4m'),
  { employeeId: 'EMP-2026-001-F452', status: 'Active', clockIn: '09:04:12 AM', clockOut: '—', activeHours: '0h 0m', date: day(0) },
  closed('EMP-2026-002-6AA5', 0, '09:31:05 AM', '04:48:20 PM', '7h 17m')
].map((row, index) => ({ ...row, id: index + 1 }));

const tasks = [
  { id: 1, title: 'Rewrite the floor notes', description: 'Added from the task board.', status: 'In Progress', urgency: 'Normal', dueDate: day(0), assignedTo: 'Ava Shah' },
  { id: 2, title: 'File the Pune desk hours', description: 'Match the capture window to the 9:00–17:00 record.', status: 'To Do', urgency: 'Normal', dueDate: day(1), assignedTo: 'Nia Bose' },
  { id: 3, title: 'Read yesterday’s captures', description: 'The afternoon strip, not the whole day.', status: 'Completed', urgency: 'Low', dueDate: day(2), assignedTo: 'Ava Shah' }
];

const usage = [
  { employeeId: 'EMP-2026-001-F452', appName: 'Code', durationMinutes: 148, category: 'Productive', date: day(0) },
  { employeeId: 'EMP-2026-001-F452', appName: 'Figma', durationMinutes: 46, category: 'Productive', date: day(0) },
  { employeeId: 'EMP-2026-001-F452', appName: 'Google Chrome', durationMinutes: 38, category: 'Neutral', date: day(0) },
  { employeeId: 'EMP-2026-001-F452', appName: 'Slack', durationMinutes: 22, category: 'Neutral', date: day(0) },
  { employeeId: 'EMP-2026-002-6AA5', appName: 'Google Docs', durationMinutes: 96, category: 'Productive', date: day(0) },
  { employeeId: 'EMP-2026-002-6AA5', appName: 'Google Chrome', durationMinutes: 34, category: 'Neutral', date: day(0) },
  { employeeId: 'EMP-2026-002-6AA5', appName: 'Preview', durationMinutes: 18, category: 'Unproductive', date: day(0) }
];

const screenshots = {
  'EMP-2026-001-F452': [
    { url: shot('capture-code.svg'), time: '11:20 AM' },
    { url: shot('capture-notes.svg'), time: '02:15 PM' }
  ],
  'EMP-2026-002-6AA5': [
    { url: shot('capture-edit.svg'), time: '01:05 PM' },
    { url: shot('capture-notes.svg'), time: '03:40 PM' }
  ]
};

const settings = {
  schedule: { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, timezone: 'local' },
  attendance_window: { enabled: false, startTime: '09:00', endTime: '11:00' }
};

const clockInstant = (dateStr, timeStr) => {
  const match = String(timeStr || '').match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match || !dateStr) return null;
  let hours = Number(match[1]);
  const meridiem = (match[4] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const [year, month, dayNumber] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, dayNumber, hours, Number(match[2]), Number(match[3] || 0));
};

const withLiveHours = (row) => {
  if (!row || row.status !== 'Active') return row;
  const start = clockInstant(row.date, row.clockIn);
  if (!start) return row;
  const total = Math.max(0, Math.round((Date.now() - start.getTime()) / 60000));
  return { ...row, activeHours: `${Math.floor(total / 60)}h ${total % 60}m` };
};

const scoreOf = (rows) => {
  let productive = 0;
  let total = 0;
  rows.forEach((row) => {
    const mins = row.durationMinutes || 0;
    total += mins;
    if (row.category === 'Productive') productive += mins;
    else if (row.category === 'Neutral') productive += mins * 0.5;
  });
  return total > 0 ? Math.round((productive / total) * 100) : null;
};

const named = (row) => {
  const person = employees.find((item) => item.id === row.employeeId);
  return withLiveHours({ ...row, name: person?.name || row.employeeId, role: person?.role || '' });
};

const readBody = (init) => {
  if (!init?.body) return {};
  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
};

const reply = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

const handle = (method, path, init) => {
  const url = new URL(path, 'http://desk.local');
  const route = url.pathname;

  if (method === 'GET' && route === '/api/employees') return reply(200, employees);
  if (method === 'GET' && route.startsWith('/api/employees/')) {
    const person = employees.find((item) => item.id === decodeURIComponent(route.slice('/api/employees/'.length)));
    return person ? reply(200, person) : reply(404, { error: 'Employee not found' });
  }
  if (method === 'POST' && route === '/api/employees') {
    const body = readBody(init);
    const id = `EMP-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}-DEMO`;
    employees.push({
      id,
      name: body.name,
      role: body.role,
      department: body.department,
      location: body.location || '',
      status: body.status || 'Active',
      joinDate: body.joinDate
    });
    return reply(201, { message: 'Employee added successfully', id });
  }

  if (method === 'GET' && route === '/api/attendance') {
    const since = url.searchParams.get('since');
    const rows = attendance
      .filter((row) => !since || row.date >= since)
      .sort((a, b) => b.id - a.id)
      .map(named);
    return reply(200, rows);
  }
  if (method === 'GET' && route.startsWith('/api/attendance/employee/')) {
    const id = decodeURIComponent(route.slice('/api/attendance/employee/'.length));
    const rows = attendance
      .filter((row) => row.employeeId === id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map(named);
    return reply(200, rows);
  }

  if (method === 'GET' && route === '/api/tasks') return reply(200, [...tasks].sort((a, b) => b.id - a.id));
  if (method === 'POST' && route === '/api/tasks') {
    const body = readBody(init);
    const id = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    tasks.push({
      id,
      title: body.title,
      description: body.description || '',
      status: body.status || 'To Do',
      urgency: body.urgency || 'Normal',
      dueDate: body.dueDate || day(0),
      assignedTo: body.assignedTo || null
    });
    return reply(201, { id });
  }
  if (method === 'PUT' && /^\/api\/tasks\/\d+\/status$/.test(route)) {
    const id = Number(route.split('/')[3]);
    const task = tasks.find((item) => item.id === id);
    if (task) task.status = readBody(init).status;
    return reply(200, { message: 'Task status updated' });
  }

  if (method === 'GET' && route === '/api/analytics/dashboard') {
    const today = day(0);
    const todayUsage = usage.filter((row) => row.date === today);
    const focus = scoreOf(todayUsage);
    const activeToday = new Set(
      attendance.filter((row) => row.date === today && row.status === 'Active').map((row) => row.employeeId)
    ).size;
    return reply(200, {
      totalEmployees: employees.length,
      activeToday,
      avgProductivity: focus === null ? '—' : `${focus}%`,
      alerts: 0
    });
  }
  if (method === 'GET' && route.startsWith('/api/analytics/employee/')) {
    const id = decodeURIComponent(route.slice('/api/analytics/employee/'.length));
    const today = day(0);
    const rows = usage
      .filter((row) => row.employeeId === id && row.date === today)
      .sort((a, b) => b.durationMinutes - a.durationMinutes);
    const focus = scoreOf(rows);
    return reply(200, {
      employeeId: id,
      topApps: rows.slice(0, 5).map((row) => ({ name: row.appName, value: row.durationMinutes, category: row.category })),
      productivityScore: focus || 0,
      screenshots: screenshots[id] || []
    });
  }

  if (method === 'GET' && route === '/api/schedule') return reply(200, settings.schedule);
  if (method === 'POST' && route === '/api/schedule') {
    settings.schedule = { ...settings.schedule, ...readBody(init) };
    return reply(200, { message: 'Schedule updated successfully' });
  }
  if (method === 'GET' && route === '/api/settings/attendance-window') return reply(200, settings.attendance_window);
  if (method === 'POST' && route === '/api/settings/attendance-window') {
    settings.attendance_window = { ...settings.attendance_window, ...readBody(init) };
    return reply(200, { message: 'Attendance window updated successfully' });
  }

  return reply(404, { error: 'Not in the floor record' });
};

export const installMockApi = () => {
  if (window.__empMonitorMock) return;
  window.__empMonitorMock = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let path = raw;
    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.origin !== window.location.origin) return realFetch(input, init);
      path = `${parsed.pathname}${parsed.search}`;
    } catch {
      return realFetch(input, init);
    }
    if (!path.startsWith('/api/')) return realFetch(input, init);
    const method = String(init.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
    return Promise.resolve(handle(method, path, init));
  };
};
