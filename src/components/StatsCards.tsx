import { useEffect, useState } from "react";
import {
  faArrowRightArrowLeft,
  faTowerBroadcast,
  faWalkieTalkie,
} from "@fortawesome/free-solid-svg-icons";
import StatCard from "./StatCard";

type StatsResponse = {
  packetsLast24h: number;
  counts: {
    repeaters: number;
    companions: number;
  };
};

function StatsCards() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const response = await fetch("https://corescope.meshcore.fi/api/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = (await response.json()) as StatsResponse;
        if (isMounted) {
          setStats(data);
        }
      } catch {
        // Keep latest successful stats shown on transient fetch failures.
      }
    };

    fetchStats();
    const intervalId = window.setInterval(fetchStats, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={faTowerBroadcast}
        title="Repeaters"
        value={stats?.counts.repeaters ?? "-"}
      />
      <StatCard
        icon={faWalkieTalkie}
        title="Companions"
        value={stats?.counts.companions ?? "-"}
      />
      <StatCard
        icon={faArrowRightArrowLeft}
        title="Packets (24h)"
        value={stats?.packetsLast24h ?? "-"}
      />
    </div>
  );
}

export default StatsCards;
