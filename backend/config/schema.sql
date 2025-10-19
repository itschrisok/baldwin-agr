-- Baldwin County News Hub Database Schema
-- PostgreSQL Database Setup

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS article_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS scrape_logs CASCADE;

-- Sources Table
-- Stores information about news sources being scraped
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'news', 'social', 'media'
  scraper_type VARCHAR(50) NOT NULL, -- 'rss', 'cheerio', 'puppeteer', 'api'
  enabled BOOLEAN DEFAULT true,
  last_scraped TIMESTAMP,
  last_successful_scrape TIMESTAMP,
  scrape_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Articles Table
-- Stores all scraped news articles and posts
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT,
  url VARCHAR(1000) UNIQUE NOT NULL,
  author VARCHAR(200),
  category VARCHAR(50), -- 'local', 'politics', 'sports', 'weather', etc.
  content_type VARCHAR(20) NOT NULL, -- 'news', 'social', 'media'
  platform VARCHAR(50), -- For social media: 'twitter', 'instagram', 'tiktok'
  image_url VARCHAR(1000),
  published_at TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags Table
-- Stores hashtags and topic tags
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) DEFAULT 'general', -- 'hashtag', 'category', 'general'
  count INTEGER DEFAULT 0, -- Number of times used
  created_at TIMESTAMP DEFAULT NOW()
);

-- Article_Tags Junction Table
-- Many-to-many relationship between articles and tags
CREATE TABLE article_tags (
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Scrape Logs Table
-- Tracks scraping operations for monitoring and debugging
CREATE TABLE scrape_logs (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_updated INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_articles_source ON articles(source_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_content_type ON articles(content_type);
CREATE INDEX idx_articles_created ON articles(created_at DESC);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_article_tags_article ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);
CREATE INDEX idx_scrape_logs_source ON scrape_logs(source_id);
CREATE INDEX idx_scrape_logs_started ON scrape_logs(started_at DESC);

-- Full-text search index on articles
CREATE INDEX idx_articles_search ON articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, '')));

-- Insert Default Sources
INSERT INTO sources (name, url, type, scraper_type, enabled) VALUES
  ('Baldwin Times', 'https://www.baldwintimes.com', 'news', 'cheerio', true),
  ('Gulf Coast News', 'https://www.gulfcoastnewstoday.com', 'news', 'cheerio', true),
  ('Orange Beach Today', 'https://www.orangebeachtoday.com', 'news', 'cheerio', true),
  ('AL.com Baldwin', 'https://www.al.com/news/mobile/baldwin/', 'news', 'rss', true),
  ('Foley Observer', 'https://www.foleyobserver.com', 'news', 'cheerio', true),
  ('Mobile Register', 'https://www.al.com/mobile/', 'news', 'rss', true),
  ('Orange Beach City', 'https://www.orangebeachal.gov/news', 'news', 'cheerio', true);

-- Insert Common Tags
INSERT INTO tags (name, type) VALUES
  ('#BaldwinCounty', 'hashtag'),
  ('#OrangeBeach', 'hashtag'),
  ('#GulfShores', 'hashtag'),
  ('#Foley', 'hashtag'),
  ('Development', 'category'),
  ('Education', 'category'),
  ('Tourism', 'category'),
  ('Local Government', 'category'),
  ('Weather', 'category'),
  ('Sports', 'category');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment tag count
CREATE OR REPLACE FUNCTION increment_tag_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET count = count + 1 WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_tag_count_trigger AFTER INSERT ON article_tags
  FOR EACH ROW EXECUTE FUNCTION increment_tag_count();

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
