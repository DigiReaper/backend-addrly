import axios from 'axios';
import * as cheerio from 'cheerio';
import { TwitterApi } from 'twitter-api-v2';

class ContentExtractor {
  constructor() {
    // Initialize Twitter client
    if (process.env.TWITTER_BEARER_TOKEN) {
      this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    }
  }

  /**
   * Extract content from a personal website/blog
   */
  async extractFromWebsite(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DateMeDocBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style tags
      $('script, style, nav, footer, header').remove();

      // Extract text content
      const title = $('title').text();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      // Extract main content (try common content selectors)
      let mainContent = '';
      const contentSelectors = [
        'article',
        'main',
        '.post-content',
        '.entry-content',
        '.content',
        '#content',
        '.blog-post'
      ];

      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > mainContent.length) {
          mainContent = content;
        }
      }

      // If no main content found, get body text
      if (!mainContent) {
        mainContent = $('body').text();
      }

      // Clean up whitespace
      mainContent = mainContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, parseInt(process.env.MAX_CONTENT_LENGTH || 50000));

      // Extract blog posts if it's a blog
      const blogPosts = [];
      $('article, .post, .blog-post').each((i, elem) => {
        if (i < 10) { // Limit to 10 posts
          const postTitle = $(elem).find('h1, h2, .post-title, .entry-title').first().text().trim();
          const postContent = $(elem).text().replace(/\s+/g, ' ').trim().substring(0, 2000);
          if (postTitle && postContent) {
            blogPosts.push({ title: postTitle, content: postContent });
          }
        }
      });

      return {
        success: true,
        data: {
          url,
          title,
          metaDescription,
          mainContent,
          blogPosts,
          contentLength: mainContent.length,
          extractedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Website extraction error:', error.message);
      return {
        success: false,
        error: error.message,
        url
      };
    }
  }

  /**
   * Extract content from Twitter profile
   */
  async extractFromTwitter(handle) {
    try {
      if (!this.twitterClient) {
        throw new Error('Twitter API not configured');
      }

      // Remove @ if present
      handle = handle.replace('@', '');

      // Get user info
      const user = await this.twitterClient.v2.userByUsername(handle, {
        'user.fields': ['description', 'created_at', 'public_metrics', 'verified']
      });

      if (!user.data) {
        throw new Error('Twitter user not found');
      }

      // Get recent tweets
      const tweets = await this.twitterClient.v2.userTimeline(user.data.id, {
        max_results: 100,
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
        exclude: ['retweets']
      });

      const tweetTexts = tweets.data?.data?.map(t => t.text) || [];

      return {
        success: true,
        data: {
          handle,
          userId: user.data.id,
          name: user.data.name,
          username: user.data.username,
          bio: user.data.description,
          verified: user.data.verified,
          metrics: user.data.public_metrics,
          tweets: tweetTexts,
          tweetCount: tweetTexts.length,
          extractedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Twitter extraction error:', error.message);
      return {
        success: false,
        error: error.message,
        handle
      };
    }
  }

  /**
   * Extract content based on URL type
   */
  async extractFromUrl(url, type = 'website') {
    try {
      // Detect type from URL if not provided
      if (url.includes('twitter.com') || url.includes('x.com')) {
        const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
        if (match) {
          return await this.extractFromTwitter(match[1]);
        }
      }

      // For Instagram, we can't easily extract without API access
      if (url.includes('instagram.com')) {
        return {
          success: false,
          error: 'Instagram extraction requires user to provide API access or manual data',
          url,
          type: 'instagram'
        };
      }

      // For LinkedIn
      if (url.includes('linkedin.com')) {
        return {
          success: false,
          error: 'LinkedIn extraction requires user to provide manual data or API access',
          url,
          type: 'linkedin'
        };
      }

      // Default to website extraction
      return await this.extractFromWebsite(url);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url
      };
    }
  }

  /**
   * Extract content from multiple links
   */
  async extractFromMultipleLinks(links) {
    const results = [];

    for (const link of links) {
      const result = await this.extractFromUrl(link.url, link.type);
      results.push({
        ...link,
        extraction: result
      });
    }

    return results;
  }

  /**
   * Aggregate all extracted content into a single text corpus
   */
  aggregateContent(extractionResults) {
    let corpus = '';
    const metadata = {
      sources: [],
      totalLength: 0,
      successfulExtractions: 0,
      failedExtractions: 0
    };

    for (const result of extractionResults) {
      if (result.extraction?.success) {
        metadata.successfulExtractions++;
        metadata.sources.push({
          type: result.type,
          url: result.url,
          success: true
        });

        const data = result.extraction.data;
        
        // Add content based on type
        if (data.mainContent) {
          corpus += `\n\n--- Content from ${result.url} ---\n`;
          corpus += data.mainContent;
        }

        if (data.tweets && data.tweets.length > 0) {
          corpus += `\n\n--- Tweets from @${data.handle} ---\n`;
          corpus += data.tweets.join('\n\n');
        }

        if (data.bio) {
          corpus += `\n\n--- Bio: ${data.bio}\n`;
        }

        if (data.blogPosts && data.blogPosts.length > 0) {
          corpus += `\n\n--- Blog Posts ---\n`;
          data.blogPosts.forEach(post => {
            corpus += `\n${post.title}\n${post.content}\n`;
          });
        }
      } else {
        metadata.failedExtractions++;
        metadata.sources.push({
          type: result.type,
          url: result.url,
          success: false,
          error: result.extraction?.error
        });
      }
    }

    metadata.totalLength = corpus.length;

    return {
      corpus: corpus.trim(),
      metadata
    };
  }
}

export default new ContentExtractor();
