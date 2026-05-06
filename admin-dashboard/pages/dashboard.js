export function formatDashboardStats(stats) {
  return [
    { label: 'Total doctors', value: stats.totalDoctors || 0 },
    { label: 'Total bookings', value: stats.totalBookings || 0 },
    { label: 'Upcoming appointments', value: stats.upcomingAppointments || 0 }
  ];
}
