import streamlit as st
from streamlit_option_menu import option_menu
from dotenv import load_dotenv
from pathfinder import Pathfinder  
from streamlit_d3graph import d3graph
import pandas as pd
import numpy as np

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

        if source_address and sink_address:
            token_owner, srcs, dests, wads, capacity = pathfinder.get_args_for_path(source_address, sink_address, amount)
            if token_owner:
                fig = pathfinder.draw_sankey(*pathfinder.get_sankey(token_owner, srcs, dests, wads))
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.error("Failed to generate path. Please check the inputs.")
        else:
            st.error("Could not resolve address: " + user_address)

# Explore Trust Graph logic
if selected == "Explore Trust Graph" and generate_graph_button:
    resolved_address = resolve_input_to_address(user_source)
    if resolved_address:
        trust_connections = pathfinder.fetch_trust_connections(resolved_address)
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