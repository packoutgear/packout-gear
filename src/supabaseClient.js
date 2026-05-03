import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmpjtvcxqzftystnrgkz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcGp0dmN4cXpmdHlzdG5yZ2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2ODU5MDgsImV4cCI6MjA5MzI2MTkwOH0.s0qB8lobGxE1O1MdbQAJmIY1rNfxpUTA1TQs5irSOqo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
