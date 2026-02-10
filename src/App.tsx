import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

type BypassMethod = 'proxy-only' | 'double-encode' | 'base64' | 'hex' | 'parameter-mask';

type Link = {
  id: string;
  name: string;
  url: string; // Final proxied URL
  category: string;
  originalUrl?: string;
  bypassMethod?: BypassMethod; // Store method used
};

type Category = {
  id: string;
  name: string;
  icon: string;
};

const CATEGORIES: Category[] = [
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'apps', name: 'Apps', icon: '📱' },
  { id: 'ai', name: 'AI', icon: '🤖' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'tools', name: 'Tools', icon: '🛠️' },
  { id: 'other', name: 'Other', icon: '📦' },
];

// Proxy services that rotate for each link
// CORS proxies - good for API requests and simple content
// Web proxies - good for full page rendering
// Note: Some proxies may stop working over time - update as needed
const PROXY_SERVICES = [
  'https://api.allorigins.win/raw?url=', // CORS proxy - reliable
  'https://corsproxy.io/?', // CORS proxy - fast
  'https://api.codetabs.com/v1/proxy?quest=', // CORS proxy
  'https://cors-anywhere.herokuapp.com/', // CORS proxy (may require activation)
  'https://thingproxy.freeboard.io/fetch/', // CORS proxy
  'https://yacdn.org/proxy/', // Web proxy
  'https://corsproxy.io/?', // Alternative CORS endpoint
  'https://api.codetabs.com/v1/proxy?quest=', // Alternative format
  'https://cors-anywhere.herokuapp.com/corsdemo/', // Demo endpoint
  'https://proxy.cors.sh/?', // CORS proxy service
  'https://api.allorigins.win/get?url=', // Alternative AllOrigins format
  'https://corsproxy.io/?', // Duplicate for rotation
  'https://api.codetabs.com/v1/proxy?quest=', // Duplicate for rotation
];

// Bypass methods for URL obfuscation
const BYPASS_METHODS: BypassMethod[] = [
  'proxy-only',
  'double-encode',
  'base64',
  'hex',
  'parameter-mask',
];

const DEFAULT_LINKS: Link[] = [
  // Games
  { id: '0', name: 'Snow Rider 3D', url: '/snowrider', category: 'games', originalUrl: '/snowrider' },
  { id: '1', name: 'Cool Math Games', url: 'https://www.coolmathgames.com', category: 'games' },
  { id: '2', name: 'Hooda Math', url: 'https://www.hoodamath.com', category: 'games' },
  { id: '3', name: 'Krunker', url: 'https://krunker.io', category: 'games' },
  { id: '4', name: 'Shell Shockers', url: 'https://shellshockers.io', category: 'games' },
  { id: '5', name: '2048', url: 'https://play2048.co', category: 'games' },
  
  // Apps
  { id: '6', name: 'Google Docs', url: 'https://docs.google.com', category: 'apps' },
  { id: '7', name: 'Google Sheets', url: 'https://sheets.google.com', category: 'apps' },
  { id: '8', name: 'Canva', url: 'https://www.canva.com', category: 'apps' },
  
  // AI
  { id: '9', name: 'ChatGPT', url: 'https://chat.openai.com', category: 'ai' },
  { id: '10', name: 'Character.AI', url: 'https://character.ai', category: 'ai' },
  { id: '11', name: 'Perplexity', url: 'https://www.perplexity.ai', category: 'ai' },
  
  // Music
  { id: '12', name: 'Spotify Web', url: 'https://open.spotify.com', category: 'music' },
  { id: '13', name: 'SoundCloud', url: 'https://soundcloud.com', category: 'music' },
  { id: '14', name: 'YouTube Music', url: 'https://music.youtube.com', category: 'music' },
  
  // Tools
  { id: '15', name: 'Photopea', url: 'https://www.photopea.com', category: 'tools' },
  { id: '16', name: 'Remove.bg', url: 'https://www.remove.bg', category: 'tools' },
];

