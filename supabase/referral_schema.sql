-- Referral and Share Tracking System for Ezra App
-- Run this SQL in your Supabase SQL editor

-- Create share_history table for tracking user shares
CREATE TABLE IF NOT EXISTS share_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    share_type TEXT CHECK (share_type IN ('whatsapp', 'sms', 'email', 'social', 'provider', 'service', 'app', 'booking')) NOT NULL,
    target TEXT, -- phone number, email, or platform identifier
    content TEXT NOT NULL,
    referral_code TEXT, -- generated referral code if applicable
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create referral_codes table for tracking referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    share_type TEXT NOT NULL,
    shared_item_id TEXT, -- provider_id, service_id, etc.
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create referral_conversions table for tracking successful referrals
CREATE TABLE IF NOT EXISTS referral_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE NOT NULL,
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    conversion_type TEXT CHECK (conversion_type IN ('signup', 'first_booking', 'payment')) NOT NULL,
    reward_amount NUMERIC(10,2) DEFAULT 0,
    reward_currency TEXT DEFAULT 'FCFA',
    reward_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create referral_rewards table for tracking reward history
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    referral_conversion_id UUID REFERENCES referral_conversions(id) ON DELETE SET NULL,
    reward_type TEXT CHECK (reward_type IN ('points', 'discount', 'credit', 'free_service')) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'FCFA',
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_share_history_user_id ON share_history(user_id);
CREATE INDEX IF NOT EXISTS idx_share_history_created_at ON share_history(created_at);
CREATE INDEX IF NOT EXISTS idx_share_history_user_date ON share_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer ON referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referee ON referral_conversions(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_share_history_updated_at BEFORE UPDATE ON share_history FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON referral_codes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create Row Level Security (RLS) policies
ALTER TABLE share_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_history
CREATE POLICY "Users can view their own share history" ON share_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shares" ON share_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares" ON share_history
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes" ON referral_codes
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create their own referral codes" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referral codes" ON referral_codes
    FOR UPDATE USING (auth.uid() = referrer_id);

-- RLS Policies for referral_conversions
CREATE POLICY "Users can view conversions they referred or were referred by" ON referral_conversions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert conversions" ON referral_conversions
    FOR INSERT WITH CHECK (true); -- Allow system inserts

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their own rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rewards" ON referral_rewards
    FOR ALL USING (true); -- Allow system management

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(prefix TEXT DEFAULT 'EZRA')
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := prefix || '-' || upper(substring(md5(random()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO exists;
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward(
    p_referrer_id UUID,
    p_referee_id UUID,
    p_conversion_type TEXT,
    p_reward_amount NUMERIC DEFAULT 25000
)
RETURNS UUID AS $$
DECLARE
    conversion_id UUID;
    reward_id UUID;
BEGIN
    -- Create conversion record
    INSERT INTO referral_conversions (referrer_id, referee_id, conversion_type, reward_amount)
    VALUES (p_referrer_id, p_referee_id, p_conversion_type, p_reward_amount)
    RETURNING id INTO conversion_id;
    
    -- Create reward for referrer
    INSERT INTO referral_rewards (
        user_id, 
        referral_conversion_id, 
        reward_type, 
        amount, 
        description,
        expires_at
    )
    VALUES (
        p_referrer_id,
        conversion_id,
        'credit',
        p_reward_amount,
        'Crédit de parrainage - Nouveau membre inscrit',
        NOW() + INTERVAL '90 days'
    )
    RETURNING id INTO reward_id;
    
    RETURN reward_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample tier data if needed (optional)
/*
INSERT INTO referral_rewards (user_id, reward_type, amount, description, status) 
VALUES 
    -- Sample rewards can be added here for testing
    -- ('user-uuid', 'points', 100, 'Welcome bonus', 'applied')
;
*/

-- Create view for user referral stats
CREATE OR REPLACE VIEW user_referral_stats AS
SELECT 
    p.id as user_id,
    p.full_name,
    COALESCE(sh.total_shares, 0) as total_shares,
    COALESCE(rw.total_points, 0) as total_points,
    COALESCE(rc.referrals_signed_up, 0) as referrals_signed_up,
    COALESCE(rw.active_rewards, 0) as active_rewards,
    COALESCE(rw.total_credit, 0) as total_credit
FROM profiles p
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_shares 
    FROM share_history 
    GROUP BY user_id
) sh ON p.id = sh.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        SUM(CASE WHEN reward_type = 'points' THEN amount ELSE 0 END) as total_points,
        COUNT(CASE WHEN status = 'pending' OR status = 'applied' THEN 1 END) as active_rewards,
        SUM(CASE WHEN reward_type = 'credit' AND status = 'applied' THEN amount ELSE 0 END) as total_credit
    FROM referral_rewards 
    GROUP BY user_id
) rw ON p.id = rw.user_id
LEFT JOIN (
    SELECT referrer_id, COUNT(*) as referrals_signed_up
    FROM referral_conversions
    WHERE conversion_type = 'signup'
    GROUP BY referrer_id
) rc ON p.id = rc.referrer_id;

-- ADMIN ACCESS POLICIES (for admin dashboard)
-- These policies allow admins to view and manage all referral data

-- Admin access to share_history
CREATE POLICY "Admins can view all share history" ON share_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all shares" ON share_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin access to referral_codes
CREATE POLICY "Admins can view all referral codes" ON referral_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all referral codes" ON referral_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin access to referral_conversions
CREATE POLICY "Admins can view all conversions" ON referral_conversions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin access to referral_rewards
CREATE POLICY "Admins can view all rewards" ON referral_rewards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );