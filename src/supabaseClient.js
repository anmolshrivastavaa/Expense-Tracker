import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jnahhlobbkveipyfpxwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYWhobG9iYmt2ZWlweWZweHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDA3NjMsImV4cCI6MjEwNTExNjc2M30._RKemLHolDpRvsxw1As6nAu_TG0UTM5fU2M58JlbvLQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

