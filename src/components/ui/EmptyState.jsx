export default function EmptyState({ icon, title, hint }) {
  return (
    <div className="empty-state">
      {icon}
      <b>{title}</b>
      {hint && <span>{hint}</span>}
    </div>
  );
}
