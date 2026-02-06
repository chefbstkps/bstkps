-- Create inventory table
-- This table tracks the current stock levels for each accessory per organization
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES groepen(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, accessory_id)
);

-- Create inventory_transactions table
-- This table records all purchase and issue transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES groepen(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'issue')),
  quantity INTEGER NOT NULL,
  transaction_date DATE NOT NULL,
  
  -- Purchase-specific fields
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  supplier TEXT,
  invoice_number TEXT,
  
  -- Issue-specific fields
  issued_to_type TEXT CHECK (issued_to_type IN ('radio', 'installation', 'employee')),
  issued_to_id TEXT,
  issue_reason TEXT,
  
  -- Common fields
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_organization ON inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_accessory ON inventory(accessory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(current_stock) WHERE current_stock <= low_stock_threshold;

CREATE INDEX IF NOT EXISTS idx_transactions_organization ON inventory_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_accessory ON inventory_transactions(accessory_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON inventory_transactions(transaction_date);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view inventory for their organization" ON inventory;
DROP POLICY IF EXISTS "Users can insert inventory for their organization" ON inventory;
DROP POLICY IF EXISTS "Users can update inventory for their organization" ON inventory;
DROP POLICY IF EXISTS "Users can delete inventory for their organization" ON inventory;

DROP POLICY IF EXISTS "Users can view transactions for their organization" ON inventory_transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their organization" ON inventory_transactions;
DROP POLICY IF EXISTS "Users can update transactions for their organization" ON inventory_transactions;
DROP POLICY IF EXISTS "Users can delete transactions for their organization" ON inventory_transactions;

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory for their organization"
  ON inventory FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

CREATE POLICY "Users can insert inventory for their organization"
  ON inventory FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

CREATE POLICY "Users can update inventory for their organization"
  ON inventory FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

CREATE POLICY "Users can delete inventory for their organization"
  ON inventory FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

-- RLS Policies for inventory_transactions
CREATE POLICY "Users can view transactions for their organization"
  ON inventory_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

CREATE POLICY "Users can insert transactions for their organization"
  ON inventory_transactions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

CREATE POLICY "Users can update transactions for their organization"
  ON inventory_transactions FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

CREATE POLICY "Users can delete transactions for their organization"
  ON inventory_transactions FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM groepen
      WHERE id = organization_id
    )
  );

-- Function to automatically update inventory.updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory.updated_at
DROP TRIGGER IF EXISTS update_inventory_updated_at_trigger ON inventory;
CREATE TRIGGER update_inventory_updated_at_trigger
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Function to automatically update inventory stock when a transaction is created
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if inventory record exists
  IF NOT EXISTS (
    SELECT 1 FROM inventory 
    WHERE organization_id = NEW.organization_id 
    AND accessory_id = NEW.accessory_id
  ) THEN
    -- Create inventory record if it doesn't exist
    INSERT INTO inventory (organization_id, accessory_id, current_stock)
    VALUES (NEW.organization_id, NEW.accessory_id, 0);
  END IF;

  -- Update stock based on transaction type
  IF NEW.transaction_type = 'purchase' THEN
    UPDATE inventory 
    SET current_stock = current_stock + NEW.quantity
    WHERE organization_id = NEW.organization_id 
    AND accessory_id = NEW.accessory_id;
  ELSIF NEW.transaction_type = 'issue' THEN
    UPDATE inventory 
    SET current_stock = current_stock - NEW.quantity
    WHERE organization_id = NEW.organization_id 
    AND accessory_id = NEW.accessory_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory on transaction
DROP TRIGGER IF EXISTS update_inventory_on_transaction_trigger ON inventory_transactions;
CREATE TRIGGER update_inventory_on_transaction_trigger
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_transaction();

-- Grant necessary permissions
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON inventory_transactions TO authenticated;

