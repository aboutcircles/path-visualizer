import streamlit as st
from streamlit_option_menu import option_menu
from dotenv import load_dotenv
from pathfinder import Pathfinder
from streamlit_d3graph import d3graph
import pandas as pd
import numpy as np


# Load environment variables and initialize Pathfinder
load_dotenv()
pathfinder = Pathfinder()

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
        amount = st.text_input("Amount", value="1000000000000000000", key="pv_amount")
        generate_chart_button = st.button('Generate Chart', key='generate_chart')

    elif selected == "Explore Trust Graph":
        # Explore Trust Graph inputs
        st.header("Explore the Trust Graph")
        user_source = st.text_input("Username or address", value="shorn", key="ng_user_source")
        show_trusted_by = st.button('Show Trusted By', key='show_trusted_by')
        show_trusted_from = st.button('Show Trusted From', key='show_trusted_from')
        show_mutual_trusts = st.button('Show Mutual Trusts', key='show_mutual_trusts')

# Explore Trust Graph logic
if selected == "Explore Trust Graph":
    resolved_address = resolve_input_to_address(user_source)
    if resolved_address:
        trust_connections = pathfinder.fetch_trust_connections(resolved_address)
        if trust_connections:
            relationship_type = ""
            if show_trusted_by:
                relationship_type = "trusted_by"
                st.write("Showing 'Trusted By' connections for:", resolved_address)
            elif show_trusted_from:
                relationship_type = "trusted_from"
                st.write("Showing 'Trusted From' connections for:", resolved_address)
            elif show_mutual_trusts:
                relationship_type = "mutual"
                st.write("Showing 'Mutual Trusts' for:", resolved_address)

            if relationship_type:
                nodes, links = pathfinder.process_data_for_visualization(trust_connections, resolved_address, relationship_type)
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

                # Assuming process_data_for_visualization returns nodes and links formatted for d3graph
                d3 = d3graph()
                # Convert nodes and links as needed
                d3.graph(adj_matrix)  # Adjust as per the actual API of d3graph
                d3.show()
            else:
                st.error("Please select a trust relationship type.")
        else:
            st.error("Failed to fetch trust connections or no connections found.")
    else:
        st.error("Could not resolve address: " + user_source)
