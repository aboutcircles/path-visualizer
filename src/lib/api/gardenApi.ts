import axios from "axios";

export interface UserData {
  id: string;
  username: string;
  avatarUrl?: string;
  safeAddress: string;
}

interface ApiResponse {
  data: UserData[];
}

export class CirclesAPI {
  private static BASE_URL: string = "https://api.circles.garden/api/";

  public static async fetchUserData(addresses: string[]): Promise<UserData[]> {
    const chunkedAddresses = (addressList: string[], chunkSize: number = 50): string[][] => {
      const chunks: string[][] = [];
      for (let i = 0; i < addressList.length; i += chunkSize) {
        chunks.push(addressList.slice(i, i + chunkSize));
      }
      return chunks;
    };

    let allUserData: UserData[] = [];

    for (const addressChunk of chunkedAddresses(addresses)) {
      const queryUrl: string = `${CirclesAPI.BASE_URL}users/?${addressChunk.map(address => `address[]=${address}`).join('&')}`;

      try {
        const response = await axios.get<ApiResponse>(queryUrl);
        if (response.status === 200 && response.data.data) {
          allUserData = allUserData.concat(response.data.data);
        } else {
          throw new Error(`Failed to fetch user data. Status code: ${response.status}`);
        }
      } catch (error) {
        throw new Error(`An error occurred while fetching user data: ${error}`);
      }
    }

    return allUserData;
  }

  public static async getAllAvatarUrls(addresses: string[]): Promise<string[]> {
    try {
      const userData = await CirclesAPI.fetchUserData(addresses);
      const avatarUrls: string[] = [];

      if (userData) {
        userData.forEach(user => {
          const avatarUrl: string | undefined = user.avatarUrl;
          if (avatarUrl) {
            avatarUrls.push(avatarUrl);
          }
        });
      }

      return avatarUrls;
    } catch (error) {
      throw new Error(`An error occurred while getting avatar URLs: ${error}`);
    }
  }

  public static async resolveUsernameToAddress(username: string): Promise<string | null> {
    const queryUrl = `${this.BASE_URL}users/?username[]=${username}`;

    try {
      const response = await axios.get<ApiResponse>(queryUrl);
      if (response.status === 200 && response.data.data && response.data.data.length > 0) {
        const user = response.data.data[0];
        return user.safeAddress || null;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(`An error occurred while resolving username to address: ${error}`);
    }
  }
}
