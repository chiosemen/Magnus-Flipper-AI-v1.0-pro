import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ResultRow = {
  item: string;
  buyPrice: string;
  sellPrice: string;
  profitPct: string;
  marketPair: string;
  confidence: "High" | "Medium" | "Low";
};

const PLACEHOLDER_ROWS: ResultRow[] = [
  {
    item: "iPhone 14 Pro 256GB",
    buyPrice: "540",
    sellPrice: "690",
    profitPct: "27%",
    marketPair: "Facebook -> eBay",
    confidence: "High",
  },
  {
    item: "Nike Air Max 90",
    buyPrice: "55",
    sellPrice: "95",
    profitPct: "42%",
    marketPair: "Vinted -> Facebook",
    confidence: "Medium",
  },
  {
    item: "MacBook Air M2",
    buyPrice: "780",
    sellPrice: "940",
    profitPct: "20%",
    marketPair: "Facebook -> Amazon",
    confidence: "High",
  },
  {
    item: "Xbox Series X",
    buyPrice: "280",
    sellPrice: "345",
    profitPct: "23%",
    marketPair: "Craigslist -> eBay",
    confidence: "Medium",
  },
  {
    item: "Vintage Omega Seamaster",
    buyPrice: "1180",
    sellPrice: "1300",
    profitPct: "10%",
    marketPair: "Gumtree -> eBay",
    confidence: "Low",
  },
];

function confidenceStyle(confidence: ResultRow["confidence"]) {
  if (confidence === "High") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  }
  if (confidence === "Medium") {
    return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
  }
  return "border-red-500/40 bg-red-500/15 text-red-300";
}

export function ResultsGrid() {
  return (
    <Card className="border-white/10 bg-[#121621] text-white">
      <CardHeader>
        <CardTitle className="text-xl">Results</CardTitle>
        <CardDescription className="text-white/60">
          Placeholder opportunities until the Phase 4 engine ships.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/60">Item</TableHead>
              <TableHead className="text-white/60">Buy price</TableHead>
              <TableHead className="text-white/60">Sell price</TableHead>
              <TableHead className="text-white/60">Profit %</TableHead>
              <TableHead className="text-white/60">Market pair</TableHead>
              <TableHead className="text-white/60 text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_ROWS.map((row) => (
              <TableRow key={`${row.item}-${row.marketPair}`} className="border-white/5">
                <TableCell className="text-white/90">{row.item}</TableCell>
                <TableCell className="text-white/70">{row.buyPrice}</TableCell>
                <TableCell className="text-white/70">{row.sellPrice}</TableCell>
                <TableCell className="text-white/70">{row.profitPct}</TableCell>
                <TableCell className="text-white/70">{row.marketPair}</TableCell>
                <TableCell className="text-right">
                  <Badge className={confidenceStyle(row.confidence)} variant="outline">
                    {row.confidence}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
