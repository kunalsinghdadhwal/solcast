"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, LogOut } from "lucide-react"
import { useWallet } from "@/context/WalletContext"

export function WalletConnect() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { connected, walletAddress, connectMetaMask, connectPhantom, disconnectWallet } = useWallet()

  const handleConnect = async (type: 'metamask' | 'phantom') => {
    if (type === 'metamask') await connectMetaMask()
    else await connectPhantom()
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
              <Button onClick={() => handleConnect('metamask')} variant="outline" className="flex items-center gap-2">
                <img src="/metamask-logo.svg" alt="MetaMask" className="h-6 w-6" />
                Connect MetaMask
              </Button>
              <Button onClick={() => handleConnect('phantom')} variant="outline" className="flex items-center gap-2">
                <img src="/phantom-logo.svg" alt="Phantom" className="h-6 w-6" />
                Connect Phantom
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => {
                disconnectWallet()
                setDialogOpen(false)
              }} 
              variant="destructive" 
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}