import * as assetConstants from './config/assetsConfig';
import { IYieldFunctions } from './types';
import * as yieldObservables from './observables';
import * as viewObservables from './viewObservables';
/**
 * On app start (and on providerø, chainId$ or appConfig$ observed changes ),
 * appConfig gathers all the required information from env etc.
 * sets things up, and then the stream finishes indicating that everything is ready to go.
 */
declare const initProtocol: import("rxjs").Subscription;
declare const viewFunctions: any;
declare const yieldFunctions: IYieldFunctions;
declare const yieldConfig: {
    series: Map<number, Map<string, import("./config/new/series").ISeriesStatic>>;
    assets: Map<number, Map<string, import("./config/new/assets").AssetStaticInfo>>;
    strategies: Map<number, import("./config/new/strategies").StrategyInfo[]>;
    oracles: Map<number, Map<string, Map<string, string>>>;
};
declare const yieldConstants: {
    UNKNOWN: "0x000000000000";
    WETH: "0x303000000000";
    DAI: "0x303100000000";
    USDC: "0x303200000000";
    WBTC: "0x303300000000";
    stETH: "0x303500000000";
    wstETH: "0x303400000000";
    LINK: "0x303600000000";
    ENS: "0x303700000000";
    UNI: "0x313000000000";
    yvUSDC: "0x303900000000";
    MKR: "0x313100000000";
    FRAX: "0x313800000000";
    FDAI2203: "0x313200000000";
    FUSDC2203: "0x313300000000";
    FDAI2206: "0x313400000000";
    FUSDC2206: "0x313500000000";
    FDAI2209: "0x313600000000";
    FUSDC2209: "0x313700000000";
    CVX3CRV: "0x313900000000";
    cKES: "0x404000000000";
    USDT_CELO: "0x404100000000";
    CONVEX_BASED_ASSETS: string[];
    ETH_BASED_ASSETS: string[];
    IGNORE_BASE_ASSETS: string[];
    ASSETS_42161: Map<string, assetConstants.IAssetInfo>;
    ASSETS_1: Map<string, assetConstants.IAssetInfo>;
    ASSETS_42220: Map<string, assetConstants.IAssetInfo>;
    MAX_256: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    MAX_128: "0xffffffffffffffffffffffffffffffff";
    ZERO_BN: import("ethers").BigNumber;
    ZERO_W3B: {
        big: import("ethers").BigNumber;
        hStr: string;
        dsp: number;
    };
    ONE_BN: import("ethers").BigNumber;
    MINUS_ONE_BN: import("ethers").BigNumber;
    WAD_RAY_BN: import("ethers").BigNumber;
    WAD_BN: import("ethers").BigNumber;
    SECONDS_PER_YEAR: number;
    ETH_BYTES: string;
    CHAI_BYTES: string;
    CHI: string;
    RATE: string;
    BLANK_ADDRESS: "0x0000000000000000000000000000000000000000";
    BLANK_VAULT: "0x000000000000000000000000";
    BLANK_SERIES: "0x000000000000";
    IGNORED_CALLDATA: {
        operation: string;
        args: any[];
        ignoreIf: boolean;
    };
    ETHEREUM: "ETHEREUM";
    ARBITRUM: "ARBITRUM";
    OPTIMISM: "OPTIMISM";
    CELO: "CELO";
};
export { initProtocol, yieldObservables, yieldFunctions, yieldConstants, viewObservables, viewFunctions, yieldConfig };
