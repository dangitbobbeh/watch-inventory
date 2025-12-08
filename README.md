# Watch Inventory

A full-stack web application for watch dealers and collectors to manage inventory, track profits, and get AI-powered insights.

**Live Demo:** [watch-inventory-two.vercel.app](https://watch-inventory-two.vercel.app/)
<img width="1180" height="761" alt="Screenshot 2025-12-08 at 2 19 56 PM" src="https://github.com/user-attachments/assets/cb3c13b8-1433-41f8-a0b2-9457edc486cb" />


## Features

### Inventory Management

- Track watches with detailed specs (brand, model, reference, year, condition, accessories)
- Record purchase details including source, price, shipping, and additional costs
- Track sales with full cost breakdown (platform fees, marketing, shipping, sales tax)
- Automatic profit calculation per watch
- Filter and search by brand, model, reference, status, source, or platform

### Financial Tracking

- Dashboard with real-time stats: inventory value, total profit, average margins
- Detailed profit breakdown per transaction
- Support for cents-level precision on all financial fields

### Reports & Analytics

- Profit by brand, source, and sale platform
- Monthly performance trends
- Top and bottom performers
- Inventory aging analysis (days in stock)
- Average days to sell metrics

### AI-Powered Tools

- **Pricing Assistant**: Describe a watch you're considering and get purchase recommendations based on your sales history
- **Inventory Advisor**: Get actionable insights on slow movers, pricing adjustments, and acquisition opportunities
- **Business Chat**: Ask natural language questions about your business ("What's my best performing brand?", "How did Q3 compare to Q2?")

### Data Import

- Bulk import from CSV (Google Sheets export)
- Separate inventory and sales sheet support
- Automatic field mapping

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (Google OAuth)
- **AI**: Anthropic Claude API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Google OAuth credentials
- Anthropic API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dangitbobbeh/watch-inventory.git
   cd watch-inventory
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in your `.env` file:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/watch_inventory"
   ANTHROPIC_API_KEY="sk-ant-..."
   AUTH_SECRET="generate-with-openssl-rand-base64-32"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. Set up the database:

   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your `.env` file

### Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add a Postgres database (Neon recommended via Vercel Storage)
4. Set environment variables in Vercel dashboard
5. Deploy

After deployment, run migrations against production:

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

Don't forget to add your production callback URL to Google OAuth.

## CSV Import Format

### Inventory Sheet

| Column                           | Description                             |
| -------------------------------- | --------------------------------------- |
| ID                               | Unique identifier (used to match sales) |
| Brand                            | Watch brand                             |
| Model                            | Watch model                             |
| Material                         | Case material                           |
| Reference Number                 | Reference/model number                  |
| Year                             | Production year                         |
| Accessories                      | Box, papers, etc.                       |
| Comments                         | Notes                                   |
| Purchase Date                    | Date acquired                           |
| Purchase Location                | Source (eBay, dealer, etc.)             |
| Purchase Price                   | Amount paid                             |
| Shipping Cost                    | Inbound shipping                        |
| Additional Costs (service, etc.) | Service, repairs, etc.                  |

### Sales Sheet

| Column         | Description                     |
| -------------- | ------------------------------- |
| Sale ID        | Unique sale identifier          |
| Watch ID       | Matches ID from inventory sheet |
| Sale Platform  | Where it sold                   |
| Sale Date      | Date of sale                    |
| Sold Price     | Total sale price                |
| Sales Tax      | Tax collected                   |
| Platform Fees  | eBay, PayPal fees, etc.         |
| Marketing Fees | Advertising costs               |
| Shipping Cost  | Outbound shipping               |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.
