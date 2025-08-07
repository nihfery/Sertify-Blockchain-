const path = require("path");
require('dotenv').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // port ganache
      network_id: "5777"
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.TEST_MNEMONIC, "https://ropsten.infura.io/v3/279c40b247e246609188d276e02e6de2", 0),
      network_id: 3,
      gas: 4700000,
    },
    rinkeby: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 4,
      gas: 4700000,
      from: "0x6a1335bcc64630802a3edfbcdfea84de45608b27"
    }
  },
  compilers: {
    solc: {
      version: "0.5.12"
    }
  }
};
