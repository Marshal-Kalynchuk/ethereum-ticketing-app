import React, { useState, useEffect } from 'react';

function DemoAccounts() {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const demoAccounts = [];
    
    // Load venue accounts from environment variables
    for (let i = 1; i <= 3; i++) {
      const address = process.env[`REACT_APP_DEMO_VENUE${i}_ADDRESS`];
      const privateKey = process.env[`REACT_APP_DEMO_VENUE${i}_PRIVATE_KEY`];
      const name = process.env[`REACT_APP_DEMO_VENUE${i}_NAME`] || `Demo Venue ${i}`;
      const location = process.env[`REACT_APP_DEMO_VENUE${i}_LOCATION`] || 'Test Location';
      
      if (address && privateKey) {
        demoAccounts.push({
          type: 'Venue',
          address,
          privateKey,
          name,
          location
        });
      }
    }
    
    // Load customer accounts from environment variables
    for (let i = 1; i <= 2; i++) {
      const address = process.env[`REACT_APP_DEMO_CUSTOMER${i}_ADDRESS`];
      const privateKey = process.env[`REACT_APP_DEMO_CUSTOMER${i}_PRIVATE_KEY`];
      const name = process.env[`REACT_APP_DEMO_CUSTOMER${i}_NAME`] || `Demo Customer ${i}`;
      
      if (address && privateKey) {
        demoAccounts.push({
          type: 'Customer',
          address,
          privateKey,
          name,
          location: 'N/A'
        });
      }
    }
    
    setAccounts(demoAccounts);
  }, []);

  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyToClipboard = (privateKey, index) => {
    navigator.clipboard.writeText(privateKey);
    setCopiedIndex(index);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="mt-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Demo Accounts for Testing</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Use these accounts to test venue authorization, ticket purchases, and resale functionality.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Private Key
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account, index) => (
                  <tr key={index} className={account.type === 'Venue' ? 'bg-blue-50' : 'bg-green-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        account.type === 'Venue' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {account.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      <div className="flex items-center relative">
                        <span className="truncate max-w-xs">{account.privateKey}</span>
                        <button
                          onClick={() => handleCopyToClipboard(account.privateKey, index)}
                          className="ml-2 text-primary-600 hover:text-primary-900"
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                        {copiedIndex === index && (
                          <div className="absolute right-0 top-0 -mt-8 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded border border-green-200 whitespace-nowrap">
                            Copied!
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-4 py-4 bg-gray-50 text-sm text-gray-500">
          <p>To use these accounts for testing:</p>
          <ol className="list-decimal ml-5 mt-2">
            <li>Import the private key into MetaMask</li>
            <li>Connect with that account</li>
            <li><strong>Venue accounts</strong> need to be authorized by the contract owner</li>
            <li><strong>Customer accounts</strong> need enough Sepolia ETH for gas and ticket purchases</li>
          </ol>
          <p className="mt-2">
            <span className="font-semibold">Note:</span> These are demo accounts only for testing purposes. Do not send real assets to these addresses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DemoAccounts; 