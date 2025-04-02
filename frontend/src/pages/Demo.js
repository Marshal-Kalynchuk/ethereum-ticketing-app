import React from 'react';
import DemoVenueAccounts from '../components/admin/DemoVenueAccounts';

function Demo() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Demo Accounts</h1>
        <p className="mt-2 text-gray-600">
          This page provides test accounts that can be used to demo the application.
          Import these accounts into MetaMask to test different roles in the system.
        </p>
      </div>
      
      {/* Demo Venue Accounts section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Venue Accounts</h2>
        <p className="mb-6 text-gray-600">
          These accounts can be used to test venue functionality. Each account represents a venue
          that can create and manage events, once authorized by the contract owner.
        </p>
        <DemoVenueAccounts />
      </div>
      
      <div className="bg-yellow-50 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                These accounts are for testing purposes only. Do not use them in a production environment
                or with real funds. The private keys are publicly available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo; 