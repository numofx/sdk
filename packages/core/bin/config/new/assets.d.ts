export declare enum TokenType {
    ERC20_ = 0,
    ERC20_Permit = 1,
    ERC20_DaiPermit = 2,
    ERC20_MKR = 3,
    ERC1155_ = 4,
    ERC720_ = 5
}
export interface AssetStaticInfo {
    assetAddress: string;
    joinAddress: string;
    tokenType: TokenType;
    name: string;
    version: string;
    symbol: string;
    decimals: number;
    showToken: boolean;
    digitFormat: number;
    isYieldBase?: boolean;
    tokenIdentifier?: number | string;
    displaySymbol?: string;
    limitToSeries?: string[];
    wrapHandlerAddresses?: Map<number, string>;
    unwrapHandlerAddresses?: Map<number, string>;
    proxyId?: string;
}
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
export declare const FETH2212 = "0x323800000000";
export declare const FDAI2212 = "0x323300000000";
export declare const FUSDC2212 = "0x323400000000";
export declare const FETH2303 = "0x323900000000";
export declare const FDAI2303 = "0x323500000000";
export declare const FUSDC2303 = "0x323600000000";
export declare const FETH2306 = "0x40301200028B";
export declare const FDAI2306 = "0x40311200028B";
export declare const FUSDC2306 = "0x40321200028B";
export declare const CRAB = "0x333800000000";
export declare const cKES = "0x404000000000";
export declare const USDT_CELO = "0x404100000000";
export declare const CONVEX_BASED_ASSETS: string[];
export declare const ETH_BASED_ASSETS: string[];
export declare const IGNORE_BASE_ASSETS: string[];
export declare const ASSETS_42161: Map<string, AssetStaticInfo>;
export declare const ASSETS_1: Map<string, AssetStaticInfo>;
export declare const ASSETS_42220: Map<string, AssetStaticInfo>;
declare const ASSETS: Map<number, Map<string, AssetStaticInfo>>;
export default ASSETS;
