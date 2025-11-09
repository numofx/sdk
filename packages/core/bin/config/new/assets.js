"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSETS_42220 = exports.ASSETS_1 = exports.ASSETS_42161 = exports.IGNORE_BASE_ASSETS = exports.ETH_BASED_ASSETS = exports.CONVEX_BASED_ASSETS = exports.USDT_CELO = exports.cKES = exports.CRAB = exports.FUSDC2306 = exports.FDAI2306 = exports.FETH2306 = exports.FUSDC2303 = exports.FDAI2303 = exports.FETH2303 = exports.FUSDC2212 = exports.FDAI2212 = exports.FETH2212 = exports.CVX3CRV = exports.FUSDC2209 = exports.FDAI2209 = exports.FUSDC2206 = exports.FDAI2206 = exports.FUSDC2203 = exports.FDAI2203 = exports.FRAX = exports.MKR = exports.yvUSDC = exports.UNI = exports.ENS = exports.LINK = exports.wstETH = exports.stETH = exports.WBTC = exports.USDC = exports.DAI = exports.WETH = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["ERC20_"] = 0] = "ERC20_";
    TokenType[TokenType["ERC20_Permit"] = 1] = "ERC20_Permit";
    TokenType[TokenType["ERC20_DaiPermit"] = 2] = "ERC20_DaiPermit";
    TokenType[TokenType["ERC20_MKR"] = 3] = "ERC20_MKR";
    TokenType[TokenType["ERC1155_"] = 4] = "ERC1155_";
    TokenType[TokenType["ERC720_"] = 5] = "ERC720_";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
