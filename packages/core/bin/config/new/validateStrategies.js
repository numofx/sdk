"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStrategies = void 0;
const tslib_1 = require("tslib");
const contracts_1 = require("@numo-engine/contracts");
const strategies_1 = tslib_1.__importDefault(require("./strategies"));
const validateStrategies = (provider) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const preText = '### STRATEGY VALIDATION ERROR ### ';
    const chainId = (yield provider.getNetwork()).chainId;
    const strategyList = strategies_1.default.get(chainId);
    strategyList.forEach((s) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const strategy = contracts_1.Strategy__factory.connect(s.address, provider);
        try {
            const [symbol, baseId, name, decimals, version] = yield Promise.all([
                strategy.symbol(),
                strategy.baseId(),
                strategy.name(),
                strategy.decimals(),
                strategy.version(),
            ]);
            s.symbol !== symbol && console.log(preText, s.address, ': symbol mismatch');
            s.baseId !== baseId && console.log(preText, s.address, ': baseId mismatch');
            s.name !== name && console.log(preText, s.address, ': name mismatch');
            s.decimals !== decimals && console.log(preText, s.address, ': decimals mismatch');
            s.version !== version && console.log(preText, s.address, ': version mismatch');
        }
        catch (e) {
            console.log(preText, s.address, ': Contract not reachable.');
        }
    }));
});
exports.validateStrategies = validateStrategies;
//# sourceMappingURL=validateStrategies.js.map