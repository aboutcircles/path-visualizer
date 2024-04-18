import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ethers } from 'ethers';

interface UserData {
  id: string;
  username: string;
  avatarUrl?: string;
  safeAddress: string;
}

interface ApiResponse {
  data: UserData[];
}

const BASE_URL = "https://api.circles.garden/api/";

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  const body = await request.json();
  const { type, data } = body;

  switch (type) {
    case 'fetchUserData':
      return await fetchUserData(data);
    case 'getAllAvatarUrls':
      return await getAllAvatarUrls(data);
    case 'resolveUsernameToAddress':
      return await resolveUsernameToAddress(data);
    default:
      return json({ error: 'Invalid request type' }, { status: 400 });
  }
};

const chunkArray = (array: string[], size: number): string[][] => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
};



// Updated function with batching
const fetchUserData = async (addresses: string[]): Promise<Response> => {
  const MAX_ADDRESSES_PER_REQUEST = 50;
  addresses = addresses.map(address => ethers.getAddress(address));
  const chunks = chunkArray(addresses, MAX_ADDRESSES_PER_REQUEST);
  let allUserData: UserData[] = [];

  for (const chunk of chunks) {
    const queryUrl = `${BASE_URL}users/?${chunk.map(address => `address[]=${address}`).join('&')}`;
    try {
      const response = await fetch(queryUrl);
      if (response.ok) {
        const result: ApiResponse = await response.json();
        allUserData = allUserData.concat(result.data);
      } else {
        console.error(`Failed to fetch user data for chunk. Status code: ${response.status}`);
        // Handle partial failure or throw an error
      }
    } catch (error: any) {
      console.error(`Error fetching data for chunk: ${error instanceof Error ? error.message : error}`);
      return json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
    }
  }

  return json(allUserData.map(user => ({
    ...user,
    avatarUrl: user.avatarUrl ? `/api/avatars/${user.avatarUrl.split('/').pop()}` : undefined
  })));
};

const getAllAvatarUrls = async (addresses: string[]): Promise<Response> => {
  const userDataResponse = await fetchUserData(addresses);
  if (!userDataResponse.ok) return userDataResponse;
  const avatarUrls = (await userDataResponse.json()).map((user: UserData) => user.avatarUrl).filter((url: string | undefined) => url);
  return json(avatarUrls);
};

const resolveUsernameToAddress = async (username: string): Promise<Response> => {
  const queryUrl = `${BASE_URL}users/?username[]=${username}`;

  try {
    const response = await fetch(queryUrl);
    if (response.ok) {
      const result: ApiResponse = await response.json();
      if (result.data.length > 0) {
        return json({ address: result.data[0].safeAddress });
      } else {
        return json({ error: 'Username not found' }, { status: 404 });
      }
    } else {
      throw new Error(`Failed to resolve username to address. Status code: ${response.status}`);
    }
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return json({ error: message }, { status: 500 });
  }
};
