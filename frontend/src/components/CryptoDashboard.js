import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiCardano, SiSolana, SiBinance } from 'react-icons/si';
import { FiArrowUp, FiArrowDown, FiRefreshCw } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Styled Components
const DashboardContainer = styled.div`
  background: rgba(10, 10, 26, 0.7);
  border-radius: 15px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 240, 255, 0.1);
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const DashboardTitle = styled.h2`
  font-family: ${props => props.theme.fonts.main};
  color: ${props => props.theme.colors.primary};
  margin: 0;
  text-shadow: ${props => props.theme.effects.textGlow};
`;

const TimeFilters = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TimeFilter = styled.button.attrs(props => ({
  'data-active': props.$active || false
}))`
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.dark : props.theme.colors.light};
  border: 1px solid ${props => props.theme.colors.primary};
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-family: ${props => props.theme.fonts.secondary};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.dark};
  }
`;

const RefreshButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.primary};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ${props => props.theme.fonts.secondary};
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.theme.colors.accent};
  }
`;

const CryptoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CryptoCard = styled.div.attrs(props => ({
  'data-active': props.$active || false
}))`
  background: rgba(20, 20, 40, 0.6);
  border-radius: 10px;
  padding: 1.5rem;
  border-left: 3px solid ${props => 
    props.$active ? props.theme.colors.accent : props.theme.colors.primary};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.effects.glow};
  }
`;

const CryptoHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const CryptoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.theme.colors.darker};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  
  svg {
    font-size: 1.5rem;
    color: ${props => props.theme.colors.accent};
  }
`;

const CryptoName = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.light};
  font-family: ${props => props.theme.fonts.secondary};
`;

const CryptoPrice = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const CryptoChange = styled.div.attrs(props => ({
  'data-positive': props.$positive || false
}))`
  display: flex;
  align-items: center;
  color: ${props => 
    props.$positive ? props.theme.colors.success : props.theme.colors.danger};
  
  svg {
    margin-right: 0.3rem;
  }
`;

const LoadingMessage = styled.div`
  color: ${props => props.theme.colors.light};
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RetryButton = styled.button`
  background: ${props => props.theme.colors.danger};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-family: ${props => props.theme.fonts.secondary};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent};
  }
`;

const LastUpdated = styled.div`
  color: ${props => props.theme.colors.light};
  font-size: 0.8rem;
  text-align: right;
  margin-top: 1rem;
  font-style: italic;
