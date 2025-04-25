import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from 'styled-components';
import './SentimentalAnalysis.css';

const SentimentGlow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  border-radius: 10px;
  ${props => props.type === 'positive' && `
    background: radial-gradient(
      circle at center,
      rgba(0, 255, 100, 0.3) 0%,
      transparent 70%
    );
  `}
  ${props => props.type === 'negative' && `
    background: radial-gradient(
      circle at center,
      rgba(255, 50, 50, 0.3) 0%,
      transparent 70%
    );
  `}
  ${props => props.type === 'neutral' && `
    background: radial-gradient(
      circle at center,
      rgba(0, 200, 255, 0.3) 0%,
      transparent 70%
    );
  `}
`;

const SentimentalAnalysis = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('comments');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/sentiment");
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // Parse the GPT response more reliably
        const recommendationMatch = data.analysis?.match(/RECOMMENDATION:\s*(BUY|SELL|HOLD)\s*with\s*(\d+)%/i) || 
                                   data.recommendation?.match(/(BUY|SELL|HOLD)/i);
        
        const confidenceMatch = data.analysis?.match(/with\s*(\d+)%\s*confidence/i) || 
                               [null, data.confidence];

        const sentimentMatch = data.analysis?.match(/SENTIMENT:\s*(Positive|Neutral|Negative)/i) || 
                              [null, data.sentiment];

        const trendMatch = data.analysis?.match(/MARKET TREND:\s*(Bullish|Bearish|Neutral)/i) || 
                          [null, data.market_trend];

        const factorsSection = data.analysis?.match(/KEY FACTORS:(.*?)ANALYSIS:/is);
        let keyFactors = data.key_factors || [];
        if (factorsSection && !keyFactors.length) {
          keyFactors = factorsSection[1]
            .split('\n')
            .filter(line => line.trim().startsWith('🔹') || line.trim().startsWith('-'))
            .map(line => line.replace(/^[🔹-]\s*/, '').trim())
            .filter(Boolean);
        }

        const analysisText = data.analysis?.match(/ANALYSIS:\s*(.+)/is)?.[1]?.trim() || 
                            data.analysis || 
                            "No analysis available";

        const transformedData = {
          posts_analyzed: data.posts_analyzed,
          sentiment: (sentimentMatch?.[1] || data.sentiment || "Neutral").toUpperCase(),
          marketTrend: (trendMatch?.[1] || data.market_trend || "Neutral").toUpperCase(),
          confidence: confidenceMatch?.[1] ? parseInt(confidenceMatch[1]) : data.confidence || 0,
          recommendation: (recommendationMatch?.[1] || data.recommendation || "HOLD").toUpperCase(),
          analysisText,
          keyFactors,
          posts: data.posts || []
        };
        
        setSentimentData(transformedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching sentiment data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();

    return () => {
      hasFetched.current = false;
    };
  }, []);

  const getSentimentClass = () => {
    if (!sentimentData) return "neutral";
    const sentiment = sentimentData.sentiment.toLowerCase();
    if (sentiment.includes("positive")) return "positive";
    if (sentiment.includes("negative")) return "negative";
    return "neutral";
  };

  const getRecommendationClass = () => {
    if (!sentimentData) return "hold";
    return sentimentData.recommendation.toLowerCase();
  };

  const filteredPosts = useMemo(() => {
    if (!sentimentData?.posts) return [];
    return sentimentData.posts.filter(post => 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sentimentData?.posts, searchTerm]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortOption === 'comments') return b.num_comments - a.num_comments;
      if (sortOption === 'score') return b.score - a.score;
      if (sortOption === 'karma') return (b.author_karma || 0) - (a.author_karma || 0);
      return 0;
    });
  }, [filteredPosts, sortOption]);

  if (loading) return (
    <div className="loading">
      <div className="loading-spinner"></div>
      Analyzing market sentiment...
    </div>
  );
  if (error) return <div className="error">Error: {error}</div>;
  if (!sentimentData) return <div className="error">No data available</div>;

  return (
    <div className="sentimental-analysis">
      {/* Header Section */}
      <div className="header">
        <h1>MARKET SENTIMENT ANALYSIS</h1>
        <div className="stats">
          <span>Posts Analyzed: {sentimentData.posts_analyzed}</span>
        </div>
      </div>

      {/* Sentiment Overview Card */}
      <div className={`sentiment-card ${getSentimentClass()}`}>
        <SentimentGlow type={getSentimentClass()} />
        <div className="sentiment-metrics">
          <div className="metric">
            <label>Market Sentiment</label>
            <div className={`value sentiment-${getSentimentClass()}`}>
              {sentimentData.sentiment}
            </div>
          </div>
          
          <div className="metric">
            <label>Trend Indicator</label>
            <div className="value">{sentimentData.marketTrend}</div>
          </div>
          
          <div className="metric">
            <label>Confidence Level</label>
            <div className="value">
              {sentimentData.confidence ? `${sentimentData.confidence}%` : "N/A"}
              {sentimentData.confidence && (
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${sentimentData.confidence}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="metric">
            <label>AI Recommendation</label>
            <div className={`recommendation ${getRecommendationClass()}`}>
              {sentimentData.recommendation}
              {sentimentData.confidence > 0 && (
                <span className="confidence-badge">
                  {sentimentData.confidence}% confidence
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="analysis-section">
        <h2>ANALYSIS SUMMARY</h2>
        <div className="analysis-text">
          {sentimentData.analysisText}
        </div>
      </div>

      {/* Key Factors Section */}
      {sentimentData.keyFactors.length > 0 && (
        <div className="factors-section">
          <h2>KEY MARKET FACTORS</h2>
          <ul className="factors-list">
            {sentimentData.keyFactors.map((factor, index) => (
              <li key={index}>
                <span className="factor-bullet">■</span>
                <span className="factor-text">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Posts Filter Controls */}
      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search crypto discussions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="sort-select"
        >
          <option value="comments">Most Comments</option>
          <option value="score">Highest Score</option>
          <option value="karma">Author Reputation</option>
        </select>
      </div>

      {/* Analyzed Posts Section */}
      <div className="posts-section">
        <h2>ANALYZED DISCUSSIONS ({sortedPosts.length})</h2>
        
        {sortedPosts.length > 0 ? (
          <div className="posts-grid">
            {sortedPosts.map((post, index) => (
              <div className="post-card" key={index}>
                <h3>{post.title || "Untitled Post"}</h3>
                <div className="post-meta">
                  <span title="Upvotes">▲ {post.score || 0}</span>
                  <span title="Comments">💬 {post.num_comments || 0}</span>
                  <span title="Author">👤 {post.author || "Anonymous"}</span>
                  {post.author_karma && <span title="Author Karma">⭐ {post.author_karma}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">No discussions match your filters.</p>
        )}
      </div>
    </div>
  );
};

export default SentimentalAnalysis;