import { useEffect, useState } from "react";
import {
  faArrowRightArrowLeft,
  faTowerBroadcast,
} from "@fortawesome/free-solid-svg-icons";
import StatCard from "./StatCard";

type CoreScopeStatsResponse = {
  packetsLast24h: number;
};

type MeshSharkNode = {
  role: string | null;
  freshness: string | null;
  lat: number | null;
  lon: number | null;
};

type MeshSharkNodesResponse = {
  nodes: MeshSharkNode[];
};

type StatsState = {
  packetsLast24h: number | "n/a" | null;
  repeaters: number | "n/a" | null;
};

function StatsCards() {
  const [stats, setStats] = useState<StatsState>({
    packetsLast24h: null,
    repeaters: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPacketStats = async () => {
      try {
        const response = await fetch("https://corescope.meshcore.fi/api/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = (await response.json()) as CoreScopeStatsResponse;
        if (isMounted) {
          setStats((current) => ({
            ...current,
            packetsLast24h: data.packetsLast24h,
          }));
        }
      } catch {
        if (isMounted) {
          setStats((current) => ({
            ...current,
            packetsLast24h: "n/a",
          }));
        }
      }
    };

    const fetchRepeaterStats = async () => {
      try {
        const response = await fetch("https://shark-api.meshcore.fi/api/v1/nodes?limit=1000");
        if (!response.ok) {
          throw new Error("Failed to fetch nodes");
        }

        const data = (await response.json()) as MeshSharkNodesResponse;
        const repeaters = data.nodes.filter(isFreshFinlandRepeater).length;
        if (isMounted) {
          setStats((current) => ({
            ...current,
            repeaters,
          }));
        }
      } catch {
        if (isMounted) {
          setStats((current) => ({
            ...current,
            repeaters: "n/a",
          }));
        }
      }
    };

    fetchPacketStats();
    fetchRepeaterStats();
    const packetIntervalId = window.setInterval(fetchPacketStats, 5000);
    const repeaterIntervalId = window.setInterval(fetchRepeaterStats, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(packetIntervalId);
      window.clearInterval(repeaterIntervalId);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <StatCard
        icon={faTowerBroadcast}
        title="Repeaters"
        value={stats.repeaters ?? "-"}
      />
      <StatCard
        icon={faArrowRightArrowLeft}
        title="Packets (24h)"
        value={stats.packetsLast24h ?? "-"}
      />
    </div>
  );
}

function isFreshFinlandRepeater(node: MeshSharkNode) {
  return (
    node.role === "repeater" &&
    node.freshness === "fresh" &&
    isFinlandCoordinate(node.lat, node.lon)
  );
}

function isFinlandCoordinate(lat: number | null, lon: number | null) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return false;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }

  return (
    !(lat === 0 && lon === 0) &&
    lat >= 59.85 &&
    lat <= 70.3 &&
    lon >= 19.0 &&
    lon <= 31.7
  );
}

export default StatsCards;
