import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'post_comment' | 'post_vote' | 'promise_update' | 'community_invite';
  recipient_id: string;
  sender_id?: string;
  post_id?: string;
  promise_id?: string;
  community_id?: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const notification: NotificationRequest = await req.json();

    // Store notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        type: notification.type,
        recipient_id: notification.recipient_id,
        sender_id: notification.sender_id,
        post_id: notification.post_id,
        promise_id: notification.promise_id,
        community_id: notification.community_id,
        message: notification.message,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Here you could add push notification logic
    // For now, we'll just log the notification
    console.log('Notification created:', data);

    // You could integrate with services like:
    // - Push notifications (Firebase, OneSignal)
    // - Email notifications (via Resend)
    // - SMS notifications (via Twilio)

    // Example: Send email notification for important updates
    if (notification.type === 'promise_update') {
      await sendEmailNotification(supabase, notification);
    }

    return new Response(JSON.stringify({ success: true, notification: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function sendEmailNotification(supabase: any, notification: NotificationRequest) {
  try {
    // Get recipient email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', notification.recipient_id)
      .single();

    if (!profile) return;

    // Here you would integrate with your email service
    // For example, using Resend:
    /*
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    await resend.emails.send({
      from: 'WanaIQ <notifications@wanaiq.com>',
      to: profile.email,
      subject: 'New Promise Update',
      html: `<p>${notification.message}</p>`
    });
    */

    console.log(`Email notification would be sent to user ${profile.username}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}