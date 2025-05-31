import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the \`jwt\` callback and \`getToken\`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    /** User ID */
    id?: string;
  }
}