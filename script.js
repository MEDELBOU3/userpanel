 const Youtube_apiKey = 'AIzaSyDULbpO4E6_GML55UQVVjIEkR3oicW3820';
        let currentPlaylist = [];
        let currentTrackIndex = -1;
        let isPlaying = false;
        let player;

        // Initialize YouTube API
        function loadYouTubeAPI() {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        function onYouTubeIframeAPIReady() {
            player = new YT.Player('videoPlayer', {
                height: '100%',
                width: '100%',
                playerVars: {
                    'controls': 0,
                    'playsinline': 1,
                    'enablejsapi': 1,
                    'rel': 0
                },
                events: {
                    'onStateChange': onPlayerStateChange,
                    'onReady': onPlayerReady
                }
            });
        }

        function onPlayerReady(event) {
            const volumeSlider = document.getElementById('volumeSlider');
            volumeSlider.addEventListener('input', function() {
                player.setVolume(this.value);
            });
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', debounce(searchMusic, 500));

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        async function searchMusic() {
            const query = document.getElementById('searchInput').value;
            if (!query) return;

            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoCategoryId=10&key=${Youtube_apiKey}&maxResults=10`);
                const data = await response.json();
                displaySearchResult(data.items);
            } catch (error) {
                console.error('Error searching music:', error);
            }
        }

        function displaySearchResult(items) {
            const musicList = document.getElementById('musicList');
            musicList.innerHTML = '';
            currentPlaylist = items;

            items.forEach((item, index) => {
                const musicItem = document.createElement('div');
                musicItem.className = 'music-item';
                musicItem.onclick = () => playTracks(index);

                musicItem.innerHTML = `
                    <img class="music-thumbnail" src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
                    <div class="music-info">
                        <p class="music-title">${item.snippet.title}</p>
                        <p class="music-artist">${item.snippet.channelTitle}</p>
                    </div>
                `;

                musicList.appendChild(musicItem);
            });
        }

        function playTracks(indexOrId) {
            let videoId;
            
            if (typeof indexOrId === 'string') {
                // Direct video ID
                videoId = indexOrId;
                // Add to queue if not already present
                if (!queue.find(track => track.id === videoId)) {
                    queue.push({
                        id: videoId,
                        title: currentPlaylist[currentTrackIndex]?.snippet.title || 'Unknown',
                        thumbnail: currentPlaylist[currentTrackIndex]?.snippet.thumbnails.default.url || '',
                        channel: currentPlaylist[currentTrackIndex]?.snippet.channelTitle || 'Unknown'
                    });
                }
                currentTrackIndex = queue.findIndex(track => track.id === videoId);
            } else {
                // Index in current playlist
                currentTrackIndex = indexOrId;
                const track = currentPlaylist[currentTrackIndex];
                videoId = track.id.videoId;
                
                // Add to queue if not already present
                if (!queue.find(t => t.id === videoId)) {
                    queue.push({
                        id: videoId,
                        title: track.snippet.title,
                        thumbnail: track.snippet.thumbnails.default.url,
                        channel: track.snippet.channelTitle
                    });
                }
            }
        
            if (player) {
                player.loadVideoById(videoId);
                isPlaying = true;
                updatePlayPauseButton();
                updateQueueDisplay();
            }
        }

        function togglePlay() {
            if (player) {
                if (isPlaying) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
                isPlaying = !isPlaying;
                updatePlayPauseButton();
            }
        }

        function updatePlayPauseButton() {
            const btn = document.getElementById('playPauseBtn');
            btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }

        function previousTrack() {
            if (currentTrackIndex > 0) {
                playTracks(currentTrackIndex - 1);
            }
        }

        function nextTrack() {
            if (currentTrackIndex < currentPlaylist.length - 1) {
                playTracks(currentTrackIndex + 1);
            }
        }

        function onPlayerStateChange(event) {
            if (event.data === YT.PlayerState.ENDED) {
                nextTrack();
            }
            isPlaying = event.data === YT.PlayerState.PLAYING;
            updatePlayPauseButton();
        }

        function toggleExpand() {
            const container = document.getElementById('videoPlayerContainer');
            const icon = document.getElementById('expandIcon');
            container.classList.toggle('expanded');
            icon.classList.toggle('fa-expand');
            icon.classList.toggle('fa-compress');
        }

        // Progress bar functionality
        document.getElementById('progressBar').addEventListener('click', function(e) {
            const progressBar = this;
            const percent = (e.offsetX / progressBar.offsetWidth);
            if (player && player.getDuration) {
                const duration = player.getDuration();
                player.seekTo(duration * percent);
            }
        });

        setInterval(() => {
            if (player && player.getCurrentTime) {
                const currentTime = player.getCurrentTime();
                const duration = player.getDuration();
                const progress = (currentTime / duration) * 100;
                document.getElementById('progress').style.width = `${progress}%`;
                
                document.getElementById('currentTime').textContent = formatTime(currentTime);
                document.getElementById('duration').textContent = formatTime(duration);
            }
        }, 1000);

        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Panel resize functionality
        const resizer = document.getElementById('resizer');
        const panel = document.getElementById('userPanel');

        resizer.addEventListener('mousedown', initResize, false);

        function initResize(e) {
            window.addEventListener('mousemove', Resize, false);
            window.addEventListener('mouseup', stopResize, false);
        }

        function Resize(e) {
            panel.style.width = (window.innerWidth - e.clientX) + 'px';
        }

        function stopResize(e) {
            window.removeEventListener('mousemove', Resize, false);
            window.removeEventListener('mouseup', stopResize, false);
        }

        function closeUserPanel() {
            panel.style.transform = 'translateX(100%)';
        }

        // Initialize
        loadYouTubeAPI();

         // New features and functionality
         let currentTab = 'home';
         let queue = [];
         let categories = [];
         let userPlaylists = [];
         let currentCategory = '';
 
         // Initialize tabs
         document.querySelectorAll('.tab-btn').forEach(btn => {
             btn.addEventListener('click', () => {
                 document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                 btn.classList.add('active');
                 currentTab = btn.dataset.tab;
                 loadTabContent(currentTab);
             });
         });
 
         async function loadTabContent(tab) {
             showLoading(true);
             const container = document.getElementById('contentContainer');
             container.innerHTML = '';
 
             switch(tab) {
                 case 'home':
                     await loadHomeContent();
                     break;
                 case 'trending':
                     await loadTrendingContent();
                     break;
                 case 'playlists':
                     await loadPlaylistsContent();
                     break;
                 case 'library':
                     await loadLibraryContent();
                     break;
             }
             showLoading(false);
         }
 
         async function loadCategories() {
             try {
                 const response = await fetch(
                     `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US&key=${Youtube_apiKey}`
                 );
                 const data = await response.json();
                 categories = data.items;
                 displayCategorie();
             } catch (error) {
                 console.error('Error loading categories:', error);
             }
         }
 
         function displayCategorie() {
             const container = document.getElementById('categoryChips');
             container.innerHTML = '<button class="category-chip active" data-id="">All</button>';
             
             categories.forEach(category => {
                 if (category.snippet.assignable) {
                     const chip = document.createElement('button');
                     chip.className = 'category-chip';
                     chip.dataset.id = category.id;
                     chip.textContent = category.snippet.title;
                     chip.onclick = () => filterByCategory(category.id);
                     container.appendChild(chip);
                 }
             });
         }
 
         async function loadHomeContent() {
            try {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&maxResults=20&key=${Youtube_apiKey}`
                );
                const data = await response.json();
                currentPlaylist = data.items;
                
                const container = document.getElementById('contentContainer');
                container.innerHTML = `
                    <h2 class="section-title">Recommended for you</h2>
                    <div class="music-grid">
                        ${data.items.map((item, index) => `
                            <div class="music-card" onclick="playTracks('${item.id}')">
                                <img src="${item.snippet.thumbnails.high.url}" alt="${item.snippet.title}">
                                <div class="music-card-info">
                                    <p class="music-card-title">${item.snippet.title}</p>
                                    <p class="music-card-artist">${item.snippet.channelTitle}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (error) {
                console.error('Error loading home content:', error);
            }
        }


        async function filterByCategory(categoryId) {
            currentCategory = categoryId;
            showLoading(true);
            
            try {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&videoCategoryId=${categoryId}&chart=mostPopular&maxResults=20&key=${Youtube_apiKey}`
                );
                const data = await response.json();
                currentPlaylist = data.items;
                
                const container = document.getElementById('contentContainer');
                container.innerHTML = `
                    <div class="music-grid">
                        ${data.items.map((item, index) => createMusicCard(item)).join('')}
                    </div>
                `;
                
                // Update category chips
                document.querySelectorAll('.category-chip').forEach(chip => {
                    chip.classList.toggle('active', chip.dataset.id === categoryId);
                });
            } catch (error) {
                console.error('Error filtering by category:', error);
            } finally {
                showLoading(false);
            }
        }
 
        async function loadTrendingContent() {
            try {
                const response = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&maxResults=50&key=${Youtube_apiKey}`
                );
                const data = await response.json();
                currentPlaylist = data.items;
                
                const container = document.getElementById('contentContainer');
                container.innerHTML = `
                    <h2 class="section-title">Trending Music</h2>
                    <div class="music-list">
                        ${data.items.map((item, index) => `
                            <div class="music-item" onclick="playTracks('${item.id}')">
                                <div class="trending-number">${index + 1}</div>
                                <img class="music-thumbnail" src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
                                <div class="music-info">
                                    <p class="music-title">${item.snippet.title}</p>
                                    <p class="music-artist">${item.snippet.channelTitle}</p>
                                    <p class="music-stats">
                                        <i class="fas fa-play"></i> ${formatNumber(item.statistics.viewCount)}
                                        <i class="fas fa-thumbs-up"></i> ${formatNumber(item.statistics.likeCount)}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (error) {
                console.error('Error loading trending content:', error);
            }
        }
 
         async function loadPlaylistsContent() {
             try {
                 // In a real application, you would use OAuth2 to get user's playlists
                 // For demo purposes, we'll fetch some public playlists
                 const response = await fetch(
                     `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=UC-9-kyTW8ZkZNDHQJ6FgpwQ&maxResults=20&key=${Youtube_apiKey}`
                 );
                 const data = await response.json();
                 userPlaylists = data.items;
                 
                 const container = document.getElementById('contentContainer');
                 container.innerHTML = `
                     <h2 class="section-title">Your Playlists</h2>
                     <div class="music-grid">
                         ${userPlaylists.map(playlist => createPlaylistCard(playlist)).join('')}
                     </div>
                 `;
             } catch (error) {
                 console.error('Error loading playlists:', error);
             }
         }
 
         function createMusicCard(item) {
             return `
                 <div class="music-card" onclick="playTracks('${item.id}')">
                     <img src="${item.snippet.thumbnails.high.url}" alt="${item.snippet.title}">
                     <div class="music-card-info">
                         <p class="music-card-title">${item.snippet.title}</p>
                         <p class="music-card-artist">${item.snippet.channelTitle}</p>
                     </div>
                 </div>
             `;
         }
 
         function createPlaylistCard(playlist) {
             return `
                 <div class="music-card" onclick="openPlaylist('${playlist.id}')">
                     <img src="${playlist.snippet.thumbnails.high.url}" alt="${playlist.snippet.title}">
                     <div class="music-card-info">
                         <p class="music-card-title">${playlist.snippet.title}</p>
                         <p class="music-card-artist">${playlist.contentDetails.itemCount} songs</p>
                     </div>
                 </div>
             `;
         }
 
         function createTrendingItem(item, index) {
             return `
                 <div class="music-item" onclick="playTracks('${item.id}')">
                     <div class="trending-number">${index + 1}</div>
                     <img class="music-thumbnail" src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
                     <div class="music-info">
                         <p class="music-title">${item.snippet.title}</p>
                         <p class="music-artist">${item.snippet.channelTitle}</p>
                         <p class="music-stats">
                             <i class="fas fa-play"></i> ${formatNumber(item.statistics.viewCount)}
                             <i class="fas fa-thumbs-up"></i> ${formatNumber(item.statistics.likeCount)}
                         </p>
                     </div>
                 </div>
             `;
         }
 
         async function openPlaylist(playlistId) {
             try {
                 const response = await fetch(
                     `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${Youtube_apiKey}`
                 );
                 const data = await response.json();
                 
                 // Add all playlist items to queue
                 queue = data.items.map(item => ({
                     id: item.snippet.resourceId.videoId,
                     title: item.snippet.title,
                     thumbnail: item.snippet.thumbnails.default.url,
                     channel: item.snippet.channelTitle
                 }));
                 
                 updateQueueDisplay();
                 playTracks(queue[0].id);
                 showQueue();
             } catch (error) {
                 console.error('Error opening playlist:', error);
             }
         }
 
         function formatNumber(num) {
             if (num >= 1000000) {
                 return (num/1000000).toFixed(1) + 'M';
             }
             if (num >= 1000) {
                 return (num/1000).toFixed(1) + 'K';
             }
             return num;
         }
 
         function showLoading(show) {
             document.getElementById('loadingSpinner').classList.toggle('show', show);
         }
 
         function toggleQueue() {
             document.getElementById('queueContainer').classList.toggle('show');
         }
 
         function updateQueueDisplay() {
             const queueList = document.getElementById('queueList');
             queueList.innerHTML = queue.map((track, index) => `
                 <div style="margin: 10px auto;" class="music-item ${index === currentTrackIndex ? 'active' : ''}" 
                      onclick="playTracks('${track.id}')">
                     <img class="music-thumbnail" src="${track.thumbnail}" alt="${track.title}">
                     <div class="music-info">
                         <p class="music-title">${track.title}</p>
                         <p class="music-artist">${track.channel}</p>
                     </div>
                 </div>
             `).join('');
         }
 
         // Initialize features
         loadCategories();
         loadTabContent('home');
