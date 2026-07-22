import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import searchPosts from "./tools/search-posts";
import getPost from "./tools/get-post";
import listMyCommunities from "./tools/list-my-communities";
import listRepresentatives from "./tools/list-representatives";
import searchPromises from "./tools/search-promises";
import listRecentPosts from "./tools/list-recent-posts";

// Direct supabase.co issuer required — never the .lovable.cloud proxy.
// Built from VITE_SUPABASE_PROJECT_ID (Vite inlines this at build time,
// so the module stays import-safe with no runtime env read).
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "wanaiq-mcp",
  title: "WanaIQ Civic",
  version: "0.1.0",
  instructions:
    "Read-only civic tools for WanaIQ (Kenya). Use whoami to identify the caller, search_posts to find civic discussions, get_post to fetch a post with its comments, list_my_communities for the user's communities, list_representatives for their elected leaders, search_promises to track campaign promises, and list_recent_posts for activity in the user's county. All calls run as the signed-in user under RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoami,
    searchPosts,
    getPost,
    listMyCommunities,
    listRepresentatives,
    searchPromises,
    listRecentPosts,
  ],
});
