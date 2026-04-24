"use client";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { GenerateResponse, VaveInput } from "@/lib/vave/types";
import { formatMoney, type CurrencyCode } from "@/lib/vave/currency";

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1b2233" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 12, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  small: { fontSize: 8, color: "#445674" },
  row: { flexDirection: "row", borderBottom: "1pt solid #c9d2de", paddingVertical: 2 },
  cell: { flex: 1, paddingRight: 4 },
});

export default function VaveReport({
  input,
  result,
  currency,
}: {
  input: VaveInput;
  result: GenerateResponse;
  currency: CurrencyCode;
}) {
  const digits = currency === "INR" ? 1 : 2;
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>VAVE BIW Report</Text>
        <Text style={s.small}>
          Part family: {input.part_family} · Baseline: {input.current_grade_id} @{" "}
          {input.current_thk_mm} mm · Coating: {input.current_coating_id} · Joining:{" "}
          {input.current_joining_ids.join(" + ")} · Volume:{" "}
          {input.annual_volume.toLocaleString("en-IN")} / yr · Cost currency: {currency}
        </Text>

        <Text style={s.h2}>Baseline</Text>
        <Text>
          Mass/part {result.baseline.mass_per_part_kg.toFixed(3)} kg · Cost/part{" "}
          {formatMoney(result.baseline.cost_per_part_usd, currency, { fractionDigits: digits })}
        </Text>
        {result.baseline.notes.map((n, i) => (
          <Text key={i} style={s.small}>
            {n}
          </Text>
        ))}

        <Text style={s.h2}>Ranked Ideas</Text>
        <View style={[s.row, { borderBottomWidth: 2 }]}>
          <Text style={s.cell}>#</Text>
          <Text style={[s.cell, { flex: 3 }]}>Title</Text>
          <Text style={s.cell}>Δ kg</Text>
          <Text style={s.cell}>Δ %</Text>
          <Text style={s.cell}>Δ {currency}/part</Text>
          <Text style={s.cell}>Δ {currency}/yr</Text>
          <Text style={s.cell}>Conf.</Text>
        </View>
        {result.ideas.map((idea, i) => (
          <View key={idea.id} style={s.row}>
            <Text style={s.cell}>{i + 1}</Text>
            <Text style={[s.cell, { flex: 3 }]}>{idea.title}</Text>
            <Text style={s.cell}>{idea.weight_delta_kg.toFixed(3)}</Text>
            <Text style={s.cell}>{idea.weight_delta_pct.toFixed(1)}%</Text>
            <Text style={s.cell}>
              {formatMoney(idea.cost_delta_per_part_usd, currency, { fractionDigits: digits })}
            </Text>
            <Text style={s.cell}>
              {formatMoney(idea.cost_delta_program_usd, currency, { compact: true })}
            </Text>
            <Text style={s.cell}>{idea.confidence}</Text>
          </View>
        ))}

        <Text style={s.h2}>Integrated notes (top idea)</Text>
        {result.ideas[0] && (
          <View>
            <Text>Welding: {result.ideas[0].weldability_note}</Text>
            <Text>Coating: {result.ideas[0].coating_note}</Text>
            <Text>Formability: {result.ideas[0].formability_note}</Text>
            <Text>Crash / Stiffness: {result.ideas[0].crash_note}</Text>
            {result.ideas[0].risks.length > 0 && (
              <Text>Risks: {result.ideas[0].risks.join("; ")}</Text>
            )}
          </View>
        )}

        <Text style={s.small}>
          Data anchored to WorldAutoSteel AHSS Application Guidelines & AHSS Insights.
          Indian OEM context: baselines often IF / IF-HS / Mild / HSLA;
          lightweight ideas move to BH / DP / TRIP / PHS per part function.
        </Text>
      </Page>
    </Document>
  );
}
