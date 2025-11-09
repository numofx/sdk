"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CELO = exports.OPTIMISM = exports.ARBITRUM = exports.ETHEREUM = exports.IGNORED_CALLDATA = exports.BLANK_SERIES = exports.BLANK_VAULT = exports.BLANK_ADDRESS = exports.RATE = exports.CHI = exports.CHAI_BYTES = exports.ETH_BYTES = exports.SECONDS_PER_YEAR = exports.WAD_BN = exports.WAD_RAY_BN = exports.MINUS_ONE_BN = exports.ONE_BN = exports.ZERO_W3B = exports.ZERO_BN = exports.MAX_128 = exports.MAX_256 = void 0;
const ethers_1 = require("ethers");
/* constants */
exports.MAX_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
exports.MAX_128 = '0xffffffffffffffffffffffffffffffff';
exports.ZERO_BN = ethers_1.ethers.constants.Zero;
exports.ZERO_W3B = { big: ethers_1.ethers.constants.Zero, hStr: '0', dsp: 0 };
exports.ONE_BN = ethers_1.ethers.constants.One;
exports.MINUS_ONE_BN = ethers_1.ethers.constants.One.mul(-1);
exports.WAD_RAY_BN = ethers_1.BigNumber.from('1000000000000000000000000000');
exports.WAD_BN = ethers_1.BigNumber.from('1000000000000000000');
exports.SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
exports.ETH_BYTES = ethers_1.ethers.utils.formatBytes32String('ETH-A');
exports.CHAI_BYTES = ethers_1.ethers.utils.formatBytes32String('CHAI');
exports.CHI = ethers_1.ethers.utils.formatBytes32String('chi');
exports.RATE = ethers_1.ethers.utils.formatBytes32String('rate');
exports.BLANK_ADDRESS = ethers_1.ethers.constants.AddressZero;
exports.BLANK_VAULT = '0x000000000000000000000000';
exports.BLANK_SERIES = '0x000000000000';
exports.IGNORED_CALLDATA = { operation: '', args: new Array(7), ignoreIf: true };
exports.ETHEREUM = 'ETHEREUM';
exports.ARBITRUM = 'ARBITRUM';
exports.OPTIMISM = 'OPTIMISM';
exports.CELO = 'CELO';
//# sourceMappingURL=constants.js.map