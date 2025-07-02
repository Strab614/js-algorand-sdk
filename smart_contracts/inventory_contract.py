from pyteal import *

def approval_program():
    # Global state schema
    # - total_products: uint64
    # - admin_address: bytes
    # - oracle_address: bytes
    
    # Local state schema (per product)
    # - product_id: uint64
    # - quantity: uint64
    # - min_threshold: uint64
    # - price: uint64
    # - location: bytes
    # - last_updated: uint64
    # - expiration: uint64
    # - supplier: bytes
    
    # App creation arguments
    # - admin_address: bytes
    
    # Define application arguments indices
    CREATE_PRODUCT = Bytes("create_product")
    UPDATE_QUANTITY = Bytes("update_quantity")
    REORDER = Bytes("reorder")
    CHECK_INVENTORY = Bytes("check_inventory")
    UPDATE_PRICE = Bytes("update_price")
    UPDATE_LOCATION = Bytes("update_location")
    AUDIT = Bytes("audit")
    
    # Define global state keys
    total_products_key = Bytes("total_products")
    admin_address_key = Bytes("admin_address")
    oracle_address_key = Bytes("oracle_address")
    
    # Define local state keys
    product_id_key = Bytes("product_id")
    quantity_key = Bytes("quantity")
    min_threshold_key = Bytes("min_threshold")
    price_key = Bytes("price")
    location_key = Bytes("location")
    last_updated_key = Bytes("last_updated")
    expiration_key = Bytes("expiration")
    supplier_key = Bytes("supplier")
    
    # Helper function to check if sender is admin
    def is_admin():
        return Txn.sender() == App.globalGet(admin_address_key)
    
    # Helper function to check if sender is oracle
    def is_oracle():
        return Txn.sender() == App.globalGet(oracle_address_key)
    
    # Helper function to check if product exists
    def product_exists(product_id):
        return App.localGet(Txn.sender(), product_id_key) != Int(0)
    
    # On app creation
    on_creation = Seq([
        App.globalPut(total_products_key, Int(0)),
        App.globalPut(admin_address_key, Txn.application_args[0]),
        App.globalPut(oracle_address_key, Txn.application_args[1]),
        Return(Int(1))
    ])
    
    # Create a new product
    create_product = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(7)),  # Command + 6 args
        
        # Extract arguments
        # product_id, min_threshold, price, location, expiration, supplier
        App.localPut(Txn.sender(), product_id_key, Btoi(Txn.application_args[1])),
        App.localPut(Txn.sender(), quantity_key, Int(0)),
        App.localPut(Txn.sender(), min_threshold_key, Btoi(Txn.application_args[2])),
        App.localPut(Txn.sender(), price_key, Btoi(Txn.application_args[3])),
        App.localPut(Txn.sender(), location_key, Txn.application_args[4]),
        App.localPut(Txn.sender(), last_updated_key, Global.latest_timestamp()),
        App.localPut(Txn.sender(), expiration_key, Btoi(Txn.application_args[5])),
        App.localPut(Txn.sender(), supplier_key, Txn.application_args[6]),
        
        # Increment total products
        App.globalPut(total_products_key, App.globalGet(total_products_key) + Int(1)),
        
        Return(Int(1))
    ])
    
    # Update product quantity
    update_quantity = Seq([
        Assert(Or(is_admin(), is_oracle())),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Check if product exists
        Assert(product_exists(Btoi(Txn.application_args[1]))),
        
        # Extract arguments
        # product_id, new_quantity
        App.localPut(Txn.sender(), quantity_key, Btoi(Txn.application_args[2])),
        App.localPut(Txn.sender(), last_updated_key, Global.latest_timestamp()),
        
        # Check if quantity is below threshold and trigger reorder if needed
        If(
            Btoi(Txn.application_args[2]) < App.localGet(Txn.sender(), min_threshold_key),
            # Trigger reorder logic
            Seq([
                # In a real implementation, this would call an oracle or external service
                # For now, we just log the reorder event
                Log(Concat(Bytes("REORDER NEEDED: "), Txn.application_args[1])),
                Return(Int(1))
            ]),
            Return(Int(1))
        )
    ])
    
    # Reorder product
    reorder = Seq([
        Assert(Or(is_admin(), is_oracle())),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Check if product exists
        Assert(product_exists(Btoi(Txn.application_args[1]))),
        
        # Extract arguments
        # product_id, reorder_quantity
        # In a real implementation, this would initiate a transaction to the supplier
        # For now, we just update the quantity
        App.localPut(
            Txn.sender(), 
            quantity_key, 
            App.localGet(Txn.sender(), quantity_key) + Btoi(Txn.application_args[2])
        ),
        App.localPut(Txn.sender(), last_updated_key, Global.latest_timestamp()),
        
        Return(Int(1))
    ])
    
    # Check inventory
    check_inventory = Seq([
        Assert(Or(is_admin(), is_oracle())),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Check if product exists
        Assert(product_exists(Btoi(Txn.application_args[1]))),
        
        # Return the current quantity (via log for now)
        Log(Concat(
            Bytes("Product ID: "), Txn.application_args[1],
            Bytes(", Quantity: "), Itob(App.localGet(Txn.sender(), quantity_key)),
            Bytes(", Min Threshold: "), Itob(App.localGet(Txn.sender(), min_threshold_key))
        )),
        
        Return(Int(1))
    ])
    
    # Update product price
    update_price = Seq([
        Assert(is_admin()),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Check if product exists
        Assert(product_exists(Btoi(Txn.application_args[1]))),
        
        # Extract arguments
        # product_id, new_price
        App.localPut(Txn.sender(), price_key, Btoi(Txn.application_args[2])),
        App.localPut(Txn.sender(), last_updated_key, Global.latest_timestamp()),
        
        Return(Int(1))
    ])
    
    # Update product location
    update_location = Seq([
        Assert(Or(is_admin(), is_oracle())),
        Assert(Txn.application_args.length() == Int(3)),  # Command + 2 args
        
        # Check if product exists
        Assert(product_exists(Btoi(Txn.application_args[1]))),
        
        # Extract arguments
        # product_id, new_location
        App.localPut(Txn.sender(), location_key, Txn.application_args[2]),
        App.localPut(Txn.sender(), last_updated_key, Global.latest_timestamp()),
        
        Return(Int(1))
    ])
    
    # Perform audit
    audit = Seq([
        Assert(Or(is_admin(), is_oracle())),
        Assert(Txn.application_args.length() == Int(2)),  # Command + 1 arg
        
        # Check if product exists
        Assert(product_exists(Btoi(Txn.application_args[1]))),
        
        # Log all product information for audit
        Log(Concat(
            Bytes("AUDIT - Product ID: "), Txn.application_args[1],
            Bytes(", Quantity: "), Itob(App.localGet(Txn.sender(), quantity_key)),
            Bytes(", Price: "), Itob(App.localGet(Txn.sender(), price_key)),
            Bytes(", Location: "), App.localGet(Txn.sender(), location_key),
            Bytes(", Last Updated: "), Itob(App.localGet(Txn.sender(), last_updated_key)),
            Bytes(", Expiration: "), Itob(App.localGet(Txn.sender(), expiration_key))
        )),
        
        Return(Int(1))
    ])
    
    # Main router logic
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin())],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == CREATE_PRODUCT, create_product],
        [Txn.application_args[0] == UPDATE_QUANTITY, update_quantity],
        [Txn.application_args[0] == REORDER, reorder],
        [Txn.application_args[0] == CHECK_INVENTORY, check_inventory],
        [Txn.application_args[0] == UPDATE_PRICE, update_price],
        [Txn.application_args[0] == UPDATE_LOCATION, update_location],
        [Txn.application_args[0] == AUDIT, audit]
    )
    
    return program

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    with open("inventory_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), Mode.Application, version=6)
        f.write(compiled)
        
    with open("inventory_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), Mode.Application, version=6)
        f.write(compiled)