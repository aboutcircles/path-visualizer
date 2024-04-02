import requests

class CirclesAPI:
    BASE_URL = "https://api.circles.garden/api/"
    
    @staticmethod
    def fetch_user_data(addresses):
        """
        Fetches user data for a list of addresses from the Circles Garden API.
        Handles more than 50 addresses by splitting them into multiple requests.
        
        Parameters:
        - addresses: A list of addresses (str) for which to fetch user data.
        
        Returns:
        A list of dictionaries containing user data, or None if the request fails.
        """
        def chunked_addresses(address_list, chunk_size=50):
            """Yield successive chunk_size chunks from address_list."""
            for i in range(0, len(address_list), chunk_size):
                yield address_list[i:i + chunk_size]
        
        all_user_data = []
        
        for address_chunk in chunked_addresses(addresses):
            query_url = f"{CirclesAPI.BASE_URL}users/?{'&'.join(['address[]=' + address for address in address_chunk])}"
            
            try:
                response = requests.get(query_url)
                if response.status_code == 200:
                    data = response.json()
                    if "data" in data:
                        all_user_data.extend(data["data"])
                    else:
                        print("No data field in response")
                        # Optionally, return None or continue to the next chunk
                else:
                    print(f"Failed to fetch user data. Status code: {response.status_code}")
                    # Optionally, return None or continue to the next chunk
            except Exception as e:
                print(f"An error occurred while fetching user data: {e}")
                # Optionally, return None or break the loop
        
        return all_user_data
