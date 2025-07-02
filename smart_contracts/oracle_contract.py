from pyteal import *

def approval_program():
    # Global state schema
    # - admin_address: bytes
    # - inventory_app_id: uint64
    # - asset_manager_app_id: uint64
    # - last_check_timestamp: uint64
    # - check_interval: uint64 (in seconds)
    
    # Define application arguments indices
    REGISTER_INVENTORY_APP = Bytes("register_inventory_app")
    REGISTER_ASSET_MANAGER = Bytes("register_asset_manager")
    SET_CHECK_INTERVAL = Bytes("set_check_interval")
    PERFORM_CHECK = Bytes("perform_check")
    UPDATE_VALUATION = Bytes("update_valuation")
    COMPUTE_METRICS = Bytes("compute_metrics")
    
    # Define global state keys
    admin_address_key = Bytes("admin_address")
    inventory_app_id_key = Bytes("inventory_app_id")
    asset_manager_app_id_key = Bytes("asset_manager_app_id")
    last_check_timestamp_key = Bytes("last_check_timestamp")
    check_interval_key = Bytes("check_interval")
    
    # Helper function to check if sender is admin
    def is_admin():
        return Txn.sender() == App.globalGet(admin_address_key)
    
    # On app creation
    on_creation = Seq([
        App.globalPut(admin_address_key, Txn.application_args[0]),
        App.globalPut(inventory_app_id_key, Int(0)),
        App.globalPut(asset_manager_app_id_key, Int(0)),
        App.globalPut(last_check_timestamp_key, Global.latest_timestamp()),
        App.globalPut(check_interval_key, Int(86400)),  # Default: 24 hours
        Return(Int(1))
    ])
    
    # Register inventory app
    register_inventory_app = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # inventory_app_id
        App.globalPut(inventory_app_id_key, Btoi(Txn.application_args[1])),
        
        Return(Int(1))
    ])
    
    # Register asset manager app
    register_asset_manager = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # asset_manager_app_id
        App.globalPut(asset_manager_app_id_key, Btoi(Txn.application_args[1])),
        
        Return(Int(1))
    ])
    
    # Set check interval
    set_check_interval = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # check_interval (in seconds)
        App.globalPut(check_interval_key, Btoi(Txn.application_args[1])),
        
        Return(Int(1))
    ])
    
    # Perform inventory check
    perform_check = Seq([
        # Anyone can call this, but it will only execute if enough time has passed
        # since the last check
        
        # Check if it's time to perform a check
        If(
            Global.latest_timestamp() >= App.globalGet(last_check_timestamp_key) + App.globalGet(check_interval_key),
            Seq([
                # Update last check timestamp
                App.globalPut(last_check_timestamp_key, Global.latest_timestamp()),
                
                # In a real implementation, this would call the inventory app to check stock levels
                # For now, we just log the check event
                Log(Bytes("INVENTORY CHECK PERFORMED")),
                
                Return(Int(1))
            ]),
            Return(Int(0))  # Not time to check yet
        )
    ])
    
    # Update inventory valuation
    update_valuation = Seq([
        Assert(Or(is_admin(), Global.latest_timestamp() >= App.globalGet(last_check_timestamp_key) + App.globalGet(check_interval_key))),
        
        # In a real implementation, this would calculate the total value of inventory
        # For now, we just log the valuation event
        Log(Bytes("INVENTORY VALUATION UPDATED")),
        
        Return(Int(1))
    ])
    
    # Compute performance metrics
    compute_metrics = Seq([
        Assert(Or(is_admin(), Global.latest_timestamp() >= App.globalGet(last_check_timestamp_key) + App.globalGet(check_interval_key))),
        
        # In a real implementation, this would calculate various performance metrics
        # For now, we just log the metrics event
        Log(Bytes("PERFORMANCE METRICS COMPUTED")),
        
        Return(Int(1))
    ])
    
    # Main router logic
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == REGISTER_INVENTORY_APP, register_inventory_app],
        [Txn.application_args[0] == REGISTER_ASSET_MANAGER, register_asset_manager],
        [Txn.application_args[0] == SET_CHECK_INTERVAL, set_check_interval],
        [Txn.application_args[0] == PERFORM_CHECK, perform_check],
        [Txn.application_args[0] == UPDATE_VALUATION, update_valuation],
        [Txn.application_args[0] == COMPUTE_METRICS, compute_metrics]
    )
    
    return program

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    with open("oracle_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), Mode.Application, version=6)
        f.write(compiled)
        
    with open("oracle_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), Mode.Application, version=6)
        f.write(compiled)