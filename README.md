# Numo Engine SDK

A TypeScript SDK for interacting with YieldSpace markets on Celo Mainnet.


## Included Packages
- **core** - Core SDK functionality for pool interactions and protocol data
- **react** - React adaptor with hooks and components
- **math** - YieldSpace AMM math calculations
- **contracts** - TypeChain-generated contract wrappers
- **redux** - Redux adaptor for state management
- (cli) - Command-line interface tools
- (utils) - Shared utilities

## Supported Networks
- **Celo Mainnet (Chain ID: 42220)** ✨

## Prerequisites

**Bun is required** for this SDK. Install it first:

```bash
curl -fsSL https://bun.sh/install | bash
```

> 💡 **Why Bun?** 4x faster installs, native TypeScript support, built-in tools. [Learn more](./BUN_SETUP.md)

## Quick Start

### Install from GitHub

Add to your frontend project's `package.json`:

```json
{
  "dependencies": {
    "@numo-engine/core": "github:numo/sdk#main:packages/core",
    "@numo-engine/math": "github:numo/sdk#main:packages/math",
    "ethers": "^5.7.0"
  }
}
```

Then:
```bash
bun install
```

### Use in Your App

```typescript
import { ethers } from 'ethers';
import { yieldFunctions, yieldObservables } from '@numo-engine/core';

// Connect to Celo Mainnet
const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org');

yieldFunctions.updateConfig({
  defaultChainId: 42220,
  defaultProviderMap: new Map([[42220, () => provider]]),
});

// Subscribe to pool data
yieldObservables.seriesø.subscribe(pools => {
  console.log('Celo pools:', pools);
});
```

## Included Examples
- basic react app
- ( cli )

## Developer Setup (for contributing):

### 1. Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clean and build ALL packages in the monorepo (in root dir):
```bash
bun install
bun run clean
bun run bootstrap
bun run compile
```

### 3. Propagate any changes made to ANY of the packages (in root dir):
```bash
bun run compile
```

### 4. Start the examples on localhost (in examples/* dir):
```bash
bun start
```

### 5. Publish global changes (in root dir):
```bash
lerna publish
```

### 6. Publish individual packages changes (in packages/* dir):
```bash
bun version --patch
bun publish
```

### 7. Link packages for local development:
In the SDK package directory:
```bash
bun run compile
bun link
```

In your frontend app:
```bash
bun link @numo-engine/core
bun install
```