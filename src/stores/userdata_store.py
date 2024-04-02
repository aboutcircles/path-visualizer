from utils.http.circles_api.circles_api import CirclesAPI
import web3


class UserDataStore:
    def __init__(self):
        self._subscribers = []
        self._user_data = []

    def subscribe(self, callback):
        """Subscribe to changes in the user data store."""
        self._subscribers.append(callback)

    def notify_subscribers(self):
        """Notify all subscribers about an update."""
        for callback in self._subscribers:
            callback(self._user_data)

    def update_user_data(self, addresses):
        """Fetch user data for given addresses and update the store."""
        fetched_data = CirclesAPI.fetch_user_data(addresses)
        if fetched_data is not None:
            self._user_data = fetched_data
            self.notify_subscribers()

    def get_user_data(self):
        """Get the current user data from the store."""
        return self._user_data

    def get_names(self):
        """
        Maps each safeAddress in the stored user data to its corresponding username.
        
        Returns:
        A dictionary mapping each safeAddress to its username.
        """
        address_to_username = {}

        for user in self._user_data:
            user_address = user.get("safeAddress")
            username = user.get("username", None)
            address_to_username[user_address] = username

        return address_to_username

    def get_avatar_urls(self):
        """
        Maps each safeAddress in the stored user data to its corresponding avatarUrl.
        
        Returns:
        A dictionary mapping each safeAddress to its avatarUrl.
        """
        address_to_avatar_url = {}

        for user in self._user_data:
            user_address = user.get("safeAddress")
            avatar_url = user.get("avatarUrl", None)  # Or specify a default avatar URL
            address_to_avatar_url[user_address] = avatar_url

        return address_to_avatar_url