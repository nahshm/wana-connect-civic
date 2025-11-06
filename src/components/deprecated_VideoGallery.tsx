import React from 'react';
import VideoPlayer from './VideoPlayer';

interface Video {
  id: string;
  title: string;
  url: string;
}

interface VideoGalleryProps {
  videos: Video[];
}

const VideoGallery: React.FC<VideoGalleryProps> = ({ videos }) => {
  return (
    <div className="video-gallery grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="video-item">
          <h3 className="text-lg font-semibold">{video.title}</h3>
          <VideoPlayer src={video.url} />
        </div>
      ))}
    </div>
  );
};

export default VideoGallery;
