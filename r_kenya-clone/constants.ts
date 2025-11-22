import { Post, SidebarRule, Flair } from './types';

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    subreddit: 'r/Kenya',
    author: 'u/koolaidc205',
    title: 'Wameenda kutuuza',
    image: 'https://pbs.twimg.com/media/GH8qXQBWQAABw9_.jpg', // Placeholder for the political meeting
    upvotes: 6,
    comments: 0,
    timeAgo: '2 min. ago',
    flair: { text: 'Discussion', color: '#0079D3', textColor: 'white' }
  },
  {
    id: '2',
    subreddit: 'u/Anuttacon',
    author: 'Promoted',
    title: 'Work from home, flexible hours, paid weekly! Help build smarter AI dialogue and expressions.',
    image: 'https://picsum.photos/seed/aiad/600/400',
    upvotes: 0,
    comments: 0,
    timeAgo: 'Promoted',
    isSponsored: true
  },
  {
    id: '3',
    subreddit: 'r/Kenya',
    author: 'u/Imaginary-Pace667',
    title: 'Need help with my small sister',
    content: 'M 24...So my siz is 17 na she already has a 6 month old kid. Na ofc it was a shock to all of us...but we love the toddler so much. Sasa after she gave birth we all thought she would change her ways but we were wrong. We have tried talking to her ata amechapwa but aki waah...sai naona ameplan kupatana na boiz fulani machi raw(her ig is in my phone na alikuwa anatumia but alisahau kutoa).....I swear I am tired nashangaa sa nifanye nini like she has a child na bado anapanga kupatana na mwanaume na atawacha mtoi home. Na pia naambiwa that she goes out for more than 3 hours anaacha mtoi akilia. She is suppose to return to form 3 in January.....I swear I don\'t...',
    upvotes: 124,
    comments: 111,
    timeAgo: '5 hr. ago',
    flair: { text: 'Discussion', color: '#0079D3', textColor: 'white' }
  },
  {
    id: '4',
    subreddit: 'r/Kenya',
    author: 'u/patedarkpate',
    title: 'Being Born in Kenya Sucks Man',
    content: 'The Butcher @inglorious_bat - 4h\nNo. We want nganyas! They are our culture and a source of tourism. You are an enemy of development and youth employment. Just say you hate young people /s',
    image: 'https://picsum.photos/seed/train/600/300',
    upvotes: 256,
    comments: 89,
    timeAgo: '7 days ago',
    flair: { text: 'Rant', color: '#FF4500', textColor: 'white' }
  }
];

export const SUBREDDIT_RULES: SidebarRule[] = [
  { id: 1, title: 'Be Respectful' },
  { id: 2, title: 'Stay Relevant' },
  { id: 3, title: 'No Spam or Self-promotion' },
  { id: 4, title: 'Keep It Legal' },
  { id: 5, title: 'Respect Privacy and Safety' },
  { id: 6, title: 'Quality Content Matters' },
  { id: 7, title: 'Use tags and Flairs' },
  { id: 8, title: 'Fight Misinformation' },
  { id: 9, title: 'Engage Responsibly' },
  { id: 10, title: 'State The Price/Salary' },
  { id: 11, title: 'No scams or fraud schemes' },
  { id: 12, title: 'No Solicitation, begging or fundraising' }
];

export const FLAIRS: Flair[] = [
  { id: '1', text: 'History', bg: '#FF4500' },
  { id: '2', text: 'Ask r/Kenya', bg: '#FF8717' },
  { id: '3', text: 'Discussion', bg: '#0079D3' },
  { id: '4', text: 'Rant', bg: '#00B050' },
  { id: '5', text: 'Business', bg: '#FFD635' }, // Using closest visual match
  { id: '6', text: 'News', bg: '#CC3600' },
  { id: '7', text: 'Politics', bg: '#0079D3' },
  { id: '8', text: 'Music', bg: '#014980' },
  { id: '9', text: 'Meme', bg: '#00B050' },
  { id: '10', text: 'Culture', bg: '#00A6A5' },
  { id: '11', text: 'Sports', bg: '#0079D3' },
  { id: '12', text: 'Education/Scholarships', bg: '#00B050' },
];

export const RELATED_SUBS = [
  { name: 'r/nairobi', members: '98,934 members', icon: 'bg-orange-500' },
  { name: 'r/KenyanLadies', members: '7,555 members', icon: 'bg-purple-500' },
  { name: 'r/KenyaPics', members: '21,622 members', icon: 'bg-blue-500' },
  { name: 'r/nairobitechies', members: '17,272 members', icon: 'bg-red-500' },
  { name: 'r/Nakuru', members: '2,050 members', icon: 'bg-green-500' },
  { name: 'r/Mombasa', members: '2,136 members', icon: 'bg-blue-300' },
];
