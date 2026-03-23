import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zcnjpczplkbdmmovlrtv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  // Try inserting without auth (RLS should block it with 401 or return empty) 
  // OR we can just try to see if there's a schema error.
  const { data, error } = await supabase.from('chat_messages').insert({
    room_id: '123e4567-e89b-12d3-a456-426614174000',
    sender_id: '123e4567-e89b-12d3-a456-426614174000',
    content: 'test'
  });
  console.log('Result:', { data, error });
}

testInsert();
