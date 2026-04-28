import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconDefinition } from "@fortawesome/free-solid-svg-icons";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: IconDefinition;
};

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="card-bg p-4 rounded-xl shadow-xl">
      <div className="text-sm flex items-center justify-center gap-2 mb-3 stat-card-title">
        <FontAwesomeIcon icon={icon} />
        {title}
      </div>
      <div className="text-3xl font-bold text-center stat-card-value">{value}</div>
    </div>
  );
}

export default StatCard;
