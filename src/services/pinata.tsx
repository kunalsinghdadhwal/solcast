import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

export interface PostMetadata {
  title: string;
  author: string;
  walletAddress: string;
  timestamp: number;
  contentHash: string;
}

export async function pinContentToIPFS(content: any) {
  try {
    const jsonContent = typeof content === 'object' ? JSON.stringify(content) : content;
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      { content: jsonContent },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
      }
    );
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error pinning content to IPFS:', error);
    throw error;
  }
}

export async function pinJSONToIPFS(json: any) {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      json,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
      }
    );
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error pinning JSON to IPFS:', error);
    throw error;
  }
}