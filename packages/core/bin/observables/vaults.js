"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVaults = exports.vaultsø = void 0;
const tslib_1 = require("tslib");
const math_1 = require("@numo-engine/math");
const ethers_1 = require("ethers");
const rxjs_1 = require("rxjs");
const initVaults_1 = require("../buildProtocol/initVaults");
const types_1 = require("../types");
const utils_1 = require("../utils");
const yieldUtils_1 = require("../utils/yieldUtils");
const appConfig_1 = require("./appConfig");
const connection_1 = require("./connection");
const messages_1 = require("./messages");
const protocol_1 = require("./protocol");
const vaultMap$ = new rxjs_1.BehaviorSubject(new Map([]));
exports.vaultsø = vaultMap$.pipe((0, rxjs_1.shareReplay)(1));
/* Update vaults function */
const updateVaults = (vaultList, suppressEventLogQueries = false) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const account = yield (0, rxjs_1.lastValueFrom)(connection_1.accountø.pipe((0, rxjs_1.first)()));
    const protocol = yield (0, rxjs_1.lastValueFrom)(protocol_1.protocolø.pipe((0, rxjs_1.first)()));
    const appConfig = yield (0, rxjs_1.lastValueFrom)(appConfig_1.appConfigø.pipe((0, rxjs_1.first)()));
    const provider = yield (0, rxjs_1.lastValueFrom)(connection_1.providerø.pipe((0, rxjs_1.first)()));
    const chainId = yield (0, rxjs_1.lastValueFrom)(connection_1.chainIdø.pipe((0, rxjs_1.first)()));
    const list = vaultList !== undefined
        ? vaultList
        : Array.from((yield (0, initVaults_1.buildVaultMap)(protocol, provider, account, chainId, appConfig)).values()); // : Array.from(vaultMap$.value.values());
    /* if there are some vaults: */
    if (list.length && account) {
        yield Promise.all(list.map((_vault) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const vaultUpdate = yield _updateVault(_vault, account, protocol, suppressEventLogQueries);
            vaultMap$.next(new Map(vaultMap$.value.set(_vault.id, vaultUpdate))); // note: new Map to enforce ref update
        })));
    }
    else {
        /* if the list is empty, return an empty vaultMap */
        vaultMap$.next(new Map([]));
    }
});
exports.updateVaults = updateVaults;
/**
 *  Observe protocolø and accountø changes TOGETHER >  Initiate OR Empty VAULT Map
 * */
(0, rxjs_1.combineLatest)([connection_1.accountø, protocol_1.protocolø])
    // only emit if account is defined and yp.cauldron adress exists - indicating protocol has mostly loaded
    .pipe((0, rxjs_1.filter)(([a, yp]) => a !== undefined && yp.cauldron.address !== ''), (0, rxjs_1.withLatestFrom)(connection_1.chainIdø, appConfig_1.appConfigø, connection_1.providerø))
    .subscribe(([[account, protocol], chainId, appConfig, provider]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (account !== undefined) {
        console.log('Getting vaults for: ', account);
        const vaultMap = yield (0, initVaults_1.buildVaultMap)(protocol, provider, account, chainId, appConfig);
        yield (0, exports.updateVaults)(Array.from(vaultMap.values()), appConfig.suppressEventLogQueries);
        console.log('Vaults loading complete.');
        (0, messages_1.sendMsg)({ message: 'Vaults Loaded', type: types_1.MessageType.INTERNAL, id: 'vaultsLoaded' });
    }
    else {
        /* if account changes and is undefined > EMPTY the vaultMap */
        vaultMap$.next(new Map([]));
    }
}));
const _updateVault = (vault, account, protocol, suppressEventLogQueries) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const { seriesRootMap, cauldron, witch, oracleMap } = protocol;
    const RateOracle = oracleMap.get('RateOracle');
    /* Get dynamic vault data */
    const [{ ink, art }, { owner, seriesId, ilkId }, // Update balance and series (series - because a vault can have been rolled to another series) */
    liquidations, // Get the list of liquidations on this vault - unless supressed
    ] = yield Promise.all([
        cauldron.balances(vault.id),
        cauldron.vaults(vault.id),
        suppressEventLogQueries
            ? []
            : witch.queryFilter(witch.filters.Auctioned((0, math_1.bytesToBytes32)(vault.id, 12), null), 'earliest', 'latest'),
    ]);
    /* Check for liquidation event date */
    const liquidationDate = liquidations.length ? liquidations[0].args.start.toNumber() : undefined;
    /* check if the series is mature - Note: calc'd from protocol.seriesMap instead of relying on seriesMap$ observations */
    const series = seriesRootMap.get(seriesId);
    /* Note: If the series is 'ignored' in the appConfig (or undefined) > the series maturity will be considered 'mature' */
    const seriesIsMature = series ? series.maturity - Math.round(new Date().getTime() / 1000) <= 0 : true;
    let accruedArt = art;
    let rateAtMaturity = ethers_1.BigNumber.from('1');
    let rate = ethers_1.BigNumber.from('1');
    if (series && seriesIsMature) {
        rateAtMaturity = yield cauldron.ratesAtMaturity(seriesId);
        [rate] = yield RateOracle.peek((0, math_1.bytesToBytes32)(vault.baseId, 6), '0x5241544500000000000000000000000000000000000000000000000000000000', // bytes for 'RATE'
        '0');
        [accruedArt] = rateAtMaturity.gt(utils_1.ZERO_BN)
            ? (0, math_1.calcAccruedDebt)(rate, rateAtMaturity, art)
            : (0, math_1.calcAccruedDebt)(rate, rate, art);
    }
    return Object.assign(Object.assign({}, vault), { owner, isActive: owner === account, // refreshed in case owner has been updated
        seriesId,
        ilkId, ink: (0, yieldUtils_1.bnToW3bNumber)(ink, vault.ilkDecimals), art: (0, yieldUtils_1.bnToW3bNumber)(art, vault.baseDecimals), accruedArt: (0, yieldUtils_1.bnToW3bNumber)(accruedArt, vault.baseDecimals), underLiquidation: witch.address === owner, hasBeenLiquidated: !!liquidationDate, // TODO redundant ??
        liquidationDate, liquidationDate_: liquidationDate ? (0, yieldUtils_1.dateFromMaturity)(liquidationDate, 'dd MMMM yyyy').display : undefined, rateAtMaturity: (0, yieldUtils_1.bnToW3bNumber)(rateAtMaturity, 18, 2), rate: (0, yieldUtils_1.bnToW3bNumber)(rate, 18, 2) });
});
//# sourceMappingURL=vaults.js.map