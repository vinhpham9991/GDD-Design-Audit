import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/shared/Card";
import { useAppStore } from "@/store";

export function ScoreTrendChart() {
  const scorecards = useAppStore((state) => state.scorecards);

  const data = scorecards.map((item) => ({
    reviewer: item.reviewer,
    score: item.weightedTotal,
  }));

  return (
    <Card title="Scorecard Snapshot" subtitle="Weighted totals from seeded reviews">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="reviewer" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#0f766e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

