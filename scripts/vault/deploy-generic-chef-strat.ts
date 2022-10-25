import hardhat, { ethers, web3 } from "hardhat";
import { addressBook } from "blockchain-addressbook";
import { predictAddresses } from "../../utils/predictAddresses";
import { setPendingRewardsFunctionName } from "../../utils/setPendingRewardsFunctionName";
import { verifyContract } from "../../utils/verifyContract";

const registerSubsidy = require("../../utils/registerSubsidy");

const {
  platforms: { pancake, beefyfinance },
  tokens: {
    CAKE: { address: CAKE },
    WBNB: { address: WBNB },
    WOM: { address: WOM },
    SD: { address: SD },
    BUSD: { address: BUSD }
  },
} = addressBook.bsc;

const shouldVerifyOnEtherscan = false;

const want = web3.utils.toChecksumAddress("0x6DbE46854723c439c8a5Dc8D6d08e7df685Dcd9d");
const ensId = ethers.utils.formatBytes32String("cake.eth");


/**
 *   outputToNativeRoute: [CAKE, WBNB],
  outputToLp0Route: [CAKE, BUSD, WOM],
  outputToLp1Route: [CAKE, BUSD],
 */
const vaultParams = {
  mooName: "Moo BriseCakeV2 agam-brise",
  mooSymbol: "mooBriseCakeV2agamBrise",
  delay: 21600,
};
const agam="0xE8930F26A176dc1320eD0Ee423AFe09e378C2e6A"
const wbrise="0x0eb9036cbE0f052386f36170c6b07eF0a0E3f710"
const briseswapLptoken="0xF26006408112be347c23FDBa03F7bC3566519655"

const strategyParams = {
  want: want,
  poolId: 0,
  chef:"0x4013c82F6cD1E4D3F3428f5B685Bb301c9dF540d",
  unirouter: "0xE396407e21F7d7526ff0b0a8912751C64957fBF7",
  strategist: "0xfb8370A4b1b0Ff62D11Ca07B2f0c8490Bf0Fc7D8",
  keeper: "0xfb8370A4b1b0Ff62D11Ca07B2f0c8490Bf0Fc7D8",
  beefyFeeRecipient: "0x4387FcdF7399BDEb61A98DD2bb2382B870fa04Ab",
  beefyFeeConfig: "0x1c80B9b421a699023238174308f0373E3328C5ae",
  outputToNativeRoute: [briseswapLptoken, wbrise],
  outputToLp0Route: [briseswapLptoken, wbrise, agam],
  outputToLp1Route: [briseswapLptoken, wbrise],
  ensId,
  shouldSetPendingRewardsFunctionName: true,
  pendingRewardsFunctionName: "pendingCake", // used for rewardsAvailable(), use correct function name from masterchef
};

const contractNames = {
  vault: "BeefyVaultV6",
  strategy: "StrategyCommonChefLP",
};

async function main() {
  if (
    Object.values(vaultParams).some(v => v === undefined) ||
    Object.values(strategyParams).some(v => v === undefined) ||
    Object.values(contractNames).some(v => v === undefined)
  ) {
    console.error("one of config values undefined");
    return;
  }

  await hardhat.run("compile");

  const Vault = await ethers.getContractFactory(contractNames.vault);
  const Strategy = await ethers.getContractFactory(contractNames.strategy);

  const [deployer] = await ethers.getSigners();

  console.log("Deploying:", vaultParams.mooName);

  const predictedAddresses = await predictAddresses({ creator: deployer.address });

  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    vaultParams.mooName,
    vaultParams.mooSymbol,
    vaultParams.delay,
  ];
  const vault = await Vault.deploy(...vaultConstructorArguments);
  await vault.deployed();

  const strategyConstructorArguments = [
    strategyParams.want,
    strategyParams.poolId,
    strategyParams.chef,
    [vault.address,
    strategyParams.unirouter,
    strategyParams.keeper,
    strategyParams.strategist,
    strategyParams.beefyFeeRecipient,
    strategyParams.beefyFeeConfig],
    strategyParams.outputToNativeRoute,
    strategyParams.outputToLp0Route,
    strategyParams.outputToLp1Route
  ];
  const strategy = await Strategy.deploy(...strategyConstructorArguments);
  await strategy.deployed();

  // add this info to PR
  console.log();
  console.log("Vault:", vault.address);
  console.log("Strategy:", strategy.address);
  console.log("Want:", strategyParams.want);
  console.log("PoolId:", strategyParams.poolId);

  console.log();
  console.log("Running post deployment");

  const verifyContractsPromises: Promise<any>[] = [];
  if (shouldVerifyOnEtherscan) {
    // skip await as this is a long running operation, and you can do other stuff to prepare vault while this finishes
    verifyContractsPromises.push(
      verifyContract(vault.address, vaultConstructorArguments),
      verifyContract(strategy.address, strategyConstructorArguments)
    );
  }

  if (strategyParams.shouldSetPendingRewardsFunctionName) {
      await setPendingRewardsFunctionName(strategy, strategyParams.pendingRewardsFunctionName);
  }
  
  console.log(`Transfering Vault Owner to ${beefyfinance.vaultOwner}`)
  await vault.transferOwnership(beefyfinance.vaultOwner);
  console.log();

  await Promise.all(verifyContractsPromises);

  if (hardhat.network.name === "bsc") {
    await registerSubsidy(vault.address, deployer);
    await registerSubsidy(strategy.address, deployer);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
