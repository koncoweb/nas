import 'react-router';
module 'virtual:load-fonts.jsx' {
	export function LoadFonts(): null;
}
declare module 'react-router' {
	interface AppLoadContext {
		// add context properties here
	}
}
declare module 'npm:stripe' {
	import Stripe from 'stripe';
	export default Stripe;
}
declare module '@auth/create/react' {
	import { SessionProvider } from '@auth/react';
	export { SessionProvider };
}

// Extend Auth.js types to include user_role
declare module '@auth/core/types' {
	interface User {
		user_role?: string;
	}
	
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			user_role?: string;
		};
	}
}

declare module '@auth/core/adapters' {
	interface AdapterUser {
		user_role?: string;
	}
}
declare module '@auth/core/jwt' {
	interface JWT {
		user_role?: string;
	}
}