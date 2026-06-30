-- =========================================================================
-- SMART SAVE DATABASE SETUP - PART 3 (MEMBERS ONWARDS)
-- Robust and safe SQL to run in Supabase SQL Editor
-- =========================================================================

-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create an updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';


-- =========================================================================
-- 3. MEMBERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    aadhaar TEXT NOT NULL,
    address TEXT NOT NULL,
    plan TEXT NOT NULL,
    join_date TEXT NOT NULL,
    daily_amount TEXT NOT NULL,
    nominee_name TEXT NOT NULL,
    nominee_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    balance TEXT,
    registered_by TEXT,
    registration_status TEXT DEFAULT 'Verified',
    plan_units INTEGER DEFAULT 1,
    photo TEXT,
    password TEXT,
    account_status TEXT DEFAULT 'Active',
    failed_login_attempts INTEGER DEFAULT 0,
    lock_until BIGINT,
    plans JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Member Queries
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- Trigger for members updated_at
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for members" ON members;
DROP POLICY IF EXISTS "Allow public insert access for members" ON members;
DROP POLICY IF EXISTS "Allow public update access for members" ON members;
DROP POLICY IF EXISTS "Allow public delete access for members" ON members;

CREATE POLICY "Allow public read access for members" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for members" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for members" ON members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for members" ON members FOR DELETE USING (true);


-- =========================================================================
-- 4. MEMBER PLANS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS member_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    daily_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    start_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for Member ID
CREATE INDEX IF NOT EXISTS idx_member_plans_member_id ON member_plans(member_id);

-- Trigger for member_plans updated_at
DROP TRIGGER IF EXISTS update_member_plans_updated_at ON member_plans;
CREATE TRIGGER update_member_plans_updated_at
    BEFORE UPDATE ON member_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE member_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for member_plans" ON member_plans;
DROP POLICY IF EXISTS "Allow public insert access for member_plans" ON member_plans;
DROP POLICY IF EXISTS "Allow public update access for member_plans" ON member_plans;
DROP POLICY IF EXISTS "Allow public delete access for member_plans" ON member_plans;

CREATE POLICY "Allow public read access for member_plans" ON member_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for member_plans" ON member_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for member_plans" ON member_plans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for member_plans" ON member_plans FOR DELETE USING (true);


-- =========================================================================
-- 5. REGISTRATIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    registration_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for registrations updated_at
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public insert access for registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public update access for registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public delete access for registrations" ON registrations;

CREATE POLICY "Allow public read access for registrations" ON registrations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for registrations" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for registrations" ON registrations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for registrations" ON registrations FOR DELETE USING (true);


-- =========================================================================
-- 6. COLLECTIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    receipt_no TEXT,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    amount TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    collected_by TEXT,
    collected_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for Collection Member Lookups
