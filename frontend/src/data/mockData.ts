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
  news_articles?: Array<{ title: string; url: string; source: string; published_at?: string }>
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
export const SP500_SAMPLE: Company[] = [
  // ── Mega-Cap Tech (Bay Area) ──
  { ticker: "AAPL",  name: "Apple Inc.",               sector: "Technology",      lat: 37.33, lng: -122.03, mc: 3100 },
  { ticker: "NVDA",  name: "NVIDIA Corporation",        sector: "Technology",      lat: 37.37, lng: -121.99, mc: 2200 },
  { ticker: "GOOGL", name: "Alphabet Inc.",             sector: "Communication",   lat: 37.42, lng: -122.08, mc: 2100 },
  { ticker: "META",  name: "Meta Platforms Inc.",       sector: "Communication",   lat: 37.48, lng: -122.15, mc: 1400 },
  { ticker: "AMD",   name: "Advanced Micro Devices",    sector: "Technology",      lat: 37.33, lng: -121.93, mc: 290  },
  { ticker: "INTC",  name: "Intel Corporation",         sector: "Technology",      lat: 37.39, lng: -121.96, mc: 120  },
  { ticker: "CVX",   name: "Chevron Corporation",       sector: "Energy",          lat: 37.92, lng: -122.06, mc: 280  },
  { ticker: "CRM",   name: "Salesforce Inc.",           sector: "Technology",      lat: 37.79, lng: -122.40, mc: 290  },
  { ticker: "ADBE",  name: "Adobe Inc.",                sector: "Technology",      lat: 37.33, lng: -121.89, mc: 230  },
  { ticker: "NFLX",  name: "Netflix Inc.",              sector: "Communication",   lat: 37.26, lng: -121.96, mc: 320  },
  { ticker: "V",     name: "Visa Inc.",                 sector: "Financials",      lat: 37.53, lng: -121.95, mc: 570  },
  { ticker: "PANW",  name: "Palo Alto Networks",        sector: "Technology",      lat: 37.39, lng: -122.15, mc: 110  },
  { ticker: "NOW",   name: "ServiceNow Inc.",           sector: "Technology",      lat: 37.39, lng: -121.98, mc: 170  },
  { ticker: "SNPS",  name: "Synopsys Inc.",             sector: "Technology",      lat: 37.38, lng: -122.03, mc: 80   },
  { ticker: "CDNS",  name: "Cadence Design",            sector: "Technology",      lat: 37.37, lng: -121.92, mc: 75   },
  { ticker: "KLAC",  name: "KLA Corporation",           sector: "Technology",      lat: 37.42, lng: -121.95, mc: 70   },
  { ticker: "AMAT",  name: "Applied Materials",         sector: "Technology",      lat: 37.35, lng: -122.04, mc: 130  },
  { ticker: "LRCX",  name: "Lam Research",              sector: "Technology",      lat: 37.40, lng: -122.00, mc: 95   },
  { ticker: "INTU",  name: "Intuit Inc.",               sector: "Technology",      lat: 37.39, lng: -122.06, mc: 175  },
  { ticker: "HPE",   name: "Hewlett Packard Enterprise", sector: "Technology",     lat: 37.40, lng: -122.14, mc: 25   },
  { ticker: "KEYS",  name: "Keysight Technologies",     sector: "Technology",      lat: 37.69, lng: -122.09, mc: 30   },
  { ticker: "FTNT",  name: "Fortinet Inc.",             sector: "Technology",      lat: 37.40, lng: -122.02, mc: 60   },
  // ── Seattle ──
  { ticker: "MSFT",  name: "Microsoft Corporation",     sector: "Technology",      lat: 47.64, lng: -122.13, mc: 3000 },
  { ticker: "AMZN",  name: "Amazon.com Inc.",           sector: "Consumer Disc",   lat: 47.62, lng: -122.34, mc: 1900 },
  { ticker: "BA",    name: "Boeing Company",            sector: "Industrials",     lat: 47.52, lng: -122.19, mc: 130  },
  { ticker: "SBUX",  name: "Starbucks Corp.",           sector: "Consumer Disc",   lat: 47.58, lng: -122.33, mc: 110  },
  { ticker: "COST",  name: "Costco Wholesale",          sector: "Consumer Staples",lat: 47.53, lng: -122.19, mc: 330  },
  // ── NYC / NJ / CT ──
  { ticker: "JPM",   name: "JPMorgan Chase",            sector: "Financials",      lat: 40.76, lng: -73.97,  mc: 580  },
  { ticker: "GS",    name: "Goldman Sachs",             sector: "Financials",      lat: 40.71, lng: -74.01,  mc: 160  },
  { ticker: "MA",    name: "Mastercard Inc.",           sector: "Financials",      lat: 40.79, lng: -73.96,  mc: 460  },
  { ticker: "JNJ",   name: "Johnson & Johnson",         sector: "Healthcare",      lat: 40.49, lng: -74.45,  mc: 390  },
  { ticker: "IBM",   name: "IBM Corporation",           sector: "Technology",      lat: 41.11, lng: -73.72,  mc: 200  },
  { ticker: "PFE",   name: "Pfizer Inc.",               sector: "Healthcare",      lat: 40.75, lng: -73.98,  mc: 150  },
  { ticker: "MRK",   name: "Merck & Co.",               sector: "Healthcare",      lat: 40.78, lng: -74.07,  mc: 280  },
  { ticker: "BLK",   name: "BlackRock Inc.",            sector: "Financials",      lat: 40.76, lng: -73.96,  mc: 130  },
  { ticker: "C",     name: "Citigroup Inc.",            sector: "Financials",      lat: 40.72, lng: -74.01,  mc: 120  },
  { ticker: "MS",    name: "Morgan Stanley",            sector: "Financials",      lat: 40.76, lng: -73.98,  mc: 155  },
  { ticker: "AXP",   name: "American Express",          sector: "Financials",      lat: 40.71, lng: -74.00,  mc: 170  },
  { ticker: "BK",    name: "Bank of New York Mellon",   sector: "Financials",      lat: 40.71, lng: -74.01,  mc: 45   },
  { ticker: "ICE",   name: "Intercontinental Exchange", sector: "Financials",      lat: 40.72, lng: -74.00,  mc: 70   },
  { ticker: "SCHW",  name: "Charles Schwab",            sector: "Financials",      lat: 40.75, lng: -73.98,  mc: 130  },
  { ticker: "CME",   name: "CME Group",                 sector: "Financials",      lat: 40.76, lng: -73.97,  mc: 80   },
  { ticker: "SPGI",  name: "S&P Global",                sector: "Financials",      lat: 40.75, lng: -73.97,  mc: 140  },
  { ticker: "MCO",   name: "Moody's Corporation",       sector: "Financials",      lat: 40.72, lng: -74.00,  mc: 70   },
  { ticker: "VZ",    name: "Verizon Communications",    sector: "Communication",   lat: 40.75, lng: -73.99,  mc: 170  },
  { ticker: "VRTX",  name: "Vertex Pharmaceuticals",    sector: "Healthcare",      lat: 40.73, lng: -73.99,  mc: 100  },
  { ticker: "BDX",   name: "Becton Dickinson",          sector: "Healthcare",      lat: 40.99, lng: -74.12,  mc: 65   },
  { ticker: "CB",    name: "Chubb Limited",             sector: "Financials",      lat: 40.73, lng: -74.00,  mc: 100  },
  { ticker: "ETN",   name: "Eaton Corporation",         sector: "Industrials",     lat: 40.72, lng: -74.01,  mc: 120  },
  { ticker: "PH",    name: "Parker Hannifin",           sector: "Industrials",     lat: 40.74, lng: -73.99,  mc: 75   },
  // ── Boston / Mass ──
  { ticker: "GE",    name: "GE Aerospace",              sector: "Industrials",     lat: 42.36, lng: -71.06,  mc: 190  },
  { ticker: "RTX",   name: "RTX Corporation",           sector: "Industrials",     lat: 42.37, lng: -71.12,  mc: 145  },
  { ticker: "BIIB",  name: "Biogen Inc.",               sector: "Healthcare",      lat: 42.37, lng: -71.08,  mc: 30   },
  { ticker: "TFC",   name: "Truist Financial",          sector: "Financials",      lat: 42.35, lng: -71.06,  mc: 55   },
  { ticker: "REGN",  name: "Regeneron Pharma",          sector: "Healthcare",      lat: 41.09, lng: -73.84,  mc: 100  },
  // ── Texas (Austin / Dallas / Houston) ──
  { ticker: "TSLA",  name: "Tesla Inc.",                sector: "Consumer Disc",   lat: 30.22, lng: -97.63,  mc: 800  },
  { ticker: "XOM",   name: "Exxon Mobil",               sector: "Energy",          lat: 32.84, lng: -96.78,  mc: 490  },
  { ticker: "ORCL",  name: "Oracle Corporation",        sector: "Technology",      lat: 30.40, lng: -97.74,  mc: 380  },
  { ticker: "COP",   name: "ConocoPhillips",            sector: "Energy",          lat: 29.77, lng: -95.37,  mc: 130  },
  { ticker: "EOG",   name: "EOG Resources",             sector: "Energy",          lat: 29.75, lng: -95.35,  mc: 70   },
  { ticker: "SLB",   name: "Schlumberger Ltd.",         sector: "Energy",          lat: 29.76, lng: -95.36,  mc: 65   },
  { ticker: "HAL",   name: "Halliburton Co.",           sector: "Energy",          lat: 29.76, lng: -95.38,  mc: 30   },
  { ticker: "PSX",   name: "Phillips 66",               sector: "Energy",          lat: 29.78, lng: -95.40,  mc: 50   },
  { ticker: "VLO",   name: "Valero Energy",             sector: "Energy",          lat: 29.42, lng: -98.49,  mc: 45   },
  { ticker: "OXY",   name: "Occidental Petroleum",      sector: "Energy",          lat: 29.77, lng: -95.37,  mc: 50   },
  { ticker: "TXN",   name: "Texas Instruments",         sector: "Technology",      lat: 32.91, lng: -96.75,  mc: 170  },
  { ticker: "DELL",  name: "Dell Technologies",         sector: "Technology",      lat: 30.39, lng: -97.73,  mc: 85   },
  { ticker: "KMI",   name: "Kinder Morgan",             sector: "Energy",          lat: 29.76, lng: -95.36,  mc: 45   },
  { ticker: "WMB",   name: "Williams Companies",        sector: "Energy",          lat: 36.15, lng: -95.99,  mc: 50   },
  { ticker: "APA",   name: "APA Corporation",           sector: "Energy",          lat: 29.77, lng: -95.38,  mc: 15   },
  { ticker: "FANG",  name: "Diamondback Energy",        sector: "Energy",          lat: 31.99, lng: -102.08, mc: 30   },
  // ── Atlanta / Southeast ──
  { ticker: "KO",    name: "The Coca-Cola Company",     sector: "Consumer Staples",lat: 33.79, lng: -84.39,  mc: 260  },
  { ticker: "HD",    name: "Home Depot",                sector: "Consumer Disc",   lat: 33.88, lng: -84.46,  mc: 360  },
  { ticker: "UPS",   name: "United Parcel Service",     sector: "Industrials",     lat: 33.80, lng: -84.33,  mc: 150  },
  { ticker: "ICE2",  name: "Intercontinental Exch.",    sector: "Financials",      lat: 33.75, lng: -84.39,  mc: 70   },
  { ticker: "SO",    name: "Southern Company",          sector: "Utilities",       lat: 33.75, lng: -84.39,  mc: 85   },
  { ticker: "SYY",   name: "Sysco Corporation",         sector: "Consumer Staples",lat: 29.76, lng: -95.39,  mc: 40   },
  // ── Charlotte / NC ──
  { ticker: "BAC",   name: "Bank of America",           sector: "Financials",      lat: 35.23, lng: -80.84,  mc: 310  },
  { ticker: "LOW",   name: "Lowe's Companies",          sector: "Consumer Disc",   lat: 35.46, lng: -80.87,  mc: 140  },
  { ticker: "DUK",   name: "Duke Energy",               sector: "Utilities",       lat: 35.23, lng: -80.84,  mc: 80   },
  // ── Minneapolis / Midwest ──
  { ticker: "UNH",   name: "UnitedHealth Group",        sector: "Healthcare",      lat: 44.98, lng: -93.47,  mc: 470  },
  { ticker: "TGT",   name: "Target Corporation",        sector: "Consumer Disc",   lat: 44.95, lng: -93.27,  mc: 75   },
  { ticker: "MMM",   name: "3M Company",                sector: "Industrials",     lat: 44.95, lng: -93.00,  mc: 60   },
  { ticker: "MDT",   name: "Medtronic plc",             sector: "Healthcare",      lat: 44.97, lng: -93.40,  mc: 110  },
  // ── Chicago / Illinois ──
  { ticker: "CAT",   name: "Caterpillar Inc.",          sector: "Industrials",     lat: 40.68, lng: -89.59,  mc: 180  },
  { ticker: "ABT",   name: "Abbott Laboratories",       sector: "Healthcare",      lat: 42.28, lng: -87.85,  mc: 200  },
  { ticker: "ABBV",  name: "AbbVie Inc.",               sector: "Healthcare",      lat: 42.28, lng: -87.95,  mc: 310  },
  { ticker: "MCD",   name: "McDonald's Corp.",          sector: "Consumer Disc",   lat: 41.88, lng: -87.64,  mc: 210  },
  { ticker: "BMY",   name: "Bristol-Myers Squibb",      sector: "Healthcare",      lat: 41.88, lng: -87.63,  mc: 105  },
  { ticker: "ADM",   name: "Archer-Daniels-Midland",    sector: "Consumer Staples",lat: 39.85, lng: -89.64,  mc: 25   },
  { ticker: "DE",    name: "Deere & Company",           sector: "Industrials",     lat: 41.51, lng: -90.52,  mc: 120  },
  { ticker: "CME2",  name: "CME Group",                 sector: "Financials",      lat: 41.88, lng: -87.63,  mc: 80   },
  { ticker: "AIG",   name: "American Intl Group",       sector: "Financials",      lat: 41.88, lng: -87.64,  mc: 50   },
  { ticker: "CL",    name: "Colgate-Palmolive",         sector: "Consumer Staples",lat: 41.88, lng: -87.62,  mc: 75   },
  { ticker: "ALL",   name: "Allstate Corp.",            sector: "Financials",      lat: 42.07, lng: -87.81,  mc: 45   },
  // ── Detroit / Michigan ──
  { ticker: "F",     name: "Ford Motor Company",        sector: "Consumer Disc",   lat: 42.33, lng: -83.05,  mc: 50   },
  { ticker: "GM",    name: "General Motors",            sector: "Consumer Disc",   lat: 42.33, lng: -83.04,  mc: 55   },
  { ticker: "DOW",   name: "Dow Inc.",                  sector: "Materials",       lat: 43.62, lng: -84.25,  mc: 35   },
  // ── Cincinnati / Ohio ──
  { ticker: "PG",    name: "Procter & Gamble",          sector: "Consumer Staples",lat: 39.10, lng: -84.51,  mc: 380  },
  { ticker: "KR",    name: "Kroger Co.",                sector: "Consumer Staples",lat: 39.10, lng: -84.52,  mc: 40   },
  { ticker: "GPC",   name: "Genuine Parts Co.",         sector: "Consumer Disc",   lat: 39.10, lng: -84.50,  mc: 20   },
  // ── Philadelphia / PA ──
  { ticker: "CMCSA", name: "Comcast Corporation",       sector: "Communication",   lat: 39.95, lng: -75.17,  mc: 160  },
  { ticker: "LIN",   name: "Linde plc",                sector: "Materials",       lat: 39.95, lng: -75.16,  mc: 200  },
  { ticker: "ADP",   name: "Automatic Data Proc.",      sector: "Industrials",     lat: 39.95, lng: -75.15,  mc: 110  },
  // ── Washington DC / Virginia ──
  { ticker: "LMT",   name: "Lockheed Martin",           sector: "Industrials",     lat: 38.90, lng: -77.04,  mc: 130  },
  { ticker: "NOC",   name: "Northrop Grumman",          sector: "Industrials",     lat: 38.92, lng: -77.23,  mc: 75   },
  { ticker: "GD",    name: "General Dynamics",          sector: "Industrials",     lat: 38.87, lng: -77.11,  mc: 80   },
  { ticker: "BKNG",  name: "Booking Holdings",          sector: "Consumer Disc",   lat: 38.90, lng: -77.02,  mc: 150  },
  { ticker: "MDLZ",  name: "Mondelez International",    sector: "Consumer Staples",lat: 38.91, lng: -77.04,  mc: 90   },
  // ── Bentonville / Arkansas ──
  { ticker: "WMT",   name: "Walmart Inc.",              sector: "Consumer Staples",lat: 36.37, lng: -94.21,  mc: 730  },
  // ── San Diego ──
  { ticker: "QCOM",  name: "Qualcomm Inc.",             sector: "Technology",      lat: 32.88, lng: -117.20, mc: 180  },
  { ticker: "ILMN",  name: "Illumina Inc.",             sector: "Healthcare",      lat: 32.89, lng: -117.17, mc: 25   },
  // ── SoCal / LA ──
  { ticker: "DIS",   name: "Walt Disney Company",       sector: "Communication",   lat: 34.16, lng: -118.33, mc: 200  },
  { ticker: "AMGN",  name: "Amgen Inc.",                sector: "Healthcare",      lat: 34.17, lng: -118.95, mc: 145  },
  { ticker: "GILD",  name: "Gilead Sciences",           sector: "Healthcare",      lat: 37.89, lng: -122.24, mc: 105  },
  { ticker: "BRK.B", name: "Berkshire Hathaway",        sector: "Financials",      lat: 41.25, lng: -95.93,  mc: 800  },
  // ── Denver / Colorado ──
  { ticker: "LRCX2", name: "Ball Corporation",          sector: "Materials",       lat: 39.74, lng: -104.99, mc: 20   },
  { ticker: "CBRE",  name: "CBRE Group",                sector: "Real Estate",     lat: 39.74, lng: -104.98, mc: 35   },
  { ticker: "DISH",  name: "Dish Network",              sector: "Communication",   lat: 39.58, lng: -104.87, mc: 10   },
  // ── Portland / Oregon ──
  { ticker: "NKE",   name: "Nike Inc.",                 sector: "Consumer Disc",   lat: 45.51, lng: -122.68, mc: 145  },
  // ── St. Louis / MO ──
  { ticker: "EMRSN", name: "Emerson Electric",          sector: "Industrials",     lat: 38.63, lng: -90.20,  mc: 55   },
  { ticker: "BUD",   name: "Anheuser-Busch InBev",      sector: "Consumer Staples",lat: 38.63, lng: -90.19,  mc: 120  },
  // ── Omaha ──
  { ticker: "BRK.A", name: "Berkshire Hathaway A",      sector: "Financials",      lat: 41.26, lng: -95.94,  mc: 800  },
  // ── Hartford / Connecticut ──
  { ticker: "TROW",  name: "T. Rowe Price",             sector: "Financials",      lat: 41.76, lng: -72.68,  mc: 25   },
  { ticker: "HIG",   name: "Hartford Financial",        sector: "Financials",      lat: 41.77, lng: -72.67,  mc: 30   },
  // ── Pittsburgh ──
  { ticker: "PPG",   name: "PPG Industries",            sector: "Materials",       lat: 40.44, lng: -80.00,  mc: 30   },
  { ticker: "USB",   name: "U.S. Bancorp",              sector: "Financials",      lat: 44.98, lng: -93.27,  mc: 70   },
  // ── Phoenix / Arizona ──
  { ticker: "AVGO",  name: "Broadcom Inc.",             sector: "Technology",      lat: 33.45, lng: -112.07, mc: 700  },
  { ticker: "ON",    name: "ON Semiconductor",           sector: "Technology",      lat: 33.44, lng: -112.07, mc: 35   },
  // ── Salt Lake / Utah ──
  { ticker: "ZS",    name: "Zscaler Inc.",              sector: "Technology",      lat: 40.76, lng: -111.89, mc: 30   },
  // ── Las Vegas ──
  { ticker: "LVS",   name: "Las Vegas Sands",           sector: "Consumer Disc",   lat: 36.17, lng: -115.14, mc: 35   },
  // ── Raleigh / NC ──
  { ticker: "MRVL",  name: "Marvell Technology",        sector: "Technology",      lat: 35.78, lng: -78.64,  mc: 65   },
  // ── Tampa / Florida ──
  { ticker: "WRB",   name: "W.R. Berkley Corp.",        sector: "Financials",      lat: 27.95, lng: -82.46,  mc: 20   },
  { ticker: "CARR",  name: "Carrier Global",            sector: "Industrials",     lat: 28.54, lng: -81.38,  mc: 50   },
  // ── Miami ──
  { ticker: "WLTW",  name: "Willis Towers Watson",      sector: "Financials",      lat: 25.76, lng: -80.19,  mc: 30   },
  // ── Kansas City ──
  { ticker: "CERN",  name: "Cerner Corporation",        sector: "Healthcare",      lat: 39.10, lng: -94.58,  mc: 25   },
  { ticker: "SPR",   name: "Spirit AeroSystems",        sector: "Industrials",     lat: 37.69, lng: -97.34,  mc: 10   },
  // ── Nashville ──
  { ticker: "HCA",   name: "HCA Healthcare",            sector: "Healthcare",      lat: 36.16, lng: -86.78,  mc: 85   },
  { ticker: "DG",    name: "Dollar General",            sector: "Consumer Disc",   lat: 36.30, lng: -86.59,  mc: 35   },
  // ── Richmond / Virginia ──
  { ticker: "CFG",   name: "Citizens Financial",        sector: "Financials",      lat: 37.54, lng: -77.44,  mc: 20   },
  { ticker: "ALGN",  name: "Align Technology",          sector: "Healthcare",      lat: 37.54, lng: -77.43,  mc: 15   },
  // ── Indianapolis ──
  { ticker: "LLY",   name: "Eli Lilly and Company",     sector: "Healthcare",      lat: 39.77, lng: -86.16,  mc: 700  },
  { ticker: "ANTM",  name: "Elevance Health",           sector: "Healthcare",      lat: 39.77, lng: -86.15,  mc: 110  },
  // ── International ──
  { ticker: "TSMC",  name: "TSMC",                      sector: "Technology",      lat: 24.78, lng: 120.98,  mc: 650  },
  { ticker: "ASML",  name: "ASML Holdings",             sector: "Technology",      lat: 51.49, lng: 5.46,    mc: 350  },
  { ticker: "NVO",   name: "Novo Nordisk",              sector: "Healthcare",      lat: 55.77, lng: 12.52,   mc: 420  },
  { ticker: "SAP",   name: "SAP SE",                    sector: "Technology",      lat: 49.29, lng: 8.64,    mc: 250  },
  { ticker: "TM",    name: "Toyota Motor Corp.",        sector: "Consumer Disc",   lat: 35.08, lng: 137.15,  mc: 300  },
  { ticker: "SHEL",  name: "Shell plc",                 sector: "Energy",          lat: 51.50, lng: -0.12,   mc: 210  },
  { ticker: "NESN",  name: "Nestlé SA",                 sector: "Consumer Staples",lat: 46.46, lng: 6.84,    mc: 280  },
  { ticker: "ROCHE", name: "Roche Holding",             sector: "Healthcare",      lat: 47.56, lng: 7.59,    mc: 220  },
  { ticker: "SONY",  name: "Sony Group Corp.",          sector: "Technology",      lat: 35.66, lng: 139.75,  mc: 130  },
  { ticker: "BABA",  name: "Alibaba Group",             sector: "Consumer Disc",   lat: 30.27, lng: 120.15,  mc: 200  },
  { ticker: "SMSN",  name: "Samsung Electronics",       sector: "Technology",      lat: 37.24, lng: 127.00,  mc: 350  },
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

export interface SupplyChainEdge {
  from_ticker: string
  to_ticker: string
  relationship: string
  weight: number
  description: string
}

export const RELATIONSHIP_COLORS: Record<string, string> = {
  chip_fab: '#06B6D4',
  component: '#A78BFA',
  ai_compute: '#F59E0B',
  cloud_provider: '#10B981',
  sector_peer: '#60A5FA',
  logistics: '#EC4899',
  semiconductor: '#22D3EE',
  manufacturing: '#F97316',
  raw_materials: '#A3E635',
  software: '#818CF8',
  licensing: '#FB923C',
  energy: '#FACC15',
  financial: '#34D399',
  supplies: '#38BDF8',
}

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
