import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    role?: string;
    token?: string;
  }

  interface Session {
    user: User;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    id?: string;
    accessToken?: string;
  }
}
