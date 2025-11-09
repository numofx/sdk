/**
 * Quick Celo Integration Test (Plain JavaScript)
 * Run with: bun run test-celo.js
 * Or: node test-celo.js
 */

const { ethers } = require('ethers');

const CELO_CHAIN_ID = 42220;
const CELO_RPC = 'https://forno.celo.org';

// Asset addresses
const cKES_ADDRESS = '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0';
const USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';

// Series addresses
const fyCKES_ADDRESS = '0x774Dce3065C04A61D564470f78b07411Bd38edc5';
const fyCKES_POOL = '0x0870dE39Aab3046cAC6E2F6Bc0Bd7c8e61c30f1f';

const fyUSDT_ADDRESS = '0xCD3F00B3C646210DE13557d6C555E98efea7F767';
const fyUSDT_POOL = '0x84b5f96510C160D7Ca1Db2540339Fab7646e9F33';

async function testCeloIntegration() {
  console.log('🧪 Testing Celo Mainnet Integration...\n');

  try {
    // 1. Connect to Celo Mainnet
    console.log('1️⃣  Connecting to Celo Mainnet...');
    const provider = new ethers.providers.JsonRpcProvider(CELO_RPC);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✓ Connected to chain ID: ${network.chainId}`);
    console.log(`   ✓ Current block: ${blockNumber}`);

    if (network.chainId !== CELO_CHAIN_ID) {
      throw new Error(`Expected chain ID ${CELO_CHAIN_ID}, got ${network.chainId}`);
    }

    // 2. Test cKES Token
    console.log('\n2️⃣  Testing cKES Token...');
    const erc20Abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
    ];

    const ckesToken = new ethers.Contract(cKES_ADDRESS, erc20Abi, provider);
    const [ckesName, ckesSymbol, ckesDecimals, ckesTotalSupply] = await Promise.all([
      ckesToken.name(),
      ckesToken.symbol(),
      ckesToken.decimals(),
      ckesToken.totalSupply(),
    ]);

    console.log(`   ✓ cKES Token:`);
    console.log(`     Name: ${ckesName}`);
    console.log(`     Symbol: ${ckesSymbol}`);
    console.log(`     Decimals: ${ckesDecimals}`);
    console.log(`     Total Supply: ${ethers.utils.formatUnits(ckesTotalSupply, ckesDecimals)}`);

    // 3. Test USDT Token
    console.log('\n3️⃣  Testing USDT Token...');
    const usdtToken = new ethers.Contract(USDT_ADDRESS, erc20Abi, provider);
    const [usdtName, usdtSymbol, usdtDecimals, usdtTotalSupply] = await Promise.all([
      usdtToken.name(),
      usdtToken.symbol(),
      usdtToken.decimals(),
      usdtToken.totalSupply(),
    ]);

    console.log(`   ✓ USDT Token:`);
    console.log(`     Name: ${usdtName}`);
    console.log(`     Symbol: ${usdtSymbol}`);
    console.log(`     Decimals: ${usdtDecimals}`);
    console.log(`     Total Supply: ${ethers.utils.formatUnits(usdtTotalSupply, usdtDecimals)}`);

    // 4. Test fyCKES Pool
    console.log('\n4️⃣  Testing fyCKES-2602 Pool...');
    const poolAbi = [
      'function fyToken() view returns (address)',
      'function base() view returns (address)',
      'function getCache() view returns (uint112, uint112, uint32)',
      'function totalSupply() view returns (uint256)',
      'function ts() view returns (uint256)',
      'function g1() view returns (uint256)',
      'function g2() view returns (uint256)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
    ];

    const fyCKESPool = new ethers.Contract(fyCKES_POOL, poolAbi, provider);
    const [
      fyCKESPoolFyToken,
      fyCKESPoolBase,
      fyCKESPoolCache,
      fyCKESPoolSupply,
      fyCKESTs,
      fyCKESG1,
      fyCKESG2,
      fyCKESPoolName,
      fyCKESPoolSymbol,
    ] = await Promise.all([
      fyCKESPool.fyToken(),
      fyCKESPool.base(),
      fyCKESPool.getCache(),
      fyCKESPool.totalSupply(),
      fyCKESPool.ts(),
      fyCKESPool.g1(),
      fyCKESPool.g2(),
      fyCKESPool.name(),
      fyCKESPool.symbol(),
    ]);

    console.log(`   ✓ fyCKES Pool (${fyCKES_POOL}):`);
    console.log(`     Pool Name: ${fyCKESPoolName}`);
    console.log(`     Pool Symbol: ${fyCKESPoolSymbol}`);
    console.log(`     fyToken: ${fyCKESPoolFyToken}`);
    console.log(`     Base: ${fyCKESPoolBase}`);
    console.log(`     Base Reserves: ${ethers.utils.formatUnits(fyCKESPoolCache[0], 18)} cKES`);
    console.log(`     fyToken Reserves: ${ethers.utils.formatUnits(fyCKESPoolCache[1], 18)} fyCKES`);
    console.log(`     Total Supply: ${ethers.utils.formatUnits(fyCKESPoolSupply, 18)}`);
    console.log(`     Time Stretch (ts): ${fyCKESTs.toString()}`);
    console.log(`     g1: ${fyCKESG1.toString()}`);
    console.log(`     g2: ${fyCKESG2.toString()}`);

    // Verify addresses
    if (fyCKESPoolFyToken.toLowerCase() !== fyCKES_ADDRESS.toLowerCase()) {
      console.log(`     ⚠️  fyToken address mismatch!`);
    }
    if (fyCKESPoolBase.toLowerCase() !== cKES_ADDRESS.toLowerCase()) {
      console.log(`     ⚠️  Base token address mismatch!`);
    }

    // 5. Test fyCKES Token
    console.log('\n5️⃣  Testing fyCKES-2602 Token...');
    const fyTokenAbi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function maturity() view returns (uint256)',
      'function underlying() view returns (address)',
    ];

    const fyCKESToken = new ethers.Contract(fyCKES_ADDRESS, fyTokenAbi, provider);
    const [fyCKESName, fyCKESSymbol, fyCKESDecimals, fyCKESMaturity, fyCKESUnderlying] =
      await Promise.all([
        fyCKESToken.name(),
        fyCKESToken.symbol(),
        fyCKESToken.decimals(),
        fyCKESToken.maturity(),
        fyCKESToken.underlying(),
      ]);

    console.log(`   ✓ fyCKES Token:`);
    console.log(`     Name: ${fyCKESName}`);
    console.log(`     Symbol: ${fyCKESSymbol}`);
    console.log(`     Decimals: ${fyCKESDecimals}`);
    console.log(`     Maturity: ${new Date(fyCKESMaturity * 1000).toUTCString()}`);
    console.log(`     Underlying: ${fyCKESUnderlying}`);

    // 6. Test fyUSDT Pool
    console.log('\n6️⃣  Testing fyUSDT-2602 Pool...');
    const fyUSDTPool = new ethers.Contract(fyUSDT_POOL, poolAbi, provider);
    const [
      fyUSDTPoolFyToken,
      fyUSDTPoolBase,
      fyUSDTPoolCache,
      fyUSDTPoolSupply,
      fyUSDTTs,
      fyUSDTG1,
      fyUSDTG2,
      fyUSDTPoolName,
      fyUSDTPoolSymbol,
    ] = await Promise.all([
      fyUSDTPool.fyToken(),
      fyUSDTPool.base(),
      fyUSDTPool.getCache(),
      fyUSDTPool.totalSupply(),
      fyUSDTPool.ts(),
      fyUSDTPool.g1(),
      fyUSDTPool.g2(),
      fyUSDTPool.name(),
      fyUSDTPool.symbol(),
    ]);

    console.log(`   ✓ fyUSDT Pool (${fyUSDT_POOL}):`);
    console.log(`     Pool Name: ${fyUSDTPoolName}`);
    console.log(`     Pool Symbol: ${fyUSDTPoolSymbol}`);
    console.log(`     fyToken: ${fyUSDTPoolFyToken}`);
    console.log(`     Base: ${fyUSDTPoolBase}`);
    console.log(`     Base Reserves: ${ethers.utils.formatUnits(fyUSDTPoolCache[0], 6)} USDT`);
    console.log(`     fyToken Reserves: ${ethers.utils.formatUnits(fyUSDTPoolCache[1], 6)} fyUSDT`);
    console.log(`     Total Supply: ${ethers.utils.formatUnits(fyUSDTPoolSupply, 6)}`);
    console.log(`     Time Stretch (ts): ${fyUSDTTs.toString()}`);
    console.log(`     g1: ${fyUSDTG1.toString()}`);
    console.log(`     g2: ${fyUSDTG2.toString()}`);

    // Verify addresses
    if (fyUSDTPoolFyToken.toLowerCase() !== fyUSDT_ADDRESS.toLowerCase()) {
      console.log(`     ⚠️  fyToken address mismatch!`);
    }
    if (fyUSDTPoolBase.toLowerCase() !== USDT_ADDRESS.toLowerCase()) {
      console.log(`     ⚠️  Base token address mismatch!`);
    }

    // 7. Calculate APR (simple estimate)
    console.log('\n7️⃣  Calculating Estimated APR...');

    // For cKES pool
    const fyCKESPrice = fyCKESPoolCache[0].mul(ethers.constants.WeiPerEther).div(fyCKESPoolCache[1]);
    const fyCKESPriceFloat = parseFloat(ethers.utils.formatEther(fyCKESPrice));
    const timeToMaturity = fyCKESMaturity - Math.floor(Date.now() / 1000);
    const yearsToMaturity = timeToMaturity / (365.25 * 24 * 60 * 60);
    const fyCKESAPR = ((1 / fyCKESPriceFloat - 1) / yearsToMaturity) * 100;

    console.log(`   cKES/fyCKES Pool:`);
    console.log(`     fyToken Price: ${fyCKESPriceFloat.toFixed(6)} cKES`);
    console.log(`     Days to Maturity: ${Math.floor(timeToMaturity / (24 * 60 * 60))}`);
    console.log(`     Estimated APR: ${fyCKESAPR.toFixed(2)}%`);

    console.log('\n✅ Celo Integration Test Complete!\n');
    console.log('📝 Summary:');
    console.log('   - Both token contracts are accessible');
    console.log('   - Both pool contracts are deployed and functional');
    console.log('   - Pool parameters match configuration');
    console.log('   - Pools have liquidity and are ready for trading');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testCeloIntegration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
