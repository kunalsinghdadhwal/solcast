"use client"

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image, ImagePlus, VideoIcon, Lock, Unlock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { pinContentToIPFS, pinJSONToIPFS, PostMetadata } from "@/services/pinata";
import { useToast } from "@/hooks/use-toast";

export function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { connected, walletAddress } = useWallet();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postType, setPostType] = useState<"preview" | "full">("full");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !walletAddress || !title.trim() || !content.trim()) {
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
      
      // Store in Pinata
      const contentHash = await pinContentToIPFS(JSON.stringify(postContent));

      // Create and pin metadata
      const metadata: PostMetadata = {
        title: title.trim(),
        author: walletAddress,
        walletAddress,
        timestamp: Date.now(),
        contentHash
      };

      const metadataHash = await pinJSONToIPFS(metadata);
      console.log('Post created with metadata hash:', metadataHash);

      // Create a post object
      const newPost = {
        id: Date.now(),
        creator: {
          id: Date.now(),
          name: walletAddress.slice(0, 8),
          handle: `@${walletAddress.slice(0, 6)}`,
          avatar: "/placeholder.svg?height=40&width=40",
        },
        content: content.trim(),
        title: title.trim(),
        type: postType,
        image: mediaType === "image" ? selectedMedia : undefined,
        video: mediaType === "video" ? selectedMedia : undefined,
        likes: 0,
        comments: 0,
        reposts: 0,
        timestamp: new Date().toLocaleString(),
        isSubscribed: true,
        metadataHash
      };

      // Save to localStorage
      const savedPosts = JSON.parse(localStorage.getItem('ethcast_posts') || '[]');
      localStorage.setItem('ethcast_posts', JSON.stringify([newPost, ...savedPosts]));
      
      // Save to JSON Server if available
      try {
        const response = await fetch('http://localhost:3001/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPost),
        });
        
        if (!response.ok) {
          throw new Error('Server error');
        }
      } catch (error) {
        console.log('JSON Server might not be running:', error);
        // Continue anyway since we've saved to localStorage
      }

      toast({
        title: "Post created!",
        description: "Your post has been published successfully.",
      });

      // Clear form
      setTitle('');
      setContent('');
      setSelectedMedia(null);
      setMediaType(null);
      
      // Force reload posts in the feed
      window.dispatchEvent(new CustomEvent('post-created'));
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Something went wrong. Please try again.",
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
    setPostType((prev) => (prev === "full" ? "preview" : "full"));
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
          disabled={!connected || isLoading}
          className="border-0 focus-visible:ring-1 focus-visible:ring-violet-500 bg-background/50"
        />
        
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!connected || isLoading}
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
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageIconClick}
              disabled={isLoading || !connected}
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
              disabled={isLoading || !connected}
              className="text-muted-foreground hover:text-foreground"
            >
              {postType === "full" ? (
                <>
                  <Unlock className="h-4 w-4 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  Preview Only
                </>
              )}
            </Button>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={!connected || isLoading || !title || !content}
              className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white border-0"
            >
              <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
              {isLoading ? 'Posting...' : <><Send className="mr-2 h-4 w-4" />Post</>}
            </Button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}