# Master Strategy: Dual-Platform Game Ecosystem

This document outlines the architecture, infrastructure, and business logic for maintaining two parallel versions of the game: a **Moddable Single-Player Desktop (Steam)** version and a **Multiplayer-Service Web** version.

## 1\. Development Roadmap: The "Desktop-First" Approach

To manage complexity, the game follows a phased release schedule.

### Phase 1: Desktop Foundation (Current Focus)

-   **Objective:** Convert the current JS codebase into a standalone Electron app.
    
-   **Storage (SQLite Proxy):** Instead of simple JSON files, the Desktop version will use **SQLite**. This allows you to write SQL queries (SELECT, INSERT) that are nearly identical to the PostgreSQL queries you will use later on the web.
    
-   **Steam Integration:** Add Steamworks for Achievements and initial Steam Workshop support.
    
-   **Offline focus:** Ensure 100% of the game works without an internet connection.
    

### Phase 2: Small-Scale Web Migration (Stepping Stone)

-   **Platform:** Move from Vercel to **Railway** or **DigitalOcean**.
    
-   **Database Transition:** Swap the local SQLite file for a hosted PostgreSQL instance. Because the Desktop code was already written in SQL, this transition is a "find and replace" for the connection string rather than a logic rewrite.
    
-   **Scope:** Introduce the "Multiplayer" Auction House for alpha testers.
    

### Phase 3: Large-Scale Web MMO (Growth)

-   **Scale:** Support 1,000+ players using a dedicated PostgreSQL cluster.
    
-   **Monetization:** Launch the Web Cash Shop using flat USD pricing.
    

## 2\. Infrastructure & Data Management

### The "Exalt" & Archive Pattern (Pedigree Preservation)

As the world reaches millions of horses, performance is maintained by splitting the database:

-   **Active Database:** Contains living horses owned by active players. This is the "hot" data used for breeding and gameplay.
    
-   **Archive Database (Read-Only):** When a horse dies or is disconnected from the player, it is moved to the Archive.
    
-   **Pedigree Linking:** Family trees still reference these horses. The UI will fetch "Ancestry Nodes" from the Archive. Because these records are **read-only**, they can be indexed heavily and cached aggressively, ensuring that viewing a 10-generation pedigree doesn't slow down the main game.
    

### Web Version (MMO/Service)

-   **Hosting:** Dedicated VPS or Container Service (Railway/DigitalOcean).
    
-   **Database:** PostgreSQL for complex genetics queries and Auction House transactions.
    

### Desktop Version (Single-Player/Offline)

-   **Runtime:** Electron (Chromium + Node.js).
    
-   **Storage:** Local SQLite database (mimicking the Web PostgreSQL structure).
    
-   **Asset Syncing:** App downloads 3D models from GitHub to `AppData` on install.
    

## 3\. DLC & Content Logic

-   **Unified Pricing:** DLC costs the same flat USD amount on both platforms.
    
-   **Entitlement Check:** Imports fail if the horse uses DLC traits the user doesn't own.
    
-   **Export to Desktop:** Web users can export any horse as a JSON `.horse` file to their desktop game for free.
    

## 4\. Modding Ecosystem

### Desktop Version (Open)

-   **Workshop & Manual:** Supports Steam Workshop, NexusMods, and manual folder placement.
    
-   **Featured Mods Browser:** An in-game UI that mirrors the Web Store. Desktop users can download these curated mods for free to facilitate importing horses from the web that might use "Official" mod parts.
    

### Web Version (Curated)

-   **Flat-Fee Sales:** Mods are sold for real USD amounts.
    
-   **Technical Integration:** Once a mod is "Graduated" to the web, the developer hosts the assets on a CDN. Web players pay the fee to unlock the ability to use those traits in the multiplayer environment (Auction House/Breeding).
    
-   **Revenue Sharing:** Modders receive a **75/25 split** via Stripe Connect.
    

## 5\. Sunsetting & Legacy Plan (The "Exit" Strategy)

-   **The Transition:** All active web players receive a Steam Key for the Desktop version.
    
-   **Data Migration:** A "Final Export" tool allows users to download their entire web game-state as a package for local import.
    

## 6\. Feature Comparison Table

**Feature**

**Web (MMO)**

**Desktop (Steam)**

**Primary Save**

PostgreSQL (Centralized)

Local SQLite (Simulated DB)

**Archive Data**

Remote Read-Only Archive

Local Read-Only Archive

**Multiplayer**

Auction House (P2P)

NPC-only Economy

**Monetization**

Flat USD Microtransactions

One-Time Purchase (OTP)

**Modding**

Verified Store Content Only

Workshop, Nexus, & Manual

**Internet**

Required

Optional (Fully Offline)

**Updates**

Forced

Optional (Betas supported)

## 7\. Technical Implementation Snippets

### The Simulated Database Pattern (Shared Logic)

```
// This logic remains 95% the same for both SQLite (Desktop) and PostgreSQL (Web)
async function getHorsePedigree(horseId) {
  const query = `SELECT * FROM horses_archive WHERE id = $1`;
  // On Desktop, this hits the local SQLite file
  // On Web, this hits the remote Postgres Archive
  return await db.query(query, [horseId]);
}
```