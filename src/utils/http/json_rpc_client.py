from typing import Any, Dict, List, Optional, Union, TypedDict
import requests
import json

class Error(TypedDict):
    code: int
    message: str

class TrustRelationsResponse(TypedDict):
    jsonrpc: str
    result: Dict[str, Any]
    id: int

class TrustRelationsErrorResponse(TypedDict):
    jsonrpc: str
    error: Error
    id: int


class JSONRPCClient:
    def __init__(self, url: str):
        self.url = url
        self.headers = {"Content-Type": "application/json"}

    def __call_method(self, method: str, params: Optional[Union[List[Any], Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or [],
            "id": 1
        }
        try:
            response = requests.post(self.url, data=json.dumps(payload), headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")
            return None

    # def circles_get_total_balance(self, address: str) -> Optional[Dict[str, Any]]:
    #     return self.__call_method("circles_getTotalBalance", [address])

    # def circles_get_token_balances(self, address: str) -> Optional[Dict[str, Any]]:
    #     return self.__call_method("circles_getTokenBalances", [address])

    def circles_get_trust_relations(self, address: str) -> TrustRelationsResponse:
        response = self.__call_method("circles_getTrustRelations", [address])

        # Check if response is not None and contains an 'error' field
        if response and 'error' in response:
            error_info: Dict[str, Any] = response['error']
            error_message = f"RPC Error {error_info['code']}: {error_info['message']}"
            raise ValueError(error_message)  # Raise an error with the RPC error message

        elif response:
            # Proceed to parse the response if there's no 'error' field
            try:
                return self.__parse_trust_relations_response(response)
            except ValueError:
                # Re-raise the ValueError from __parse_trust_relations_response
                raise
        else:
            # Explicitly handle the case where response is None
            raise ValueError("Received an empty response from the server.")

    def __parse_trust_relations_response(self, response: Dict[str, Any]) -> TrustRelationsResponse:
        # Ensure the response contains necessary keys and types
        if "jsonrpc" in response and isinstance(response["jsonrpc"], str) \
            and "result" in response and isinstance(response["result"], dict) \
            and "id" in response and isinstance(response["id"], int):
            # Construct TrustRelationsResponse explicitly
            trust_response: TrustRelationsResponse = {
                "jsonrpc": response["jsonrpc"],
                "result": response["result"], 
                "id": response["id"]
            }
            return trust_response
        else:
            raise ValueError("The response structure does not match the expected TrustRelationsResponse format.")


    # def circles_query_trust_events(self, user_address: str, can_send_to_address: str, sort_order: str = "Descending", mode: str = "Or", limit: int = 10) -> Optional[Dict[str, Any]]:
    #     params = [{
    #         "UserAddress": user_address,
    #         "CanSendToAddress": can_send_to_address,
    #         "SortOrder": sort_order,
    #         "Mode": mode,
    #         "Limit": limit
    #     }]
    #     return self.__call_method("circles_queryTrustEvents", params)

    # def circles_query_hub_transfers(self, from_address: str, to_address: str, mode: str = "Or", cursor: str = "27677614-1-2", sort_order: str = "Descending") -> Optional[Dict[str, Any]]:
    #     params = [{
    #         "FromAddress": from_address,
    #         "ToAddress": to_address,
    #         "Mode": mode,
    #         "Cursor": cursor,
    #         "SortOrder": sort_order
    #     }]
    #     return self.__call_method("circles_queryHubTransfers", params)

    # def circles_query_crc_transfers(self, to_address: str, from_address: str = "0x0000000000000000000000000000000000000000", min_block_number: int = 29664296, sort_order: str = "Descending") -> Optional[Dict[str, Any]]:
    #     params = [{
    #         "ToAddress": to_address,
    #         "FromAddress": from_address,
    #         "BlockNumberRange": {"Min": min_block_number},
    #         "SortOrder": sort_order
    #     }]
    #     return self.__call_method("circles_queryCrcTransfers", params)

    # def circles_compute_transfer(self, from_address: str, to_address: str, amount: str) -> Optional[Dict[str, Any]]:
    #     return self.__call_method("circles_computeTransfer", [from_address, to_address, amount])



# Example usage

# Initialize the client with the URL of the JSON-RPC server
# rpc_client = JSONRPCClient("http://circles-rpc.circlesubi.id")

    
# # Call a specific method with parameters
# result = rpc_client.circles_get_trust_relations("0x3A599ab30A17Bc7527D8BE6D434F3048eA92d5d7")

# # result = rpc_client.circles_get_total_balance("0x3A599ab30A17Bc7527D8BE6D434F3048eA92d5d7")
    
#     # Print the result of the call
# print(result)