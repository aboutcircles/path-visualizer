from sankey_chart.sankey_chart import SankeyChart
import streamlit as st
from streamlit_option_menu import option_menu
from dotenv import load_dotenv
from pathfinder.pathfinder import Pathfinder  
from streamlit_d3graph import d3graph
import pandas as pd
import numpy as np
from stores.userdata_store import UserDataStore

load_dotenv()
pathfinder = Pathfinder()
sankey_chart = SankeyChart()
user_data_store = UserDataStore()


# Set page config
st.set_page_config(layout="wide")
st.title('Circles Pathfinder Viewer')

def resolve_input_to_address(user_input):
    if user_input.startswith('0x'):
        return user_input
    elif user_input.strip() != "":
        return pathfinder.resolve_username_to_address(user_input)
    else:
        return None

# Sidebar navigation and form inputs
with st.sidebar:
    selected = option_menu("Main Menu", ["Path Viewer", "Explore Trust Graph"],
                        icons=["graph-up", "diagram-3"], menu_icon="cast", default_index=0)

    if selected == "Path Viewer":
        # Path Viewer inputs
        st.header("Path Viewer Inputs")
        user_source = st.text_input("From (Username or address)", value="Martin", key="pv_user_source")
        user_sink = st.text_input("To (Username or address)", value="shorn", key="pv_user_sink")
        amount = st.text_input("Amount", value="999999999999999999999999999", key="pv_amount")
        generate_chart_button = st.button('Generate Chart', key='generate_chart')

    elif selected == "Explore Trust Graph":
        # Explore Trust Graph inputs
        st.header("Explore the Trust Graph")
        user_source = st.text_input("Username or address", value="shorn", key="ng_user_source")
        generate_graph_button = st.button('Generate Graph', key='generate_graph')


# Path Viewer logic
if selected == "Path Viewer" and generate_chart_button:
    with st.spinner('Generating chart... Please wait'):
        source_address = resolve_input_to_address(user_source)
        sink_address = resolve_input_to_address(user_sink)
        # Ensure 'amount' is defined and converted to the correct format (e.g., int or string representing wei)
        amount = str(amount) 

        if source_address and sink_address:
            # Use the SankeyClass to fetch path data and draw the Sankey diagram
            fig = sankey_chart.draw_sankey_from_path(source_address, sink_address, amount)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.error("Could not resolve address: " + source_address)


def extract_all_addresses(api_response):
    """
    Extracts all unique addresses from an API response that includes a user's address,
    the addresses they trust, and the addresses that trust them.

    Parameters:
    - api_response: The API response structured as a dictionary.

    Returns:
    A list of unique addresses (str).
    """
    all_addresses = set()

    # Extract the user's address
    user_address = api_response.get('result', {}).get('user')
    if user_address:
        all_addresses.add(user_address)

    # Extract addresses the user trusts
    trusts = api_response.get('result', {}).get('trusts', {})
    all_addresses.update(trusts.keys())

    # Extract addresses that trust the user
    trusted_by = api_response.get('result', {}).get('trustedBy', {})
    all_addresses.update(trusted_by.keys())

    return list(all_addresses)


# Explore Trust Graph logic
if selected == "Explore Trust Graph" and generate_graph_button:
    resolved_address = resolve_input_to_address(user_source)
    if resolved_address:
        trust_connections = pathfinder.fetch_trust_connections(resolved_address)
        data = extract_all_addresses(trust_connections)

        print("data: ", data)
        user_data_store.update_user_data(data)

        test_data = user_data_store.get_avatar_urls()

        print("test_data: ", test_data)
        if trust_connections:
            nodes, links = pathfinder.process_data_for_visualization(trust_connections, resolved_address, "mutual")
            # Create a DataFrame from links
            links_df = pd.DataFrame(links)

            # Create a square matrix with dimensions equal to the number of unique nodes
            node_ids = [node['id'] for node in nodes]
            adj_matrix = pd.DataFrame(np.zeros((len(node_ids), len(node_ids))), index=node_ids, columns=node_ids)

            # Populate the adjacency matrix with values from links
            for _, link in links_df.iterrows():
                source = link['source']
                target = link['target']
                value = link['value']
                adj_matrix.at[source, target] = value

            d3 = d3graph(collision=1, charge=250)
            d3.graph(adj_matrix)
            d3.set_edge_properties(edge_distance=1000)
            d3.set_node_properties(size=10)
            d3.show()
        else:
            st.error("Failed to fetch trust connections or no connections found.")
    else:
        st.error("Could not resolve address: " + user_source)