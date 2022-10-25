const hardhat = require("hardhat");
const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
import { addressBook } from "blockchain-addressbook";

const ethers = hardhat.ethers;

// //const {
//  // platforms: { stella, beefyfinance },
//   //tokens: {
//     USDC: { address: USDC },
//     BIFI: { address: BIFI }
//   },
// } = addressBook.cronos;

const addressZero = ethers.constants.AddressZero,

const config = {
  treasury: "0xfb8370A4b1b0Ff62D11Ca07B2f0c8490Bf0Fc7D8",
  rewardPool: "0x79a1847677B2c14311B9d3708C0483B6DF521f60",
  unirouter: "0xE396407e21F7d7526ff0b0a8912751C64957fBF7",
  bifi: "0xE8930F26A176dc1320eD0Ee423AFe09e378C2e6A",
  wNative: "0x0eb9036cbE0f052386f36170c6b07eF0a0E3f710",
  stable: "0xDe14b85cf78F2ADd2E867FEE40575437D5f10c06",
  bifiRoute: ["0x0eb9036cbE0f052386f36170c6b07eF0a0E3f710", "0xE8930F26A176dc1320eD0Ee423AFe09e378C2e6A"],
  stableRoute: ["0x0eb9036cbE0f052386f36170c6b07eF0a0E3f710", "0xDe14b85cf78F2ADd2E867FEE40575437D5f10c06"],
  splitTreasury: false,
  treasuryFee: 6400
};

async function main() {
  await hardhat.run("compile");

  const deployer = await ethers.getSigner();
  const provider = deployer.provider;

  const BeefyFeeBatch = await ethers.getContractFactory("BeefyFeeBatchV3");

  const batcher = await upgrades.deployProxy(BeefyFeeBatch,  [
    config.bifi,
    config.wNative,
    config.stable,
    config.treasury,
    config.rewardPool,
    config.unirouter,
    config.bifiRoute, 
    config.stableRoute, 
    config.splitTreasury,
    config.treasuryFee
  ]
 );
  await batcher.deployed();

  const implementationAddr = await getImplementationAddress(provider, batcher.address);
  console.log("Deployed to:", batcher.address);
  console.log(`Deployed implementation at ${implementationAddr}`);

 
  console.log(`Verifing implementation`);
  await hardhat.run("verify:verify", {
    address: implementationAddr,
    constructorArguments: [
    ]
  })

}



main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
