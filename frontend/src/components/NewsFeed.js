import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const NewsContainer = styled.div`
  background: rgba(15, 15, 35, 0.7);
  border-radius: 15px;
  padding: 1.5rem;
  border-left: 3px solid ${props => props.theme.colors.accent};
`;

const NewsItem = styled(motion.div)`
  padding: 1rem 0;
  border-bottom: 1px dashed rgba(0, 240, 255, 0.3);
  
  &:last-child {
    border-bottom: none;
  }
`;

const NewsTitle = styled.h4`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const NewsExcerpt = styled.p`
  color: ${props => props.theme.colors.light};
  font-size: 0.9rem;
  opacity: 0.8;
`;

const NewsTime = styled.span`
  color: ${props => props.theme.colors.accent};
  font-size: 0.8rem;
  display: block;
  margin-top: 0.5rem;
`;

const NewsFeed = () => {
  const newsItems = [
    {
      title: 'Ethereum Merge Completed Successfully',
      excerpt: 'The long-awaited Ethereum merge has been completed, transitioning to Proof-of-Stake',
      time: '2 hours ago'
    },
    {
      title: 'Bitcoin Institutional Adoption Hits New High',
      excerpt: 'Wall Street firms increasing BTC holdings despite market conditions',
      time: '5 hours ago'
    },
    {
      title: 'New Regulation Proposal for Stablecoins',
      excerpt: 'US Treasury releases new framework for stablecoin regulation',
      time: '1 day ago'
    }
  ];

  return (
    <NewsContainer>
      <h3>LATEST NEWS</h3>
      {newsItems.map((news, index) => (
        <NewsItem 
          key={index}
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <NewsTitle>{news.title}</NewsTitle>
          <NewsExcerpt>{news.excerpt}</NewsExcerpt>
          <NewsTime>{news.time}</NewsTime>
        </NewsItem>
      ))}
    </NewsContainer>
  );
};

export default NewsFeed;