import { ethers, BigNumber, BigNumberish, ContractTransaction, Contract } from 'ethers';
import { Observable } from 'rxjs';
import { Cauldron, FYToken, Ladle, Pool, Strategy, Witch } from '@numo-engine/contracts';
import { ISelected } from '../observables/selected';
export * from './messages';
export * from './operations';
export interface W3bNumber {
    big: BigNumber;
    hStr: string;
    dsp: number;
}
export declare enum TokenType {
    Native_Token = 0,
    ERC20 = 1,
    ERC20_Permit = 2,
    ERC20_DaiPermit = 3,
    ERC20_MKR = 4,
    ERC1155 = 5,
    ERC720 = 6
}
export interface ISignable {
    name: string;
    version: string;
    address: string;
    symbol: string;
    tokenType: TokenType;
}
export interface ISeriesRoot extends ISignable {
    id: string;
    displayName: string;
    displayNameMobile: string;
    decimals: number;
    maturity: number;
    maturityDate: Date;
    fyTokenAddress: string;
    poolAddress: string;
    poolName: string;
    poolVersion: string;
    poolSymbol: string;
    ts: BigNumber;
    g1: BigNumber;
    g2: BigNumber;
    baseId: string;
    baseTokenAddress: string;
}
export interface ISeries extends ISeriesRoot {
    sharesReserves: W3bNumber;
    fyTokenReserves: W3bNumber;
    fyTokenRealReserves: W3bNumber;
    totalSupply: W3bNumber;
    fyTokenContract: FYToken;
    poolContract: Pool;
    apr: string;
    poolAPY: string | undefined;
    seriesIsMature: boolean;
    showSeries: boolean;
    c: BigNumber | undefined;
    mu: BigNumber | undefined;
    getTimeTillMaturity: () => string;
    isMature: () => boolean;
    getFyTokenAllowance: (acc: string, spender: string) => Promise<BigNumber>;
    getPoolAllowance: (acc: string, spender: string) => Promise<BigNumber>;
    getShares: (baseAmount: BigNumber) => BigNumber;
    getBase: (sharesAmount: BigNumber) => BigNumber;
    poolTokenBalance?: W3bNumber;
    fyTokenBalance?: W3bNumber;
    poolPercentOwned?: string;
}
export interface IAssetRoot extends ISignable {
    tokenType: TokenType;
    name: string;
    version: string;
    address: string;
    symbol: string;
    decimals: number;
    joinAddress: string;
    hideToken: boolean;
    digitFormat: number;
    id: string;
    tokenIdentifier: string | undefined;
    displayName: string;
    displayNameMobile: string;
    isYieldBase: boolean;
    displaySymbol: string;
    limitToSeries: string[];
    wrapHandlerAddress: string | undefined;
    unwrapHandlerAddress: string | undefined;
    isWrappedToken: boolean;
    wrappingRequired: boolean;
    proxyId: string;
}
export interface IAsset extends IAssetRoot {
    assetContract: Contract;
    getBalance: (account: string) => Promise<BigNumber>;
    getAllowance: (account: string, spender: string) => Promise<BigNumber>;
    setAllowance?: (spender: string) => Promise<BigNumber | void>;
    balance: W3bNumber;
}
export interface IYieldProtocol {
    protocolVersion: string;
    cauldron: Cauldron;
    ladle: Ladle;
    witch: Witch;
    oracleMap: Map<string, Contract>;
    moduleMap: Map<string, Contract>;
    assetRootMap: Map<string, IAssetRoot>;
    seriesRootMap: Map<string, ISeriesRoot>;
    strategyRootMap: Map<string, IStrategyRoot>;
}
export interface IYieldObservables {
    protocolø: Observable<IYieldProtocol>;
    providerø: Observable<ethers.providers.BaseProvider>;
    accountø: Observable<string | undefined>;
    accountProviderø: Observable<ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider>;
    seriesø: Observable<Map<string, ISeries>>;
    assetsø: Observable<Map<string, IAsset>>;
    vaultsø: Observable<Map<string, IVault>>;
    strategiesø: Observable<Map<string, IStrategy>>;
    assetPairsø: Observable<Map<string, IAssetPair>>;
    transactionsø: Observable<Map<string, IYieldProcess>>;
    selectedø: Observable<ISelected>;
    userSettingsø: Observable<IUserSettings>;
    messagesø: Observable<Map<string, IMessage>>;
}
export interface IYieldFunctions {
    updateProvider: (provider: ethers.providers.BaseProvider) => void;
    updateConfig: (config: IYieldConfig) => void;
    updateAccount: (account: string) => void;
    selectIlk: (asset: string | IAsset) => void;
    selectBase: (asset: string | IAsset) => void;
    selectVault: (vault: string | IVault) => void;
    selectSeries: (series: string | ISeries, futureSeries: boolean) => void;
    selectStrategy: (strategy: string | IStrategy) => void;
    borrow: () => Promise<void>;
    repayDebt: any;
    addLiquidity: any;
}
export interface IPriceContextState {
    pairMap: Map<string, IAssetPair>;
    pairLoading: string[];
}
export interface IPriceContextActions {
    updateAssetPair: (baseId: string, ilkId: string) => Promise<void>;
}
export interface IPriceContext {
    priceState: IPriceContextState;
    priceActions: IPriceContextActions;
}
export interface IUserSettings {
    slippageTolerance: number;
    approvalMethod: ApprovalMethod;
    maxApproval: boolean;
    unwrapTokens: boolean;
}
export interface IYieldConfig {
    defaultProviderMap: Map<number, () => ethers.providers.BaseProvider>;
    defaultChainId: number;
    defaultAccountProvider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider;
    useAccountProviderAsProvider: boolean;
    autoConnectAccountProvider: boolean;
    supressInjectedListeners: boolean;
    defaultUserSettings: IUserSettings;
    defaultSeriesId: string | undefined;
    defaultBaseId: string | undefined;
    ignoreSeries: string[];
    ignoreStrategies: string[];
    messageTimeout: number;
    browserCaching: boolean;
    forceTransactions: boolean;
    useFork: boolean;
    defaultForkMap: Map<number, () => ethers.providers.JsonRpcProvider>;
    suppressEventLogQueries: boolean;
    diagnostics: boolean;
}
export interface ISettingsContext {
    settingsState: ISettingsContextState;
    settingsActions: {
        updateSetting: (setting: string, value: string | number | boolean) => void;
    };
}
export interface ISettingsContextState {
    slippageTolerance: number;
    darkMode: boolean;
    autoTheme: boolean;
    forceTransactions: boolean;
    approvalMethod: ApprovalMethod;
    approveMax: boolean;
    disclaimerChecked: boolean;
    powerUser: boolean;
    diagnostics: boolean;
    showWrappedTokens: boolean;
    unwrapTokens: boolean;
    dashHideEmptyVaults: boolean;
    dashHideInactiveVaults: boolean;
    dashHideVaults: boolean;
    dashHideLendPositions: boolean;
    dashHidePoolPositions: boolean;
    dashCurrency: string;
}
export interface IAssetPair {
    id: string;
    baseId: string;
    ilkId: string;
    oracle: string;
    baseDecimals: number;
    ilkDecimals: number;
    minRatio: number;
    minDebtLimit: W3bNumber;
    maxDebtLimit: W3bNumber;
    limitDecimals: number;
    pairPrice: W3bNumber;
    pairTotalDebt: W3bNumber;
    pairUpdating?: boolean;
    lastUpdate?: number;
}
export interface IStrategyRoot extends ISignable {
    id: string;
    baseId: string;
    decimals: number;
}
export interface IStrategy extends IStrategyRoot {
    strategyContract: Strategy;
    currentSeriesId: string;
    currentPoolAddr: string;
    nextSeriesId: string;
    active: boolean;
    initInvariant?: BigNumber;
    currentInvariant?: BigNumber;
    returnRate?: W3bNumber;
    strategyTotalSupply?: W3bNumber;
    accountBalance?: W3bNumber;
    accountStrategyPercent?: string | undefined;
    strategyPoolContract?: Pool;
    poolTotalSupply?: W3bNumber;
    strategyPoolBalance?: W3bNumber;
    strategyPoolPercent?: string;
    accountPoolBalance?: W3bNumber;
    accountPoolPercent?: string | undefined;
    getAllowance: (acc: string, spender: string) => Promise<BigNumber>;
}
export interface IVaultRoot {
    id: string;
    ilkId: string;
    baseId: string;
    seriesId: string;
    displayName: string;
    baseDecimals: number;
    ilkDecimals: number;
    createdBlock: number;
    createdTxHash: string;
}
export interface IVault extends IVaultRoot {
    owner: string;
    underLiquidation: boolean;
    hasBeenLiquidated: boolean;
    liquidationDate?: number;
    liquidationDate_?: string;
    isActive: boolean;
    ink: W3bNumber;
    art: W3bNumber;
    accruedArt: W3bNumber;
    rateAtMaturity: W3bNumber;
    rate: W3bNumber;
}
export interface ICallData {
    args: (string | BigNumberish | boolean)[];
    operation: string | [number, string[]];
    targetContract?: ethers.Contract;
    fnName?: string;
    overrides?: ethers.CallOverrides;
    ignoreIf?: boolean;
}
export interface ISignData {
    target: ISignable;
    spender: string;
    amount?: BigNumberish;
    domain?: IDomain;
    ignoreIf?: boolean;
}
export interface IDaiPermitMessage {
    holder: string;
    spender: string;
    nonce: number;
    expiry: number | string;
    allowed?: boolean;
}
export interface IERC2612PermitMessage {
    owner: string;
    spender: string;
    value: number | string;
    nonce: number | string;
    deadline: number | string;
}
export interface IDomain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}
export declare enum ApprovalMethod {
    TX = "TX",
    SIG = "SIG"
}
export declare enum MessageType {
    INFO = 0,
    WARNING = 1,
    ERROR = 2,
    INTERNAL = 3
}
export interface IMessage {
    message: string;
    id?: string;
    type?: MessageType;
    origin?: any;
    timeoutOverride?: number;
    expired?: boolean;
}
export declare enum TxState {
    PENDING = "PENDING",
    SUCCESSFUL = "SUCCESSFUL",
    FAILED = "FAILED",
    REJECTED = "REJECTED"
}
export interface IYieldSig {
    signData: ISignData;
    status: TxState;
}
export interface IYieldTx extends ContractTransaction {
    receipt: any | null;
    status: TxState;
}
export declare enum ProcessStage {
    PROCESS_INACTIVE = "Process inactive",
    SIGNING_APPROVAL_REQUESTED = "Signing requested",
    APPROVAL_TRANSACTION_PENDING = "Approval transaction pending",
    SIGNING_APPROVAL_COMPLETE = "Signing/Approval complete",
    TRANSACTION_REQUESTED = "Transaction requested ",
    TRANSACTION_PENDING = "Transaction pending",
    PROCESS_COMPLETE = "Process complete",
    PROCESS_COMPLETE_TIMEOUT = "Process complete: timeout"
}
export interface IYieldProcess {
    processCode: string;
    stage?: ProcessStage;
    signMap?: Map<string, IYieldSig>;
    tx?: IYieldTx;
    txHash?: string;
    timeout?: boolean;
    processActive?: boolean;
    error?: {
        error: Error;
        message: string;
    };
}
export declare enum TradeType {
    BUY = "BUY",
    SELL = "SELL"
}
export declare enum ActionType {
    BORROW = "BORROW",
    LEND = "LEND",
    POOL = "POOL"
}
export declare enum AddLiquidityType {
    BUY = "BUY",
    BORROW = "BORROW"
}
export declare enum YieldColors {
    SUCCESS = "success",
    FAILED = "error",
    WARNING = "warning",
    GRADIENT = "",
    GRADIENT_TRANSPARENT = "",
    PRIMARY = "",
    SECONDARY = ""
}
export declare enum ActionCodes {
    ADD_COLLATERAL = "Add Collateral",
    REMOVE_COLLATERAL = "Remove Collateral",
    BORROW = "Borrow",
    REPAY = "Repay",
    ROLL_DEBT = "Roll Debt",
    LEND = "Lend",
    CLOSE_POSITION = "Redeem Position",
    ROLL_POSITION = "Roll Position",
    REDEEM = "Redeem",
    ADD_LIQUIDITY = "Add Liquidity",
    REMOVE_LIQUIDITY = "Remove Liquidity",
    ROLL_LIQUIDITY = "Roll Liquidity",
    DELETE_VAULT = "Delete Vault",
    TRANSFER_VAULT = "Transfer Vault",
    MERGE_VAULT = "Merge Vault"
}
