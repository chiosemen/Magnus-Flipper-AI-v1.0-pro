import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Row {
  label: string;
  magnus: string;
  competitor: string;
}

interface ComparisonTableProps {
  rows: Row[];
  heading?: string;
  copy?: string;
}

export function ComparisonTable({ rows, heading, copy }: ComparisonTableProps) {
  return (
    <section className="space-y-4">
      {(heading || copy) && (
        <div>
          {heading && <h3 className="text-2xl font-semibold text-white">{heading}</h3>}
          {copy && <p className="text-sm text-slate-300">{copy}</p>}
        </div>
      )}
      <Card className="border-slate-800 bg-slate-950/80">
        <CardHeader>
          <CardTitle className="text-lg">Magnus vs Manual</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-slate-200">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="px-3 py-2">Capability</th>
                <th className="px-3 py-2 text-emerald-200">Magnus</th>
                <th className="px-3 py-2 text-slate-300">Manual/Competitors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-semibold text-white">{row.label}</td>
                  <td className="px-3 py-2 text-emerald-200">{row.magnus}</td>
                  <td className="px-3 py-2 text-slate-300">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
