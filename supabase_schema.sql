-- RoboSchool Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Учитель',
  phone TEXT,
  email TEXT,
  salary INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner',
  teacher_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  days TEXT,
  time TEXT,
  duration INTEGER DEFAULT 90,
  max_students INTEGER DEFAULT 10,
  color TEXT DEFAULT '#0ea5e9',
  age_range TEXT,
  kit_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birthday DATE,
  city TEXT DEFAULT 'Алматы',
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  payment_status TEXT DEFAULT 'due_soon',
  enrolled DATE DEFAULT CURRENT_DATE,
  medical_notes TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student-Group enrollment
CREATE TABLE IF NOT EXISTS student_groups (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, group_id)
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  duration INTEGER,
  topic TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, student_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  period TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can read/write all data
CREATE POLICY "Authenticated users can select employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert employees" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update employees" ON employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete employees" ON employees FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select groups" ON groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert groups" ON groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update groups" ON groups FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete groups" ON groups FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete students" ON students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select student_groups" ON student_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert student_groups" ON student_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete student_groups" ON student_groups FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select lessons" ON lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert lessons" ON lessons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lessons" ON lessons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete lessons" ON lessons FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select attendance" ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete attendance" ON attendance FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payments" ON payments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expenses" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete expenses" ON expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can select activity_log" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activity_log" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Grant access to authenticated role
GRANT ALL ON employees TO authenticated;
GRANT ALL ON groups TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON student_groups TO authenticated;
GRANT ALL ON lessons TO authenticated;
GRANT ALL ON attendance TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON expenses TO authenticated;
GRANT ALL ON activity_log TO authenticated;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Employees
INSERT INTO employees (id, name, role, phone, email, salary, active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Дмитрий Волков', 'Учитель', '+7 701 555 0101', 'd.volkov@roboschool.kz', 180000, true),
  ('11111111-1111-1111-1111-111111111102', 'Айгуль Нурмаганбетова', 'Учитель', '+7 702 555 0202', 'a.nur@roboschool.kz', 160000, true),
  ('11111111-1111-1111-1111-111111111103', 'Санжар Абенов', 'Учитель', '+7 705 555 0303', 's.abenov@roboschool.kz', 150000, true),
  ('11111111-1111-1111-1111-111111111104', 'Зарина Касымова', 'Администратор', '+7 707 555 0404', 'z.kas@roboschool.kz', 140000, true);

-- Groups
INSERT INTO groups (id, name, level, teacher_id, days, time, duration, max_students, color, age_range, kit_type) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Mindstorms Начинающие', 'beginner', '11111111-1111-1111-1111-111111111101', 'Вт, Чт', '16:00', 90, 8, '#0ea5e9', '9–12', 'Mindstorms EV3'),
  ('22222222-2222-2222-2222-222222222202', 'Mindstorms Продвинутые', 'advanced', '11111111-1111-1111-1111-111111111101', 'Пн, Ср', '17:30', 90, 8, '#8b5cf6', '12–16', 'Mindstorms EV3'),
  ('22222222-2222-2222-2222-222222222203', 'WeDo Малыши', 'beginner', '11111111-1111-1111-1111-111111111102', 'Сб', '10:00', 60, 10, '#f59e0b', '6–9', 'LEGO WeDo 2.0'),
  ('22222222-2222-2222-2222-222222222204', 'Spike Prime Средний', 'intermediate', '11111111-1111-1111-1111-111111111102', 'Вт', '18:00', 90, 8, '#10b981', '10–14', 'SPIKE Prime'),
  ('22222222-2222-2222-2222-222222222205', 'Scratch + Роботы', 'beginner', '11111111-1111-1111-1111-111111111103', 'Сб', '12:00', 60, 10, '#f43f5e', '7–10', 'LEGO + Scratch');

-- Students
INSERT INTO students (id, name, birthday, city, parent_name, parent_phone, parent_email, payment_status, enrolled, medical_notes) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Алия Бекова', '2015-03-15', 'Алматы', 'Гульнара Бекова', '+7 701 234 5678', 'g.bekova@mail.ru', 'paid', '2025-09-01', ''),
  ('33333333-3333-3333-3333-333333333302', 'Нурлан Сейткали', '2012-07-22', 'Алматы', 'Серик Сейткали', '+7 702 345 6789', 'serik@gmail.com', 'overdue', '2024-09-01', 'Аллергия на пыль'),
  ('33333333-3333-3333-3333-333333333303', 'Дарья Михайлова', '2017-11-05', 'Алматы', 'Ольга Михайлова', '+7 705 456 7890', 'o.mikh@mail.ru', 'due_soon', '2025-01-15', ''),
  ('33333333-3333-3333-3333-333333333304', 'Тимур Ахметов', '2013-05-18', 'Алматы', 'Болат Ахметов', '+7 707 567 8901', 'bolat@kz.kz', 'paid', '2024-09-01', ''),
  ('33333333-3333-3333-3333-333333333305', 'Амина Джаксыбекова', '2016-09-30', 'Алматы', 'Назгуль Джаксыбекова', '+7 708 678 9012', 'nazgul@mail.ru', 'paid', '2025-03-01', ''),
  ('33333333-3333-3333-3333-333333333306', 'Арман Сатыбалды', '2011-12-12', 'Алматы', 'Дина Сатыбалды', '+7 701 789 0123', 'dina@inbox.ru', 'overdue', '2023-09-01', 'Астма (лёгкая форма)'),
  ('33333333-3333-3333-3333-333333333307', 'Полина Рябова', '2014-06-07', 'Алматы', 'Андрей Рябов', '+7 702 890 1234', 'a.ryabov@gmail.com', 'paid', '2025-09-01', ''),
  ('33333333-3333-3333-3333-333333333308', 'Жансая Омарова', '2018-02-14', 'Алматы', 'Асель Омарова', '+7 705 901 2345', 'asel@mail.ru', 'due_soon', '2025-09-01', ''),
  ('33333333-3333-3333-3333-333333333309', 'Максим Сорокин', '2010-08-20', 'Алматы', 'Игорь Сорокин', '+7 707 012 3456', 'i.sorokin@mail.ru', 'paid', '2024-01-01', ''),
  ('33333333-3333-3333-3333-333333333310', 'Айдана Кенжебаева', '2015-04-25', 'Алматы', 'Маржан Кенжебаева', '+7 708 123 4567', 'm.kenz@kz.kz', 'paid', '2025-09-01', ''),
  ('33333333-3333-3333-3333-333333333311', 'Сабина Ержанова', '2016-10-10', 'Алматы', 'Кайрат Ержанов', '+7 701 234 0987', 'k.erz@gmail.com', 'paid', '2025-03-01', ''),
  ('33333333-3333-3333-3333-333333333312', 'Влад Коваленко', '2012-01-31', 'Алматы', 'Татьяна Коваленко', '+7 702 345 0876', 't.koval@mail.ru', 'due_soon', '2024-09-01', '');

-- Student-Group enrollments
INSERT INTO student_groups (student_id, group_id) VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222204'),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222204'),
  ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222205'),
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333310', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333311', '22222222-2222-2222-2222-222222222205'),
  ('33333333-3333-3333-3333-333333333312', '22222222-2222-2222-2222-222222222204');

