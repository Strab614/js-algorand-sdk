from pyteal import *

def approval_program():
    # Global state schema
    # - admin_address: bytes
    # - inventory_app_id: uint64
    # - asset_manager_app_id: uint64
    # - authorized_users: map[address]role (1=admin, 2=manager, 3=operator)
    
    # Define application arguments indices
    ADD_USER = Bytes("add_user")
    REMOVE_USER = Bytes("remove_user")
    CHANGE_ROLE = Bytes("change_role")
    REGISTER_INVENTORY_APP = Bytes("register_inventory_app")
    REGISTER_ASSET_MANAGER = Bytes("register_asset_manager")
    BACKUP_DATA = Bytes("backup_data")
    
    # Define global state keys
    admin_address_key = Bytes("admin_address")
    inventory_app_id_key = Bytes("inventory_app_id")
    asset_manager_app_id_key = Bytes("asset_manager_app_id")
    
    # Define roles
    ROLE_ADMIN = Int(1)
    ROLE_MANAGER = Int(2)
    ROLE_OPERATOR = Int(3)
    
    # Helper function to check if sender is admin
    def is_admin():
        return Txn.sender() == App.globalGet(admin_address_key)
    
    # Helper function to check if user has a specific role or higher
    def has_role(address, min_role):
        user_role_key = Concat(Bytes("role_"), address)
        return App.globalGet(user_role_key) >= min_role
    
    # Helper function to check if sender has a specific role or higher
    def sender_has_role(min_role):
        return has_role(Txn.sender(), min_role)
    
    # On app creation
    on_creation = Seq([
        App.globalPut(admin_address_key, Txn.application_args[0]),
        App.globalPut(inventory_app_id_key, Int(0)),
        App.globalPut(asset_manager_app_id_key, Int(0)),
        # Set creator as admin role
        App.globalPut(Concat(Bytes("role_"), Txn.application_args[0]), ROLE_ADMIN),
        Return(Int(1))
    ])
    
    # Add a new user with a role
    add_user = Seq([
        Assert(sender_has_role(ROLE_ADMIN)),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Extract arguments
        # user_address, role
        App.globalPut(
            Concat(Bytes("role_"), Txn.application_args[1]),
            Btoi(Txn.application_args[2])
        ),
        
        Return(Int(1))
    ])
    
    # Remove a user
    remove_user = Seq([
        Assert(sender_has_role(ROLE_ADMIN)),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # user_address
        App.globalDel(Concat(Bytes("role_"), Txn.application_args[1])),
        
        Return(Int(1))
    ])
    
    # Change a user's role
    change_role = Seq([
        Assert(sender_has_role(ROLE_ADMIN)),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Extract arguments
        # user_address, new_role
        App.globalPut(
            Concat(Bytes("role_"), Txn.application_args[1]),
            Btoi(Txn.application_args[2])
        ),
        
        Return(Int(1))
    ])
    
    # Register inventory app
    register_inventory_app = Seq([
        Assert(sender_has_role(ROLE_ADMIN)),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # inventory_app_id
        App.globalPut(inventory_app_id_key, Btoi(Txn.application_args[1])),
        
        Return(Int(1))
    ])
    
    # Register asset manager app
    register_asset_manager = Seq([
        Assert(sender_has_role(ROLE_ADMIN)),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Extract arguments
        # asset_manager_app_id
        App.globalPut(asset_manager_app_id_key, Btoi(Txn.application_args[1])),
        
        Return(Int(1))
    ])
    
    # Backup data to IPFS (simulated)
    backup_data = Seq([
        Assert(sender_has_role(ROLE_ADMIN)),
        
        # In a real implementation, this would create a backup of all data to IPFS
        # For now, we just log the backup event
        Log(Bytes("DATA BACKUP INITIATED")),
        
        Return(Int(1))
    ])
    
    # Main router logic
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == ADD_USER, add_user],
        [Txn.application_args[0] == REMOVE_USER, remove_user],
        [Txn.application_args[0] == CHANGE_ROLE, change_role],
        [Txn.application_args[0] == REGISTER_INVENTORY_APP, register_inventory_app],
        [Txn.application_args[0] == REGISTER_ASSET_MANAGER, register_asset_manager],
        [Txn.application_args[0] == BACKUP_DATA, backup_data]
    )
    
    return program

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    with open("security_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), Mode.Application, version=6)
        f.write(compiled)
        
    with open("security_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), Mode.Application, version=6)
        f.write(compiled)