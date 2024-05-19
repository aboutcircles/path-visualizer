import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ethers } from 'ethers';
import fetch from 'node-fetch';

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

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('query');

  if (query) {
    return await searchUsers(query);
  } else {
    return json({ error: 'Query parameter is required' }, { status: 400 });
  }
};

const searchUsers = async (query: string): Promise<Response> => {
  const queryUrl = `${BASE_URL}users?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(queryUrl);
    if (response.ok) {
      const result: ApiResponse = await response.json();

      const processedData = await Promise.all(result.data.map(async (user) => {
        if (user.avatarUrl) {
          const avatarUrl = await fetchImage(user.avatarUrl);
          return { ...user, avatarUrl };
        }
        return user;
      }));

      return json({ data: processedData });
    } else {
      console.error(`Failed to search users. Status code: ${response.status}`);
      return json({ error: 'Failed to search users' }, { status: response.status });
    }
  } catch (error) {
    console.error(`Error searching users: ${error}`);
    return json({ error: 'An unknown error occurred' }, { status: 500 });
  }
};

const fetchImage = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const buffer = await response.buffer();
      const base64Image = buffer.toString('base64');
      return `data:image/jpeg;base64,${base64Image}`;
    }
    return '/default.png';
  } catch (error) {
    console.error(`Error fetching image: ${error}`);
    return '/default.png';
  }
};

export const POST: RequestHandler = async ({ request }) => {
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

const fetchUserData = async (addresses: string[]): Promise<Response> => {
  const MAX_ADDRESSES_PER_REQUEST = 50;
  addresses = addresses.map(address => ethers.getAddress(address));
  const chunks = chunkArray(addresses, MAX_ADDRESSES_PER_REQUEST);
  let allUserData: UserData[] = [];

  for (const chunk of chunks) {
    const queryUrl = `${BASE_URL}users?${chunk.map(address => `address[]=${address}`).join('&')}`;
    try {
      const response = await fetch(queryUrl);
      if (response.ok) {
        const result: ApiResponse = await response.json();
        allUserData = allUserData.concat(result.data);
      } else {
        console.error(`Failed to fetch user data for chunk. Status code: ${response.status}`);
        return json({ error: `Failed to fetch user data for chunk. Status code: ${response.status}` }, { status: response.status });
      }
    } catch (error) {
      console.error(`Error fetching data for chunk: ${error}`);
      return json({ error: 'An unknown error occurred' }, { status: 500 });
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
  const avatarUrls = (await userDataResponse.json()).map((user: UserData) => user.avatarUrl).filter(url => url);
  return json(avatarUrls);
};

const resolveUsernameToAddress = async (username: string): Promise<Response> => {
  const queryUrl = `${BASE_URL}users?query=${encodeURIComponent(username)}`;

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
      console.error(`Failed to resolve username to address. Status code: ${response.status}`);
      return json({ error: `Failed to resolve username to address. Status code: ${response.status}` }, { status: response.status });
    }
  } catch (error) {
    console.error(`Error resolving username: ${error}`);
    return json({ error: 'An unknown error occurred' }, { status: 500 });
  }
};

const chunkArray = (array: string[], size: number): string[][] => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
};
