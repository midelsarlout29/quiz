export default function StatCard({ label, value, tone = 'blue' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
