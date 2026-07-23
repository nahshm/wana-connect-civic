import { useCommunityData } from '@/hooks/useCommunityData';
import { ExploreCommunities } from '@/components/community/ExploreCommunities';
import { PageMeta } from '@/components/seo/PageMeta';

const Communities = () => {
  const { communities, toggleCommunityFollow } = useCommunityData();

  return (
    <>
      <PageMeta
        title="Communities"
        description="Discover geographic and interest-based civic communities. Join conversations shaping local governance, projects, and accountability across Kenya."
        path="/communities"
      />
      <div className="container mx-auto px-4 py-6">
        <ExploreCommunities
          communities={communities}
          onToggleFollow={toggleCommunityFollow}
        />
      </div>
    </>
  );
};

export default Communities;
