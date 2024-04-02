import requests
import web3
import math
import plotly.graph_objects as go
from pathfinder.pathfinder import Pathfinder  
from utils.http.circles_api.circles_api import CirclesAPI 

pathfinder = Pathfinder()

class SankeyChart:
    @staticmethod
    def get_names(safes):
        safes = [web3.Web3.to_checksum_address(i) for i in safes]
        names_dict = {safe: safe for safe in safes}  # Initialize with address as fallback

        # Fetch user data using CirclesAPI
        user_data = CirclesAPI.fetch_user_data(safes)
        if user_data is not None:
            for user in user_data:
                # Update the dictionary with usernames, keeping the address as fallback
                safe_address = user.get("safeAddress")
                username = user.get("username", safe_address)
                names_dict[safe_address] = username
        else:
            print("Failed to fetch user data or no data returned")

        return names_dict
  
    
    def draw_sankey_from_path(self, source_address, sink_address, amount):
        # Fetch path data using the pathfinder
        token_owner, srcs, dests, wads, capacity = pathfinder.get_args_for_path(source_address, sink_address, amount)

        # Prepare the data for the Sankey diagram
        source_, target_, value_, flow_labels, labels = self.get_sankey(token_owner, srcs, dests, wads)

        # Draw the Sankey diagram using the prepared data
        fig = self.draw_sankey(source_, target_, value_, flow_labels, labels)
        return fig

    def draw_sankey(self, source_, target_, value_, flow_labels, labels, colors=None):
        if colors is None:
            colors = ["rgba(169, 169, 169,0.7)"] * len(flow_labels)

        data = go.Sankey(
            node=dict(
                pad=15,
                thickness=20,
                line=dict(color="black", width=0.5),
                label=labels,
                color=["blue"] * len(labels)
            ),
            link=dict(
                source=source_,
                target=target_,
                value=value_,
                label=flow_labels,
                color=colors
            )
        )

        fig = go.Figure(data)
        fig.update_layout(title_text="Basic Sankey Diagram", font_size=10)
        return fig

    def get_sankey(self, tokenOwner, srcs, dests, wads):
        address_index_map = {}
        safe_list = []
        j = 0
        for addr in srcs + dests:
            if addr not in address_index_map:
                address_index_map[addr] = j
                safe_list.append(addr)
                j += 1

        source_ = [address_index_map[src] for src in srcs]
        target_ = [address_index_map[dest] for dest in dests]
        value_ = [wad / 10 ** 18 for wad in wads]  # Convert wei to ETH

        # Fetch names for addresses
        names_dict = self.get_names(safe_list + tokenOwner)
        labels = [names_dict[addr] for addr in safe_list]
        flow_labels = [names_dict[owner] + " CRC" for owner in tokenOwner]

        return source_, target_, value_, flow_labels, labels
