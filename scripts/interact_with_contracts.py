#!/usr/bin/env python3

import base64
import os
import json
import time
import argparse
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.future import transaction
from algosdk.future.transaction import ApplicationNoOpTxn

# Algorand node connection parameters
algod_address = "http://localhost:4001"
algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

# Initialize Algod client
def get_algod_client():
    return algod.AlgodClient(algod_token, algod_address)

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

# Call application
def call_app(client, private_key, app_id, app_args, accounts=None, foreign_apps=None, foreign_assets=None):
    # Get suggested parameters
    params = client.suggested_params()
    
    # Get sender address
    sender = account.address_from_private_key(private_key)
    
    # Create unsigned application call transaction
    txn = ApplicationNoOpTxn(
        sender=sender,
        sp=params,
        index=app_id,
        app_args=app_args,
        accounts=accounts,
        foreign_apps=foreign_apps,
        foreign_assets=foreign_assets
    )
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    
    # Submit transaction
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    txinfo = wait_for_confirmation(client, tx_id)
    
    return txinfo

# Main function
def main():
    parser = argparse.ArgumentParser(description='Interact with inventory management contracts')
    parser.add_argument('--contract', required=True, choices=['inventory', 'asset', 'oracle', 'security'], 
                        help='Contract to interact with')
    parser.add_argument('--action', required=True, help='Action to perform')
    parser.add_argument('--args', nargs='*', help='Arguments for the action')
    
    args = parser.parse_args()
    
    # Load account
    try:
        with open("account.json", "r") as f:
            account_data = json.load(f)
            private_key = mnemonic.to_private_key(account_data["mnemonic"])
            sender_address = account.address_from_private_key(private_key)
            print(f"Using account: {sender_address}")
    except:
        print("Error: account.json not found. Please run deploy.py first.")
        return
    
    # Load app IDs
    try:
        with open("app_ids.json", "r") as f:
            app_ids = json.load(f)
    except:
        print("Error: app_ids.json not found. Please run deploy.py first.")
        return
    
    # Initialize Algod client
    client = get_algod_client()
    
    # Determine which contract to interact with
    if args.contract == 'inventory':
        app_id = app_ids["inventory_app_id"]
    elif args.contract == 'asset':
        app_id = app_ids["asset_app_id"]
    elif args.contract == 'oracle':
        app_id = app_ids["oracle_app_id"]
    elif args.contract == 'security':
        app_id = app_ids["security_app_id"]
    else:
        print(f"Error: Unknown contract {args.contract}")
        return
    
    # Prepare app args
    app_args = [args.action.encode()]
    if args.args:
        for arg in args.args:
            # Try to convert to int, otherwise treat as string
            try:
                app_args.append(int(arg).to_bytes(8, byteorder='big'))
            except ValueError:
                app_args.append(arg.encode())
    
    # Call the application
    print(f"Calling {args.contract} contract with action {args.action}...")
    txinfo = call_app(client, private_key, app_id, app_args)
    
    # Check for logs in the transaction info
    if "logs" in txinfo and txinfo["logs"]:
        print("Transaction logs:")
        for log in txinfo["logs"]:
            decoded_log = base64.b64decode(log).decode('utf-8', errors='replace')
            print(f"  {decoded_log}")
    
    print("Transaction successful!")

if __name__ == "__main__":
    main()