"use client";

import { ReactNode, useMemo } from "react";
import { MidenWalletAdapter, WalletMultiButton, WalletProvider } from "@demox-labs/miden-wallet-adapter";
import { WalletModalProvider } from "@demox-labs/miden-wallet-adapter";
import { WalletAdapter } from "@demox-labs/miden-wallet-adapter";
import { useWallet } from "@demox-labs/miden-wallet-adapter";
import "@demox-labs/miden-wallet-adapter-reactui/styles.css";
import { Toaster } from "react-hot-toast";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const wallets = [
    new MidenWalletAdapter({ appName: 'Your Miden App' }),
  ];

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <Toaster />
        <PublicKeyDisplay />
        {children}
      </WalletModalProvider>
    </WalletProvider>
  );
}

function PublicKeyDisplay() {
  const { accountId } = useWallet();
  return accountId ? (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "0.5rem 1rem",
        borderRadius: 4,
        fontSize: "0.875rem",
        fontFamily: "monospace",
        zIndex: 1000,
      }}
    >
      Connected: {accountId}
    </div>
  ) : null;
}
