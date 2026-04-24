import grades from "@/data/grades.json";
import coatings from "@/data/coatings.json";
import joining from "@/data/joining.json";
import partRules from "@/data/partRules.json";

export const metadata = { title: "VAVE BIW — Data sources" };

type Row = { id: string; name: string; source: string };

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="card">
      <h2 className="text-base font-semibold mb-3 text-steel-50">{title}</h2>
      <table className="w-full text-xs">
        <thead className="text-steel-400">
          <tr className="border-b border-steel-700">
            <th className="text-left py-2">ID</th>
            <th className="text-left py-2">Name</th>
            <th className="text-left py-2">Source citation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-steel-800 text-steel-200">
              <td className="py-1 font-mono">{r.id}</td>
              <td className="py-1">{r.name}</td>
              <td className="py-1 text-steel-400">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function SourcesPage() {
  const gradeRows = (grades as Row[]).map((g) => ({
    id: g.id,
    name: g.name,
    source: g.source,
  }));
  const coatRows = (coatings as Row[]).map((c) => ({
    id: c.id,
    name: c.name,
    source: c.source,
  }));
  const joinRows = (joining as Row[]).map((j) => ({
    id: j.id,
    name: j.name,
    source: j.source,
  }));
  const partRows = Object.entries(partRules as Record<string, { label: string; source: string }>).map(
    ([id, r]) => ({ id, name: r.label, source: r.source }),
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-lg font-semibold text-steel-50 mb-2">Data sources</h1>
        <p className="text-sm text-steel-300">
          All grade data is anchored to the public WorldAutoSteel AHSS Application
          Guidelines (v7.0) and AHSS Insights articles. No data was scraped;
          entries are hand-curated and cited per row. Users should verify each
          number against the original reference before using it for production
          decisions.
        </p>
      </div>
      <Section title="Grades" rows={gradeRows} />
      <Section title="Coatings" rows={coatRows} />
      <Section title="Joining methods" rows={joinRows} />
      <Section title="Part-family rules" rows={partRows} />
    </div>
  );
}
