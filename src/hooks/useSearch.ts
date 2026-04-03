import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface SearchFilters {
  communityId?: string
  authorId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}

export interface SearchParams {
  query: string
  type?: 'all' | 'posts' | 'comments' | 'users' | 'communities' | 'officials' | 'promises' | 'projects'
  filters?: SearchFilters
  sort?: 'relevance' | 'date' | 'votes'
  limit?: number
  offset?: number
}

export interface SearchResults {
  posts: any[]
  comments: any[]
  users: any[]
  communities: any[]
  officials: any[]
  promises: any[]
  projects: any[]
}

export const useSearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: async (): Promise<SearchResults> => {
      const { query, type = 'all', filters = {}, sort = 'relevance', limit = 20, offset = 0 } = params
      const searchPattern = `%${query}%`

      // Build all queries in parallel using Promise.all + safe ILIKE (no textSearch 400 errors)
      const [posts, comments, users, communities, officials, promises, projects] = await Promise.all([
        // Posts
        (type === 'all' || type === 'posts') ? (async () => {
          let q = supabase
            .from('posts')
            .select(`
              id, title, content, created_at, upvotes, downvotes, comment_count,
              author:profiles!author_id(id, username, display_name, avatar_url),
              community:communities(id, name, display_name)
            `)
            .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)

          if (filters.communityId) q = q.eq('community_id', filters.communityId)
          if (filters.authorId) q = q.eq('author_id', filters.authorId)
          if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom)
          if (filters.dateTo) q = q.lte('created_at', filters.dateTo)

          if (sort === 'date') q = q.order('created_at', { ascending: false })
          else if (sort === 'votes') q = q.order('upvotes', { ascending: false })
          else q = q.order('created_at', { ascending: false })

          q = q.range(offset, offset + limit - 1)
          const { data } = await q
          return data || []
        })() : Promise.resolve([]),

        // Comments
        (type === 'all' || type === 'comments') ? (async () => {
          const { data } = await supabase
            .from('comments')
            .select(`
              id, content, created_at, upvotes, downvotes,
              author:profiles!author_id(id, username, display_name, avatar),
              post:posts(id, title, community:communities(name))
            `)
            .ilike('content', searchPattern)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
          return data || []
        })() : Promise.resolve([]),

        // Users
        (type === 'all' || type === 'users') ? (async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar, bio, karma, is_verified, role')
            .or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`)
            .range(offset, offset + limit - 1)
          return data || []
        })() : Promise.resolve([]),

        // Communities
        (type === 'all' || type === 'communities') ? (async () => {
          const { data } = await supabase
            .from('communities')
            .select('id, name, display_name, description, member_count, category')
            .or(`name.ilike.${searchPattern},display_name.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .range(offset, offset + limit - 1)
          return data || []
        })() : Promise.resolve([]),

        // Officials
        (type === 'all' || type === 'officials') ? (async () => {
          const { data } = await supabase
            .from('officials')
            .select('id, name, position, level, constituency, county, party, photo_url')
            .or(`name.ilike.${searchPattern},position.ilike.${searchPattern}`)
            .range(offset, offset + limit - 1)
          return data || []
        })() : Promise.resolve([]),

        // Promises
        (type === 'all' || type === 'promises') ? (async () => {
          const { data } = await supabase
            .from('development_promises')
            .select('id, title, description, status, progress_percentage, official_id')
            .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .range(offset, offset + limit - 1)
          return data || []
        })() : Promise.resolve([]),

        // Projects
        (type === 'all' || type === 'projects') ? (async () => {
          const { data } = await supabase
            .from('government_projects')
            .select('id, title, description, status, progress_percentage, county, constituency')
            .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .range(offset, offset + limit - 1)
          return data || []
        })() : Promise.resolve([]),
      ])

      return { posts, comments, users, communities, officials, promises, projects }
    },
    enabled: params.query.length >= 2 // Only search if query is at least 2 characters
  })
}
