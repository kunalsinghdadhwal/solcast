"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Repeat, Share, Heart } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/context/WalletContext";
import { SubscriptionModal } from "@/components/subscription-modal";

type PostType = "preview" | "full";

type Post = {
  id: number;
  creator: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  title: string;
  fullContent?: string;
  type: PostType;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  reposts: number;
  timestamp: string;
  isSubscribed?: boolean;
  metadataHash?: string;
};

const initialPosts: Post[] = [];

export function PostFeed() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { connected, walletAddress } = useWallet();

  // Check if user is subscribed to a creator
  const isUserSubscribed = (creatorId: number) => {
    try {
      const subscriptions = JSON.parse(localStorage.getItem('ethcast_subscriptions') || '[]');
      return connected && subscriptions.some(
        (sub: any) => sub.creatorId === creatorId.toString() && sub.subscriberWallet === walletAddress
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  // Load posts from both localStorage and server
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage first for immediate display
      const localPosts = JSON.parse(localStorage.getItem('ethcast_posts') || '[]');
      setPosts(localPosts);

      // Then try to load from JSON server 
      try {
        const response = await fetch('http://localhost:3001/posts');
        if (response.ok) {
          const serverPosts = await response.json();
          // Merge local and server posts, removing duplicates by ID
          const allPostIds = new Set();
          const mergedPosts = [...localPosts];
          
          serverPosts.forEach((serverPost: Post) => {
            if (!allPostIds.has(serverPost.id)) {
              allPostIds.add(serverPost.id);
              // Only add server posts that don't exist locally
              if (!localPosts.some((localPost: Post) => localPost.id === serverPost.id)) {
                mergedPosts.push(serverPost);
              }
            }
          });
          
          setPosts(mergedPosts);
        }
      } catch (error) {
        console.log('JSON Server might not be running:', error);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    
    // Listen for new posts
    const handleNewPost = () => {
      loadPosts();
    };
    
    window.addEventListener('post-created', handleNewPost);
    
    return () => {
      window.removeEventListener('post-created', handleNewPost);
    };
  }, []);

  // Also reload posts when wallet connection changes
  useEffect(() => {
    loadPosts();
  }, [connected, walletAddress]);

  const toggleLike = async (postId: number) => {
    setIsLiked((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
    
    // Update post in state
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedLikes = post.likes + (isLiked[postId] ? -1 : 1);
        return { ...post, likes: updatedLikes };
      }
      return post;
    });
    
    setPosts(updatedPosts);
    
    // Save to localStorage
    localStorage.setItem('ethcast_posts', JSON.stringify(updatedPosts));
    
    // Update on server if possible
    try {
      const postToUpdate = updatedPosts.find(post => post.id === postId);
      if (postToUpdate) {
        await fetch(`http://localhost:3001/posts/${postId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            likes: postToUpdate.likes 
          }),
        });
      }
    } catch (error) {
      console.log('Could not update like on server:', error);
    }
  };

  // Sort by timestamp
  const sortedPosts = [...posts].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="text-center p-4">
          <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading posts...</p>
        </div>
      )}

      {posts.length === 0 && !isLoading && (
        <div className="text-center p-8 rounded-xl border bg-card/80 backdrop-blur-sm">
          <p className="text-muted-foreground">No posts yet. Be the first to create one!</p>
        </div>
      )}

      <AnimatePresence>
        {sortedPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`rounded-xl border p-4 shadow-lg hover:shadow-violet-500/10 hover:scale-[1.01] transition-all duration-300 ${
              post.type === "preview"
                ? "bg-gradient-to-r from-amber-500/5 to-amber-600/5 border-amber-500/30"
                : "bg-card/80 backdrop-blur-sm shadow-violet-500/5 border-violet-500/20"
            }`}
          >
            <div className="flex gap-3">
              <Link href={`/creator/${post.creator.id}`}>
                <Avatar className={`border-2 h-10 w-10 ${
                  post.type === "preview" ? "border-amber-500/30" : "border-violet-500/20"
                }`}>
                  <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                  <AvatarFallback className={`text-white ${
                    post.type === "preview"
                      ? "bg-gradient-to-br from-amber-500 to-amber-600"
                      : "bg-gradient-to-br from-violet-600 to-cyan-500"
                  }`}>
                    {post.creator.name[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/creator/${post.creator.id}`} className="font-semibold hover:underline">
                    {post.creator.name}
                  </Link>
                  <span className="text-muted-foreground text-sm">{post.creator.handle}</span>
                  <span className="text-muted-foreground text-sm">·</span>
                  <span className="text-muted-foreground text-sm">{post.timestamp}</span>
                </div>

                <h3 className="font-semibold mt-1">{post.title}</h3>

                {/* Content - check if preview and not subscribed */}
                {post.type === "preview" && !isUserSubscribed(post.creator.id) ? (
                  <>
                    <div className="mt-2 relative">
                      <p className="blur-md select-none">{post.content}</p>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/70 p-4 rounded-lg text-center">
                          <p className="text-white mb-2">Subscribe to view full content</p>
                          <SubscriptionModal 
                            creatorName={post.creator.name} 
                            creatorId={post.creator.id.toString()} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Blur media for preview posts */}
                    {post.image && (
                      <div className="mt-4 relative">
                        <div className="blur-md">
                          <Image
                            src={post.image}
                            alt="Post image"
                            width={500}
                            height={300}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                    
                    {post.video && (
                      <div className="mt-4 relative">
                        <div className="blur-md">
                          <video controls width="500" className="rounded-lg">
                            <source src={post.video} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-2">{post.content}</p>
                    {post.image && (
                      <div className="mt-4">
                        <Image
                          src={post.image}
                          alt="Post image"
                          width={500}
                          height={300}
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    
                    {post.video && (
                      <div className="mt-4">
                        <video controls width="500" className="rounded-lg">
                          <source src={post.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 rounded-full transition-colors ${
                      isLiked[post.id]
                        ? "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    }`}
                    onClick={() => toggleLike(post.id)}
                  >
                    <Heart className={`h-4 w-4 ${isLiked[post.id] ? "fill-current" : ""}`} />
                    <span>{post.likes + (isLiked[post.id] ? 1 : 0)}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 rounded-full text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                  >
                    <Repeat className="h-4 w-4" />
                    <span>{post.reposts}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}