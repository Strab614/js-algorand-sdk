from pyteal import *

def approval_program():
    # Global state schema
    # - total_assets: uint64
    # - admin_address: bytes
    
    # Define application arguments indices
    CREATE_ASSET = Bytes("create_asset")
    MODIFY_ASSET = Bytes("modify_asset")
    TRANSFER_ASSET = Bytes("transfer_asset")
    FREEZE_ASSET = Bytes("freeze_asset")
    BURN_ASSET = Bytes("burn_asset")
    
    # Define global state keys
    total_assets_key = Bytes("total_assets")
    admin_address_key = Bytes("admin_address")
    
    # Helper function to check if sender is admin
    def is_admin():
        return Txn.sender() == App.globalGet(admin_address_key)
    
    # On app creation
    on_creation = Seq([
        App.globalPut(total_assets_key, Int(0)),
        App.globalPut(admin_address_key, Txn.application_args[0]),
        Return(Int(1))
    ])
    
    # Create a new asset (ASA)
    # This function prepares the parameters for an ASA creation transaction
    # The actual ASA creation will be done in a separate transaction
    create_asset = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(8)),  # Command + 7 args
        
        # Extract arguments
        # asset_name, unit_name, total, decimals, default_frozen, url, metadata_hash
        # These will be used in the frontend to create the actual ASA
        Log(Concat(
            Bytes("CREATE_ASSET:"),
            Txn.application_args[1], # asset_name
            Bytes(":"),
            Txn.application_args[2], # unit_name
            Bytes(":"),
            Txn.application_args[3], # total
            Bytes(":"),
            Txn.application_args[4], # decimals
            Bytes(":"),
            Txn.application_args[5], # default_frozen
            Bytes(":"),
            Txn.application_args[6], # url
            Bytes(":"),
            Txn.application_args[7]  # metadata_hash
        )),
        
        # Increment total assets
        App.globalPut(total_assets_key, App.globalGet(total_assets_key) + Int(1)),
        
        Return(Int(1))
    ])
    
    # Modify an existing asset
    # This function prepares the parameters for an ASA configuration transaction
    modify_asset = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Extract arguments
        # asset_id, new_manager_addr
        Log(Concat(
            Bytes("MODIFY_ASSET:"),
            Txn.application_args[1], # asset_id
            Bytes(":"),
            Txn.application_args[2]  # new_manager_addr
        )),
        
        Return(Int(1))
    ])
    
    # Transfer asset
    # This function prepares the parameters for an ASA transfer transaction
    transfer_asset = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(4)),  # Command + 3 args
        
        # Extract arguments
        # asset_id, receiver_addr, amount
        Log(Concat(
            Bytes("TRANSFER_ASSET:"),
            Txn.application_args[1], # asset_id
            Bytes(":"),
            Txn.application_args[2], # receiver_addr
            Bytes(":"),
            Txn.application_args[3]  # amount
        )),
        
        Return(Int(1))
    ])
    
    # Freeze asset
    # This function prepares the parameters for an ASA freeze transaction
    freeze_asset = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(4)),  # Command + 3 args
        
        # Extract arguments
        # asset_id, target_addr, freeze_state
        Log(Concat(
            Bytes("FREEZE_ASSET:"),
            Txn.application_args[1], # asset_id
            Bytes(":"),
            Txn.application_args[2], # target_addr
            Bytes(":"),
            Txn.application_args[3]  # freeze_state
        )),
        
        Return(Int(1))
    ])
    
    # Burn asset (destroy)
    # This function prepares the parameters for an ASA destroy transaction
    burn_asset = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # asset_id
        Log(Concat(
            Bytes("BURN_ASSET:"),
            Txn.application_args[1] # asset_id
        )),
        
        # Decrement total assets
        App.globalPut(total_assets_key, App.globalGet(total_assets_key) - Int(1)),
        
        Return(Int(1))
    ])
    
    # Main router logic
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == CREATE_ASSET, create_asset],
        [Txn.application_args[0] == MODIFY_ASSET, modify_asset],
        [Txn.application_args[0] == TRANSFER_ASSET, transfer_asset],
        [Txn.application_args[0] == FREEZE_ASSET, freeze_asset],
        [Txn.application_args[0] == BURN_ASSET, burn_asset]
    )
    
    return program

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    with open("asset_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), Mode.Application, version=6)
        f.write(compiled)
        
    with open("asset_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), Mode.Application, version=6)
        f.write(compiled)