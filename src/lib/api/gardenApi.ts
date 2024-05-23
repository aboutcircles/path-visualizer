import axios from "axios";

export interface UserData {
  id: string;
  username: string;
  avatarUrl?: string;
  safeAddress: string;
}

export class CirclesAPI {
  private static BASE_URL: string = "/api/garden";

  public static async fetchUserData(addresses: string[]): Promise<UserData[]> {
    console.log("Fetching user data for addresses:", addresses)
    try {
      const response = await axios.post<UserData[]>(`${CirclesAPI.BASE_URL}`, {
        type: 'fetchUserData',
        data: addresses
      });
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(`Failed to fetch user data. Status code: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`An error occurred while fetching user data: ${error instanceof Error ? error.message : error}`);
    }
  }

  public static async getAllAvatarUrls(addresses: string[]): Promise<string[]> {
    try {
      const response = await axios.post<string[]>(`${CirclesAPI.BASE_URL}`, {
        type: 'getAllAvatarUrls',
        data: addresses
      });
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(`Failed to get avatar URLs. Status code: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`An error occurred while getting avatar URLs: ${error instanceof Error ? error.message : error}`);
    }
  }

  public static async resolveUsernameToAddress(username: string): Promise<string | null> {
    try {
      const response = await axios.post<{ address: string }>(`${CirclesAPI.BASE_URL}`, {
        type: 'resolveUsernameToAddress',
        data: username
      });
      if (response.status === 200 && response.data && response.data.address) {
        return response.data.address;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(`An error occurred while resolving username to address: ${error instanceof Error ? error.message : error}`);
    }
  }

  public static async searchUsers(query: string): Promise<UserData[]> {
    try {
      const response = await axios.get<{ data: UserData[] }>(`${CirclesAPI.BASE_URL}`, {
        params: { query }
      });
      if (response.status === 200 && response.data) {
        return response.data.data;
      } else {
        throw new Error(`Failed to search users. Status code: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`An error occurred while searching users: ${error instanceof Error ? error.message : error}`);
    }
  }
}
