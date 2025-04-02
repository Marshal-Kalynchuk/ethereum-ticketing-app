import React, { useState, useEffect } from 'react';

function DemoCustomerAccounts() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Parse demo customers from environment variables
    const demoCustomers = [];
    
    // Try to load customers from environment variables (up to 2 customers)
    for (let i = 1; i <= 2; i++) {
      const address = process.env[`REACT_APP_DEMO_CUSTOMER${i}_ADDRESS`];
      const privateKey = process.env[`REACT_APP_DEMO_CUSTOMER${i}_PRIVATE_KEY`];
      const name = process.env[`REACT_APP_DEMO_CUSTOMER${i}_NAME`] || `Demo Customer ${i}`;
      
      if (address && privateKey) {
        demoCustomers.push({
          address,
          privateKey,
          name
        });
      }
    }
    
    setCustomers(demoCustomers);
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">Demo Customer Accounts</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Use these accounts to test ticket purchase and resale functionality.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
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
                {customers.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {customer.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      <div className="flex items-center relative">
                        <span className="truncate max-w-xs">{customer.privateKey}</span>
                        <button
                          onClick={() => handleCopyToClipboard(customer.privateKey, index)}
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
            <li>Ensure you have enough Sepolia ETH for gas and ticket purchases</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DemoCustomerAccounts;