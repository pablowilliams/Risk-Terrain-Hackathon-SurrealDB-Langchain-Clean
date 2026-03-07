"""
RiskTerrain Seed Data — Fix #1-4 #12 #20 #41 #42 #96
154 companies (correct countries for non-US), ~90 supply chain edges.
Dual-write: SurrealDB RELATE + SurrealDBGraph (langchain-surrealdb).
"""

import logging
from db.surreal import get_db
from utils import safe_surreal_id

logger = logging.getLogger("riskterrain.seed")

SP500_COMPANIES = [
    {"ticker": "AAPL", "safe_id": "AAPL", "name": "Apple Inc.", "sector": "Technology", "lat": 37.33, "lng": -122.03, "mc": 3100, "country": "USA"},
    {"ticker": "NVDA", "safe_id": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology", "lat": 37.37, "lng": -121.99, "mc": 2200, "country": "USA"},
    {"ticker": "GOOGL", "safe_id": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication", "lat": 37.42, "lng": -122.08, "mc": 2100, "country": "USA"},
    {"ticker": "META", "safe_id": "META", "name": "Meta Platforms Inc.", "sector": "Communication", "lat": 37.48, "lng": -122.15, "mc": 1400, "country": "USA"},
    {"ticker": "AMD", "safe_id": "AMD", "name": "Advanced Micro Devices", "sector": "Technology", "lat": 37.33, "lng": -121.93, "mc": 290, "country": "USA"},
    {"ticker": "INTC", "safe_id": "INTC", "name": "Intel Corporation", "sector": "Technology", "lat": 37.39, "lng": -121.96, "mc": 120, "country": "USA"},
    {"ticker": "CVX", "safe_id": "CVX", "name": "Chevron Corporation", "sector": "Energy", "lat": 37.92, "lng": -122.06, "mc": 280, "country": "USA"},
    {"ticker": "CRM", "safe_id": "CRM", "name": "Salesforce Inc.", "sector": "Technology", "lat": 37.79, "lng": -122.4, "mc": 290, "country": "USA"},
    {"ticker": "ADBE", "safe_id": "ADBE", "name": "Adobe Inc.", "sector": "Technology", "lat": 37.33, "lng": -121.89, "mc": 230, "country": "USA"},
    {"ticker": "NFLX", "safe_id": "NFLX", "name": "Netflix Inc.", "sector": "Communication", "lat": 37.26, "lng": -121.96, "mc": 320, "country": "USA"},
    {"ticker": "V", "safe_id": "V", "name": "Visa Inc.", "sector": "Financials", "lat": 37.53, "lng": -121.95, "mc": 570, "country": "USA"},
    {"ticker": "PANW", "safe_id": "PANW", "name": "Palo Alto Networks", "sector": "Technology", "lat": 37.39, "lng": -122.15, "mc": 110, "country": "USA"},
    {"ticker": "NOW", "safe_id": "NOW", "name": "ServiceNow Inc.", "sector": "Technology", "lat": 37.39, "lng": -121.98, "mc": 170, "country": "USA"},
    {"ticker": "SNPS", "safe_id": "SNPS", "name": "Synopsys Inc.", "sector": "Technology", "lat": 37.38, "lng": -122.03, "mc": 80, "country": "USA"},
    {"ticker": "CDNS", "safe_id": "CDNS", "name": "Cadence Design", "sector": "Technology", "lat": 37.37, "lng": -121.92, "mc": 75, "country": "USA"},
    {"ticker": "KLAC", "safe_id": "KLAC", "name": "KLA Corporation", "sector": "Technology", "lat": 37.42, "lng": -121.95, "mc": 70, "country": "USA"},
    {"ticker": "AMAT", "safe_id": "AMAT", "name": "Applied Materials", "sector": "Technology", "lat": 37.35, "lng": -122.04, "mc": 130, "country": "USA"},
    {"ticker": "LRCX", "safe_id": "LRCX", "name": "Lam Research", "sector": "Technology", "lat": 37.4, "lng": -122.0, "mc": 95, "country": "USA"},
    {"ticker": "INTU", "safe_id": "INTU", "name": "Intuit Inc.", "sector": "Technology", "lat": 37.39, "lng": -122.06, "mc": 175, "country": "USA"},
    {"ticker": "HPE", "safe_id": "HPE", "name": "Hewlett Packard Enterprise", "sector": "Technology", "lat": 37.4, "lng": -122.14, "mc": 25, "country": "USA"},
    {"ticker": "KEYS", "safe_id": "KEYS", "name": "Keysight Technologies", "sector": "Technology", "lat": 37.69, "lng": -122.09, "mc": 30, "country": "USA"},
    {"ticker": "FTNT", "safe_id": "FTNT", "name": "Fortinet Inc.", "sector": "Technology", "lat": 37.4, "lng": -122.02, "mc": 60, "country": "USA"},
    {"ticker": "MSFT", "safe_id": "MSFT", "name": "Microsoft Corporation", "sector": "Technology", "lat": 47.64, "lng": -122.13, "mc": 3000, "country": "USA"},
    {"ticker": "AMZN", "safe_id": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Disc", "lat": 47.62, "lng": -122.34, "mc": 1900, "country": "USA"},
    {"ticker": "BA", "safe_id": "BA", "name": "Boeing Company", "sector": "Industrials", "lat": 47.52, "lng": -122.19, "mc": 130, "country": "USA"},
    {"ticker": "SBUX", "safe_id": "SBUX", "name": "Starbucks Corp.", "sector": "Consumer Disc", "lat": 47.58, "lng": -122.33, "mc": 110, "country": "USA"},
    {"ticker": "COST", "safe_id": "COST", "name": "Costco Wholesale", "sector": "Consumer Staples", "lat": 47.53, "lng": -122.19, "mc": 330, "country": "USA"},
    {"ticker": "JPM", "safe_id": "JPM", "name": "JPMorgan Chase", "sector": "Financials", "lat": 40.76, "lng": -73.97, "mc": 580, "country": "USA"},
    {"ticker": "GS", "safe_id": "GS", "name": "Goldman Sachs", "sector": "Financials", "lat": 40.71, "lng": -74.01, "mc": 160, "country": "USA"},
    {"ticker": "MA", "safe_id": "MA", "name": "Mastercard Inc.", "sector": "Financials", "lat": 40.79, "lng": -73.96, "mc": 460, "country": "USA"},
    {"ticker": "JNJ", "safe_id": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare", "lat": 40.49, "lng": -74.45, "mc": 390, "country": "USA"},
    {"ticker": "IBM", "safe_id": "IBM", "name": "IBM Corporation", "sector": "Technology", "lat": 41.11, "lng": -73.72, "mc": 200, "country": "USA"},
    {"ticker": "PFE", "safe_id": "PFE", "name": "Pfizer Inc.", "sector": "Healthcare", "lat": 40.75, "lng": -73.98, "mc": 150, "country": "USA"},
    {"ticker": "MRK", "safe_id": "MRK", "name": "Merck & Co.", "sector": "Healthcare", "lat": 40.78, "lng": -74.07, "mc": 280, "country": "USA"},
    {"ticker": "BLK", "safe_id": "BLK", "name": "BlackRock Inc.", "sector": "Financials", "lat": 40.76, "lng": -73.96, "mc": 130, "country": "USA"},
    {"ticker": "C", "safe_id": "C", "name": "Citigroup Inc.", "sector": "Financials", "lat": 40.72, "lng": -74.01, "mc": 120, "country": "USA"},
    {"ticker": "MS", "safe_id": "MS", "name": "Morgan Stanley", "sector": "Financials", "lat": 40.76, "lng": -73.98, "mc": 155, "country": "USA"},
    {"ticker": "AXP", "safe_id": "AXP", "name": "American Express", "sector": "Financials", "lat": 40.71, "lng": -74.0, "mc": 170, "country": "USA"},
    {"ticker": "BK", "safe_id": "BK", "name": "Bank of New York Mellon", "sector": "Financials", "lat": 40.71, "lng": -74.01, "mc": 45, "country": "USA"},
    {"ticker": "ICE", "safe_id": "ICE", "name": "Intercontinental Exchange", "sector": "Financials", "lat": 40.72, "lng": -74.0, "mc": 70, "country": "USA"},
    {"ticker": "SCHW", "safe_id": "SCHW", "name": "Charles Schwab", "sector": "Financials", "lat": 40.75, "lng": -73.98, "mc": 130, "country": "USA"},
    {"ticker": "CME", "safe_id": "CME", "name": "CME Group", "sector": "Financials", "lat": 40.76, "lng": -73.97, "mc": 80, "country": "USA"},
    {"ticker": "SPGI", "safe_id": "SPGI", "name": "S&P Global", "sector": "Financials", "lat": 40.75, "lng": -73.97, "mc": 140, "country": "USA"},
    {"ticker": "MCO", "safe_id": "MCO", "name": "Moody's Corporation", "sector": "Financials", "lat": 40.72, "lng": -74.0, "mc": 70, "country": "USA"},
    {"ticker": "VZ", "safe_id": "VZ", "name": "Verizon Communications", "sector": "Communication", "lat": 40.75, "lng": -73.99, "mc": 170, "country": "USA"},
    {"ticker": "VRTX", "safe_id": "VRTX", "name": "Vertex Pharmaceuticals", "sector": "Healthcare", "lat": 40.73, "lng": -73.99, "mc": 100, "country": "USA"},
    {"ticker": "BDX", "safe_id": "BDX", "name": "Becton Dickinson", "sector": "Healthcare", "lat": 40.99, "lng": -74.12, "mc": 65, "country": "USA"},
    {"ticker": "CB", "safe_id": "CB", "name": "Chubb Limited", "sector": "Financials", "lat": 40.73, "lng": -74.0, "mc": 100, "country": "USA"},
    {"ticker": "ETN", "safe_id": "ETN", "name": "Eaton Corporation", "sector": "Industrials", "lat": 40.72, "lng": -74.01, "mc": 120, "country": "USA"},
    {"ticker": "PH", "safe_id": "PH", "name": "Parker Hannifin", "sector": "Industrials", "lat": 40.74, "lng": -73.99, "mc": 75, "country": "USA"},
    {"ticker": "GE", "safe_id": "GE", "name": "GE Aerospace", "sector": "Industrials", "lat": 42.36, "lng": -71.06, "mc": 190, "country": "USA"},
    {"ticker": "RTX", "safe_id": "RTX", "name": "RTX Corporation", "sector": "Industrials", "lat": 42.37, "lng": -71.12, "mc": 145, "country": "USA"},
    {"ticker": "BIIB", "safe_id": "BIIB", "name": "Biogen Inc.", "sector": "Healthcare", "lat": 42.37, "lng": -71.08, "mc": 30, "country": "USA"},
    {"ticker": "TFC", "safe_id": "TFC", "name": "Truist Financial", "sector": "Financials", "lat": 42.35, "lng": -71.06, "mc": 55, "country": "USA"},
    {"ticker": "REGN", "safe_id": "REGN", "name": "Regeneron Pharma", "sector": "Healthcare", "lat": 41.09, "lng": -73.84, "mc": 100, "country": "USA"},
    {"ticker": "TSLA", "safe_id": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Disc", "lat": 30.22, "lng": -97.63, "mc": 800, "country": "USA"},
    {"ticker": "XOM", "safe_id": "XOM", "name": "Exxon Mobil", "sector": "Energy", "lat": 32.84, "lng": -96.78, "mc": 490, "country": "USA"},
    {"ticker": "ORCL", "safe_id": "ORCL", "name": "Oracle Corporation", "sector": "Technology", "lat": 30.4, "lng": -97.74, "mc": 380, "country": "USA"},
    {"ticker": "COP", "safe_id": "COP", "name": "ConocoPhillips", "sector": "Energy", "lat": 29.77, "lng": -95.37, "mc": 130, "country": "USA"},
    {"ticker": "EOG", "safe_id": "EOG", "name": "EOG Resources", "sector": "Energy", "lat": 29.75, "lng": -95.35, "mc": 70, "country": "USA"},
    {"ticker": "SLB", "safe_id": "SLB", "name": "Schlumberger Ltd.", "sector": "Energy", "lat": 29.76, "lng": -95.36, "mc": 65, "country": "USA"},
    {"ticker": "HAL", "safe_id": "HAL", "name": "Halliburton Co.", "sector": "Energy", "lat": 29.76, "lng": -95.38, "mc": 30, "country": "USA"},
    {"ticker": "PSX", "safe_id": "PSX", "name": "Phillips 66", "sector": "Energy", "lat": 29.78, "lng": -95.4, "mc": 50, "country": "USA"},
    {"ticker": "VLO", "safe_id": "VLO", "name": "Valero Energy", "sector": "Energy", "lat": 29.42, "lng": -98.49, "mc": 45, "country": "USA"},
    {"ticker": "OXY", "safe_id": "OXY", "name": "Occidental Petroleum", "sector": "Energy", "lat": 29.77, "lng": -95.37, "mc": 50, "country": "USA"},
    {"ticker": "TXN", "safe_id": "TXN", "name": "Texas Instruments", "sector": "Technology", "lat": 32.91, "lng": -96.75, "mc": 170, "country": "USA"},
    {"ticker": "DELL", "safe_id": "DELL", "name": "Dell Technologies", "sector": "Technology", "lat": 30.39, "lng": -97.73, "mc": 85, "country": "USA"},
    {"ticker": "KMI", "safe_id": "KMI", "name": "Kinder Morgan", "sector": "Energy", "lat": 29.76, "lng": -95.36, "mc": 45, "country": "USA"},
    {"ticker": "WMB", "safe_id": "WMB", "name": "Williams Companies", "sector": "Energy", "lat": 36.15, "lng": -95.99, "mc": 50, "country": "USA"},
    {"ticker": "APA", "safe_id": "APA", "name": "APA Corporation", "sector": "Energy", "lat": 29.77, "lng": -95.38, "mc": 15, "country": "USA"},
    {"ticker": "FANG", "safe_id": "FANG", "name": "Diamondback Energy", "sector": "Energy", "lat": 31.99, "lng": -102.08, "mc": 30, "country": "USA"},
    {"ticker": "KO", "safe_id": "KO", "name": "The Coca-Cola Company", "sector": "Consumer Staples", "lat": 33.79, "lng": -84.39, "mc": 260, "country": "USA"},
    {"ticker": "HD", "safe_id": "HD", "name": "Home Depot", "sector": "Consumer Disc", "lat": 33.88, "lng": -84.46, "mc": 360, "country": "USA"},
    {"ticker": "UPS", "safe_id": "UPS", "name": "United Parcel Service", "sector": "Industrials", "lat": 33.8, "lng": -84.33, "mc": 150, "country": "USA"},
    {"ticker": "ICE2", "safe_id": "ICE2", "name": "Intercontinental Exch.", "sector": "Financials", "lat": 33.75, "lng": -84.39, "mc": 70, "country": "USA"},
    {"ticker": "SO", "safe_id": "SO", "name": "Southern Company", "sector": "Utilities", "lat": 33.75, "lng": -84.39, "mc": 85, "country": "USA"},
    {"ticker": "SYY", "safe_id": "SYY", "name": "Sysco Corporation", "sector": "Consumer Staples", "lat": 29.76, "lng": -95.39, "mc": 40, "country": "USA"},
    {"ticker": "BAC", "safe_id": "BAC", "name": "Bank of America", "sector": "Financials", "lat": 35.23, "lng": -80.84, "mc": 310, "country": "USA"},
    {"ticker": "LOW", "safe_id": "LOW", "name": "Lowe's Companies", "sector": "Consumer Disc", "lat": 35.46, "lng": -80.87, "mc": 140, "country": "USA"},
    {"ticker": "DUK", "safe_id": "DUK", "name": "Duke Energy", "sector": "Utilities", "lat": 35.23, "lng": -80.84, "mc": 80, "country": "USA"},
    {"ticker": "UNH", "safe_id": "UNH", "name": "UnitedHealth Group", "sector": "Healthcare", "lat": 44.98, "lng": -93.47, "mc": 470, "country": "USA"},
    {"ticker": "TGT", "safe_id": "TGT", "name": "Target Corporation", "sector": "Consumer Disc", "lat": 44.95, "lng": -93.27, "mc": 75, "country": "USA"},
    {"ticker": "MMM", "safe_id": "MMM", "name": "3M Company", "sector": "Industrials", "lat": 44.95, "lng": -93.0, "mc": 60, "country": "USA"},
    {"ticker": "MDT", "safe_id": "MDT", "name": "Medtronic plc", "sector": "Healthcare", "lat": 44.97, "lng": -93.4, "mc": 110, "country": "USA"},
    {"ticker": "CAT", "safe_id": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials", "lat": 40.68, "lng": -89.59, "mc": 180, "country": "USA"},
    {"ticker": "ABT", "safe_id": "ABT", "name": "Abbott Laboratories", "sector": "Healthcare", "lat": 42.28, "lng": -87.85, "mc": 200, "country": "USA"},
    {"ticker": "ABBV", "safe_id": "ABBV", "name": "AbbVie Inc.", "sector": "Healthcare", "lat": 42.28, "lng": -87.95, "mc": 310, "country": "USA"},
    {"ticker": "MCD", "safe_id": "MCD", "name": "McDonald's Corp.", "sector": "Consumer Disc", "lat": 41.88, "lng": -87.64, "mc": 210, "country": "USA"},
    {"ticker": "BMY", "safe_id": "BMY", "name": "Bristol-Myers Squibb", "sector": "Healthcare", "lat": 41.88, "lng": -87.63, "mc": 105, "country": "USA"},
    {"ticker": "ADM", "safe_id": "ADM", "name": "Archer-Daniels-Midland", "sector": "Consumer Staples", "lat": 39.85, "lng": -89.64, "mc": 25, "country": "USA"},
    {"ticker": "DE", "safe_id": "DE", "name": "Deere & Company", "sector": "Industrials", "lat": 41.51, "lng": -90.52, "mc": 120, "country": "USA"},
    {"ticker": "CME2", "safe_id": "CME2", "name": "CME Group", "sector": "Financials", "lat": 41.88, "lng": -87.63, "mc": 80, "country": "USA"},
    {"ticker": "AIG", "safe_id": "AIG", "name": "American Intl Group", "sector": "Financials", "lat": 41.88, "lng": -87.64, "mc": 50, "country": "USA"},
    {"ticker": "CL", "safe_id": "CL", "name": "Colgate-Palmolive", "sector": "Consumer Staples", "lat": 41.88, "lng": -87.62, "mc": 75, "country": "USA"},
    {"ticker": "ALL", "safe_id": "ALL", "name": "Allstate Corp.", "sector": "Financials", "lat": 42.07, "lng": -87.81, "mc": 45, "country": "USA"},
    {"ticker": "F", "safe_id": "F", "name": "Ford Motor Company", "sector": "Consumer Disc", "lat": 42.33, "lng": -83.05, "mc": 50, "country": "USA"},
    {"ticker": "GM", "safe_id": "GM", "name": "General Motors", "sector": "Consumer Disc", "lat": 42.33, "lng": -83.04, "mc": 55, "country": "USA"},
    {"ticker": "DOW", "safe_id": "DOW", "name": "Dow Inc.", "sector": "Materials", "lat": 43.62, "lng": -84.25, "mc": 35, "country": "USA"},
    {"ticker": "PG", "safe_id": "PG", "name": "Procter & Gamble", "sector": "Consumer Staples", "lat": 39.1, "lng": -84.51, "mc": 380, "country": "USA"},
    {"ticker": "KR", "safe_id": "KR", "name": "Kroger Co.", "sector": "Consumer Staples", "lat": 39.1, "lng": -84.52, "mc": 40, "country": "USA"},
    {"ticker": "GPC", "safe_id": "GPC", "name": "Genuine Parts Co.", "sector": "Consumer Disc", "lat": 39.1, "lng": -84.5, "mc": 20, "country": "USA"},
    {"ticker": "CMCSA", "safe_id": "CMCSA", "name": "Comcast Corporation", "sector": "Communication", "lat": 39.95, "lng": -75.17, "mc": 160, "country": "USA"},
    {"ticker": "LIN", "safe_id": "LIN", "name": "Linde plc", "sector": "Materials", "lat": 39.95, "lng": -75.16, "mc": 200, "country": "USA"},
    {"ticker": "ADP", "safe_id": "ADP", "name": "Automatic Data Proc.", "sector": "Industrials", "lat": 39.95, "lng": -75.15, "mc": 110, "country": "USA"},
    {"ticker": "LMT", "safe_id": "LMT", "name": "Lockheed Martin", "sector": "Industrials", "lat": 38.9, "lng": -77.04, "mc": 130, "country": "USA"},
    {"ticker": "NOC", "safe_id": "NOC", "name": "Northrop Grumman", "sector": "Industrials", "lat": 38.92, "lng": -77.23, "mc": 75, "country": "USA"},
    {"ticker": "GD", "safe_id": "GD", "name": "General Dynamics", "sector": "Industrials", "lat": 38.87, "lng": -77.11, "mc": 80, "country": "USA"},
    {"ticker": "BKNG", "safe_id": "BKNG", "name": "Booking Holdings", "sector": "Consumer Disc", "lat": 38.9, "lng": -77.02, "mc": 150, "country": "USA"},
    {"ticker": "MDLZ", "safe_id": "MDLZ", "name": "Mondelez International", "sector": "Consumer Staples", "lat": 38.91, "lng": -77.04, "mc": 90, "country": "USA"},
    {"ticker": "WMT", "safe_id": "WMT", "name": "Walmart Inc.", "sector": "Consumer Staples", "lat": 36.37, "lng": -94.21, "mc": 730, "country": "USA"},
    {"ticker": "QCOM", "safe_id": "QCOM", "name": "Qualcomm Inc.", "sector": "Technology", "lat": 32.88, "lng": -117.2, "mc": 180, "country": "USA"},
    {"ticker": "ILMN", "safe_id": "ILMN", "name": "Illumina Inc.", "sector": "Healthcare", "lat": 32.89, "lng": -117.17, "mc": 25, "country": "USA"},
    {"ticker": "DIS", "safe_id": "DIS", "name": "Walt Disney Company", "sector": "Communication", "lat": 34.16, "lng": -118.33, "mc": 200, "country": "USA"},
    {"ticker": "AMGN", "safe_id": "AMGN", "name": "Amgen Inc.", "sector": "Healthcare", "lat": 34.17, "lng": -118.95, "mc": 145, "country": "USA"},
    {"ticker": "GILD", "safe_id": "GILD", "name": "Gilead Sciences", "sector": "Healthcare", "lat": 37.89, "lng": -122.24, "mc": 105, "country": "USA"},
    {"ticker": "BRK.B", "safe_id": "BRK_B", "name": "Berkshire Hathaway", "sector": "Financials", "lat": 41.25, "lng": -95.93, "mc": 800, "country": "USA"},
    {"ticker": "LRCX2", "safe_id": "LRCX2", "name": "Ball Corporation", "sector": "Materials", "lat": 39.74, "lng": -104.99, "mc": 20, "country": "USA"},
    {"ticker": "CBRE", "safe_id": "CBRE", "name": "CBRE Group", "sector": "Real Estate", "lat": 39.74, "lng": -104.98, "mc": 35, "country": "USA"},
    {"ticker": "DISH", "safe_id": "DISH", "name": "Dish Network", "sector": "Communication", "lat": 39.58, "lng": -104.87, "mc": 10, "country": "USA"},
    {"ticker": "NKE", "safe_id": "NKE", "name": "Nike Inc.", "sector": "Consumer Disc", "lat": 45.51, "lng": -122.68, "mc": 145, "country": "USA"},
    {"ticker": "EMRSN", "safe_id": "EMRSN", "name": "Emerson Electric", "sector": "Industrials", "lat": 38.63, "lng": -90.2, "mc": 55, "country": "USA"},
    {"ticker": "BUD", "safe_id": "BUD", "name": "Anheuser-Busch InBev", "sector": "Consumer Staples", "lat": 38.63, "lng": -90.19, "mc": 120, "country": "USA"},
    {"ticker": "BRK.A", "safe_id": "BRK_A", "name": "Berkshire Hathaway A", "sector": "Financials", "lat": 41.26, "lng": -95.94, "mc": 800, "country": "USA"},
    {"ticker": "TROW", "safe_id": "TROW", "name": "T. Rowe Price", "sector": "Financials", "lat": 41.76, "lng": -72.68, "mc": 25, "country": "USA"},
    {"ticker": "HIG", "safe_id": "HIG", "name": "Hartford Financial", "sector": "Financials", "lat": 41.77, "lng": -72.67, "mc": 30, "country": "USA"},
    {"ticker": "PPG", "safe_id": "PPG", "name": "PPG Industries", "sector": "Materials", "lat": 40.44, "lng": -80.0, "mc": 30, "country": "USA"},
    {"ticker": "USB", "safe_id": "USB", "name": "U.S. Bancorp", "sector": "Financials", "lat": 44.98, "lng": -93.27, "mc": 70, "country": "USA"},
    {"ticker": "AVGO", "safe_id": "AVGO", "name": "Broadcom Inc.", "sector": "Technology", "lat": 33.45, "lng": -112.07, "mc": 700, "country": "USA"},
    {"ticker": "ON", "safe_id": "ON", "name": "ON Semiconductor", "sector": "Technology", "lat": 33.44, "lng": -112.07, "mc": 35, "country": "USA"},
    {"ticker": "ZS", "safe_id": "ZS", "name": "Zscaler Inc.", "sector": "Technology", "lat": 40.76, "lng": -111.89, "mc": 30, "country": "USA"},
    {"ticker": "LVS", "safe_id": "LVS", "name": "Las Vegas Sands", "sector": "Consumer Disc", "lat": 36.17, "lng": -115.14, "mc": 35, "country": "USA"},
    {"ticker": "MRVL", "safe_id": "MRVL", "name": "Marvell Technology", "sector": "Technology", "lat": 35.78, "lng": -78.64, "mc": 65, "country": "USA"},
    {"ticker": "WRB", "safe_id": "WRB", "name": "W.R. Berkley Corp.", "sector": "Financials", "lat": 27.95, "lng": -82.46, "mc": 20, "country": "USA"},
    {"ticker": "CARR", "safe_id": "CARR", "name": "Carrier Global", "sector": "Industrials", "lat": 28.54, "lng": -81.38, "mc": 50, "country": "USA"},
    {"ticker": "WLTW", "safe_id": "WLTW", "name": "Willis Towers Watson", "sector": "Financials", "lat": 25.76, "lng": -80.19, "mc": 30, "country": "USA"},
    {"ticker": "CERN", "safe_id": "CERN", "name": "Cerner Corporation", "sector": "Healthcare", "lat": 39.1, "lng": -94.58, "mc": 25, "country": "USA"},
    {"ticker": "SPR", "safe_id": "SPR", "name": "Spirit AeroSystems", "sector": "Industrials", "lat": 37.69, "lng": -97.34, "mc": 10, "country": "USA"},
    {"ticker": "HCA", "safe_id": "HCA", "name": "HCA Healthcare", "sector": "Healthcare", "lat": 36.16, "lng": -86.78, "mc": 85, "country": "USA"},
    {"ticker": "DG", "safe_id": "DG", "name": "Dollar General", "sector": "Consumer Disc", "lat": 36.3, "lng": -86.59, "mc": 35, "country": "USA"},
    {"ticker": "CFG", "safe_id": "CFG", "name": "Citizens Financial", "sector": "Financials", "lat": 37.54, "lng": -77.44, "mc": 20, "country": "USA"},
    {"ticker": "ALGN", "safe_id": "ALGN", "name": "Align Technology", "sector": "Healthcare", "lat": 37.54, "lng": -77.43, "mc": 15, "country": "USA"},
    {"ticker": "LLY", "safe_id": "LLY", "name": "Eli Lilly and Company", "sector": "Healthcare", "lat": 39.77, "lng": -86.16, "mc": 700, "country": "USA"},
    {"ticker": "ANTM", "safe_id": "ANTM", "name": "Elevance Health", "sector": "Healthcare", "lat": 39.77, "lng": -86.15, "mc": 110, "country": "USA"},
    {"ticker": "TSMC", "safe_id": "TSMC", "name": "TSMC", "sector": "Technology", "lat": 24.78, "lng": 120.98, "mc": 650, "country": "Taiwan"},
    {"ticker": "ASML", "safe_id": "ASML", "name": "ASML Holdings", "sector": "Technology", "lat": 51.49, "lng": 5.46, "mc": 350, "country": "Netherlands"},
    {"ticker": "NVO", "safe_id": "NVO", "name": "Novo Nordisk", "sector": "Healthcare", "lat": 55.77, "lng": 12.52, "mc": 420, "country": "Denmark"},
    {"ticker": "SAP", "safe_id": "SAP", "name": "SAP SE", "sector": "Technology", "lat": 49.29, "lng": 8.64, "mc": 250, "country": "Germany"},
    {"ticker": "TM", "safe_id": "TM", "name": "Toyota Motor Corp.", "sector": "Consumer Disc", "lat": 35.08, "lng": 137.15, "mc": 300, "country": "Japan"},
    {"ticker": "SHEL", "safe_id": "SHEL", "name": "Shell plc", "sector": "Energy", "lat": 51.5, "lng": -0.12, "mc": 210, "country": "UK"},
    {"ticker": "NESN", "safe_id": "NESN", "name": "Nestl\u00e9 SA", "sector": "Consumer Staples", "lat": 46.46, "lng": 6.84, "mc": 280, "country": "Switzerland"},
    {"ticker": "ROCHE", "safe_id": "ROCHE", "name": "Roche Holding", "sector": "Healthcare", "lat": 47.56, "lng": 7.59, "mc": 220, "country": "Switzerland"},
    {"ticker": "SONY", "safe_id": "SONY", "name": "Sony Group Corp.", "sector": "Technology", "lat": 35.66, "lng": 139.75, "mc": 130, "country": "Japan"},
    {"ticker": "BABA", "safe_id": "BABA", "name": "Alibaba Group", "sector": "Consumer Disc", "lat": 30.27, "lng": 120.15, "mc": 200, "country": "China"},
    {"ticker": "SMSN", "safe_id": "SMSN", "name": "Samsung Electronics", "sector": "Technology", "lat": 37.24, "lng": 127.0, "mc": 350, "country": "South Korea"},
]

# Fix #4: All edge tickers must match safe_id values in SP500_COMPANIES
# Fix #96: removed LRCX2/ICE2/CME2 aliases from edges
SUPPLY_CHAIN_EDGES = [
    # SEMICONDUCTOR FAB (Taiwan-centric)
    ("TSMC","NVDA","chip_fab",0.90,"Manufactures 100% of NVIDIA GPUs"),
    ("TSMC","AAPL","chip_fab",0.85,"A-series and M-series chip production"),
    ("TSMC","AMD","chip_fab",0.88,"Primary fab for Ryzen, EPYC, Instinct"),
    ("TSMC","QCOM","chip_fab",0.82,"Snapdragon and 5G modem production"),
    ("TSMC","AVGO","chip_fab",0.70,"Custom ASIC fabrication"),
    ("TSMC","INTC","chip_fab",0.20,"Some outsourced advanced nodes"),
    ("TSMC","MRVL","chip_fab",0.65,"Marvell custom silicon"),
    # SEMICONDUCTOR EQUIPMENT
    ("ASML","TSMC","component",0.85,"Sole EUV lithography supplier"),
    ("ASML","SMSN","component",0.70,"EUV for Samsung foundry"),
    ("ASML","INTC","component",0.65,"EUV for Intel foundry"),
    ("AMAT","TSMC","component",0.50,"Deposition and etch equipment"),
    ("LRCX","TSMC","component",0.45,"Etch and deposition tools"),
    ("KLAC","TSMC","component",0.40,"Wafer inspection and metrology"),
    ("SNPS","NVDA","component",0.40,"EDA verification for GPU designs"),
    ("CDNS","AMD","component",0.35,"EDA for CPU/GPU design"),
    # AI COMPUTE
    ("NVDA","MSFT","ai_compute",0.60,"Azure AI H100/B200 GPUs"),
    ("NVDA","GOOGL","ai_compute",0.55,"GCP AI/ML training"),
    ("NVDA","AMZN","ai_compute",0.50,"AWS GPU clusters"),
    ("NVDA","META","ai_compute",0.45,"LLaMA training H100 clusters"),
    ("NVDA","ORCL","ai_compute",0.40,"OCI AI infrastructure"),
    ("NVDA","TSLA","ai_compute",0.35,"Dojo + FSD inference"),
    ("NVDA","DELL","ai_compute",0.45,"PowerEdge servers"),
    ("NVDA","IBM","ai_compute",0.20,"watsonx infrastructure"),
    # CLOUD PROVIDER
    ("AMZN","NFLX","cloud_provider",0.35,"Netflix runs on AWS"),
    ("AMZN","BKNG","cloud_provider",0.30,"Booking primary cloud"),
    ("AMZN","DIS","cloud_provider",0.25,"Disney+ on AWS"),
    ("MSFT","SAP","cloud_provider",0.30,"SAP on Azure"),
    # COMPONENT
    ("AAPL","QCOM","component",0.40,"5G modem chips for iPhone"),
    ("AAPL","TXN","component",0.30,"Power management ICs"),
    ("AVGO","AAPL","component",0.35,"Wi-Fi and Bluetooth chips"),
    ("INTC","DELL","component",0.50,"CPUs for Dell servers/PCs"),
    ("AMD","DELL","component",0.40,"EPYC server CPUs"),
    ("AMD","MSFT","component",0.35,"Xbox APUs and Azure CPUs"),
    ("QCOM","SMSN","component",0.30,"Snapdragon for Samsung phones"),
    ("TSLA","NVDA","component",0.25,"FSD inference chips"),
    # ENERGY
    ("XOM","CVX","sector_peer",0.30,"Correlated crude oil exposure"),
    ("COP","EOG","sector_peer",0.25,"Correlated US shale"),
    ("XOM","SLB","sector_peer",0.25,"Oilfield services client"),
    ("SHEL","XOM","sector_peer",0.30,"Global oil major correlation"),
    # FINANCIAL
    ("JPM","BAC","sector_peer",0.25,"Interest rate correlation"),
    ("JPM","C","sector_peer",0.25,"Universal bank correlation"),
    ("GS","MS","sector_peer",0.30,"Investment banking correlation"),
    ("V","MA","sector_peer",0.40,"Payment network correlation"),
    ("AXP","V","sector_peer",0.20,"Consumer payment correlation"),
    # HEALTHCARE
    ("PFE","JNJ","sector_peer",0.20,"Pharma sector correlation"),
    ("MRK","PFE","sector_peer",0.20,"Pharma R&D/pricing"),
    ("ABT","MDT","sector_peer",0.25,"Medical device correlation"),
    ("UNH","HCA","sector_peer",0.30,"Payer/provider correlation"),
    # AUTOMOTIVE
    ("F","GM","sector_peer",0.35,"US auto production correlation"),
    ("TM","SMSN","component",0.20,"Samsung EV battery cells"),
    # LOGISTICS
    ("UPS","AMZN","logistics",0.30,"Major parcel delivery partner"),
    ("UPS","WMT","logistics",0.20,"Walmart e-commerce delivery"),
    ("UPS","HD","logistics",0.15,"Home delivery logistics"),
    ("WMT","PG","logistics",0.20,"P&G largest retail customer"),
    ("WMT","KO","logistics",0.15,"Coca-Cola retail channel"),
    # DEFENCE
    ("LMT","RTX","sector_peer",0.25,"US defence budget correlation"),
    ("LMT","NOC","sector_peer",0.25,"Defence prime correlation"),
    ("BA","GE","component",0.40,"GE engines for 737/787"),
    ("BA","RTX","component",0.35,"P&W engines for Boeing"),
    ("CAT","DE","sector_peer",0.25,"Heavy equipment demand"),
    # SOFTWARE
    ("ORCL","SAP","sector_peer",0.25,"Enterprise ERP/DB"),
    ("NOW","CRM","sector_peer",0.20,"Enterprise SaaS"),
    # MEDIA
    ("DIS","NFLX","sector_peer",0.25,"Streaming content spend"),
    ("CMCSA","DIS","sector_peer",0.20,"Media conglomerate"),
    # CHINA
    ("AAPL","BABA","logistics",0.15,"China supply chain exposure"),
    ("NVDA","BABA","ai_compute",0.15,"Restricted chip exports"),
    ("QCOM","BABA","component",0.20,"Chips in Chinese phones"),
    # CONSUMER / RETAIL cross-links
    ("NKE","BABA","logistics",0.15,"Nike China manufacturing exposure"),
    ("COST","PG","logistics",0.10,"Costco retail channel for P&G"),
    ("TGT","PG","logistics",0.10,"Target retail channel for P&G"),
    ("MCD","KO","logistics",0.20,"McDonald's serves Coca-Cola products"),
    ("SBUX","COST","sector_peer",0.10,"Consumer retail correlation"),
    # ADDITIONAL SEMICONDUCTOR paths (deeper graph)
    ("SNPS","TSMC","component",0.55,"EDA chip design verification"),
    ("CDNS","TSMC","component",0.50,"EDA physical design tools"),
    ("AMAT","SMSN","component",0.35,"Samsung fab equipment"),
    ("LRCX","SMSN","component",0.30,"Samsung etch tools"),
    ("ON","TSLA","component",0.30,"Power semiconductors for EVs"),
    ("ON","F","component",0.20,"Power semis for Ford EVs"),
    ("TXN","TSLA","component",0.15,"Analog chips for Tesla"),
    # CLOUD second-order
    ("AMZN","CRM","cloud_provider",0.20,"Salesforce on AWS"),
    ("MSFT","NOW","cloud_provider",0.20,"ServiceNow on Azure"),
    ("GOOGL","DIS","cloud_provider",0.15,"Disney analytics on GCP"),
    # MORE FINANCIAL cross-links
    ("JPM","MS","sector_peer",0.20,"Investment banking correlation"),
    ("BAC","GS","sector_peer",0.15,"Capital markets correlation"),
    ("BLK","JPM","sector_peer",0.20,"Asset management flows"),
    ("SCHW","BAC","sector_peer",0.15,"Retail brokerage correlation"),
    # HEALTHCARE deeper
    ("LLY","PFE","sector_peer",0.20,"Pharma pipeline correlation"),
    ("LLY","NVO","sector_peer",0.30,"Obesity/diabetes drug competition"),
    ("GILD","MRK","sector_peer",0.15,"Antiviral pharma correlation"),
    ("BIIB","AMGN","sector_peer",0.20,"Biotech sector correlation"),
    # INDUSTRIAL cross-links
    ("GE","BA","component",0.40,"Jet engines for Boeing"),
    ("RTX","LMT","sector_peer",0.25,"Defence systems correlation"),
    ("GD","RTX","sector_peer",0.20,"Defence electronics"),
    ("ETN","CAT","sector_peer",0.15,"Industrial equipment"),
    ("MMM","CAT","sector_peer",0.10,"Industrial manufacturing"),
    # JAPAN / KOREA exposure
    ("SONY","SMSN","sector_peer",0.25,"Consumer electronics competition"),
    ("TM","F","sector_peer",0.20,"Global auto market correlation"),
    ("TM","GM","sector_peer",0.20,"Global auto market correlation"),
    # UTILITY peers
    ("SO","DUK","sector_peer",0.30,"Southeast US utility correlation"),
]

# Fix #4: Build set of valid safe_ids for edge validation
_VALID_IDS = {safe_surreal_id(c["ticker"]) for c in SP500_COMPANIES}


def seed_companies():
    db = get_db()
    logger.info(f"Seeding {len(SP500_COMPANIES)} companies...")
    created = 0
    for company in SP500_COMPANIES:
        sid = safe_surreal_id(company["ticker"])
        data = {k: v for k, v in company.items() if k not in ("safe_id",)}
        try:
            db.query(f"CREATE company:{sid} CONTENT $data", {"data": data})
            created += 1
        except Exception as e:
            s = str(e).lower()
            if "already exists" in s or "unique" in s or "exist" in s:
                pass  # Fix #41: only skip true duplicates
            else:
                logger.warning(f"Seed company {sid}: {e}")
    logger.info(f"Companies: {created} created")


def seed_supply_chain():
    db = get_db()
    logger.info(f"Seeding {len(SUPPLY_CHAIN_EDGES)} supply chain edges...")

    # Try langchain-surrealdb dual-write
    use_graph = False
    try:
        from db.langchain_stores import add_supply_chain_to_graph
        use_graph = True
    except Exception:
        pass

    created = 0
    skipped = 0
    for from_t, to_t, rel, weight, desc in SUPPLY_CHAIN_EDGES:
        from_id = safe_surreal_id(from_t)
        to_id = safe_surreal_id(to_t)

        # Fix #4: validate both ends exist
        if from_id not in _VALID_IDS or to_id not in _VALID_IDS:
            logger.debug(f"Skipping edge {from_id}->{to_id}: endpoint not in company list")
            skipped += 1
            continue

        try:
            db.query(
                f"RELATE company:{from_id}->supplies->company:{to_id} "
                f"SET relationship = $rel, weight = $weight, description = $desc",
                {"rel": rel, "weight": weight, "desc": desc}
            )
            created += 1
        except Exception as e:
            logger.debug(f"Edge {from_id}->{to_id}: {e}")

        if use_graph:
            try:
                add_supply_chain_to_graph(from_t, to_t, rel, weight, desc)
            except Exception:
                pass

    # Fix #42: report created count, not total
    logger.info(f"Supply chain: {created} edges created, {skipped} skipped (invalid endpoints)")


def seed_all():
    from db.surreal import run_schema
    run_schema()
    seed_companies()
    seed_supply_chain()
    logger.info("Seed complete.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from db.surreal import connect
    connect()
    seed_all()
