import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

export function WalletConnect() {
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletType, setWalletType] = useState<"metamask" | "phantom" | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    checkWalletConnections()
  }, [])

  const checkWalletConnections = async () => {
    const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum
    const isPhantomInstalled = typeof window !== 'undefined' && window.solana?.isPhantom
    
    if (isMetaMaskInstalled) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setWalletAddress(accounts[0])
        setConnected(true)
        setWalletType("metamask")
      }
    }
    
    if (isPhantomInstalled && window.solana.isConnected) {
      const publicKey = window.solana.publicKey?.toString()
      if (publicKey) {
        setWalletAddress(publicKey)
        setConnected(true)
        setWalletType("phantom")
      }
    }
  }

  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!")
        return
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      setWalletAddress(accounts[0])
      setConnected(true)
      setWalletType("metamask")
      setDialogOpen(false)

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
        } else {
          disconnectWallet()
        }
      })
    } catch (error) {
      console.error("Error connecting to MetaMask:", error)
    }
  }

  const connectPhantom = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        alert("Please install Phantom wallet!")
        return
      }

      const response = await window.solana.connect()
      setWalletAddress(response.publicKey.toString())
      setConnected(true)
      setWalletType("phantom")
      setDialogOpen(false)

      window.solana.on('accountChanged', () => {
        if (!window.solana.isConnected) {
          disconnectWallet()
        }
      })
    } catch (error) {
      console.error("Error connecting to Phantom:", error)
    }
  }

  const disconnectWallet = async () => {
    if (walletType === "phantom" && window.solana) {
      await window.solana.disconnect()
    }
    setWalletAddress("")
    setConnected(false)
    setWalletType(null)
    setDialogOpen(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-violet-600/10 to-cyan-500/10 hover:from-violet-600/20 hover:to-cyan-500/20"
        >
          {connected ? (
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {!connected ? (
            <>
              <Button onClick={connectMetaMask} variant="outline" className="flex items-center gap-2">
                <img src="/metamask-logo.svg" alt="MetaMask" className="h-6 w-6" />
                Connect MetaMask
              </Button>
              <Button onClick={connectPhantom} variant="outline" className="flex items-center gap-2">
                <img src="/phantom-logo.svg" alt="Phantom" className="h-6 w-6" />
                Connect Phantom
              </Button>
            </>
          ) : (
            <Button onClick={disconnectWallet} variant="destructive" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}