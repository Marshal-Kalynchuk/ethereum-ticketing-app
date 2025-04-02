import React, { useState } from 'react';

function DemoVenueAccounts() {
  const [venues] = useState([
    {
      address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4d',
      privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
      name: 'Madison Square Garden',
      location: 'New York, NY'
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      name: 'The Forum',
      location: 'Los Angeles, CA'
    },
    {
      address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      name: 'United Center',
      location: 'Chicago, IL'
    },
    {
      address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
      name: 'The O2 Arena',
      location: 'London, UK'
    },
    {
      address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
      name: 'Wells Fargo Center',
      location: 'Philadelphia, PA'
    }
  ]);

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
          <h3 className="text-lg leading-6 font-medium text-gray-900">Demo Venue Accounts</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Use these accounts to test venue authorization functionality.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue Name
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
                {venues.map((venue, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {venue.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venue.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {venue.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      <div className="flex items-center relative">
                        <span className="truncate max-w-xs">{venue.privateKey}</span>
                        <button
                          onClick={() => handleCopyToClipboard(venue.privateKey, index)}
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
            <li>Import the private key into MetaMask or your wallet</li>
            <li>Connect with that account</li>
            <li>The account will need to be authorized by the contract owner</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DemoVenueAccounts; 