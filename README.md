# Comfy's Decor Accessories — Modern Home, Kitchen & Office Décor

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-336791.svg)](https://neon.tech/)
[![Currency](https://img.shields.io/badge/Currency-GH%E2%82%B5%20(Ghanaian%20Cedis)-brightgreen.svg)]()
[![Ordering](https://img.shields.io/badge/Ordering-WhatsApp%20Direct-25D366.svg)](https://wa.me/233595427789)

A responsive, product-focused web catalog and order-routing application designed for **Comfy's Decor Accessories**, a Ghanaian retail brand offering curated decorative and functional accessories for homes, living rooms, kitchens, dining areas, and offices.

Customers can easily browse catalog pieces, filter by category or stock availability, view detailed physical specifications, and place single-click orders directly with the store via WhatsApp. A private, authenticated administrator portal enables live inventory management, product editing, and store contact updates backed by **Neon PostgreSQL**.

---

## 🌟 Key Features

### Shopper Experience
- **Mobile-First Responsive Design**: Optimized for smartphones with compact 2-column product grids, horizontally scrollable carousels, and edge-to-edge product viewing.
- **Instant Search & Category Filtering**: Filter across *Sculptures & Figurines*, *Decorative Lighting*, *Kitchen Accessories*, *Decorative Vases*, *Tabletop Accessories*, *Office Décor*, and *Wall Décor*.
- **Interactive Product Drawer**: Click any item to inspect multi-angle image galleries, material specifications, dimensions, suggested room placements, and stock availability.
- **Seamless WhatsApp Order Dispatch**: Automatically generates a pre-formatted WhatsApp order message including product title, SKU, and Ghanaian Cedis (GH₵) price routed to the store owner's WhatsApp (`059 542 7789`).
- **Snapchat Integration**: Direct profile links to `@comfys_decorate`.
- **Zero Distractions**: Clean, predominantly white brand identity with gold, charcoal, and warm neutral accents.

### Administrative Management (Private Portal)
- **Discreet Access**: The admin login is completely hidden from the public storefront. Store owners access the dashboard via a direct private URL (`/admin`, `/login`, or `/#admin`).
- **Live Inventory Registry**:
  - Quick stock increment/decrement buttons (`+` / `-`).
  - Instant Live / Draft visibility toggles.
  - Search and filter by publication status and low-stock alerts.
- **Product Editor**: Add new catalog pieces or modify titles, SKUs, categories, prices, materials, dimensions, and images.
- **Dynamic Store Settings**: Edit store WhatsApp number, display phone, Snapchat handle, delivery notice, operating hours, and banner announcements in real-time without modifying code.
- **Backup & Migration**: One-click JSON catalog export and bulk import tools.
- **Database Synchronization**: Authoritative persistence in Neon PostgreSQL with zero mock-data regressions.

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express.js
- **Database**: [Neon](https://neon.tech) Serverless PostgreSQL (`pg` driver with SSL pooling)
- **Frontend**: Vanilla HTML5, CSS3 (Modern Flexbox & CSS Grid, Custom Properties), ES6+ JavaScript
- **Security**: HMAC-SHA256 authenticated admin sessions, constant-time signature verification, and parameter-sanitized SQL queries.

---

## 📁 Repository Structure

```
catalog/
├── assets/                  # Brand assets (logo, promotional posters)
│   ├── comfys_logo.png
│   └── comfys_flyer.png
├── app.js                   # Client-side state engine, search, filters & admin UI
├── db.js                    # Neon PostgreSQL schema migrations, pool, & queries
├── index.html               # Semantic HTML markup (Storefront & Admin Views)
├── package.json             # Project dependencies & startup scripts
├── server.js                # Express API endpoints & static file serving
├── styles.css               # Mobile-first stylesheet with design tokens
├── .env.example             # Template for required environment variables
├── .gitignore               # Excludes secrets, dependencies, and OS files
└── README.md                # Project documentation & deployment guide
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL 14+ instance)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/comfys-decor-accessories.git
cd comfys-decor-accessories
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

Open `.env` and fill in your connection details:
```env
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://neondb_owner:your_password@ep-your-instance.region.aws.neon.tech/neondb?sslmode=require

# Application port
PORT=3000

# Administrator credentials & token secret
ADMIN_PASSWORD=comfy2026
AUTH_SECRET=your_super_secret_signing_key_here
```

### 4. Run the application
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> On initial startup, `db.js` will automatically create the required database tables (`products`, `admins`, `store_info`) and seed the 12 signature promotional flyer products if the tables are empty.

---

## 🔐 Store Administrator Access

The administrative workspace is accessible only through private routes:

- **Login URL**: `http://localhost:3000/admin` (or `/login`, `/#admin`)
- **Default Username**: `admin` *(or `comfysdecor@gmail.com`)*
- **Default Password**: `comfy2026`

Once authenticated, admins can navigate between the public storefront and the admin registry using the topbar badge.

---

## 🌐 Deploying to Production

### Deploying to Render / Railway / Fly.io

1. **Push your code to GitHub** (ensure `.env` is never committed; verify that `.gitignore` is in place).
2. Create a new **Web Service** linked to your repository.
3. Configure the build and start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set the **Environment Variables** in your hosting dashboard:
   - `DATABASE_URL`: Your production Neon PostgreSQL connection string.
   - `PORT`: Usually injected automatically by the platform, or default to `3000`.
   - `ADMIN_PASSWORD`: A strong password for the store administrator.
   - `AUTH_SECRET`: A secure random phrase for HMAC token generation.
5. Deploy! Your app will be live with full database persistence.

---

## 📄 License

This project is licensed under the ISC License. Brand assets, product imagery, and trademarks belong to **Comfy's Decor Accessories**.
