# ⚡ Dropper OS — Multi-Store E-Commerce Operating System & Fleet Command Center

Dropper OS is an institutional-grade, web-based e-commerce operating system, fleet manager, and autonomous engine designed for high-density multi-store DTC brands.

---

## 1. Quick Start

```bash
# Navigate to Dropper OS directory
cd dropper-os

# Install dependencies
npm install

# Start local command center on port 3000
npm run dev

# Or launch background internet telemetry daemon
node dropper-daemon.js
```

Open [http://localhost:3000](http://localhost:3000) to view the Dropper OS Desktop Command Center.

---

## 2. Core Capabilities

- **Multi-Tenant Shopify Telemetry (`lib/shopify-client.ts`):** Live polling across all registered stores (sales, AOV, inventory buffers, cart abandonment).
- **GitHub Auto-Commit Engine (`lib/github-client.ts`):** Octokit integration that pushes code updates directly to the repository and triggers GitHub Actions CI/CD.
- **Dynamic Theme Injector (`lib/dynamic-engine.ts`):** 1-click injection of high-converting dynamic components (Free Shipping Bar, Mobile Sticky Cart, Predictive Search).
- **Background Daemon (`dropper-daemon.js`):** Continually pings store endpoints every 5 minutes and auto-commits daily intelligence briefings at 23:59:00.
