// Mock data store for JOBOOK
export const mockRooms = [
  { id: 1, name: 'VIDEO EDITING ROOM', capacity: 10, floor: 'MCA BLOCK', building: 'MCA BLOCK', type: 'Video Editing', available: true, emoji: '🎬', desc: 'Professional video editing room. Location: MCA BLOCK, near Staff Room' },
];

export const mockBookings = [
  { id: 'BK-0241', room: 'VIDEO EDITING ROOM', date: 'Oct 24, 2026', time: '10:00 AM – 11:30 AM', status: 'confirmed', user: 'Alex Johnson', userId: 1, emoji: '🎬' },
  { id: 'BK-0242', room: 'VIDEO EDITING ROOM', date: 'Oct 24, 2026', time: '2:00 PM – 3:30 PM', status: 'confirmed', user: 'Alex Johnson', userId: 1, emoji: '🎬' },
  { id: 'BK-0239', room: 'VIDEO EDITING ROOM', date: 'Oct 22, 2026', time: '9:00 AM – 12:00 PM', status: 'completed', user: 'Sarah Smith', userId: 2, emoji: '🎬' },
  { id: 'BK-0238', room: 'VIDEO EDITING ROOM', date: 'Oct 21, 2026', time: '3:00 PM – 5:00 PM', status: 'cancelled', user: 'Mark Davis', userId: 3, emoji: '🎬' },
  { id: 'BK-0237', room: 'VIDEO EDITING ROOM', date: 'Oct 20, 2026', time: '1:00 PM – 4:00 PM', status: 'confirmed', user: 'Lisa Chen', userId: 4, emoji: '🎬' },
  { id: 'BK-0236', room: 'VIDEO EDITING ROOM', date: 'Oct 19, 2026', time: '11:00 AM – 12:00 PM', status: 'pending', user: 'James Wu', userId: 5, emoji: '🎬' },
];

export const mockUsers = [
  { id: 1, name: 'Alex Johnson', email: 'alex.johnson@spatial.com', role: 'User', dept: 'Engineering', status: 'active', bookings: 14, joined: 'Jan 12, 2024' },
  { id: 2, name: 'Sarah Smith', email: 'sarah.smith@spatial.com', role: 'User', dept: 'Design', status: 'active', bookings: 9, joined: 'Feb 03, 2024' },
  { id: 3, name: 'Mark Davis', email: 'mark.davis@spatial.com', role: 'Admin', dept: 'Operations', status: 'active', bookings: 22, joined: 'Dec 15, 2023' },
  { id: 4, name: 'Lisa Chen', email: 'lisa.chen@spatial.com', role: 'User', dept: 'Product', status: 'inactive', bookings: 5, joined: 'Mar 08, 2024' },
  { id: 5, name: 'James Wu', email: 'james.wu@spatial.com', role: 'User', dept: 'HR', status: 'active', bookings: 3, joined: 'Apr 22, 2024' },
];

export const mockTimeSlots = [
  { id: 1, label: 'Morning Slot', start: '08:00', end: '10:00', days: 'Mon–Fri', rooms: 'All', active: true },
  { id: 2, label: 'Late Morning', start: '10:00', end: '12:00', days: 'Mon–Fri', rooms: 'All', active: true },
  { id: 3, label: 'Lunch Slot', start: '12:00', end: '14:00', days: 'Mon–Sat', rooms: 'Boardroom, Hub', active: true },
  { id: 4, label: 'Afternoon', start: '14:00', end: '16:00', days: 'Mon–Fri', rooms: 'All', active: true },
  { id: 5, label: 'Late Afternoon', start: '16:00', end: '18:00', days: 'Mon–Fri', rooms: 'All', active: false },
];

export const chartData = [
  { name: '01 Oct', bookings: 18 },
  { name: '05 Oct', bookings: 32 },
  { name: '10 Oct', bookings: 25 },
  { name: '15 Oct', bookings: 40 },
  { name: '20 Oct', bookings: 35 },
  { name: '24 Oct', bookings: 42 },
];

export const recentActivity = [
  { id: 1, text: 'New booking from Boardroom Alpha • Conf Room A', status: 'confirmed', time: '08:30 AM', user: 'Alex J.' },
  { id: 2, text: 'Slot released for Focus Pod 302 – Oct 9', status: 'released', time: '08:45 AM', user: 'System' },
  { id: 3, text: 'User verification completed – Sarah Smith', status: 'info', time: '09:15 AM', user: 'Admin' },
  { id: 4, text: 'Maintenance update scheduled – Whole Campus', status: 'warning', time: '10:00 AM', user: 'Admin' },
];
