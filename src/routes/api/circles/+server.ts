import { json } from '@sveltejs/kit';
import { config } from '$lib/config';
import { ethers } from 'ethers'; // Import the ethers library
import hubAbi from '$lib/abis/Hub.json';

const hubContract = config.circlesHubContract;
const rpc = 'https://rpc.helsinki.aboutcircles.com';

const provider = new ethers.JsonRpcProvider(rpc);
const circlesContract = new ethers.Contract(hubContract, hubAbi, provider);

const isUserSignedUp = async (address: string): Promise<boolean> => {
  try {
    const tokenAddress = await circlesContract.userToToken(address);
    // Manually compare to the zero address if the constant is not accessible
    return tokenAddress !== '0x0000000000000000000000000000000000000000';
  } catch (error) {
    console.error('Error checking user signup:', error);
    return false;
  }
};

export const GET = async ({ request }) => {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  if (!address) {
    return json({ error: 'No address provided' }, { status: 400 });
  }

  const isSignedUp = await isUserSignedUp(address);
  return json({ address, isSignedUp });
};
