import aiohttp

class CirclesAPI:
    BASE_URL = "https://api.circles.garden/api/"
    
    @staticmethod
    async def fetch_user_data(addresses):
        async with aiohttp.ClientSession() as session:
            all_user_data = []
            chunk_size = 50

            for i in range(0, len(addresses), chunk_size):
                address_chunk = addresses[i:i + chunk_size]
                query_url = f"{CirclesAPI.BASE_URL}users/?{'&'.join(['address[]=' + address for address in address_chunk])}"
                
                async with session.get(query_url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "data" in data:
                            all_user_data.extend(data["data"])
                        else:
                            print("No data field in response")
                    else:
                        print(f"Failed to fetch user data. Status code: {response.status}")
            return all_user_data
