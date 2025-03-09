"use client"

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image, ImagePlus, VideoIcon, Lock, Unlock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { pinContentToIPFS, pinJSONToIPFS, PostMetadata } from "@/services/pinata";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/context/Web3Context"; // Import the Web3 context

export function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState<string>("0.01");
  const { toast } = useToast();
  
  // Use the Web3 context instead of the wallet context
  const { 
    isConnected, 
    currentAccount, 
    publishFreeContent, 
    publishPaidContent,
    accessContent,
    withdrawCreatorBalance,
    refreshUserPosts,
  } = useWeb3();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !currentAccount || !title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and connect your wallet",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Prepare post content including media
      const postContent = {
        title: title.trim(),
        content: content.trim(),
        media: selectedMedia,
        mediaType,
        type: postType
      };
      
      // Store content in Pinata IPFS
      const contentHash = await pinContentToIPFS(JSON.stringify(postContent));

      // Create and pin metadata
      const metadata: PostMetadata = {
        title: title.trim(),
        author: currentAccount,
        walletAddress: currentAccount,
        timestamp: Date.now(),
        contentHash
      };

      const metadataHash = await pinJSONToIPFS(metadata);
      console.log('Post metadata pinned with hash:', metadataHash);

      // Publish content to the blockchain using the smart contract
      let txResult;
      
      if (postType === "free") {
        // Use the free content publishing function from the contract
        txResult = await publishFreeContent(`ipfs://${metadataHash}`);
      } else {
        // Use the paid content publishing function from the contract
        txResult = await publishPaidContent(`ipfs://${metadataHash}`, price);
      }
      
      console.log('Transaction result:', txResult);

      // Create a post object for local display
      const newPost = {
        id: Date.now(),
        creator: {
          id: Date.now(),
          name: currentAccount.slice(0, 8),
          handle: `@${currentAccount.slice(0, 6)}`,
          avatar: "/placeholder.svg?height=40&width=40",
        },
        content: content.trim(),
        title: title.trim(),
        type: postType,
        price: postType === "paid" ? price : "0",
        image: mediaType === "image" ? selectedMedia : undefined,
        video: mediaType === "video" ? selectedMedia : undefined,
        likes: 0,
        comments: 0,
        reposts: 0,
        timestamp: new Date().toLocaleString(),
        isSubscribed: true,
        metadataHash,
        contentHash,
        transactionHash: txResult?.transactionHash
      };

      // Save to localStorage for persistence
      const savedPosts = JSON.parse(localStorage.getItem('solcast_posts') || '[]');
      localStorage.setItem('solcast_posts', JSON.stringify([newPost, ...savedPosts]));
      
      toast({
        title: "Post published!",
        description: "Your content has been successfully published to the blockchain.",
      });

      // Clear form
      setTitle('');
      setContent('');
      setSelectedMedia(null);
      setMediaType(null);
      setPrice("0.01");
      
      // Force reload posts in the feed
      window.dispatchEvent(new CustomEvent('post-created'));
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error publishing content",
        description: "Transaction failed. Please check your wallet and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageIconClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result as string);
        setMediaType(file.type.startsWith("image") ? "image" : "video");
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePostType = () => {
    setPostType((prev) => (prev === "free" ? "paid" : "free"));
  };

  return (
    <motion.div
      className="rounded-xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg shadow-violet-500/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isConnected || isLoading}
          className="border-0 focus-visible:ring-1 focus-visible:ring-violet-500 bg-background/50"
        />
        
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!isConnected || isLoading}
          className="min-h-[100px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-violet-500 bg-background/50 text-lg"
        />
        
        {selectedMedia && (
          <div className="mt-2">
            {mediaType === "image" ? (
              <img src={selectedMedia} alt="Selected media" className="max-h-60 rounded-lg" style={{ width: 'auto', height: 'auto' }} />
            ) : (
              <video src={selectedMedia} controls className="max-h-60 rounded-lg" style={{ width: 'auto', height: 'auto' }} />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedMedia(null);
                setMediaType(null);
              }}
            >
              Remove media
            </Button>
          </div>
        )}
        
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between">
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageIconClick}
              disabled={isLoading || !isConnected}
              className="text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="h-4 w-4 mr-1" />
              Add Media
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={togglePostType}
              disabled={isLoading || !isConnected}
              className="text-muted-foreground hover:text-foreground"
            >
              {postType === "free" ? (
                <>
                  <Unlock className="h-4 w-4 mr-1" />
                  Free Content
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  Paid Content
                </>
              )}
            </Button>
            
            {postType === "paid" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Price:</span>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLoading || !isConnected}
                  className="w-20 h-8 text-sm"
                  min="0.001"
                  step="0.001"
                  placeholder="ETH"
                />
                <span className="text-sm text-muted-foreground">ETH</span>
              </div>
            )}
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={!isConnected || isLoading || !title || !content}
              className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white border-0 w-full sm:w-auto"
            >
              <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
              {isLoading ? 'Publishing...' : 
                <><Send className="mr-2 h-4 w-4" />{postType === "free" ? 'Publish' : 'Publish Paid Content'}</>
              }
            </Button>
          </motion.div>
        </div>
        
        {!isConnected && (
          <p className="text-sm text-amber-500 mt-2">
            Please connect your wallet to publish content.
          </p>
        )}
      </form>
    </motion.div>
  );
}