CREATE INDEX IF NOT EXISTS idx_collections_member_id ON collections(member_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipt_no ON collections(receipt_no);

-- Trigger for collections updated_at
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for collections" ON collections;
DROP POLICY IF EXISTS "Allow public insert access for collections" ON collections;
DROP POLICY IF EXISTS "Allow public update access for collections" ON collections;
DROP POLICY IF EXISTS "Allow public delete access for collections" ON collections;

CREATE POLICY "Allow public read access for collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for collections" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for collections" ON collections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for collections" ON collections FOR DELETE USING (true);


-- =========================================================================
-- 7. COMMISSIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    remarks TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Paid',
    timestamp TEXT NOT NULL,
    period TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for Employee ID
CREATE INDEX IF NOT EXISTS idx_commissions_employee_id ON commissions(employee_id);

-- Trigger for commissions updated_at
DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for commissions" ON commissions;
DROP POLICY IF EXISTS "Allow public insert access for commissions" ON commissions;
DROP POLICY IF EXISTS "Allow public update access for commissions" ON commissions;
DROP POLICY IF EXISTS "Allow public delete access for commissions" ON commissions;

CREATE POLICY "Allow public read access for commissions" ON commissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for commissions" ON commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for commissions" ON commissions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for commissions" ON commissions FOR DELETE USING (true);


-- =========================================================================
-- 8. RECEIPTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    receipt_no TEXT UNIQUE NOT NULL,
    collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    issue_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for receipts updated_at
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for receipts" ON receipts;
DROP POLICY IF EXISTS "Allow public insert access for receipts" ON receipts;
DROP POLICY IF EXISTS "Allow public update access for receipts" ON receipts;
DROP POLICY IF EXISTS "Allow public delete access for receipts" ON receipts;

CREATE POLICY "Allow public read access for receipts" ON receipts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for receipts" ON receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for receipts" ON receipts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for receipts" ON receipts FOR DELETE USING (true);


-- =========================================================================
-- 9. REMINDERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reminder_date TEXT NOT NULL,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    due_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for reminders updated_at
DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for reminders" ON reminders;
DROP POLICY IF EXISTS "Allow public insert access for reminders" ON reminders;
DROP POLICY IF EXISTS "Allow public update access for reminders" ON reminders;
DROP POLICY IF EXISTS "Allow public delete access for reminders" ON reminders;

CREATE POLICY "Allow public read access for reminders" ON reminders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for reminders" ON reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for reminders" ON reminders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for reminders" ON reminders FOR DELETE USING (true);


-- =========================================================================
-- 10. REPORTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    generated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for reports updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for reports" ON reports;
DROP POLICY IF EXISTS "Allow public insert access for reports" ON reports;
DROP POLICY IF EXISTS "Allow public update access for reports" ON reports;
DROP POLICY IF EXISTS "Allow public delete access for reports" ON reports;

CREATE POLICY "Allow public read access for reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for reports" ON reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for reports" ON reports FOR DELETE USING (true);


-- =========================================================================
-- 11. NOTIFICATIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for notifications updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public insert access for notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public update access for notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public delete access for notifications" ON notifications;

CREATE POLICY "Allow public read access for notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for notifications" ON notifications FOR DELETE USING (true);


-- =========================================================================
-- 12. DOCUMENT UPLOADS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS document_uploads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    uploader_id TEXT,
    uploader_type TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for document_uploads updated_at
DROP TRIGGER IF EXISTS update_document_uploads_updated_at ON document_uploads;
CREATE TRIGGER update_document_uploads_updated_at
    BEFORE UPDATE ON document_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for document_uploads" ON document_uploads;
DROP POLICY IF EXISTS "Allow public insert access for document_uploads" ON document_uploads;
DROP POLICY IF EXISTS "Allow public update access for document_uploads" ON document_uploads;
DROP POLICY IF EXISTS "Allow public delete access for document_uploads" ON document_uploads;

CREATE POLICY "Allow public read access for document_uploads" ON document_uploads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for document_uploads" ON document_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for document_uploads" ON document_uploads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for document_uploads" ON document_uploads FOR DELETE USING (true);


-- =========================================================================
-- 13. TRANSACTIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for transactions updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public insert access for transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public update access for transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public delete access for transactions" ON transactions;

CREATE POLICY "Allow public read access for transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for transactions" ON transactions FOR DELETE USING (true);


-- =========================================================================
-- 14. AUDIT LOGS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    username TEXT,
    role TEXT,
    module TEXT,
    status TEXT,
    ip_address TEXT,
    device TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for audit_logs updated_at
DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER update_audit_logs_updated_at
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow public insert access for audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow public update access for audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow public delete access for audit_logs" ON audit_logs;

CREATE POLICY "Allow public read access for audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for audit_logs" ON audit_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for audit_logs" ON audit_logs FOR DELETE USING (true);


-- =========================================================================
-- 15. SETTINGS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'company_settings',
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for settings updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS & Add Permissive Policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for settings" ON settings;
DROP POLICY IF EXISTS "Allow public insert access for settings" ON settings;
DROP POLICY IF EXISTS "Allow public update access for settings" ON settings;
DROP POLICY IF EXISTS "Allow public delete access for settings" ON settings;

CREATE POLICY "Allow public read access for settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for settings" ON settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for settings" ON settings FOR DELETE USING (true);


-- =========================================================================
-- 16. ATTENDANCE TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- Enable RLS & Add Permissive Policies
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert access for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public update access for attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public delete access for attendance" ON attendance;

CREATE POLICY "Allow public read access for attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for attendance" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for attendance" ON attendance FOR DELETE USING (true);


-- =========================================================================
-- 17. LOGIN HISTORY TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS login_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    login_time TEXT NOT NULL,
    logout_time TEXT,
    status TEXT NOT NULL,
    ip_address TEXT,
    device TEXT,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS & Add Permissive Policies
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for login_history" ON login_history;
DROP POLICY IF EXISTS "Allow public insert access for login_history" ON login_history;
DROP POLICY IF EXISTS "Allow public update access for login_history" ON login_history;
DROP POLICY IF EXISTS "Allow public delete access for login_history" ON login_history;

CREATE POLICY "Allow public read access for login_history" ON login_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for login_history" ON login_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for login_history" ON login_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access for login_history" ON login_history FOR DELETE USING (true);


-- =========================================================================
-- BACKWARDS COMPATIBILITY ALIASES & VIEWS
-- =========================================================================

-- Map reminder_history directly to reminders to support older app configurations
CREATE OR REPLACE VIEW reminder_history AS SELECT * FROM reminders;

-- Map commission_payments directly to commissions
CREATE OR REPLACE VIEW commission_payments AS SELECT * FROM commissions;
