export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">Manage content for your players.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Film Posts', icon: '🎬', to: '/admin/film', soon: true },
          { label: 'Stats Views', icon: '📊', to: '/admin/stats', soon: true },
          { label: 'Wellness', icon: '💪', to: '/admin/wellness', soon: true },
          { label: 'Playbook', icon: '📖', to: '/admin/playbook', soon: true },
        ].map(({ label, icon, soon }) => (
          <div
            key={label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-2"
          >
            <span className="text-3xl">{icon}</span>
            <span className="text-white text-sm font-medium">{label}</span>
            {soon && (
              <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