exports.WETH = '0x303000000000';
exports.DAI = '0x303100000000';
exports.USDC = '0x303200000000';
exports.WBTC = '0x303300000000';
exports.stETH = '0x303500000000';
exports.wstETH = '0x303400000000';
exports.LINK = '0x303600000000';
exports.ENS = '0x303700000000';
exports.UNI = '0x313000000000';
exports.yvUSDC = '0x303900000000';
exports.MKR = '0x313100000000';
exports.FRAX = '0x313800000000';
/* Notional fCash assets */
exports.FDAI2203 = '0x313200000000';
exports.FUSDC2203 = '0x313300000000';
exports.FDAI2206 = '0x313400000000';
exports.FUSDC2206 = '0x313500000000';
exports.FDAI2209 = '0x313600000000';
exports.FUSDC2209 = '0x313700000000';
/* Convex Curve LP token assets */
exports.CVX3CRV = '0x313900000000';
exports.FETH2212 = '0x323800000000';
exports.FDAI2212 = '0x323300000000';
exports.FUSDC2212 = '0x323400000000';
exports.FETH2303 = '0x323900000000';
exports.FDAI2303 = '0x323500000000';
exports.FUSDC2303 = '0x323600000000';
exports.FETH2306 = '0x40301200028B';
exports.FDAI2306 = '0x40311200028B';
exports.FUSDC2306 = '0x40321200028B';
exports.CRAB = '0x333800000000';
/* Celo assets */
exports.cKES = '0x404000000000';
exports.USDT_CELO = '0x404100000000';
exports.CONVEX_BASED_ASSETS = [
    'CVX3CRV',
    exports.CVX3CRV,
    'CVX3CRV MOCK',
    'Curve.fi DAI/USDC/USDT Convex Deposit Mock',
    'cvx3Crv',
];
exports.ETH_BASED_ASSETS = ['WETH', 'ETH', exports.WETH];
exports.IGNORE_BASE_ASSETS = ['ENS'];
exports.ASSETS_42161 = new Map();
exports.ASSETS_1 = new Map();
exports.ASSETS_1.set(exports.DAI, {
    assetAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    joinAddress: '0x4fE92119CDf873Cf8826F4E6EcfD4E578E3D44Dc',
    version: '1',
    name: 'Dai stable coin',
    decimals: 18,
    symbol: 'DAI',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_DaiPermit,
    isYieldBase: true,
});
exports.ASSETS_1.set(exports.USDC, {
    assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    joinAddress: '0x0d9A1A773be5a83eEbda23bf98efB8585C3ae4f4',
    version: '1',
    name: 'USDC Stable coin',
    decimals: 6,
    symbol: 'USDC',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_Permit,
    isYieldBase: true,
});
exports.ASSETS_1.set(exports.WBTC, {
    assetAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    joinAddress: '0x00De0AEFcd3069d88f85b4F18b144222eaAb92Af',
    version: '1',
    name: 'Wrapped Bitcoin',
    decimals: 18,
    symbol: 'WBTC',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC20_,
});
exports.ASSETS_1.set(exports.ENS, {
    assetAddress: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
    joinAddress: '0x5AAfd8F0bfe3e1e6bAE781A6641096317D762969',
    version: '1',
    name: 'Ethereum Naming Service',
    decimals: 18,
    symbol: 'ENS',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_Permit,
});
exports.ASSETS_1.set(exports.WETH, {
    assetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    joinAddress: '0x3bDb887Dc46ec0E964Df89fFE2980db0121f0fD0',
    version: '1',
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    displaySymbol: 'ETH',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC20_,
    isYieldBase: true,
});
exports.ASSETS_1.set(exports.wstETH, {
    assetAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',
    version: '1',
    name: 'Wrapped Staked Ether',
    decimals: 18,
    symbol: 'wstETH',
    displaySymbol: 'wstETH',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC20_Permit,
    wrapHandlerAddresses: new Map([]),
    unwrapHandlerAddresses: new Map([
        [1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1'],
        [4, '0x64BA0F1D2E5479BF132936328e8c533c95646fE8'],
        [5, '0x9f65A6c2b2F12117573323443C8C2290f4C1e675'],
    ]),
});
exports.ASSETS_1.set(exports.stETH, {
    assetAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',
    version: '1',
    name: 'Staked Eth',
    decimals: 18,
    symbol: 'stETH',
    showToken: false,
    digitFormat: 6,
    tokenType: TokenType.ERC20_Permit,
    wrapHandlerAddresses: new Map([[1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1']]),
    unwrapHandlerAddresses: new Map([]),
    proxyId: exports.wstETH,
});
exports.ASSETS_1.set(exports.LINK, {
    assetAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    joinAddress: '0xbDaBb91cDbDc252CBfF3A707819C5f7Ec2B92833',
    version: '1',
    name: 'ChainLink',
    decimals: 18,
    symbol: 'LINK',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_,
});
exports.ASSETS_1.set(exports.yvUSDC, {
    assetAddress: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
    joinAddress: '0x403ae7384E89b086Ea2935d5fAFed07465242B38',
    version: '1',
    name: 'Yearn Vault USDC',
    decimals: 18,
    symbol: 'yvUSDC',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_,
    limitToSeries: ['0x303230350000', '0x303230360000', '0x303230370000', '0x303230380000', '0x303230390000'],
});
exports.ASSETS_1.set(exports.UNI, {
    assetAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    joinAddress: '0x41567f6A109f5bdE283Eb5501F21e3A0bEcbB779',
    version: '1',
    name: 'Uniswap token',
    decimals: 18,
    symbol: 'UNI',
    showToken: true,
    digitFormat: 4,
    tokenType: TokenType.ERC20_Permit,
});
exports.ASSETS_1.set(exports.FRAX, {
    assetAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    joinAddress: '0x5655A973A49e1F9c1408bb9A617Fd0DBD0352464',
    version: '1',
    name: 'frax',
    decimals: 18,
    symbol: 'FRAX',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_,
    limitToSeries: [],
    isYieldBase: true,
});
exports.ASSETS_1.set(exports.FDAI2203, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0xb8d37d6Fcbc6882480633aBF3682b1D4ae2aB124',
    version: '1',
    name: 'fDAI2203',
    decimals: 8,
    symbol: 'FDAI2203',
    showToken: false,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 563371972493313,
    limitToSeries: ['0x303130350000'],
    wrapHandlerAddresses: new Map([]),
    unwrapHandlerAddresses: new Map([]),
});
exports.ASSETS_1.set(exports.FUSDC2203, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x4970B046565BEE1DE8308E41BD22d0061A251911',
    version: '1',
    name: 'fUSDC2203',
    decimals: 8,
    symbol: 'FUSDC2203',
    showToken: false,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 844846949203969,
    limitToSeries: ['0x303230350000'],
});
exports.ASSETS_1.set(exports.FDAI2206, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x9f41f9eE1A7B24b6B016a7e61a4161A0CFCf5987',
    version: '1',
    name: 'fDAI2206',
    decimals: 8,
    symbol: 'FDAI2206',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 563373963149313,
    limitToSeries: ['0x303130360000'],
});
exports.ASSETS_1.set(exports.FUSDC2206, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x62DdD41F8A65B03746656D85b6B2539aE42e23e8',
    version: '1',
    name: 'fUSDC2206',
    decimals: 8,
    symbol: 'FUSDC2206',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 844848939859969,
    limitToSeries: ['0x303230360000'],
});
exports.ASSETS_1.set(exports.FDAI2209, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x399bA81A1f1Ed0221c39179C50d4d4Bc85C3F3Ab',
    version: '1',
    name: 'fDAI2209',
    decimals: 8,
    symbol: 'FDAI2209',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 563375953805313,
    limitToSeries: ['0x303130370000'],
});
exports.ASSETS_1.set(exports.FUSDC2209, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x0Bfd3B8570A4247157c5468861d37dA55AAb9B4b',
    version: '1',
    name: 'fUSDC2209',
    decimals: 8,
    symbol: 'FUSDC2209',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 844850930515969,
    limitToSeries: ['0x303230370000'],
});
exports.ASSETS_1.set(exports.FETH2212, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0xe888E0403e3e992fDbB473650547428e90F9DDFC',
    version: '1',
    name: 'Notional fCash ETH Dec 22',
    decimals: 8,
    symbol: 'fETH2212',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 281902967750657,
    limitToSeries: ['0x303030380000'],
});
exports.ASSETS_1.set(exports.FETH2303, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0xC4cb2489a845384277564613A0906f50dD66e482',
    version: '1',
    name: 'Notional fCash ETH March 23',
    decimals: 8,
    symbol: 'fETH2303',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 281904958406657,
    limitToSeries: ['0x303030390000'],
});
exports.ASSETS_1.set(exports.FUSDC2212, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0xA9078E573EC536c4066A5E89F715553Ed67B13E0',
    version: '1',
    name: 'Notional fCash USDC Dec 22',
    decimals: 8,
    symbol: 'fUSDC2212',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 844852921171969,
    limitToSeries: ['0x303230380000'],
});
exports.ASSETS_1.set(exports.FUSDC2303, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x3FdDa15EccEE67248048a560ab61Dd2CdBDeA5E6',
    version: '1',
    name: 'Notional fCash USDC March 23',
    decimals: 8,
    symbol: 'fUSDC2303',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 844854911827969,
    limitToSeries: ['0x303230390000'],
});
exports.ASSETS_1.set(exports.FDAI2212, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x83e99A843607CfFFC97A3acA15422aC672a463eF',
    version: '1',
    name: 'Notional fCash DAI Dec 22',
    decimals: 8,
    symbol: 'fDAI2212',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 563377944461313,
    limitToSeries: ['0x303130380000'],
});
exports.ASSETS_1.set(exports.FDAI2303, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0xE6A63e2166fcEeB447BFB1c0f4f398083214b7aB',
    version: '1',
    name: 'Notional fCash DAI March 23',
    decimals: 8,
    symbol: 'fDAI2303',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 563379935117313,
    limitToSeries: ['0x303130390000'],
});
exports.ASSETS_1.set(exports.FDAI2306, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0xe295111049A6665b35C054e3D0e896816bD12b2C',
    version: '1',
    name: 'Notional fCash DAI June 23',
    decimals: 8,
    symbol: 'fDAI2306',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 563381925773313,
    limitToSeries: ['0x0031FF00028B'],
});
exports.ASSETS_1.set(exports.FUSDC2306, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x53B0C1b8fEB4dEcdcc068367119110E20c3BCBD3',
    version: '1',
    name: 'Notional fCash USDC June 23',
    decimals: 8,
    symbol: 'fUSDC2306',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 844856902483969,
    limitToSeries: ['0x0032FF00028B'],
});
exports.ASSETS_1.set(exports.FETH2306, {
    assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
    joinAddress: '0x067Fb37Dd51a4eF6Fea0E006CaF689Db6c705812',
    version: '1',
    name: 'Notional fCash ETH June 23',
    decimals: 8,
    symbol: 'fETH2306',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC1155_,
    tokenIdentifier: 281906949062657,
    limitToSeries: ['0x0030FF00028B'],
});
exports.ASSETS_1.set(exports.CRAB, {
    assetAddress: '0x3B960E47784150F5a63777201ee2B15253D713e8',
    joinAddress: '0xc76a01d18463d7aebea574a34b7d70d8aab389b2',
    version: '1',
    name: 'Crab Strategy v2',
    decimals: 18,
    symbol: 'Crabv2',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_,
    limitToSeries: ['0x303030380000', '0x303030390000', '0x303130380000', '0x303130390000', '0x303230380000', '0x303230390000'],
    isYieldBase: false,
});
// ASSETS_1.set(CVX3CRV, {
//   assetAddress: '',
//   joinAddress: '',
//   version: '1',
//   name: 'cvx3crv',
//   decimals: 18,
//   symbol: 'cvx3crv',
//   showToken: false,
//   digitFormat: 2,
//   tokenType: TokenType.ERC20_,
//   limitToSeries: [
//     '0x303130360000', // june dai
//     '0x303130370000', // sept dai
//     '0x303230370000', // sept usdc
//     '0x303230360000', // june usdc
//   ],
// });
exports.ASSETS_42161.set(exports.DAI, {
    version: '2',
    name: 'Dai stable coin',
    decimals: 18,
    symbol: 'DAI',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_Permit,
    assetAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    joinAddress: '0xc31cce4fFA203d8F8D865b6cfaa4F36AD77E9810',
    isYieldBase: true,
});
exports.ASSETS_42161.set(exports.USDC, {
    version: '1',
    name: 'USDC Stable coin',
    decimals: 6,
    symbol: 'USDC',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_Permit,
    assetAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    joinAddress: '0x1229C71482E458fa2cd51d13eB157Bd2b5D5d1Ee',
    isYieldBase: true,
});
exports.ASSETS_42161.set(exports.WETH, {
    version: '1',
    name: 'Wrapped Ether',
    decimals: 18,
    symbol: 'WETH',
    displaySymbol: 'ETH',
    showToken: true,
    digitFormat: 6,
    tokenType: TokenType.ERC20_,
    assetAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    joinAddress: '0xaf93a04d5D8D85F69AF65ED66A9717DB0796fB10',
    isYieldBase: true,
});
/* Celo Mainnet Assets (Chain ID: 42220) */
exports.ASSETS_42220 = new Map();
exports.ASSETS_42220.set(exports.cKES, {
    version: '1',
    name: 'Celo Kenyan Shilling',
    decimals: 18,
    symbol: 'cKES',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_Permit,
    assetAddress: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0',
    joinAddress: '0x0000000000000000000000000000000000000000',
    isYieldBase: true,
});
exports.ASSETS_42220.set(exports.USDT_CELO, {
    version: '1',
    name: 'Tether USD',
    decimals: 6,
    symbol: 'USDT',
    showToken: true,
    digitFormat: 2,
    tokenType: TokenType.ERC20_Permit,
    assetAddress: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    joinAddress: '0x0000000000000000000000000000000000000000',
    isYieldBase: true,
});
const ASSETS = new Map([
    [1, exports.ASSETS_1],
    [42161, exports.ASSETS_42161],
    [42220, exports.ASSETS_42220],
]);
exports.default = ASSETS;
//# sourceMappingURL=assets.js.map