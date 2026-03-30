import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SECURITY_HEADERS, withSecurityHeaders, withErrorResponse } from "../_shared/securityHeaders.ts";

interface NotificationRequest {
  type: 'post_comment' | 'post_vote' | 'promise_update' | 'community_invite';
  recipient_id: string;
  sender_id?: string;
  post_id?: string;
  promise_id?: string;
  community_id?: string;
  message: string;
}

const VALID_NOTIFICATION_TYPES = ['post_comment', 'post_vote', 'promise_update', 'community_invite'] as const;

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateInput(data: unknown): { valid: true; data: NotificationRequest } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { type, recipient_id, sender_id, post_id, promise_id, community_id, message } = data as Record<string, unknown>;

  // Validate type
  if (!type || !VALID_NOTIFICATION_TYPES.includes(type as typeof VALID_NOTIFICATION_TYPES[number])) {
    return { valid: false, error: `Type must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}` };
  }

  // Validate recipient_id
  if (typeof recipient_id !== 'string' || !isValidUUID(recipient_id)) {
    return { valid: false, error: 'recipient_id must be a valid UUID' };
  }

  // Validate optional UUIDs
  if (sender_id !== undefined && (typeof sender_id !== 'string' || !isValidUUID(sender_id))) {
    return { valid: false, error: 'sender_id must be a valid UUID' };
  }

  if (post_id !== undefined && (typeof post_id !== 'string' || !isValidUUID(post_id))) {
    return { valid: false, error: 'post_id must be a valid UUID' };
  }

  if (promise_id !== undefined && (typeof promise_id !== 'string' || !isValidUUID(promise_id))) {
    return { valid: false, error: 'promise_id must be a valid UUID' };
  }

  if (community_id !== undefined && (typeof community_id !== 'string' || !isValidUUID(community_id))) {
    return { valid: false, error: 'community_id must be a valid UUID' };
  }

  // Validate message
  if (typeof message !== 'string' || message.length === 0) {
    return { valid: false, error: 'message must be a non-empty string' };
  }

  if (message.length > 500) {
    return { valid: false, error: 'message must be 500 characters or less' };
  }

  return {
    valid: true,
    data: {
      type: type as NotificationRequest['type'],
      recipient_id,
      sender_id: sender_id as string | undefined,
      post_id: post_id as string | undefined,
      promise_id: promise_id as string | undefined,
      community_id: community_id as string | undefined,
      message: message.trim().slice(0, 500),
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: SECURITY_HEADERS });
  }

  // Validate Content-Type
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return withErrorResponse('Content-Type must be application/json', 415);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return withErrorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT token
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return withErrorResponse('Unauthorized - invalid token', 401);
    }

    const userId = claimsData.user.id;

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return withErrorResponse('Invalid JSON body', 400);
    }

    const validation = validateInput(rawInput);
    if (!validation.valid) {
      return withErrorResponse(validation.error, 400);
    }

    const notification = validation.data;

    // Verify sender_id matches authenticated user (if provided)
    if (notification.sender_id && notification.sender_id !== userId) {
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Check if user is admin
      const { data: userRole } = await supabaseService
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!userRole) {
        return withErrorResponse('sender_id must match authenticated user', 403);
      }
    }

    // Use service role for database operations
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store notification in comment_notifications table
    const { data, error } = await supabaseService
      .from('comment_notifications')
      .insert({
        notification_type: notification.type,
        recipient_id: notification.recipient_id,
        title: notification.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        message: notification.message,
        is_read: false,
        action_url: notification.post_id ? `/post/${notification.post_id}` : null,
        metadata: {
          sender_id: notification.sender_id || userId,
          post_id: notification.post_id,
          promise_id: notification.promise_id,
          community_id: notification.community_id,
        }
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Notification created by user ${userId}:`, data);

    // Example: Send email notification for important updates
    if (notification.type === 'promise_update') {
      await sendEmailNotification(supabaseService, notification);
    }

    return withSecurityHeaders({ success: true, notification: data });

  } catch (error) {
    console.error('Error sending notification:', error);
    return withErrorResponse('Failed to send notification', 500);
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendEmailNotification(supabase: any, notification: NotificationRequest) {
  try {
    // Get recipient email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', notification.recipient_id)
      .single();

    if (!profile?.username) return;

    // Here you would integrate with your email service
    console.log(`Email notification would be sent to user ${profile.username}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}
