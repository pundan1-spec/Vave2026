"use client";
import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Idea } from "@/lib/vave/types";
import { convert, FX, type CurrencyCode } from "@/lib/vave/currency";

export default function WeightCostChart({
  ideas,
  currency,
}: {
  ideas: Idea[];
  currency: CurrencyCode;
}) {
  const sym = FX[currency].symbol;
  const data = ideas.map((i, idx) => ({
    name: `#${idx + 1}`,
    x: i.weight_delta_pct,
    y: convert(i.cost_delta_per_part_usd, currency),
    lever: i.lever,
    title: i.title,
  }));

  return (
    <div className="card h-[320px]">
      <h3 className="text-base font-semibold mb-3 text-steel-50">
        Weight vs. cost — bottom-left quadrant wins
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid stroke="#283147" />
          <XAxis
            type="number"
            dataKey="x"
            name="Δ weight"
            unit="%"
            stroke="#9aa8bd"
            label={{ value: "Δ weight (%)", position: "insideBottom", offset: -10, fill: "#9aa8bd" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Δ cost"
            stroke="#9aa8bd"
            label={{
              value: `Δ cost (${sym}/part)`,
              angle: -90,
              position: "insideLeft",
              fill: "#9aa8bd",
            }}
          />
          <ReferenceLine x={0} stroke="#445674" />
          <ReferenceLine y={0} stroke="#445674" />
          <Tooltip
            contentStyle={{ background: "#1b2233", border: "1px solid #33415b" }}
            labelStyle={{ color: "#e4e9f0" }}
            formatter={(value: number, key: string) =>
              key === "x" ? `${value.toFixed(1)}%` : key === "y" ? `${sym}${value.toFixed(currency === "INR" ? 0 : 2)}` : value
            }
            labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ""}
          />
          <Legend wrapperStyle={{ color: "#9aa8bd" }} />
          <Scatter name="Ideas" data={data} fill="#ff7a1a" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
