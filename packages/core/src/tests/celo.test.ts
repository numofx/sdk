import { ethers } from 'ethers';
import { buildProtocol } from '../buildProtocol';
import { IYieldConfig, ApprovalMethod } from '../types';
import ASSETS from '../config/new/assets';
import SERIES from '../config/new/series';

/**
 * Celo Mainnet Integration Test
 *
 * Tests that the SDK correctly loads Celo assets and series,
 * and can connect to deployed pool contracts.
 */

const CELO_CHAIN_ID = 42220;
const CELO_RPC = 'https://forno.celo.org';

async function testCeloIntegration() {
  console.log('🧪 Testing Celo Mainnet Integration...\n');

  try {
    // 1. Connect to Celo Mainnet
    console.log('1️⃣  Connecting to Celo Mainnet...');
    const provider = new ethers.providers.JsonRpcProvider(CELO_RPC);
    const network = await provider.getNetwork();
    console.log(`   ✓ Connected to chain ID: ${network.chainId}`);

    if (network.chainId !== CELO_CHAIN_ID) {
      throw new Error(`Expected chain ID ${CELO_CHAIN_ID}, got ${network.chainId}`);
    }

    // 2. Check Assets Configuration
    console.log('\n2️⃣  Checking Assets Configuration...');
    const celoAssets = ASSETS.get(CELO_CHAIN_ID);

    if (!celoAssets) {
      throw new Error('Celo assets not found in configuration');
    }

    console.log(`   ✓ Found ${celoAssets.size} assets configured for Celo:`);
    celoAssets.forEach((asset) => {
      console.log(`     - ${asset.symbol}: ${asset.assetAddress}`);
    });

    // 3. Check Series Configuration
    console.log('\n3️⃣  Checking Series Configuration...');
    const celoSeries = SERIES.get(CELO_CHAIN_ID);

    if (!celoSeries) {
      throw new Error('Celo series not found in configuration');
    }

    console.log(`   ✓ Found ${celoSeries.size} series configured for Celo:`);
    celoSeries.forEach((series) => {
      console.log(`     - ${series.symbol}:`);
      console.log(`       fyToken: ${series.address}`);
      console.log(`       Pool: ${series.poolAddress}`);
      console.log(`       Maturity: ${new Date(series.maturity * 1000).toDateString()}`);
    });

    // 4. Build Protocol (with placeholder contracts)
    console.log('\n4️⃣  Building Protocol...');
    const mockConfig: IYieldConfig = {
      defaultProviderMap: new Map([[CELO_CHAIN_ID, () => provider]]),
      defaultChainId: CELO_CHAIN_ID,
      defaultAccountProvider: provider,
      useAccountProviderAsProvider: false,
      autoConnectAccountProvider: false,
      supressInjectedListeners: true,
      defaultUserSettings: {
        slippageTolerance: 0.01,
        approvalMethod: ApprovalMethod.TX,
        maxApproval: true,
        unwrapTokens: false,
      },
      defaultSeriesId: undefined,
      defaultBaseId: undefined,
      ignoreSeries: [],
      ignoreStrategies: [],
      messageTimeout: 5000,
      browserCaching: false,
      forceTransactions: false,
      useFork: false,
      defaultForkMap: new Map(),
      suppressEventLogQueries: false,
      diagnostics: true,
    };

    const protocol = await buildProtocol(provider, CELO_CHAIN_ID, mockConfig);
    console.log('   ✓ Protocol built successfully');
    console.log(`     - Assets loaded: ${protocol.assetRootMap.size}`);
    console.log(`     - Series loaded: ${protocol.seriesRootMap.size}`);

    // 5. Test Pool Contracts
    console.log('\n5️⃣  Testing Pool Contracts...');
    const seriesArray = Array.from(celoSeries.values());

    for (const series of seriesArray) {
      console.log(`\n   Testing ${series.symbol}...`);

      // Connect to pool contract
      const poolAbi = [
        'function fyToken() view returns (address)',
        'function base() view returns (address)',
        'function getCache() view returns (uint112, uint112, uint32)',
        'function totalSupply() view returns (uint256)',
        'function ts() view returns (uint256)',
        'function g1() view returns (uint256)',
        'function g2() view returns (uint256)',
      ];

      const poolContract = new ethers.Contract(series.poolAddress, poolAbi, provider);

      try {
        // Get pool data
        const [fyTokenAddr, baseAddr, cache, totalSupply, ts, g1, g2] = await Promise.all([
          poolContract.fyToken(),
          poolContract.base(),
          poolContract.getCache(),
          poolContract.totalSupply(),
          poolContract.ts(),
          poolContract.g1(),
          poolContract.g2(),
        ]);

        console.log(`     ✓ Pool contract connected`);
        console.log(`       fyToken: ${fyTokenAddr}`);
        console.log(`       base: ${baseAddr}`);
        console.log(`       Base reserves: ${ethers.utils.formatUnits(cache[0], series.decimals)}`);
        console.log(`       fyToken reserves: ${ethers.utils.formatUnits(cache[1], series.decimals)}`);
        console.log(`       Total supply: ${ethers.utils.formatUnits(totalSupply, series.decimals)}`);
        console.log(`       ts: ${ts.toString()}`);
        console.log(`       g1: ${g1.toString()}`);
        console.log(`       g2: ${g2.toString()}`);

        // Verify addresses match
        if (fyTokenAddr.toLowerCase() !== series.address.toLowerCase()) {
          console.log(`     ⚠️  Warning: fyToken address mismatch`);
          console.log(`       Expected: ${series.address}`);
          console.log(`       Got: ${fyTokenAddr}`);
        }

        // Verify parameters match configuration
        if (ts.toString() !== series.ts) {
          console.log(`     ⚠️  Warning: ts parameter mismatch`);
          console.log(`       Expected: ${series.ts}`);
          console.log(`       Got: ${ts.toString()}`);
        }

      } catch (error: any) {
        console.log(`     ❌ Error testing pool: ${error.message}`);
      }
    }

    // 6. Test Asset Contracts
    console.log('\n6️⃣  Testing Asset Contracts...');
    const assetsArray = Array.from(celoAssets.values());

    for (const asset of assetsArray) {
      console.log(`\n   Testing ${asset.symbol}...`);

      const erc20Abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
      ];

      const tokenContract = new ethers.Contract(asset.assetAddress, erc20Abi, provider);

      try {
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.totalSupply(),
        ]);

        console.log(`     ✓ Token contract connected`);
        console.log(`       Name: ${name}`);
        console.log(`       Symbol: ${symbol}`);
        console.log(`       Decimals: ${decimals}`);
        console.log(`       Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)}`);

        // Verify decimals match
        if (decimals !== asset.decimals) {
          console.log(`     ⚠️  Warning: decimals mismatch`);
          console.log(`       Expected: ${asset.decimals}`);
          console.log(`       Got: ${decimals}`);
        }

      } catch (error: any) {
        console.log(`     ❌ Error testing token: ${error.message}`);
      }
    }

    console.log('\n✅ Celo Integration Test Complete!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testCeloIntegration();
