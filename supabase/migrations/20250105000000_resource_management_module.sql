-- ==============================================================================
-- NEXORG 2.1 - RESOURCE MANAGEMENT MODULE
-- SQL MIGRATION & RLS POLICIES
-- Classrooms, Specialized Laboratories, Room Allocation Rules & Resource Availability
-- ==============================================================================

-- 1. EXTEND ROOMS WITH ROOM NAME & NORMALIZED DEPARTMENT
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS room_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_room_per_building'
    ) THEN
        ALTER TABLE public.rooms 
        ADD CONSTRAINT unique_room_per_building UNIQUE (institute_id, building, room_number);
    END IF;
END $$;

-- 2. EXTEND LABS WITH LAB CODE & TYPE
CREATE TYPE lab_category AS ENUM (
    'COMPUTER_SCIENCE', 
    'AI_DATA_SCIENCE', 
    'HARDWARE_EMBEDDED', 
    'NETWORKING_SECURITY', 
    'ELECTRONICS_CIRCUITS', 
    'GENERAL_PURPOSE'
);

ALTER TABLE public.labs
ADD COLUMN IF NOT EXISTS lab_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS lab_type lab_category NOT NULL DEFAULT 'COMPUTER_SCIENCE',
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_lab_code_per_institute'
    ) THEN
        ALTER TABLE public.labs 
        ADD CONSTRAINT unique_lab_code_per_institute UNIQUE (institute_id, lab_code);
    END IF;
END $$;

-- 3. ROOM AVAILABILITY & MAINTENANCE LOCKS
CREATE TABLE IF NOT EXISTS public.room_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (slot_type IN ('AVAILABLE', 'MAINTENANCE', 'LOCKED', 'RESTRICTED')),
    reason VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_avail_room ON public.room_availability(room_id);
CREATE INDEX IF NOT EXISTS idx_room_avail_day ON public.room_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_room_avail_inst ON public.room_availability(institute_id);

-- 4. LAB AVAILABILITY & MAINTENANCE LOCKS
CREATE TABLE IF NOT EXISTS public.lab_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
    day_of_week academic_day NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (slot_type IN ('AVAILABLE', 'MAINTENANCE', 'LOCKED', 'RESTRICTED')),
    reason VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_avail_lab ON public.lab_availability(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_avail_day ON public.lab_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_lab_avail_inst ON public.lab_availability(institute_id);

-- 5. ROW LEVEL SECURITY POLICIES FOR RESOURCES

-- Rooms RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms: View in institute"
    ON public.rooms FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Rooms: Head full control"
    ON public.rooms FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "Rooms: Admin manage department rooms"
    ON public.rooms FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- Labs RLS
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labs: View in institute"
    ON public.labs FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "Labs: Head full control"
    ON public.labs FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "Labs: Admin manage department labs"
    ON public.labs FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- Room Availability RLS
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RoomAvailability: View in institute"
    ON public.room_availability FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "RoomAvailability: Head manage all"
    ON public.room_availability FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "RoomAvailability: Admin manage department"
    ON public.room_availability FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );

-- Lab Availability RLS
ALTER TABLE public.lab_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LabAvailability: View in institute"
    ON public.lab_availability FOR SELECT
    USING (institute_id = public.current_user_institute_id());

CREATE POLICY "LabAvailability: Head manage all"
    ON public.lab_availability FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'HEAD'
    );

CREATE POLICY "LabAvailability: Admin manage department"
    ON public.lab_availability FOR ALL
    USING (
        institute_id = public.current_user_institute_id() 
        AND public.current_user_role() = 'ADMIN'
    );
