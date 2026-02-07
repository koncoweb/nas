# Marine Engineering Project Management System

A comprehensive project management system for marine engineering companies, built with React Router 7, Hono, and Neon PostgreSQL.

## Features

- 📋 **Quotation Management** - Create and manage price quotations
- 🏗️ **Project Tracking** - Track project progress and status
- 👥 **Customer Management** - Maintain customer database
- 🔧 **Materials Catalog** - Track materials and costs
- 📦 **Material Requests** - Request materials and operational costs
- 💰 **Expense Tracking** - Record project and operational expenses
- 🧾 **Invoice Generation** - Generate and track invoices
- 📊 **Reporting** - Create completion reports
- 👤 **Role-Based Access** - Leader, Sales, Accounting, Engineer roles

## Tech Stack

- **Frontend**: React 18, React Router 7, Tailwind CSS
- **Backend**: Hono (Edge-first framework)
- **Database**: Neon PostgreSQL (Serverless)
- **Deployment**: Vercel (Serverless Functions)
- **Authentication**: Auth.js with credentials provider
- **UI Theme**: Modern Corporate Blue with Line Icons

## 🎨 Modern UI Theme

The application features a modern corporate design with:
- **Primary Blue** color scheme (#2563eb)
- **Line-style icons** for clean, professional look
- **Smooth transitions** and hover effects
- **Accessible** focus states and color contrast
- **Responsive** design for all screen sizes

### UI Documentation
- **[STYLING_DOCS_INDEX.md](./STYLING_DOCS_INDEX.md)** - Complete styling documentation index
- **[STYLING_GUIDE.md](./STYLING_GUIDE.md)** - Comprehensive styling guide
- **[QUICK_STYLING_REFERENCE.md](./QUICK_STYLING_REFERENCE.md)** - Quick copy-paste reference
- **Demo Page**: Visit `/ui-demo` to see all components in action

## Quick Start

### Prerequisites

- Node.js 20+
- Neon PostgreSQL database
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   DATABASE_URL=postgresql://...
   AUTH_SECRET=your-secret-key-min-32-chars
   CORS_ORIGINS=http://localhost:5173
   ```

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:5173
   ```

## Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### Manual Deployment

See detailed instructions in:
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

**Quick steps:**

1. Create Neon database
2. Push code to GitHub
3. Import to Vercel
4. Add environment variables
5. Deploy!

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # React Router routes
│   │   ├── api/          # API routes (Hono)
│   │   ├── account/      # Auth pages
│   │   ├── quotations/   # Quotation pages
│   │   ├── projects/     # Project pages
│   │   └── ...
│   ├── components/       # React components
│   └── utils/            # Utility functions
├── scripts/
│   └── migrate.js        # Database migration script
├── api/
│   └── index.js          # Vercel serverless function
├── public/               # Static assets
├── vercel.json           # Vercel configuration
├── vercel-build.js       # Custom build script
└── package.json
```

## Database Schema

The application uses 13+ tables:

- **Authentication**: auth_users, auth_accounts, auth_sessions
- **Core Business**: customers, materials, quotations, projects
- **Workflow**: material_requests, approval_workflows
- **Financial**: invoices, payments, project_costs
- **Reporting**: project_reports

See [MIGRATION.md](./MIGRATION.md) for complete schema details.

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/profile` - Get user profile

### Core Resources
- `/api/customers` - Customer management
- `/api/materials` - Materials catalog
- `/api/quotations` - Quotation management
- `/api/projects` - Project tracking
- `/api/material-requests` - Material requests
- `/api/costs` - Expense tracking
- `/api/invoices` - Invoice management
- `/api/reports` - Project reports

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/financial/summary` - Financial summary

## User Roles

### Leader (Admin)
- Full access to all features
- Can manage all resources
- Access to financial data
- User management

### Sales
- Create and manage quotations
- Manage customers
- Create projects
- View reports

### Accounting
- Manage invoices
- View financial data
- Approve expenses
- Generate reports

### Engineer
- View assigned projects
- Create material requests
- Track project costs
- Limited financial access

## Environment Variables

### Required

```env
DATABASE_URL=postgresql://...          # Neon database connection
AUTH_SECRET=...                        # Min 32 characters
CORS_ORIGINS=https://your-app.com     # Your domain
NODE_ENV=production                    # Environment
```

### Optional

```env
NEXT_PUBLIC_CREATE_BASE_URL=...       # Create.xyz integration
NEXT_PUBLIC_CREATE_HOST=...
NEXT_PUBLIC_PROJECT_GROUP_ID=...
```

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run migrate          # Run migrations
npm run migrate:verify   # Verify schema

# Deployment
npm run deploy:vercel    # Deploy to production
npm run deploy:preview   # Deploy preview
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Documentation

### Deployment & Setup
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Vercel deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deployment checklist
- **[MIGRATION.md](./MIGRATION.md)** - Database migration guide
- **[ENDPOINT_FIXES.md](./ENDPOINT_FIXES.md)** - API endpoint fixes
- **[DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md)** - Demo account setup
- **[AUTH_TESTING.md](./AUTH_TESTING.md)** - Authentication testing

### UI & Styling
- **[STYLING_DOCS_INDEX.md](./STYLING_DOCS_INDEX.md)** - 📚 Start here for styling docs
- **[STYLING_GUIDE.md](./STYLING_GUIDE.md)** - Complete styling guide
- **[QUICK_STYLING_REFERENCE.md](./QUICK_STYLING_REFERENCE.md)** - Quick reference
- **[MODERN_STYLING_UPDATE.md](./MODERN_STYLING_UPDATE.md)** - Update overview
- **[STYLING_CHANGES_SUMMARY.md](./STYLING_CHANGES_SUMMARY.md)** - Technical summary
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - UI testing checklist
- **Demo Page**: `/ui-demo` - Interactive component showcase

## Security

- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation on all endpoints
- ✅ Role-based access control
- ✅ Secure password hashing (Argon2)
- ✅ HTTPS enforced (Vercel)
- ✅ CORS configured
- ✅ Security headers enabled

## Performance

- ⚡ Serverless functions (auto-scaling)
- ⚡ Edge CDN for static assets
- ⚡ Database connection pooling
- ⚡ Optimized queries with indexes
- ⚡ Code splitting and lazy loading

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- Check documentation in `/docs`
- Review [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Open an issue on GitHub

## Acknowledgments

- React Router team
- Hono framework
- Neon database
- Vercel platform

---

**Ready to deploy?** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete instructions! 🚀