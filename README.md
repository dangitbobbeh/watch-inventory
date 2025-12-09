# ⌚ Watch Inventory

A full-stack inventory management system for luxury watch dealers, featuring AI-powered CSV import, profit analytics, and real-time business insights.

**Live Demo:** [watch-inventory-two.vercel.app](https://watch-inventory-two.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Tests](https://img.shields.io/badge/Tests-120+-brightgreen?style=flat-square)

<img width="1230" height="762" alt="Screenshot 2025-12-08 at 2 26 12 PM" src="https://github.com/user-attachments/assets/9db8541e-e7f3-461b-94d4-7ed0d13b8695" />

## ✨ Features

### 🤖 AI-Powered CSV Import

Upload any CSV format and Claude automatically maps columns to the correct fields—no manual configuration required.

- **Smart column detection**: "Price Paid" → `purchasePrice`, "S/N" → `serial`, "Sold For" → `salePrice`
- **Status normalization**: Handles 15+ variations ("For Sale", "Listed", "Available" → `in_stock`)
- **Flexible date parsing**: ISO, US (MM/DD/YYYY), European (DD-MM-YYYY), natural language
- **Currency formatting**: Strips symbols and commas ($12,500.00 → 12500)
- **Custom fields**: Columns that don't fit the schema are preserved as JSON
- **Two import modes**: Create new inventory OR update existing watches with sale data

### 📊 Inventory Management

- Track watches with detailed specs (brand, model, reference, serial, year, condition, accessories)
- Record full purchase details (source, price, shipping, service costs)
- Track sales with complete cost breakdown (platform fees, marketing, shipping, tax)
- Automatic profit/loss calculation per watch
- Filter and search by brand, model, reference, status, source, or platform
- Sortable columns with pagination

### 💰 Financial Analytics

- Real-time dashboard: inventory count, total sales, profit, average margin
- Detailed P&L breakdown per transaction
- ROI and margin calculations
- Support for cents-level precision

### 📈 Reports

- Profit breakdown by brand, source, and sale platform
- Monthly performance trends
- Top and bottom performers
- Inventory aging analysis (days in stock)
- Average days to sell metrics

### 🧠 AI Business Tools

- **Pricing Assistant**: Get purchase recommendations based on your historical sales data
- **Inventory Advisor**: Actionable insights on slow movers, pricing adjustments, and opportunities
- **Business Chat**: Natural language queries ("What's my best brand?", "How did Q3 compare to Q2?")

### 🎨 Modern UI/UX

- Dark mode with system preference detection
- Keyboard shortcuts (press `?` to view all)
- Toast notifications for all actions
- Form autocomplete from your historical data
- Contextual empty states
- Mobile-responsive design

## 🛠 Tech Stack

| Category  | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js 15 (App Router, Turbopack) |
| Language  | TypeScript                         |
| Database  | PostgreSQL (Neon)                  |
| ORM       | Prisma                             |
| Auth      | NextAuth.js v5 (Google OAuth)      |
| AI        | Anthropic Claude API               |
| Styling   | Tailwind CSS 4                     |
| Testing   | Jest, Testing Library              |
| CI/CD     | GitHub Actions, Vercel             |

## 🧪 Testing

The project includes 120+ tests covering:

- **Unit tests**: Import utilities, profit calculations, data parsing
- **Integration tests**: CSV import with 10 different file formats
- **Component tests**: UI components with Testing Library

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Tests run automatically on every push—failed tests block deployment.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- Anthropic API key

### Installation

```bash
# Clone the repo
git clone https://github.com/dangitbobbeh/watch-inventory.git
cd watch-inventory

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Set up database
npx prisma migrate dev

# Start dev server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/watch_inventory"
ANTHROPIC_API_KEY="sk-ant-..."
AUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth client ID** → **Web application**
4. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-domain.vercel.app/api/auth/callback/google` (prod)

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add Postgres via Vercel Storage (Neon)
4. Set environment variables
5. Deploy

Migrations run automatically via the build command.

## 📄 CSV Import

The AI import handles any column naming, but here's what it looks for:

### Watch Details

Brand, Model, Reference/Ref #, Serial/S/N, Year, Material, Dial Color, Diameter, Condition, Accessories

### Purchase Info

Purchase Date, Source/Dealer/Bought From, Cost/Price Paid, Shipping, Service/Repair Costs

### Sale Info

Sale Date, Sale Price/Sold For, Platform, Fees/Commission, Tax, Shipping Out, Marketing

### Status

"For Sale", "Available", "Listed" → `in_stock`  
"Sold", "Completed", "Closed" → `sold`  
"Traded", "Trade" → `traded`  
"Consigned", "Memo" → `consigned`

Unrecognized columns are stored as custom data and displayed on the watch detail page.

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by [David Bernstein](https://github.com/dangitbobbeh)
