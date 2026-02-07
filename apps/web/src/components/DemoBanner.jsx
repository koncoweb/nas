import { useState } from 'react';

function DemoBanner({ user }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getRoleInfo = (role) => {
    const roleConfig = {
      'leader': {
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        dotColor: 'bg-red-600',
        label: 'Leader',
        description: 'Full system access'
      },
      'accounting': {
        color: 'yellow',
        bgColor: 'bg-accent-50',
        borderColor: 'border-accent-200',
        textColor: 'text-yellow-800',
        dotColor: 'bg-accent-500',
        label: 'Accounting',
        description: 'Financial & administrative access'
      },
      'engineer': {
        color: 'blue',
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
        textColor: 'text-primary-800',
        dotColor: 'bg-primary-500',
        label: 'Engineer',
        description: 'Technical operations access'
      },
      'sales': {
        color: 'green',
        bgColor: 'bg-accent-50',
        borderColor: 'border-accent-200',
        textColor: 'text-accent-800',
        dotColor: 'bg-accent-500',
        label: 'Sales',
        description: 'Customer relations access'
      }
    };

    return roleConfig[role] || roleConfig['sales'];
  };

  const roleInfo = getRoleInfo(user?.user_role);

  return (
    <div className={`${roleInfo.bgColor} ${roleInfo.borderColor} border rounded-lg p-4 mb-6 relative`}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
            <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`w-3 h-3 ${roleInfo.dotColor} rounded-full`}></div>
            <h3 className={`font-semibold ${roleInfo.textColor}`}>
              Demo Account: {roleInfo.label}
            </h3>
          </div>
          
          <p className={`text-sm ${roleInfo.textColor} mb-2`}>
            You're logged in as <strong>{user?.name}</strong> ({user?.email}) with {roleInfo.description}.
          </p>
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`inline-flex items-center px-2 py-1 rounded-full bg-white ${roleInfo.textColor} font-medium`}>
              Current Role: {roleInfo.label}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white text-neutral-600">
              Password: password123
            </span>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/account/signin"
              className="inline-flex items-center text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Try Different Role
              <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            
            <span className="text-xs text-neutral-400">|</span>
            
            <button
              onClick={() => {
                if (confirm('This will show you the available demo accounts and their permissions. Continue?')) {
                  alert(`Available Demo Accounts:

🔴 Leader (admin@nas2.com)
   - Full system access
   - User management
   - Financial reports
   - All permissions

🟡 Accounting (accounting@nas2.com)
   - Financial data access
   - Invoice management
   - Approval workflows
   - Customer management

🔵 Engineer (engineer@nas2.com)
   - Project execution
   - Material requests
   - Technical reports
   - Assigned projects only

🟢 Sales (sales@nas2.com)
   - Customer management
   - Quotation creation
   - Basic project view
   - Limited access

All accounts use password: password123`);
                }
              }}
              className="text-xs text-neutral-600 hover:text-neutral-800 font-medium"
            >
              View All Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoBanner;