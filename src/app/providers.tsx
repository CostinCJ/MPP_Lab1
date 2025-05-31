"use client";

import { SessionProvider } from "next-auth/react";
import { GuitarProvider } from "./context/GuitarContext";

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export const AppProviders = ({ children }: Props) => {
  return (
    <NextAuthProvider>
      <GuitarProvider>
        {children}
      </GuitarProvider>
    </NextAuthProvider>
  );
};