import { TokenType } from '../types';
export interface IAssetInfo {
    tokenType: TokenType;
    name: string;
    address: string;
    symbol: string;
    version: string;
    decimals: number;
    joinAddress: string;
    /**
     * Optionals
     *  */
    isYieldBase?: boolean;
    tokenIdentifier?: number | string;
    hideToken?: boolean;
    digitFormat?: number;
    displaySymbol?: string;
    limitToSeries?: string[];
    wrapHandlerAddresses?: Map<number, string>;
    unwrapHandlerAddresses?: Map<number, string>;
    proxyId?: string;
}
export declare const UNKNOWN = "0x000000000000";
export declare const WETH = "0x303000000000";
export declare const DAI = "0x303100000000";
export declare const USDC = "0x303200000000";
export declare const WBTC = "0x303300000000";
export declare const stETH = "0x303500000000";
export declare const wstETH = "0x303400000000";
export declare const LINK = "0x303600000000";
export declare const ENS = "0x303700000000";
export declare const UNI = "0x313000000000";
export declare const yvUSDC = "0x303900000000";
export declare const MKR = "0x313100000000";
export declare const FRAX = "0x313800000000";
export declare const FDAI2203 = "0x313200000000";
export declare const FUSDC2203 = "0x313300000000";
export declare const FDAI2206 = "0x313400000000";
export declare const FUSDC2206 = "0x313500000000";
export declare const FDAI2209 = "0x313600000000";
export declare const FUSDC2209 = "0x313700000000";
export declare const CVX3CRV = "0x313900000000";
export declare const cKES = "0x404000000000";
export declare const USDT_CELO = "0x404100000000";
export declare const CONVEX_BASED_ASSETS: string[];
export declare const ETH_BASED_ASSETS: string[];
export declare const IGNORE_BASE_ASSETS: string[];
export declare const ASSETS_42161: Map<string, IAssetInfo>;
export declare const ASSETS_1: Map<string, IAssetInfo>;
export declare const ASSETS_42220: Map<string, IAssetInfo>;