`;

const CryptoDashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [cryptoData, setCryptoData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // API configuration
  const API_CONFIG = {
    baseUrl: 'https://api.coingecko.com/api/v3/',
    cacheDuration: 300000, // 5 minutes
    rateLimit: 2000, // 2 seconds between calls
    maxRetries: 3,
    retryDelay: 1000 // 1 second initial retry delay
  };

  // Cache keys
  const CACHE_KEYS = {
    MARKET_DATA: 'crypto_market_data',
    HISTORICAL_DATA: (id, days) => `crypto_historical_${id}_${days}`
  };

  // Check if cached data is still valid
  const isCacheValid = (timestamp) => {
    return Date.now() - timestamp < API_CONFIG.cacheDuration;
  };

  // Enhanced fetch with retries and exponential backoff
  const fetchWithRetry = async (endpoint, params, cacheKey) => {
    let retries = 0;
    let lastError = null;
    
    while (retries < API_CONFIG.maxRetries) {
      try {
        // Rate limit - wait if we recently made a call
        const now = Date.now();
        if (now - lastFetchTime < API_CONFIG.rateLimit) {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.rateLimit - (now - lastFetchTime)));
        }
        setLastFetchTime(Date.now());

        // Try to get from cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (isCacheValid(timestamp)) {
            setUsingCachedData(true);
            return data;
          }
        }

        // Make API call
        const response = await axios.get(`${API_CONFIG.baseUrl}${endpoint}`, {
          params,
          timeout: 10000 // 10 second timeout
        });
        const data = response.data;

        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));

        setUsingCachedData(false);
        return data;
      } catch (err) {
        lastError = err;
        retries++;
        
        // Only retry on network errors or 5xx status codes
        if (!err.response || (err.response.status >= 500 && err.response.status <= 599)) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }

    // If all retries failed, try to use cached data
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      setUsingCachedData(true);
      return data;
    }

    throw lastError || new Error('Request failed after retries');
  };

  // Fetch current market data
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchWithRetry(
        'coins/markets',
        {
          vs_currency: 'usd',
          ids: 'bitcoin,ethereum,cardano,solana,binancecoin',
          price_change_percentage: '24h,7d,30d,1y'
        },
        CACHE_KEYS.MARKET_DATA
      );

      const formattedData = data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h_in_currency,
        change7d: coin.price_change_percentage_7d_in_currency,
        change30d: coin.price_change_percentage_30d_in_currency,
        change1y: coin.price_change_percentage_1y_in_currency,
        icon: getIconForCrypto(coin.id)
      }));

      setCryptoData(formattedData);
      setLoading(false);
      setRetryCount(0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(`Failed to load market data: ${err.message}`);
      setLoading(false);
      setRetryCount(prev => prev + 1);
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const days = timeRange === '24h' ? 1 : 
                  timeRange === '7d' ? 7 : 
                  timeRange === '30d' ? 30 : 365;

      const data = await fetchWithRetry(
        `coins/${selectedCrypto}/market_chart`,
        {
          vs_currency: 'usd',
          days: days
        },
        CACHE_KEYS.HISTORICAL_DATA(selectedCrypto, days)
      );

      const formatChartData = (prices) => {
        if (days > 30) {
          const step = Math.ceil(prices.length / 30);
          return prices.filter((_, index) => index % step === 0);
        }
        return prices;
      };

      const prices = formatChartData(data.prices);
      const labels = prices.map(([timestamp]) => {
        const date = new Date(timestamp);
        if (days <= 1) return date.toLocaleTimeString();
        if (days <= 7) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });

      const selectedCoin = cryptoData.find(c => c.id === selectedCrypto) || 
                         { symbol: selectedCrypto.toUpperCase() };

      setChartData({
        labels,
        datasets: [{
          label: `${selectedCoin.symbol} Price`,
          data: prices.map(([, price]) => price),
          borderColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#00f0ff',
          pointRadius: days > 7 ? 0 : 3,
          pointHoverRadius: 5
        }]
      });
      setLoading(false);
      setRetryCount(0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(`Failed to load historical data: ${err.message}`);
      setLoading(false);
      setRetryCount(prev => prev + 1);
    }
  };

  // Auto-retry on error
  useEffect(() => {
    if (error && retryCount < API_CONFIG.maxRetries) {
      const timer = setTimeout(() => {
        if (chartData) {
          fetchHistoricalData();
        } else {
          fetchMarketData();
        }
      }, API_CONFIG.retryDelay * Math.pow(2, retryCount - 1));
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  // Get icon for cryptocurrency
  const getIconForCrypto = (id) => {
    switch(id) {
      case 'bitcoin': return <FaBitcoin />;
      case 'ethereum': return <FaEthereum />;
      case 'cardano': return <SiCardano />;
      case 'solana': return <SiSolana />;
      case 'binancecoin': return <SiBinance />;
      default: return null;
    }
  };

  // Get price change based on time range
  const getPriceChange = (crypto) => {
    switch(timeRange) {
      case '24h': return crypto.change24h;
      case '7d': return crypto.change7d;
      case '30d': return crypto.change30d;
      case '1y': return crypto.change1y;
      default: return crypto.change24h;
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e0e0ff',
          font: {
            family: 'Rajdhani, sans-serif'
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(224, 224, 255, 0.1)'
        },
        ticks: {
          color: '#e0e0ff'
        }
      },
      y: {
        grid: {
          color: 'rgba(224, 224, 255, 0.1)'
        },
        ticks: {
          color: '#e0e0ff',
          callback: (value) => `$${value.toLocaleString()}`
        }
      }
    },
    maintainAspectRatio: false
  };

  // Handle retry
  const handleRetry = () => {
    if (chartData) {
      fetchHistoricalData();
    } else {
      fetchMarketData();
    }
  };

  // Initial data load
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, API_CONFIG.cacheDuration);
    return () => clearInterval(interval);
  }, []);

  // Fetch historical data when timeRange or selectedCrypto changes
  useEffect(() => {
    if (cryptoData.length > 0) {
      fetchHistoricalData();
    }
  }, [timeRange, selectedCrypto, cryptoData]);

  if (loading && !cryptoData.length && !error) {
    return (
      <DashboardContainer>
        <LoadingMessage>
          <FiRefreshCw className="spin" />
          Loading cryptocurrency data...
        </LoadingMessage>
      </DashboardContainer>
    );
  }

  if (error && retryCount >= API_CONFIG.maxRetries) {
    return (
      <DashboardContainer>
        <ErrorMessage>
          {error}
          <RetryButton onClick={handleRetry}>
            <FiRefreshCw /> Retry
          </RetryButton>
          {usingCachedData && <div>Showing cached data</div>}
        </ErrorMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>MARKET OVERVIEW</DashboardTitle>
        <TimeFilters>
          <TimeFilter 
            $active={timeRange === '24h'} 
            onClick={() => setTimeRange('24h')}
          >
            24H
          </TimeFilter>
          <TimeFilter 
            $active={timeRange === '7d'} 
            onClick={() => setTimeRange('7d')}
          >
            7D
          </TimeFilter>
          <TimeFilter 
            $active={timeRange === '30d'} 
            onClick={() => setTimeRange('30d')}
          >
            30D
          </TimeFilter>
          <TimeFilter 
            $active={timeRange === '1y'} 
            onClick={() => setTimeRange('1y')}
          >
            1Y
          </TimeFilter>
          <RefreshButton onClick={fetchMarketData}>
            <FiRefreshCw /> Refresh
          </RefreshButton>
        </TimeFilters>
      </DashboardHeader>
      
      <div style={{ height: '300px' }}>
        {loading && chartData ? (
          <LoadingMessage>
            <FiRefreshCw className="spin" />
            Updating chart data...
          </LoadingMessage>
        ) : chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <LoadingMessage>Loading chart data...</LoadingMessage>
        )}
      </div>
      
      {cryptoData.length > 0 && (
        <>
          <CryptoGrid>
            {cryptoData.map((crypto) => {
              const priceChange = getPriceChange(crypto);
              const isPositive = priceChange > 0;
              return (
                <CryptoCard 
                  key={crypto.id}
                  onClick={() => setSelectedCrypto(crypto.id)}
                  $active={selectedCrypto === crypto.id}
                >
                  <CryptoHeader>
                    <CryptoIcon>{crypto.icon}</CryptoIcon>
                    <CryptoName>{crypto.name} ({crypto.symbol})</CryptoName>
                  </CryptoHeader>
                  <CryptoPrice>${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CryptoPrice>
                  <CryptoChange $positive={isPositive}>
                    {isPositive ? <FiArrowUp /> : <FiArrowDown />}
                    {Math.abs(priceChange).toFixed(2)}%
                  </CryptoChange>
                </CryptoCard>
              );
            })}
          </CryptoGrid>
          <LastUpdated>
            {usingCachedData ? 'Using cached data - ' : ''}
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            {loading && ' (Updating...)'}
          </LastUpdated>
        </>
      )}
    </DashboardContainer>
  );
};

export default CryptoDashboard;