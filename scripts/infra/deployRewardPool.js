const hardhat = require("hardhat");

const ethers = hardhat.ethers;

const config = {
  staked: "0xE8930F26A176dc1320eD0Ee423AFe09e378C2e6A",
  rewards: "0x4200000000000000000000000000000000000006",
  feeBatch: "0xfb8370A4b1b0Ff62D11Ca07B2f0c8490Bf0Fc7D8"
};

async function main() {
  await hardhat.run("compile");

  const Pool = await ethers.getContractFactory("BeefyRewardPool");
  const pool = await Pool.deploy(config.staked, config.rewards);
  await pool.deployed();

  

  console.log("Reward pool deployed to:", pool.address);

  console.log(`Transfering Ownership....`);
  await pool.transferOwnership(config.feeBatch);

  console.log(`Verifying contract....`);
  await hardhat.run("verify:verify", {
    address: pool.address,
    constructorArguments: [
    config.staked,
    config.rewards,
    ],
  })
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });