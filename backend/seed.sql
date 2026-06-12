-- ========================================================
-- LEARNING PATH RECOMMENDATION SYSTEM - DATABASE SEED SCRIPT
-- Copy and run this script inside your Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Courses Table
create table if not exists public.courses (
    course_code varchar(20) primary key,
    course_name varchar(100) not null,
    level varchar(50) not null, -- e.g., "Foundation", "Diploma", "BSc"
    capacity integer not null default 50,
    available_seats integer not null default 50,
    term varchar(20) not null -- e.g., "Term 1", "Term 2"
);

-- 2. Student Profiles
create table if not exists public.students (
    roll_no varchar(50) primary key,
    clerk_id varchar(100) unique, -- Maps to Clerk user ID
    name varchar(100) not null,
    email varchar(100) unique not null,
    interests text[],
    goals text[],
    schedule varchar(100), -- e.g., "Morning", "Evening"
    commitment integer, -- Hours per week
    cgpa numeric(3, 2),
    current_level varchar(50) -- "Foundation", "Diploma", etc.
);

-- 3. Enrollments / Completed Courses
create table if not exists public.enrollments (
    id uuid default uuid_generate_v4() primary key,
    roll_no varchar(50) references public.students(roll_no) on delete cascade,
    course_code varchar(20) references public.courses(course_code) on delete cascade,
    term varchar(20) not null,
    grade varchar(2) not null, -- e.g., "A", "B", "C", "S"
    status varchar(20) not null default 'completed', -- 'completed', 'enrolled'
    unique (roll_no, course_code)
);

-- 4. Course Feedback
create table if not exists public.feedback (
    id uuid default uuid_generate_v4() primary key,
    course_code varchar(20) references public.courses(course_code) on delete cascade,
    roll_no varchar(50) references public.students(roll_no) on delete cascade,
    rating integer check (rating >= 1 and rating <= 5),
    title varchar(100) not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(course_code, roll_no) -- Limit feedback to once per student per course
);

-- 5. Recommendation History
create table if not exists public.recommendations (
    id uuid default uuid_generate_v4() primary key,
    roll_no varchar(50) references public.students(roll_no) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    criteria jsonb not null, -- Interests, goals, schedule, commitment, partial courses
    recommended_courses jsonb not null -- Array of recommended course codes + explanations
);

-- 6. System Settings
create table if not exists public.settings (
    key varchar(100) primary key,
    value jsonb not null
);

-- ========================================================
-- SEED DATA
-- ========================================================

-- Insert standard Courses
insert into public.courses (course_code, course_name, level, capacity, available_seats, term) values
('BSMA1001', 'Mathematics I', 'Foundation', 100, 45, 'Term 1'),
('BSMA1002', 'Mathematics II', 'Foundation', 100, 65, 'Term 2'),
('BSCS1001', 'Introduction to Programming (Python)', 'Foundation', 150, 20, 'Term 1'),
('BSCS1002', 'Data Structures and Algorithms', 'Foundation', 120, 10, 'Term 2'),
('BSCS2001', 'Database Management Systems', 'Diploma', 80, 30, 'Term 1'),
('BSCS2002', 'Application Development (Web)', 'Diploma', 90, 15, 'Term 2'),
('BSSE3001', 'Software Engineering', 'BSc', 60, 25, 'Term 1'),
('BSAI3002', 'Artificial Intelligence & Machine Learning', 'BSc', 60, 5, 'Term 2')
on conflict (course_code) do update set
    course_name = excluded.course_name,
    level = excluded.level,
    capacity = excluded.capacity,
    available_seats = excluded.available_seats,
    term = excluded.term;

-- Insert Default Settings
insert into public.settings (key, value)
values ('max_recommendation_limit', '5'::jsonb)
on conflict (key) do nothing;
