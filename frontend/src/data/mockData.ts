// ── Types ─────────────────────────────────────────────────────────────────────
export interface Company {
  ticker: string
  name: string
  sector: string
  lat: number
  lng: number
  mc: number
}

export interface RiskEntry {
  score: number
  reasoning: string
}

export interface DemoEvent {
  id: string
  type: 'natural_disaster' | 'geopolitical' | 'macro'
  title: string
  description: string
  severity: 1 | 2 | 3 | 4 | 5
  source: string
  affected_countries: string[]
  affected_sectors: string[]
  lat: number
  lng: number
  created_at: string
  risks: Record<string, RiskEntry>
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
export const SP500_SAMPLE: Company[] = [
  { ticker: "AAPL",  name: "Apple Inc.",               sector: "Technology",      lat: 37.33, lng: -122.03, mc: 3100 },
  { ticker: "NVDA",  name: "NVIDIA Corporation",        sector: "Technology",      lat: 37.36, lng: -121.99, mc: 2200 },
  { ticker: "MSFT",  name: "Microsoft Corporation",     sector: "Technology",      lat: 47.64, lng: -122.13, mc: 3000 },
  { ticker: "AMZN",  name: "Amazon.com Inc.",           sector: "Consumer Disc",   lat: 47.61, lng: -122.33, mc: 1900 },
  { ticker: "GOOGL", name: "Alphabet Inc.",             sector: "Communication",   lat: 37.42, lng: -122.08, mc: 2100 },
  { ticker: "META",  name: "Meta Platforms Inc.",       sector: "Communication",   lat: 37.48, lng: -122.15, mc: 1400 },
  { ticker: "TSLA",  name: "Tesla Inc.",                sector: "Consumer Disc",   lat: 30.22, lng: -97.65,  mc: 800  },
  { ticker: "AMD",   name: "Advanced Micro Devices",    sector: "Technology",      lat: 37.33, lng: -121.97, mc: 290  },
  { ticker: "QCOM",  name: "Qualcomm Inc.",             sector: "Technology",      lat: 32.88, lng: -117.21, mc: 180  },
  { ticker: "INTC",  name: "Intel Corporation",         sector: "Technology",      lat: 37.38, lng: -121.96, mc: 120  },
  { ticker: "TSM",   name: "TSMC",                      sector: "Technology",      lat: 24.78, lng: 120.98,  mc: 650  },
  { ticker: "JPM",   name: "JPMorgan Chase",            sector: "Financials",      lat: 40.75, lng: -73.97,  mc: 580  },
  { ticker: "BAC",   name: "Bank of America",           sector: "Financials",      lat: 35.22, lng: -80.84,  mc: 310  },
  { ticker: "GS",    name: "Goldman Sachs",             sector: "Financials",      lat: 40.71, lng: -74.01,  mc: 160  },
  { ticker: "XOM",   name: "Exxon Mobil",               sector: "Energy",          lat: 32.78, lng: -96.80,  mc: 490  },
  { ticker: "CVX",   name: "Chevron Corporation",       sector: "Energy",          lat: 37.92, lng: -122.06, mc: 280  },
  { ticker: "UNH",   name: "UnitedHealth Group",        sector: "Healthcare",      lat: 44.97, lng: -93.46,  mc: 470  },
  { ticker: "JNJ",   name: "Johnson & Johnson",         sector: "Healthcare",      lat: 40.73, lng: -74.50,  mc: 390  },
  { ticker: "PG",    name: "Procter & Gamble",          sector: "Consumer Staples",lat: 39.10, lng: -84.51,  mc: 380  },
  { ticker: "KO",    name: "The Coca-Cola Company",     sector: "Consumer Staples",lat: 33.79, lng: -84.38,  mc: 260  },
  { ticker: "WMT",   name: "Walmart Inc.",              sector: "Consumer Staples",lat: 36.37, lng: -94.21,  mc: 730  },
  { ticker: "HD",    name: "Home Depot",                sector: "Consumer Disc",   lat: 33.88, lng: -84.47,  mc: 360  },
  { ticker: "BA",    name: "Boeing Company",            sector: "Industrials",     lat: 47.52, lng: -122.19, mc: 130  },
  { ticker: "CAT",   name: "Caterpillar Inc.",          sector: "Industrials",     lat: 40.11, lng: -88.20,  mc: 180  },
  { ticker: "GE",    name: "GE Aerospace",              sector: "Industrials",     lat: 42.35, lng: -71.06,  mc: 190  },
  { ticker: "F",     name: "Ford Motor Company",        sector: "Consumer Disc",   lat: 42.33, lng: -83.04,  mc: 50   },
  { ticker: "GM",    name: "General Motors",            sector: "Consumer Disc",   lat: 42.33, lng: -83.05,  mc: 55   },
  { ticker: "DIS",   name: "Walt Disney Company",       sector: "Communication",   lat: 33.81, lng: -117.92, mc: 200  },
  { ticker: "NFLX",  name: "Netflix Inc.",              sector: "Communication",   lat: 37.26, lng: -121.96, mc: 320  },
  { ticker: "V",     name: "Visa Inc.",                 sector: "Financials",      lat: 37.52, lng: -121.95, mc: 570  },
  { ticker: "MA",    name: "Mastercard Inc.",           sector: "Financials",      lat: 40.75, lng: -73.97,  mc: 460  },
  { ticker: "CRM",   name: "Salesforce Inc.",           sector: "Technology",      lat: 37.79, lng: -122.40, mc: 290  },
  { ticker: "ADBE",  name: "Adobe Inc.",                sector: "Technology",      lat: 37.33, lng: -121.89, mc: 230  },
  { ticker: "ORCL",  name: "Oracle Corporation",        sector: "Technology",      lat: 30.40, lng: -97.74,  mc: 380  },
  { ticker: "IBM",   name: "IBM Corporation",           sector: "Technology",      lat: 41.10, lng: -73.72,  mc: 200  },
]

export const DEMO_EVENTS: DemoEvent[] = [
  {
    id: "evt_001",
    type: "natural_disaster",
    title: "M7.4 Earthquake — Taiwan",
    description: "Major earthquake strikes Hualien County, Taiwan. TSMC has paused operations at Fab 18. Aftershocks continuing.",
    severity: 5,
    source: "USGS",
    affected_countries: ["Taiwan"],
    affected_sectors: ["Technology", "Semiconductors"],
    lat: 24.0, lng: 121.6,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    risks: {
      NVDA: { score: 0.94, reasoning: "90% of supply chain routed through TSMC Taiwan fabs" },
      AAPL: { score: 0.88, reasoning: "25% supply chain + 19% revenue exposure to Taiwan/China" },
      AMD:  { score: 0.85, reasoning: "TSMC manufactures >80% of AMD chips at Taiwan fabs" },
      QCOM: { score: 0.81, reasoning: "Heavy reliance on TSMC for 5G modem production" },
      INTC: { score: 0.61, reasoning: "Partial exposure through TSMC advanced packaging" },
      MSFT: { score: 0.42, reasoning: "Azure hardware supply chain partially affected" },
      TSLA: { score: 0.38, reasoning: "Semiconductor shortage risk for vehicle production" },
      GOOGL:{ score: 0.35, reasoning: "TPU chip supply chain indirectly exposed" },
      AMZN: { score: 0.28, reasoning: "AWS custom silicon supply partially affected" },
      META: { score: 0.22, reasoning: "AI accelerator procurement mildly impacted" },
    }
  },
  {
    id: "evt_002",
    type: "geopolitical",
    title: "US Sanctions — Chinese Tech Firms",
    description: "US Treasury announces sweeping new export controls on advanced semiconductor technology to China. 47 entities added to Entity List.",
    severity: 4,
    source: "NewsAPI",
    affected_countries: ["China"],
    affected_sectors: ["Technology", "Consumer Electronics"],
    lat: 39.9, lng: 116.4,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    risks: {
      AAPL: { score: 0.79, reasoning: "19% revenue from China at direct risk from consumer retaliation" },
      NVDA: { score: 0.76, reasoning: "China represents 25% of data centre revenue, now blocked" },
      QCOM: { score: 0.71, reasoning: "Major Chinese smartphone OEM customer base threatened" },
      INTC: { score: 0.65, reasoning: "China manufacturing and sales both impacted by controls" },
      AMD:  { score: 0.58, reasoning: "Chinese cloud and HPC customers face export restrictions" },
      TSLA: { score: 0.55, reasoning: "Shanghai Gigafactory and Chinese sales under pressure" },
      AMZN: { score: 0.31, reasoning: "AWS China operations and Alibaba partnership at risk" },
      MSFT: { score: 0.28, reasoning: "Azure China JV and LinkedIn operations affected" },
      GM:   { score: 0.45, reasoning: "SAIC-GM joint venture represents 30% of global sales" },
      F:    { score: 0.38, reasoning: "China manufacturing and Changan Ford JV exposed" },
    }
  },
  {
    id: "evt_003",
    type: "macro",
    title: "Fed Raises Rates +75bps",
    description: "Federal Reserve raises interest rates by 75 basis points, largest single hike since 1994. Chair signals further hikes likely.",
    severity: 4,
    source: "NewsAPI",
    affected_countries: ["USA"],
    affected_sectors: ["Financials", "Real Estate", "Technology"],
    lat: 38.9, lng: -77.0,
    created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    risks: {
      JPM:  { score: 0.31, reasoning: "Higher rates improve NIM but loan default risk rises" },
      BAC:  { score: 0.38, reasoning: "Large mortgage book exposed to housing market slowdown" },
      GS:   { score: 0.29, reasoning: "Deal flow likely to slow in higher rate environment" },
      NFLX: { score: 0.67, reasoning: "High debt load expensive to refinance at elevated rates" },
      TSLA: { score: 0.59, reasoning: "Auto loans become less affordable, EV demand softens" },
      AMZN: { score: 0.52, reasoning: "Consumer spending sensitivity and high capex financing costs" },
      HD:   { score: 0.71, reasoning: "Housing market directly impacted, renovation spend falls" },
      V:    { score: 0.24, reasoning: "Transaction volumes resilient but credit risk rises" },
      XOM:  { score: 0.18, reasoning: "Energy sector relatively insulated from rate sensitivity" },
      PG:   { score: 0.21, reasoning: "Consumer staples provide some defensiveness" },
    }
  }
]

// ── Utilities ─────────────────────────────────────────────────────────────────
export const riskColor = (score: number): string => {
  if (score >= 0.8) return "#EF4444"
  if (score >= 0.6) return "#F97316"
  if (score >= 0.4) return "#EAB308"
  if (score >= 0.2) return "#22C55E"
  return "#3B82F6"
}

export const riskLabel = (score: number): string => {
  if (score >= 0.8) return "CRITICAL"
  if (score >= 0.6) return "HIGH"
  if (score >= 0.4) return "MEDIUM"
  if (score >= 0.2) return "LOW"
  return "MINIMAL"
}

export const severityColor = (s: number): string =>
  (["","#22C55E","#84CC16","#EAB308","#F97316","#EF4444"][s]) || "#64748B"

export const timeAgo = (iso: string): string => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins/60)}h ${mins%60}m ago`
}
