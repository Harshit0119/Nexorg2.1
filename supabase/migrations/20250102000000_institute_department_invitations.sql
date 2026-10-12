-- ==============================================================================
-- NEXORG 2.1 - INSTITUTE ONBOARDING, DEPARTMENT MANAGEMENT & INVITATIONS
-- SQL MIGRATION & RLS POLICIES
-- ==============================================================================

-- 1. ADD INSTITUTE TYPE
ALTER TABLE public.institutes 
ADD COLUMN IF NOT EXISTS institute_type VARCHAR(50) NOT NULL DEFAULT 'TECHNOLOGY_INSTITUTE';

-- 2. ENFORCE UNIQUE DEPARTMENT NAME WITHIN INSTITUTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_dept_name_per_institute'
    ) THEN
        ALTER TABLE public.departments 
        ADD CONSTRAINT unique_dept_name_per_institute UNIQUE (institute_id, name);
    END IF;
END $$;

-- 3. INVITATION SYSTEM TABLE
CREATE TABLE IF NOT EXISTS public.institute_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'FACULTY',
    department_ids UUID[] DEFAULT ARRAY[]::UUID[],
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(128) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_inst ON public.institute_invitations(institute_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.institute_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.institute_invitations(token);

-- 4. ROW LEVEL SECURITY FOR INVITATIONS
ALTER TABLE public.institute_invitations ENABLE ROW LEVEL SECURITY;

-- HEAD can view, insert, update and delete invitations for their institute
CREATE POLICY "Invitations: Head full access"
    ON public.institute_invitations FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

-- ADMIN can view invitations in their institute
CREATE POLICY "Invitations: Admin view"
    ON public.institute_invitations FOR SELECT
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() IN ('HEAD', 'ADMIN')
    );

-- Anyone with a valid invitation token can read their specific invitation (for accepting)
CREATE POLICY "Invitations: Token holder can verify"
    ON public.institute_invitations FOR SELECT
    USING (status = 'PENDING' AND expires_at > NOW());

-- 5. FUNCTION TO ACCEPT INVITATION ATOMICALLY
CREATE OR REPLACE FUNCTION public.accept_institute_invitation(
    p_token VARCHAR(128),
    p_user_id UUID,
    p_full_name VARCHAR(255),
    p_employee_id VARCHAR(50) DEFAULT NULL,
    p_designation VARCHAR(100) DEFAULT 'Assistant Professor'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_invitation RECORD;
    v_dept_id UUID;
    v_fac_id UUID;
BEGIN
    -- 1. Find valid pending invitation
    SELECT * INTO v_invitation
    FROM public.institute_invitations
    WHERE token = p_token AND status = 'PENDING' AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;

    -- 2. Upsert user record linked to institute
    INSERT INTO public.users (id, institute_id, email, full_name, role, is_active)
    VALUES (p_user_id, v_invitation.institute_id, v_invitation.email, p_full_name, v_invitation.role, TRUE)
    ON CONFLICT (id) DO UPDATE SET
        institute_id = v_invitation.institute_id,
        role = v_invitation.role,
        full_name = p_full_name;

    -- 3. If role is FACULTY, create faculty profile & M:N department assignments
    IF v_invitation.role = 'FACULTY' THEN
        INSERT INTO public.faculty_profiles (
            user_id, 
            institute_id, 
            employee_id, 
            designation, 
            max_weekly_hours
        )
        VALUES (
            p_user_id, 
            v_invitation.institute_id, 
            COALESCE(p_employee_id, 'FAC-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 6)),
            p_designation,
            18
        )
        RETURNING id INTO v_fac_id;

        -- Assign to selected departments
        IF v_invitation.department_ids IS NOT NULL AND array_length(v_invitation.department_ids, 1) > 0 THEN
            FOREACH v_dept_id IN ARRAY v_invitation.department_ids
            LOOP
                INSERT INTO public.faculty_department_assignments (
                    faculty_id,
                    department_id,
                    institute_id,
                    is_primary_department
                )
                VALUES (
                    v_fac_id,
                    v_dept_id,
                    v_invitation.institute_id,
                    (v_dept_id = v_invitation.department_ids[1])
                )
                ON CONFLICT (faculty_id, department_id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    -- 4. Mark invitation as accepted
    UPDATE public.institute_invitations
    SET status = 'ACCEPTED', accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true, 
        'institute_id', v_invitation.institute_id, 
        'role', v_invitation.role
    );
END;
$$;
