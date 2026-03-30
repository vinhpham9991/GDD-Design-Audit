import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type RadarDatum = {
  category: string;
  audit: number;
  scorecard: number;
};

type Props = {
  data: RadarDatum[];
  mode: "overlay" | "split";
};

export function DualRadarChart({ data, mode }: Props) {
  if (mode === "split") {
    return (
      <div className="grid h-80 grid-cols-1 gap-4 md:grid-cols-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <Tooltip />
            <Radar name="Audit" dataKey="audit" fill="#0f766e" fillOpacity={0.45} stroke="#0f766e" />
          </RadarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <Tooltip />
            <Radar
              name="Scorecard"
              dataKey="scorecard"
              fill="#2563eb"
              fillOpacity={0.45}
              stroke="#2563eb"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <Tooltip />
          <Radar name="Audit" dataKey="audit" fill="#0f766e" fillOpacity={0.35} stroke="#0f766e" />
          <Radar
            name="Scorecard"
            dataKey="scorecard"
            fill="#2563eb"
            fillOpacity={0.35}
            stroke="#2563eb"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
