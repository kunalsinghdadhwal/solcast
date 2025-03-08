"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";

export function SubscriptionModal({ creatorName = "Creator", creatorId = "1" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { connected, walletAddress } = useWallet();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  
  const handleSubscribe = async () => {
    if (!connected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to subscribe",
        variant: "destructive",
      });
      return;
    }
    
    if (!email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create subscription object
      const subscription = {
        id: Date.now(),
        creatorId,
        creatorName,
        subscriberWallet: walletAddress,
        email,
        timestamp: Date.now(),
        transactionHash: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
      
      // Store in localStorage
      const subscriptions = JSON.parse(localStorage.getItem('ethcast_subscriptions') || '[]');
      localStorage.setItem('ethcast_subscriptions', JSON.stringify([...subscriptions, subscription]));
      
      // Store in JSON Server if available
      try {
        const response = await fetch('http://localhost:3001/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
        
        if (!response.ok) {
          throw new Error('Server error');
        }
      } catch (error) {
        console.log('JSON Server might not be running:', error);
        // Continue anyway since we've saved to localStorage
      }
      
      toast({
        title: "Subscription successful!",
        description: `You are now subscribed to ${creatorName}`,
      });
      
      setDialogOpen(false);
      
      // Force reload posts to update UI
      window.dispatchEvent(new CustomEvent('post-created'));
      
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: "Subscription failed",
        description: "There was an error processing your subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600">
          Subscribe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to {creatorName}</DialogTitle>
          <DialogDescription>
            Get exclusive access to premium content for only 0.05 ETH per month.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We will send you notifications about new content.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Payment details</Label>
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex justify-between">
                <span>Subscription fee</span>
                <span>0.05 ETH</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Network fee</span>
                <span>~0.001 ETH</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>0.051 ETH</span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubscribe} 
            disabled={isLoading || !connected}
            className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600"
          >
            {isLoading ? "Processing..." : "Subscribe Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}