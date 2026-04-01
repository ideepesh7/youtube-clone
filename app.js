// ===== YOUTUBE DATA API v3 CONFIGURATION =====
const API_KEY = 'AIzaSyA8K0RzQ9Q_EwOWzp7cVJPzJBJh8KI8XqI'; // Replace with your own API key from Google Cloud Console
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// ===== DOM ELEMENTS =====
const videosGrid = document.getElementById('videosGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const chips = document.querySelectorAll('.chip');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');

// ===== STATE =====
let currentQuery = 'trending';
let videos = [];

// ===== HELPER FUNCTIONS =====
function formatViews(count) {
  if (count >= 1000000) return Math.floor(count / 1000000) + 'M views';
  if (count >= 1000) return Math.floor(count / 1000) + 'K views';
  return count + ' views';
}

function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '0M').replace('M', '');
  const seconds = (match[3] || '0S').replace('S', '');
  
  if (hours) return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' year' + (interval > 1 ? 's' : '') + ' ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' month' + (interval > 1 ? 's' : '') + ' ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' day' + (interval > 1 ? 's' : '') + ' ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago';
  return Math.floor(seconds) + ' second' + (seconds > 1 ? 's' : '') + ' ago';
}

function getChannelInitial(name) {
  return name ? name.charAt(0).toUpperCase() : 'Y';
}

function getRandomColor() {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ===== API FUNCTIONS =====
async function fetchVideos(query = 'trending', maxResults = 24) {
  try {
    // Show skeleton loaders
    showSkeletonLoaders();

    // First, search for videos
    const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=viewCount&regionCode=IN&key=${API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      videosGrid.innerHTML = '<div style="color: #aaa; text-align: center; padding: 40px;">No videos found</div>';
      return;
    }

    // Get video IDs
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Fetch video details (duration, views, etc.)
    const detailsUrl = `${BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Merge data
    videos = searchData.items.map((item, index) => {
      const details = detailsData.items[index] || {};
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelName: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        views: details.statistics?.viewCount || '0',
        duration: details.contentDetails?.duration || 'PT0M0S'
      };
    });

    renderVideos();
  } catch (error) {
    console.error('Error fetching videos:', error);
    videosGrid.innerHTML = '<div style="color: #ff5252; text-align: center; padding: 40px;">Error loading videos. Please check your API key.</div>';
  }
}

// ===== RENDER FUNCTIONS =====
function showSkeletonLoaders() {
  videosGrid.innerHTML = Array(12).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="sk-thumb"></div>
      <div class="sk-body">
        <div class="sk-avatar"></div>
        <div class="sk-lines">
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderVideos() {
  videosGrid.innerHTML = videos.map(video => {
    const color = getRandomColor();
    return `
      <div class="video-card" onclick="openVideo('${video.id}')">
        <div class="video-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
          <span class="video-duration">${formatDuration(video.duration)}</span>
        </div>
        <div class="video-info">
          <div class="channel-avatar" style="background: ${color};">
            ${getChannelInitial(video.channelName)}
          </div>
          <div class="video-details">
            <div class="video-title">${video.title}</div>
            <div class="video-meta">
              <div class="channel-name">${video.channelName}</div>
              <div class="video-stats">
                <span>${formatViews(parseInt(video.views))}</span>
                <span>•</span>
                <span>${timeAgo(video.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== VIDEO PLAYER =====
function openVideo(videoId) {
  // Store video ID in localStorage
  localStorage.setItem('currentVideoId', videoId);
  // Redirect to video page
  window.location.href = 'video.html';
}

// ===== EVENT HANDLERS =====
searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) {
    currentQuery = query;
    fetchVideos(query);
    // Remove active class from all chips
    chips.forEach(chip => chip.classList.remove('active'));
  }
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const query = chip.getAttribute('data-q');
    currentQuery = query;
    fetchVideos(query);
  });
});

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// ===== INITIALIZE =====
fetchVideos(currentQuery);
