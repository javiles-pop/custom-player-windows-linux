import Logger from 'js-logger';

export interface CacheableAsset {
  url: string;
  filename: string;
  type: 'video' | 'image' | 'other';
}

export class ContentCaching {
  
  static async cacheChannelAssets(channelUrl: string): Promise<void> {
    if (!window.DeviceAPI?.supportsLocalCache) {
      Logger.debug('[CACHE] Device does not support local caching');
      return;
    }

    try {
      Logger.info('[CACHE] Starting to cache channel assets');
      
      // Fetch the channel HTML to parse for assets
      const response = await fetch(channelUrl);
      const html = await response.text();
      
      // Extract video and image URLs from HTML
      const assets = this.extractAssetsFromHTML(html, channelUrl);
      
      // Cache each asset
      for (const asset of assets) {
        await this.cacheAsset(asset);
      }
      
      Logger.info(`[CACHE] Successfully cached ${assets.length} assets`);
    } catch (error) {
      Logger.error('[CACHE] Failed to cache channel assets:', error);
    }
  }

  private static extractAssetsFromHTML(html: string, baseUrl: string): CacheableAsset[] {
    const assets: CacheableAsset[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract video sources
    const videos = doc.querySelectorAll('video source, video[src]');
    videos.forEach(video => {
      const src = video.getAttribute('src');
      if (src) {
        assets.push({
          url: this.resolveUrl(src, baseUrl),
          filename: this.getFilenameFromUrl(src),
          type: 'video'
        });
      }
    });
    
    // Extract images
    const images = doc.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && this.isMediaFile(src)) {
        assets.push({
          url: this.resolveUrl(src, baseUrl),
          filename: this.getFilenameFromUrl(src),
          type: 'image'
        });
      }
    });
    
    return assets;
  }

  private static async cacheAsset(asset: CacheableAsset): Promise<void> {
    try {
      // Check if already cached
      if (await window.DeviceAPI.isCached(asset.filename)) {
        Logger.debug(`[CACHE] Asset already cached: ${asset.filename}`);
        return;
      }
      
      // Download and cache
      await window.DeviceAPI.downloadAndCacheContent(asset.url, asset.filename);
      Logger.debug(`[CACHE] Cached asset: ${asset.filename}`);
    } catch (error) {
      Logger.error(`[CACHE] Failed to cache asset ${asset.filename}:`, error);
    }
  }

  private static resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return new URL(url, baseUrl).toString();
  }

  private static getFilenameFromUrl(url: string): string {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'unknown_file';
  }

  private static isMediaFile(url: string): boolean {
    const mediaExtensions = ['.mp4', '.webm', '.ogg', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return mediaExtensions.some(ext => url.toLowerCase().includes(ext));
  }
}