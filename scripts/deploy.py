#!/usr/bin/env python3

import base64
import os
import json
import time
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.future import transaction
from algosdk.future.transaction import ApplicationCreateTxn, StateSchema, OnComplete
from pyteal import compileTeal, Mode
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'smart_contracts'))

from inventory_contract import approval_program as inventory_approval, clear_state_program as inventory_clear
from asset_manager import approval_program as asset_approval, clear_state_program as asset_clear
from oracle_contract import approval_program as oracle_approval, clear_state_program as oracle_clear
from security_contract import approval_program as security_approval, clear_state_program as security_clear

# Algorand node connection parameters
algod_address = "http://localhost:4001"
algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

# Initialize Algod client
def get_algod_client():
    return algod.AlgodClient(algod_token, algod_address)

# Compile PyTeal to TEAL
def compile_program(client, source_code):
    teal = compileTeal(source_code, Mode.Application, version=6)
    result = client.compile(teal)
    return base64.b64decode(result["result"])

# Create a new application
def create_app(client, private_key, approval_program, clear_program, global_schema, local_schema, app_args):
    # Get suggested parameters
    params = client.suggested_params()
    
    # Create unsigned transaction
    sender = account.address_from_private_key(private_key)
    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args
    )
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    
    # Submit transaction
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    wait_for_confirmation(client, tx_id)
    
    # Get the application ID
    transaction_response = client.pending_transaction_info(tx_id)
    app_id = transaction_response["application-index"]
    
    return app_id

# Wait for a transaction to be confirmed
def wait_for_confirmation(client, tx_id):
    last_round = client.status().get("last-round")
    txinfo = client.pending_transaction_info(tx_id)
    while not (txinfo.get("confirmed-round") and txinfo.get("confirmed-round") > 0):
        print("Waiting for confirmation...")
        last_round += 1
        client.status_after_block(last_round)
        txinfo = client.pending_transaction_info(tx_id)
    print(f"Transaction {tx_id} confirmed in round {txinfo.get('confirmed-round')}.")
    return txinfo

# Main deployment function
def main():
    # Generate or load account
    try:
        with open("account.json", "r") as f:
            account_data = json.load(f)
            private_key = mnemonic.to_private_key(account_data["mnemonic"])
            sender_address = account.address_from_private_key(private_key)
            print(f"Loaded existing account: {sender_address}")
    except:
        private_key, sender_address = account.generate_account()
        account_data = {
            "address": sender_address,
            "mnemonic": mnemonic.from_private_key(private_key)
        }
        with open("account.json", "w") as f:
            json.dump(account_data, f)
        print(f"Generated new account: {sender_address}")
        print("Please fund this account before proceeding.")
        print(f"Mnemonic: {account_data['mnemonic']}")
        return
    
    # Initialize Algod client
    client = get_algod_client()
    
    # Compile programs
    inventory_approval_compiled = compile_program(client, inventory_approval())
    inventory_clear_compiled = compile_program(client, inventory_clear())
    
    asset_approval_compiled = compile_program(client, asset_approval())
    asset_clear_compiled = compile_program(client, asset_clear())
    
    oracle_approval_compiled = compile_program(client, oracle_approval())
    oracle_clear_compiled = compile_program(client, oracle_clear())
    
    security_approval_compiled = compile_program(client, security_approval())
    security_clear_compiled = compile_program(client, security_clear())
    
    # Define schemas
    inventory_global_schema = StateSchema(num_uints=3, num_byte_slices=2)
    inventory_local_schema = StateSchema(num_uints=5, num_byte_slices=3)
    
    asset_global_schema = StateSchema(num_uints=1, num_byte_slices=1)
    asset_local_schema = StateSchema(num_uints=0, num_byte_slices=0)
    
    oracle_global_schema = StateSchema(num_uints=4, num_byte_slices=1)
    oracle_local_schema = StateSchema(num_uints=0, num_byte_slices=0)
    
    security_global_schema = StateSchema(num_uints=2, num_byte_slices=50)  # Allow for up to 50 users with roles
    security_local_schema = StateSchema(num_uints=0, num_byte_slices=0)
    
    # Deploy security contract first
    print("Deploying security contract...")
    security_app_args = [sender_address.encode()]
    security_app_id = create_app(
        client,
        private_key,
        security_approval_compiled,
        security_clear_compiled,
        security_global_schema,
        security_local_schema,
        security_app_args
    )
    print(f"Security contract deployed with app ID: {security_app_id}")
    
    # Deploy inventory contract
    print("Deploying inventory contract...")
    inventory_app_args = [sender_address.encode(), sender_address.encode()]  # Admin and oracle addresses
    inventory_app_id = create_app(
        client,
        private_key,
        inventory_approval_compiled,
        inventory_clear_compiled,
        inventory_global_schema,
        inventory_local_schema,
        inventory_app_args
    )
    print(f"Inventory contract deployed with app ID: {inventory_app_id}")
    
    # Deploy asset manager contract
    print("Deploying asset manager contract...")
    asset_app_args = [sender_address.encode()]
    asset_app_id = create_app(
        client,
        private_key,
        asset_approval_compiled,
        asset_clear_compiled,
        asset_global_schema,
        asset_local_schema,
        asset_app_args
    )
    print(f"Asset manager contract deployed with app ID: {asset_app_id}")
    
    # Deploy oracle contract
    print("Deploying oracle contract...")
    oracle_app_args = [sender_address.encode()]
    oracle_app_id = create_app(
        client,
        private_key,
        oracle_approval_compiled,
        oracle_clear_compiled,
        oracle_global_schema,
        oracle_local_schema,
        oracle_app_args
    )
    print(f"Oracle contract deployed with app ID: {oracle_app_id}")
    
    # Save app IDs to a file
    app_ids = {
        "security_app_id": security_app_id,
        "inventory_app_id": inventory_app_id,
        "asset_app_id": asset_app_id,
        "oracle_app_id": oracle_app_id
    }
    
    with open("app_ids.json", "w") as f:
        json.dump(app_ids, f)
    
    print("All contracts deployed successfully!")
    print(f"App IDs saved to app_ids.json")

if __name__ == "__main__":
    main()