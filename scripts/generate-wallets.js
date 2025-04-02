// scripts/generate-wallets.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Generating demo wallets...");
  
  // Generate wallet accounts
  const deployer = ethers.Wallet.createRandom();
  const venue1 = ethers.Wallet.createRandom();
  const venue2 = ethers.Wallet.createRandom();
  const customer1 = ethers.Wallet.createRandom();
  const customer2 = ethers.Wallet.createRandom();
  
  // Create wallet info object
  const walletInfo = {
    deployer: {
      address: deployer.address,
      privateKey: deployer.privateKey
    },
    venue1: {
      address: venue1.address,
      privateKey: venue1.privateKey
    },
    venue2: {
      address: venue2.address,
      privateKey: venue2.privateKey
    },
    customer1: {
      address: customer1.address,
      privateKey: customer1.privateKey
    },
    customer2: {
      address: customer2.address,
      privateKey: customer2.privateKey
    }
  };
  
  // Create directories if they don't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Write wallet info to file
  fs.writeFileSync(
    path.join(deploymentsDir, 'demo-wallets.json'),
    JSON.stringify(walletInfo, null, 2)
  );
  
  console.log("Demo wallets generated and saved to deployments/demo-wallets.json");
  console.log("\nIMPORTANT: Fund these accounts with Sepolia ETH before deployment");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Venue 1: ${venue1.address}`);
  console.log(`Venue 2: ${venue2.address}`);
  console.log(`Customer 1: ${customer1.address}`);
  console.log(`Customer 2: ${customer2.address}`);
  console.log("\nGet Sepolia ETH from https://sepoliafaucet.com/ or other faucets");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 