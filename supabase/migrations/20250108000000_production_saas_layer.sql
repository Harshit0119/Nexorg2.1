-- ==============================================================================
-- NEXORG 2.1 - PRODUCTION SAAS LAYER SCHEMA & RLS POLICIES
-- Subscriptions, Billing History, Audit Logs, In-App Notifications,
-- Institute Tenant Lifecycle (Active/Suspended), and Super Admin Governance
-- ==============================================================================

-- 1. EXTEND USER ROLE ENUM TO SUPPORT SUPER_ADMIN
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. EXTEND INSTITUTES WITH SAAS TENANT STATUS & BRANDING
ALTER TABLE public.institutes
ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED')),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_brand_color VARCHAR(20) DEFAULT '#4F46E5',
ADD COLUMN IF NOT EXISTS secondary_brand_color VARCHAR(20) DEFAULT '#7C3AED',
ADD COLUMN IF NOT EXISTS domain_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_institutes_status ON public.institutes(status);

-- 3. SUBSCRIPTIONS TABLE (Multi-Tenant Plan Enforcement)
CREATE TYPE subscription_plan_tier AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_billing_interval AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE subscription_status_type AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'PAUSED');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE UNIQUE,
    plan_tier subscription_plan_tier NOT NULL DEFAULT 'STARTER',
    status subscription_status_type NOT NULL DEFAULT 'ACTIVE',
    billing_interval subscription_billing_interval NOT NULL DEFAULT 'MONTHLY',
    amount NUMERIC(10, 2) NOT NULL DEFAULT 99.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    max_departments INTEGER NOT NULL DEFAULT 5,
    max_faculty INTEGER NOT NULL DEFAULT 50,
    max_rooms INTEGER NOT NULL DEFAULT 20,
    max_timetables INTEGER NOT NULL DEFAULT 3,
    custom_branding_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    priority_support BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_institute ON public.subscriptions(institute_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 4. SUBSCRIPTION BILLING HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PLAN_UPGRADE', 'PLAN_DOWNGRADE', 'RENEWAL', 'CANCELLATION')),
    from_plan subscription_plan_tier,
    to_plan subscription_plan_tier,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    invoice_number VARCHAR(100),
    invoice_pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_inst ON public.subscription_history(institute_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_sub ON public.subscription_history(subscription_id);

-- 5. AUDIT LOGS TABLE (Enterprise Compliance & Security Trace)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100),
    description TEXT NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_inst ON public.audit_logs(institute_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(institute_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 6. NOTIFICATIONS TABLE (Multi-Channel In-App & Email Registry)
CREATE TYPE notification_type AS ENUM (
    'INVITATION_SENT',
    'INVITATION_ACCEPTED',
    'FACULTY_ASSIGNMENT',
    'TIMETABLE_PUBLISHED',
    'SUBSCRIPTION_EXPIRING',
    'CONFLICT_DETECTED',
    'SYSTEM_ALERT'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type NOT NULL DEFAULT 'SYSTEM_ALERT',
    action_url VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_delivery_status VARCHAR(30) DEFAULT 'NOT_APPLICABLE' 
        CHECK (email_delivery_status IN ('NOT_APPLICABLE', 'QUEUED', 'SENT', 'FAILED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_inst ON public.notifications(institute_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SAAS LAYER
-- ==============================================================================

-- SUBSCRIPTIONS RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscriptions: Super Admin full access"
    ON public.subscriptions FOR ALL
    USING (public.current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Subscriptions: Head view own subscription"
    ON public.subscriptions FOR SELECT
    USING (
        institute_id = public.current_user_institute_id() AND
        public.current_user_role() IN ('HEAD', 'ADMIN')
    );

CREATE POLICY "Subscriptions: Head update own subscription"
    ON public.subscriptions FOR UPDATE
    USING (
        institute_id = public.current_user_institute_id() AND
        public.current_user_role() = 'HEAD'
    );

-- SUBSCRIPTION HISTORY RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SubHistory: Super Admin full access"
    ON public.subscription_history FOR ALL
    USING (public.current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "SubHistory: Head view own billing history"
    ON public.subscription_history FOR SELECT
    USING (
        institute_id = public.current_user_institute_id() AND
        public.current_user_role() IN ('HEAD', 'ADMIN')
    );

-- AUDIT LOGS RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AuditLogs: Super Admin full view"
    ON public.audit_logs FOR SELECT
    USING (public.current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "AuditLogs: Head and Admin view institute logs"
    ON public.audit_logs FOR SELECT
    USING (
        institute_id = public.current_user_institute_id() AND
        public.current_user_role() IN ('HEAD', 'ADMIN')
    );

CREATE POLICY "AuditLogs: Insert allowed from authenticated users"
    ON public.audit_logs FOR INSERT
    WITH CHECK (
        institute_id = public.current_user_institute_id() OR
        public.current_user_role() = 'SUPER_ADMIN'
    );

-- NOTIFICATIONS RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: Users view own notifications"
    ON public.notifications FOR SELECT
    USING (
        user_id = auth.uid() OR
        (user_id IS NULL AND institute_id = public.current_user_institute_id() AND public.current_user_role() IN ('HEAD', 'ADMIN'))
    );

CREATE POLICY "Notifications: Users update own read status"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid() OR (user_id IS NULL AND institute_id = public.current_user_institute_id()));

CREATE POLICY "Notifications: Head & Admin create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (institute_id = public.current_user_institute_id());

-- ==============================================================================
-- STORED FUNCTION: PLAN USAGE & RESOURCE ENFORCEMENT CHECKER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_plan_limits(
    p_institute_id UUID,
    p_resource_type VARCHAR(50)
)
RETURNS TABLE (
    is_allowed BOOLEAN,
    current_count INTEGER,
    max_limit INTEGER,
    plan_tier VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan subscription_plan_tier := 'STARTER';
    v_max_limit INTEGER := 50;
    v_current_count INTEGER := 0;
BEGIN
    SELECT s.plan_tier,
           CASE 
               WHEN p_resource_type = 'DEPARTMENTS' THEN s.max_departments
               WHEN p_resource_type = 'FACULTY' THEN s.max_faculty
               WHEN p_resource_type = 'ROOMS' THEN s.max_rooms
               WHEN p_resource_type = 'TIMETABLES' THEN s.max_timetables
               ELSE 999
           END
    INTO v_plan, v_max_limit
    FROM public.subscriptions s
    WHERE s.institute_id = p_institute_id AND s.status = 'ACTIVE';

    IF NOT FOUND THEN
        v_plan := 'STARTER';
        v_max_limit := 20;
    END IF;

    IF p_resource_type = 'DEPARTMENTS' THEN
        SELECT COUNT(*) INTO v_current_count FROM public.departments WHERE institute_id = p_institute_id;
    ELSIF p_resource_type = 'FACULTY' THEN
        SELECT COUNT(*) INTO v_current_count FROM public.faculty_profiles WHERE institute_id = p_institute_id;
    ELSIF p_resource_type = 'ROOMS' THEN
        SELECT COUNT(*) INTO v_current_count FROM public.rooms WHERE institute_id = p_institute_id;
    ELSIF p_resource_type = 'TIMETABLES' THEN
        SELECT COUNT(*) INTO v_current_count FROM public.timetables WHERE institute_id = p_institute_id;
    END IF;

    RETURN QUERY
    SELECT (v_current_count < v_max_limit), v_current_count, v_max_limit, v_plan::VARCHAR;
END;
$$;
