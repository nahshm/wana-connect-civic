import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user ID - let's create a new user directly in the database
const testUserId = '550e8400-e29b-41d4-a716-446655440000';

async function testCreatePostAndVote() {
  try {
    console.log('Testing post creation and voting functionality...\n');

    // First, try to find existing test user or create a new one
    console.log('Looking for existing test user...');
    let actualUserId = null;

    // Try to sign up a user directly (this will work with anon key)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
      options: {
        data: { username: 'testuser' }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Error signing up user:', signUpError);
      return;
    }

    if (signUpData.user) {
      console.log('User signed up successfully with ID:', signUpData.user.id);
      actualUserId = signUpData.user.id;
    } else {
      // User might already exist, try signing in
      console.log('User might already exist, trying to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });

      if (signInError) {
        console.error('Error signing in user:', signInError);
        return;
      }

      console.log('User signed in successfully with ID:', signInData.user.id);
      actualUserId = signInData.user.id;
    }

    // First, create a test profile for the user
    console.log('Creating test profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: actualUserId,
        username: 'testuser',
        display_name: 'Test User',
        karma: 0,
        post_karma: 0,
        comment_karma: 0,
      });

    if (profileError && !profileError.message.includes('duplicate key')) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('Profile created or already exists');

    // First, create a test post
    console.log('Creating a test post...');
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        title: 'Test Post for Voting ' + new Date().toISOString(),
        content: 'This is a test post to verify voting functionality works correctly.',
        author_id: actualUserId,
        community_id: null, // No community for now
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return;
    }

    console.log('✅ Post created successfully:', postData.id);
    console.log('Post details:', {
      id: postData.id,
      title: postData.title,
      upvotes: postData.upvotes,
      downvotes: postData.downvotes,
    });

    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if karma was updated
    const { data: profileAfterPost, error: profileAfterPostError } = await supabase
      .from('profiles')
      .select('karma, post_karma, comment_karma')
      .eq('id', actualUserId)
      .single();

    if (profileAfterPostError) {
      console.error('Error fetching profile:', profileAfterPostError);
    } else {
      console.log('Profile karma after post creation:', profileAfterPost);
    }

    // Now test voting on the post
    console.log('\nTesting vote functionality...');

    // Add an upvote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        user_id: actualUserId,
        post_id: postData.id,
        vote_type: 'up',
      });

    if (voteError) {
      console.error('❌ Error adding vote:', voteError);
      return;
    }

    console.log('✅ Vote added successfully');

    // Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if vote counts were updated
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .eq('id', postData.id)
      .single();

    if (updateError) {
      console.error('Error fetching updated post:', updateError);
    } else {
      console.log('Updated post vote counts:', {
        upvotes: updatedPost.upvotes,
        downvotes: updatedPost.downvotes,
      });
    }

    // Check if karma was updated after vote
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('karma, post_karma, comment_karma')
      .eq('id', actualUserId)
      .single();

    if (updatedProfileError) {
      console.error('Error fetching updated profile:', updatedProfileError);
    } else {
      console.log('Profile karma after voting:', updatedProfile);
    }

    // Test removing the vote
    console.log('\nTesting vote removal...');
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', actualUserId)
      .eq('post_id', postData.id);

    if (deleteError) {
      console.error('❌ Error removing vote:', deleteError);
    } else {
      console.log('✅ Vote removed successfully');
    }

    // Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check final vote counts
    const { data: finalPost, error: finalError } = await supabase
      .from('posts')
      .select('id, title, upvotes, downvotes')
      .eq('id', postData.id)
      .single();

    if (finalError) {
      console.error('Error fetching final post:', finalError);
    } else {
      console.log('Final post vote counts:', {
        upvotes: finalPost.upvotes,
        downvotes: finalPost.downvotes,
      });
    }

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCreatePostAndVote();
