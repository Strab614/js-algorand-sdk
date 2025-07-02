#!/usr/bin/env python3

import base64
import os
import json
import time
import argparse
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.future import transaction
from algosdk.future.transaction import AssetConfigTxn

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

# Create a new ASA for a product
def create_product_asa(client, private_key, product_data):
    # Get suggested parameters
    params = client.suggested_params()
    
    # Get sender address
    sender = account.address_from_private_key(private_key)
    
    # Create unsigned asset creation transaction
    txn = AssetConfigTxn(
        sender=sender,
        sp=params,
        total=product_data["quantity"],
        default_frozen=False,
        unit_name=product_data["unit_name"],
        asset_name=product_data["name"],
        manager=sender,
        reserve=sender,
        freeze=sender,
        clawback=sender,
        url=product_data["url"],
        metadata_hash=base64.b64decode(product_data["metadata_hash"]) if product_data["metadata_hash"] else None,
        decimals=0
    )
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    
    # Submit transaction
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    txinfo = wait_for_confirmation(client, tx_id)
    
    # Get the asset ID
    asset_id = txinfo["asset-index"]
    
    return asset_id

# Main function
def main():
    parser = argparse.ArgumentParser(description='Create a new product ASA')
    parser.add_argument('--name', required=True, help='Product name')
    parser.add_argument('--unit_name', required=True, help='Product unit name (max 8 chars)')
    parser.add_argument('--quantity', required=True, type=int, help='Initial quantity')
    parser.add_argument('--url', required=True, help='Product URL (IPFS or other)')
    parser.add_argument('--metadata_hash', help='Base64-encoded metadata hash')
    
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
    
    # Create product data
    product_data = {
        "name": args.name,
        "unit_name": args.unit_name,
        "quantity": args.quantity,
        "url": args.url,
        "metadata_hash": args.metadata_hash
    }
    
    # Initialize Algod client
    client = get_algod_client()
    
    # Create product ASA
    print(f"Creating ASA for product: {product_data['name']}...")
    asset_id = create_product_asa(client, private_key, product_data)
    print(f"Product ASA created with ID: {asset_id}")
    
    # Save product data to a file
    product_data["asset_id"] = asset_id
    
    # Create products directory if it doesn't exist
    os.makedirs("products", exist_ok=True)
    
    with open(f"products/{asset_id}.json", "w") as f:
        json.dump(product_data, f, indent=2)
    
    print(f"Product data saved to products/{asset_id}.json")

if __name__ == "__main__":
    main()