-- Lessons
INSERT INTO lessons (id, group_id, date, start_time, duration, topic, status) VALUES
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222203', CURRENT_DATE, '10:00', 60, 'Шестерёнки и механизмы', 'scheduled'),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222205', CURRENT_DATE, '12:00', 60, 'Введение в Scratch', 'scheduled'),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222202', CURRENT_DATE + 1, '17:30', 90, 'Автономная навигация', 'scheduled'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222201', CURRENT_DATE + 2, '16:00', 90, 'Сенсоры и обратная связь', 'scheduled'),
  ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222204', CURRENT_DATE + 2, '18:00', 90, 'Программирование петлей', 'scheduled'),
  ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222202', CURRENT_DATE + 2, '17:30', 90, 'Соревновательный алгоритм', 'scheduled'),
  ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222201', CURRENT_DATE + 3, '16:00', 90, 'Проект: Умный дом', 'scheduled'),
  ('44444444-4444-4444-4444-444444444408', '22222222-2222-2222-2222-222222222203', CURRENT_DATE - 1, '10:00', 60, 'Простые механизмы', 'completed'),
  ('44444444-4444-4444-4444-444444444409', '22222222-2222-2222-2222-222222222205', CURRENT_DATE - 1, '12:00', 60, 'Спрайты и анимация', 'completed');

-- Payments
INSERT INTO payments (student_id, amount, date, method, period, notes) VALUES
  ('33333333-3333-3333-3333-333333333301', 25000, CURRENT_DATE - 25, 'kaspi', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333303', 22000, CURRENT_DATE - 29, 'cash', 'Текущий месяц', 'Частичная оплата'),
  ('33333333-3333-3333-3333-333333333304', 30000, CURRENT_DATE - 24, 'card', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333305', 22000, CURRENT_DATE - 23, 'kaspi', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333307', 25000, CURRENT_DATE - 21, 'transfer', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333309', 25000, CURRENT_DATE - 25, 'kaspi', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333310', 25000, CURRENT_DATE - 22, 'cash', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333311', 22000, CURRENT_DATE - 20, 'kaspi', 'Текущий месяц', ''),
  ('33333333-3333-3333-3333-333333333302', 25000, CURRENT_DATE - 55, 'kaspi', 'Прошлый месяц', ''),
  ('33333333-3333-3333-3333-333333333306', 25000, CURRENT_DATE - 55, 'cash', 'Прошлый месяц', '');

-- Expenses
INSERT INTO expenses (category, amount, date, description) VALUES
  ('Аренда', 120000, CURRENT_DATE - 25, 'Аренда помещения'),
  ('Зарплата', 630000, CURRENT_DATE - 21, 'Зарплата сотрудников'),
  ('Материалы', 18500, CURRENT_DATE - 16, 'Запчасти для Mindstorms EV3'),
  ('Коммунальные', 12000, CURRENT_DATE - 14, 'Электричество и интернет'),
  ('Маркетинг', 15000, CURRENT_DATE - 11, 'Реклама в Instagram'),
  ('Прочее', 5000, CURRENT_DATE - 6, 'Канцтовары и печать'),
  ('Аренда', 120000, CURRENT_DATE - 55, 'Аренда помещения за прошлый месяц'),
  ('Зарплата', 610000, CURRENT_DATE - 51, 'Зарплата сотрудников за прошлый месяц'),
  ('Материалы', 32000, CURRENT_DATE - 48, 'Новый комплект SPIKE Prime'),
  ('Коммунальные', 11500, CURRENT_DATE - 42, 'Электричество и интернет');

-- Activity log
INSERT INTO activity_log (type, text, icon) VALUES
  ('payment', 'Оплата от Алии Бековой — 25 000 ₸', '💳'),
  ('student', 'Новый ученик: Айдана Кенжебаева добавлена', '👤'),
  ('attendance', 'Посещаемость отмечена — WeDo Малыши', '✅'),
  ('payment', 'Напоминание отправлено: Нурлан Сейткали', '🔔'),
  ('expense', 'Расход записан: Материалы — 18 500 ₸', '📦');

-- Create demo admin user (do this via Supabase Auth UI or Dashboard)
-- Email: admin@roboschool.kz
-- Password: demo123456
