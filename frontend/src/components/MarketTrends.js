import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
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

const TrendsContainer = styled.div`
  background: rgba(20, 20, 40, 0.7);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.primary};
  box-shadow: ${props => props.theme.effects.glowSmall};
`;

const ChartContainer = styled.div`
  height: 300px;
  margin: 1.5rem 0;
`;

const TrendItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const TrendName = styled.span`
  color: ${props => props.theme.colors.light};
  font-family: ${props => props.theme.fonts.secondary};
`;

const TrendValue = styled.span`
  color: ${props => props.positive ? props.theme.colors.success : props.theme.colors.danger};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const TimeFilter = styled.button`
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.dark : props.theme.colors.light};
  border: 1px solid ${props => props.theme.colors.primary};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  cursor: pointer;
  font-family: ${props => props.theme.fonts.secondary};
  font-size: 0.8rem;
  margin-right: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.dark};
  }
`;

const MarketTrends = () => {
  const [trends, setTrends] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        
        // Fetch current prices
        const pricesResponse = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,cardano,solana&order=market_cap_desc'
        );
        const pricesData = await pricesResponse.json();

        // Fetch historical data for chart (simplified example)
        const historyResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30}`
        );
        const historyData = await historyResponse.json();

        // Process market trends
        const processedTrends = pricesData.map(coin => ({
          id: coin.id,
          name: coin.symbol.toUpperCase(),
          value: `$${coin.current_price.toLocaleString()}`,
          change: coin.price_change_percentage_24h.toFixed(2)
        }));

        // Add additional market metrics
        processedTrends.push(
          {
            name: 'DEFI TVL',
            value: '$82.4B',
            change: 5.7
          },
          {
            name: 'NFT VOL',
            value: '$1.2B',
            change: -3.4
          }
        );

        // Process chart data
        const chartLabels = historyData.prices.map((price, index) => {
          const date = new Date(price[0]);
          return timeRange === '24h' 
            ? date.toLocaleTimeString() 
            : date.toLocaleDateString();
        });

        const chartDataset = {
          labels: chartLabels,
          datasets: [
            {
              label: 'BTC Price',
              data: historyData.prices.map(price => price[1]),
              borderColor: '#00f0ff',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0
            }
          ]
        };

        setTrends(processedTrends);
        setChartData(chartDataset);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
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
          color: '#e0e0ff'
        }
      }
    }
  };

  if (loading) return (
    <TrendsContainer>
      <h3>MARKET TRENDS</h3>
      <p>Loading market data...</p>
    </TrendsContainer>
  );

  return (
    <TrendsContainer>
      <h3>MARKET TRENDS</h3>
      
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <TimeFilter active={timeRange === '24h'} onClick={() => setTimeRange('24h')}>24H</TimeFilter>
        <TimeFilter active={timeRange === '7d'} onClick={() => setTimeRange('7d')}>7D</TimeFilter>
        <TimeFilter active={timeRange === '30d'} onClick={() => setTimeRange('30d')}>30D</TimeFilter>
      </div>
      
      {chartData && (
        <ChartContainer>
          <Line data={chartData} options={chartOptions} />
        </ChartContainer>
      )}

      {trends.map((trend, index) => (
        <TrendItem key={index}>
          <TrendName>{trend.name}</TrendName>
          <TrendValue positive={trend.change > 0}>
            {trend.change > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            {trend.value} ({trend.change > 0 ? '+' : ''}{trend.change}%)
          </TrendValue>
        </TrendItem>
      ))}
    </TrendsContainer>
  );
};

export default MarketTrends;