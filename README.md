# SmartKosh - AI-Powered Personal Finance Assistant

SmartKosh is a modern personal finance management application that leverages AI to provide personalized financial insights, budgeting assistance, and financial advice.

## Features

- **Smart Budgeting**: AI-powered budget recommendations based on spending patterns
- **Expense Tracking**: Automatically categorize and track expenses
- **Financial Insights**: Get personalized financial insights and recommendations
- **Goal Planning**: Set and track financial goals with AI assistance
- **Investment Tracking**: Monitor investments and get performance insights
- **Financial Chat**: Ask questions about your finances to our AI assistant

## Tech Stack

- **Frontend & Backend**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API
- **Deployment**: Vercel with Supabase

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or hosted)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/codanda-io/smartkosh.git
   cd smartkosh
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your database connection string and API keys

4. Set up the database
   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment on Vercel with Supabase

### Step 1: Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database to find your connection string
3. Copy the PostgreSQL connection string, which looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
   ```

### Step 2: Deploy to Vercel

1. Push your code to GitHub
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. Create a new project on [Vercel](https://vercel.com):
   - Connect your GitHub repository
   - Set the framework preset to "Next.js"
   - Under "Build & Development Settings":
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your production URL (e.g., https://smartkosh.vercel.app)
   - `JWT_SECRET`: Generate another secure string
   - `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)

4. Deploy your application
5. After deployment, initialize your database:
   ```bash
   npx vercel env pull .env.local
   npx prisma db push
   ```

## Database Schema

The application uses the following main models:
- User
- Account
- Transaction
- Budget
- FinancialGoal

See `prisma/schema.prisma` for the complete schema definition.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
