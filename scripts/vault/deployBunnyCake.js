const hardhat = require("hardhat");

const registerSubsidy = require("../utils/registerSubsidy");
const predictAddresses = require("../utils/predictAddresses");
const { getNetworkRpc } = require("../utils/getNetworkRpc");

const ethers = hardhat.ethers;

const config = {
  want: "",
  mooName: "Moo Bunny Cake",
  mooSymbol: "mooBunnyCake",
  delay: 21600,
  keeper: "0xfb8370A4b1b0Ff62D11Ca07B2f0c8490Bf0Fc7D8",
  strategist: "0xfb8370A4b1b0Ff62D11Ca07B2f0c8490Bf0Fc7D8",
};

async function main() {
  await hardhat.run("compile");

  const Vault = await ethers.getContractFactory("BeefyVaultV6");
  const Strategy = await ethers.getContractFactory("StrategyBunnyCake");

  const [deployer] = await ethers.getSigners();
  const rpc = getNetworkRpc(hardhat.network.name);

  console.log("Deploying:", config.mooName);

  const predictedAddresses = await predictAddresses({ creator: deployer.address, rpc });

  const vault = await Vault.deploy(
    config.want,
    predictedAddresses.strategy,
    config.mooName,
    config.mooSymbol,
    config.delay
  );
  await vault.deployed();

  const strategy = await Strategy.deploy(config.keeper, config.strategist, predictedAddresses.vault);
  await strategy.deployed();

  console.log("Vault deployed to:", vault.address);
  console.log("Strategy deployed to:", strategy.address);

  // await registerSubsidy(vault.address, deployer);
  // await registerSubsidy(strategy.address, deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
