"use client";
import type { GenerateResponse, VaveInput } from "@/lib/vave/types";
import type { CurrencyCode } from "@/lib/vave/currency";

export default function ExportButtons({
  input,
  result,
  currency,
}: {
  input: VaveInput;
  result: GenerateResponse;
  currency: CurrencyCode;
}) {
  function downloadJson() {
    const blob = new Blob([JSON.stringify({ input, currency, result }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vave-${input.part_family}-${input.current_grade_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    const { pdf } = await import("@react-pdf/renderer");
    const { default: VaveReport } = await import("./VaveReport");
    const blob = await pdf(
      <VaveReport input={input} result={result} currency={currency} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vave-report-${input.part_family}-${input.current_grade_id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button className="btn-ghost" onClick={downloadJson}>
        Export JSON
      </button>
      <button className="btn-ghost" onClick={downloadPdf}>
        Export PDF
      </button>
    </div>
  );
}
