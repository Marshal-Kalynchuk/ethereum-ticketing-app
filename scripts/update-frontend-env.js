const fs = require('fs');
const path = require('path');

async function main() {
  const networkName = process.env.NETWORK || 'sepolia';
  console.log(`Updating frontend .env file for ${networkName}...`);
  
  // Read wallet information
  const walletsPath = path.join(__dirname, '../deployments/demo-wallets.json');
  if (!fs.existsSync(walletsPath)) {
    console.error('Generated wallets not found. Run scripts/generate-wallets.js first.');
    process.exit(1);
  }
  
  const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  
  // Read deployment information
  const deploymentPath = path.join(__dirname, '../deployments', `${networkName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file for ${networkName} not found.`);
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Read accounts information if available
  let accounts = {};
  const accountsPath = path.join(__dirname, '../deployments', `${networkName}-accounts.json`);
  if (fs.existsSync(accountsPath)) {
    accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
  }
  
  // Create or update frontend .env file
  let envContent = `# Generated for ${networkName} network - ${new Date().toISOString()}\n\n`;
  
  // Add contract addresses
  envContent += `# Contract Addresses\n`;
  envContent += `REACT_APP_TICKETING_SYSTEM_ADDRESS=${deployment.ticketingSystem}\n`;
  if (deployment.testEvent) {
    envContent += `REACT_APP_TEST_EVENT_ADDRESS=${deployment.testEvent}\n`;
  }
  if (deployment.ticketNFT) {
    envContent += `REACT_APP_TEST_NFT_ADDRESS=${deployment.ticketNFT}\n`;
  }
  
  envContent += `\n# Network Configuration\n`;
  envContent += `REACT_APP_SUPPORTED_CHAIN_IDS=31337,1337,11155111\n`;
  
  // Define venue names and locations
  const venueInfo = [
    {
      name: "Madison Square Garden",
      location: "New York, NY"
    },
    {
      name: "The Forum",
      location: "Los Angeles, CA"
    },
    {
      name: "United Center",
      location: "Chicago, IL"
    }
  ];
  
  // Add demo venue accounts
  envContent += `\n# Demo Venue Accounts\n`;
  envContent += `REACT_APP_DEMO_VENUE1_ADDRESS=${wallets.venue1.address}\n`;
  envContent += `REACT_APP_DEMO_VENUE1_PRIVATE_KEY=${wallets.venue1.privateKey}\n`;
  envContent += `REACT_APP_DEMO_VENUE1_NAME=${venueInfo[0].name}\n`;
  envContent += `REACT_APP_DEMO_VENUE1_LOCATION=${venueInfo[0].location}\n\n`;
  
  envContent += `REACT_APP_DEMO_VENUE2_ADDRESS=${wallets.venue2.address}\n`;
  envContent += `REACT_APP_DEMO_VENUE2_PRIVATE_KEY=${wallets.venue2.privateKey}\n`;
  envContent += `REACT_APP_DEMO_VENUE2_NAME=${venueInfo[1].name}\n`;
  envContent += `REACT_APP_DEMO_VENUE2_LOCATION=${venueInfo[1].location}\n\n`;
  
  // Add customer names
  const customerNames = ["Demo Fan 1", "Demo Fan 2"];
  
  // Add demo customer accounts
  envContent += `# Demo Customer Accounts\n`;
  envContent += `REACT_APP_DEMO_CUSTOMER1_ADDRESS=${wallets.customer1.address}\n`;
  envContent += `REACT_APP_DEMO_CUSTOMER1_PRIVATE_KEY=${wallets.customer1.privateKey}\n`;
  envContent += `REACT_APP_DEMO_CUSTOMER1_NAME=${customerNames[0]}\n\n`;
  
  envContent += `REACT_APP_DEMO_CUSTOMER2_ADDRESS=${wallets.customer2.address}\n`;
  envContent += `REACT_APP_DEMO_CUSTOMER2_PRIVATE_KEY=${wallets.customer2.privateKey}\n`;
  envContent += `REACT_APP_DEMO_CUSTOMER2_NAME=${customerNames[1]}\n`;
  
  // Write to .env file
  fs.writeFileSync(path.join(__dirname, '../frontend/.env'), envContent);
  console.log('Frontend .env file updated successfully!');
  
  // Also update the .env.example file
  const exampleEnvContent = envContent.replace(/^(REACT_APP_.*_PRIVATE_KEY=).*/gm, '$1PRIVATE_KEY_REMOVED_FROM_EXAMPLE');
  fs.writeFileSync(path.join(__dirname, '../frontend/.env.example'), exampleEnvContent);
  console.log('Frontend .env.example file updated successfully!');
  
  console.log('\nIMPORTANT: Make sure to keep .env file private and never commit to version control!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 