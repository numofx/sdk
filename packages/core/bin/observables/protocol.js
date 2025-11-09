"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProtocol = exports.protocolø = void 0;
const tslib_1 = require("tslib");
const rxjs_1 = require("rxjs");
const ethers_1 = require("ethers");
const types_1 = require("../types");
const contracts = tslib_1.__importStar(require("@numo-engine/contracts"));
const messages_1 = require("./messages");
// TODO: try to get rid of this init?
const _blankProtocol = {
    protocolVersion: '0.0.0',
    cauldron: contracts.Cauldron__factory.connect('', new ethers_1.ethers.providers.JsonRpcProvider()),
    ladle: contracts.Ladle__factory.connect('', new ethers_1.ethers.providers.JsonRpcProvider()),
    witch: contracts.Witch__factory.connect('', new ethers_1.ethers.providers.JsonRpcProvider()),
    oracleMap: new Map([]),
    moduleMap: new Map([]),
    assetRootMap: new Map([]),
    seriesRootMap: new Map([]),
    strategyRootMap: new Map([]),
};
const protocol$ = new rxjs_1.BehaviorSubject(_blankProtocol);
exports.protocolø = protocol$.pipe((0, rxjs_1.shareReplay)(1));
const updateProtocol = (newProtocol) => {
    protocol$.next(newProtocol); // update to whole new protocol
};
exports.updateProtocol = updateProtocol;
/**
 *
 * Send a message when the protocol is 'ready'
 * Check the currnet network situation and timeout
 *
 * */
messages_1.internalMessagesø
    .pipe((0, rxjs_1.takeWhile)((msg) => !(msg.has('assetsLoaded') && msg.has('seriesLoaded') && msg.has('strategiesLoaded')), true), (0, rxjs_1.finalize)(() => {
    (0, messages_1.sendMsg)({ message: 'Protocol Ready', id: 'protocolReady', type: types_1.MessageType.INTERNAL });
    (0, messages_1.sendMsg)({ message: 'Protocol Ready (custom wait 4500ms)', timeoutOverride: 4500 });
}))
    .subscribe();
//# sourceMappingURL=protocol.js.map