function App() {
  const navigate = useNavigate();
  const [links, setLinks] = useState<Link[]>(() => {
    const saved = localStorage.getItem('customLinks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_LINKS, ...parsed];
      } catch {
        return DEFAULT_LINKS;
      }
    }
    return DEFAULT_LINKS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState('other');
  const [proxyCounter, setProxyCounter] = useState(() => {
    // Load counter from localStorage or start at 0
    const saved = localStorage.getItem('proxyCounter');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [methodCounter, setMethodCounter] = useState(() => {
    // Load method counter from localStorage or start at 0
    const saved = localStorage.getItem('methodCounter');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    const customLinks = links.filter((link) => !DEFAULT_LINKS.find((d) => d.id === link.id));
    localStorage.setItem('customLinks', JSON.stringify(customLinks));
  }, [links]);

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return links;
    const query = searchQuery.toLowerCase();
    return links.filter(
      (link) =>
        link.name.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query) ||
        link.category.toLowerCase().includes(query)
    );
  }, [links, searchQuery]);

  const linksByCategory = useMemo(() => {
    const grouped: Record<string, Link[]> = {};
    CATEGORIES.forEach((cat) => {
      grouped[cat.id] = filteredLinks.filter((link) => link.category === cat.id);
    });
    return grouped;
  }, [filteredLinks]);

  // Apply bypass method obfuscation to URL
  // Note: All methods must produce valid URLs that proxies can fetch
  const applyBypassMethod = (url: string, method: BypassMethod): string => {
    switch (method) {
      case 'proxy-only':
        // No obfuscation, just pass through
        return url;
      
      case 'double-encode':
        // Encode the URL twice for obfuscation
        return encodeURIComponent(encodeURIComponent(url));
      
      case 'base64':
        // Convert URL to base64 and create a data URL format
        // Since proxies need valid URLs, we'll use double encoding instead for base64-like obfuscation
        // This maintains URL validity while providing obfuscation
        try {
          const base64 = btoa(unescape(encodeURIComponent(url)));
          // Use the base64 as a parameter value in the URL to maintain validity
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}_b64=${base64}`;
        } catch {
          return url;
        }
      
      case 'hex':
        // Add hex-encoded version as parameter to maintain URL validity
        const hex = url
          .split('')
          .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('');
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_h=${hex.substring(0, 50)}`; // Limit length to keep URL valid
      
      case 'parameter-mask':
        // Add random parameters to confuse filters
        const randomParam = Math.random().toString(36).substring(7);
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}_=${randomParam}&__=${Date.now()}`;
      
      default:
        return url;
    }
  };

  // Generate bypass URL using proxy service and obfuscation method
  const generateBypassUrl = (
    originalUrl: string,
    proxyIndex: number,
    methodIndex: number
  ): { url: string; method: BypassMethod } => {
    const proxy = PROXY_SERVICES[proxyIndex % PROXY_SERVICES.length];
    const method = BYPASS_METHODS[methodIndex % BYPASS_METHODS.length];
    
    // Apply obfuscation method (result is still a valid URL)
    const obfuscatedUrl = applyBypassMethod(originalUrl, method);
    
    // Wrap in proxy service - all proxies use URL encoding
    // Different proxies have different base URLs but all accept encoded URLs
    const finalUrl = proxy + encodeURIComponent(obfuscatedUrl);
    
    return { url: finalUrl, method };
  };

  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;

    let originalUrl = newLinkUrl.trim();
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      originalUrl = 'https://' + originalUrl;
    }

    const linkId = Date.now().toString();
    
    // Generate bypass URL using both proxy and method rotation
    const { url: bypassUrl, method } = generateBypassUrl(
      originalUrl,
      proxyCounter,
      methodCounter
    );

    const newLink: Link = {
      id: linkId,
      name: newLinkName.trim(),
      url: bypassUrl,
      originalUrl: originalUrl, // Store original for display
      category: newLinkCategory,
      bypassMethod: method, // Store method used
    };

    // Increment both counters for next link (rotates through proxies and methods)
    const nextProxyCounter = (proxyCounter + 1) % PROXY_SERVICES.length;
    const nextMethodCounter = (methodCounter + 1) % BYPASS_METHODS.length;
    
    setProxyCounter(nextProxyCounter);
    setMethodCounter(nextMethodCounter);
    localStorage.setItem('proxyCounter', nextProxyCounter.toString());
    localStorage.setItem('methodCounter', nextMethodCounter.toString());

    setLinks((prev) => [...prev, newLink]);
    setNewLinkName('');
    setNewLinkUrl('');
    setNewLinkCategory('other');
    setShowAddModal(false);
  };

  const handleDeleteLink = (id: string) => {
    if (DEFAULT_LINKS.find((l) => l.id === id)) return; // Don't delete default links
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleLinkClick = (link: Link) => {
    // Internal app routes: navigate in same tab
    if (link.url.startsWith('/')) {
      navigate(link.url);
      return;
    }
    // External links: open in new tab with proxy URL
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🎯 Quick Links</h1>
          <p>Find apps, games, and more</p>
        </div>
      </header>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for games, apps, tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <main className="main-content">
        {CATEGORIES.map((category) => {
          const categoryLinks = linksByCategory[category.id];
          if (categoryLinks.length === 0 && !searchQuery) return null;

          return (
            <section key={category.id} className="category-section">
              <h2 className="category-title">
                <span className="category-icon">{category.icon}</span>
                {category.name}
                <span className="link-count">({categoryLinks.length})</span>
              </h2>
              <div className="links-grid">
                {categoryLinks.map((link) => {
                  // Display the original URL's hostname, or the proxy URL's hostname if no original
                  const displayUrl = link.originalUrl || link.url;
                  let linkLabel: string;
                  try {
                    const urlObj = new URL(displayUrl, window.location.origin);
                    linkLabel = urlObj.hostname === window.location.hostname ? 'Play here' : urlObj.hostname;
                  } catch {
                    linkLabel = 'Play here';
                  }
                  return (
                      <div key={link.id} className="link-card">
                        <button
                          className="link-button"
                          onClick={() => handleLinkClick(link)}
                          title={displayUrl}
                        >
                          <div className="link-name">{link.name}</div>
                          <div className="link-url">{linkLabel}</div>
                        </button>
                        {!DEFAULT_LINKS.find((l) => l.id === link.id) && (
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteLink(link.id)}
                            title="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                })}
                {categoryLinks.length === 0 && searchQuery && (
                  <div className="no-results">No results found</div>
                )}
              </div>
            </section>
          );
        })}

        {searchQuery && filteredLinks.length === 0 && (
          <div className="no-results-global">No links found matching "{searchQuery}"</div>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Link</h2>
            <div className="modal-form">
              <label>
                Name
                <input
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="e.g., My Favorite Game"
                  autoFocus
                />
              </label>
              <label>
                URL
                <input
                  type="text"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="e.g., example.com or https://example.com"
                />
              </label>
              <label>
                Category
                <select
                  value={newLinkCategory}
                  onChange={(e) => setNewLinkCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleAddLink}>
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;