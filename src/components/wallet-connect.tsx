"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function WalletConnect() {
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  const connectWallet = () => {
    // Simulate wallet connection
    setWalletAddress("0x1234...5678")
    setConnected(true)
  }

  const disconnectWallet = () => {
    setWalletAddress("")
    setConnected(false)
  }

  return (
    <AnimatePresence mode="wait">
      {!connected ? (
        <Dialog key="connect-dialog">
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white border-0">
                <div className="absolute inset-0 w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-background/95 backdrop-blur-sm border-violet-500/20 shadow-xl shadow-violet-500/10">
            <DialogHeader>
              <DialogTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-500">
                Connect your wallet
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  onClick={connectWallet}
                  className="flex items-center justify-between p-4 rounded-lg border border-violet-500/20 hover:bg-gradient-to-r hover:from-violet-600/10 hover:to-cyan-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-violet-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                      <span className="font-bold text-white">M</span>
                    </div>
                    <div>
                      <p className="font-medium">MetaMask</p>
                      <p className="text-sm text-muted-foreground">Connect to your MetaMask wallet</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div
                  onClick={connectWallet}
                  className="flex items-center justify-between p-4 rounded-lg border border-violet-500/20 hover:bg-gradient-to-r hover:from-violet-600/10 hover:to-cyan-500/10 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-violet-500/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <span className="font-bold text-white">W</span>
                    </div>
                    <div>
                      <p className="font-medium">WalletConnect</p>
                      <p className="text-sm text-muted-foreground">Scan with WalletConnect to connect</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          key="connected-wallet"
        >
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-600/20 to-cyan-500/20 text-sm font-medium border border-violet-500/20">
            {walletAddress}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={disconnectWallet}
            className="rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

