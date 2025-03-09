import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/context/Web3Context"
import { WalletProvider } from "@/context/WalletContext"
import { Toaster } from "@/components/ui/toaster"

// Your contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x123..."; // Replace with actual address or env variable

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SolCast- Decentralized Social Platform",
  description: "A decentralized social platform for creators and their audience",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* You have two options: */}
          
          {/* Option 1: Replace WalletProvider with Web3Provider */}
          <Web3Provider contractAddress={CONTRACT_ADDRESS}>
            {children}
            <Toaster />
          </Web3Provider>
          
          {/* Option 2: Use both providers (if WalletProvider handles different functionality) 
          <WalletProvider>
            <Web3Provider contractAddress={CONTRACT_ADDRESS}>
              {children}
              <Toaster />
            </Web3Provider>
          </WalletProvider>
          */}
        </ThemeProvider>
      </body>
    </html>
  )
}