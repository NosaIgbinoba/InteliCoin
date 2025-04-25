// ✅ Updated App.js with modal rendered outside motion.main
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { motion } from 'framer-motion';
import GlobalStyles from './GlobalStyles';
import { sciFiTheme } from './theme';
import HeroSection from './components/HeroSection';
import WalletDashboard from './components/WalletDashboard';
import CryptoDashboard from './components/CryptoDashboard';
import MarketTrends from './components/MarketTrends';
import NewsFeed from './components/NewsFeed';
import AnimatedBackground from './components/AnimatedBackground';
import Arbitrage from './components/Arbitrage';
import TradeForm from './components/TradeForm';
import ChatBox from './components/ChatBox';
import SentimentalAnalysis from './components/SentimentalAnalysis';
import AuthForm from './components/AuthForm';
import Navbar from './components/Navbar';
import TransactionsTable from './components/TransactionsTable';
import Modal from './components/Modal';
import axios from 'axios';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [arbitrageOpportunity, setArbitrageOpportunity] = useState(null);
  const [arbitrageAnalysis, setArbitrageAnalysis] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAssets, setWalletAssets] = useState({});
  const [coinPrices, setCoinPrices] = useState({});
  const [coinChanges, setCoinChanges] = useState({});
  const [btcBalance, setBtcBalance] = useState(0);
  const [aiResponse, setAIResponse] = useState("");
  const [marketData, setMarketData] = useState(null);
  const [simulateMode, setSimulateMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [walletReady, setWalletReady] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/wallet', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        withCredentials: true
      });
      setWalletBalance(res.data.balance);
      setWalletAssets(res.data.assets || {});
      setCoinPrices(res.data.prices || {});
      setCoinChanges(res.data.changes || {});
      setBtcBalance(res.data.assets?.BTC || 0);
      setWalletReady(true);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
      setWalletReady(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWallet();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setWalletReady(false);
  };

  return (
    <ThemeProvider theme={sciFiTheme}>
      <GlobalStyles />
      <AnimatedBackground />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {isLoggedIn && <Navbar onLogout={handleLogout} />}

      <div className="app-container" style={{ paddingTop: '80px', overflowY: isLoggedIn ? 'auto' : 'hidden', height: '100vh' }}>
        {!isLoggedIn ? (
          <AuthForm onLoginSuccess={() => setIsLoggedIn(true)} />
        ) : (
          <>
            <HeroSection />

            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <div id="wallet">
                <WalletDashboard
                  walletBalance={walletBalance}
                  walletAssets={walletAssets}
                  coinPrices={coinPrices}
                  coinChanges={coinChanges}
                  setWalletBalance={setWalletBalance}
                  onReloadWallet={fetchWallet}
                  setIsLoggedIn={setIsLoggedIn}
                  onToggleTransactions={() => setShowTransactions(true)}
                />
              </div>

              <div id="arbitrage">
                <section className="trading-section">
                  <h2 className="section-title">Arbitrage Trading</h2>
                  <div className="trading-components">
                    <Arbitrage
                      setArbitrageOpportunity={setArbitrageOpportunity}
                      setAIResponse={setAIResponse}
                      setArbitrageAnalysis={setArbitrageAnalysis}
                      arbitrageAnalysis={arbitrageAnalysis}
                    />
                    {(arbitrageOpportunity || simulateMode) && (
                      <TradeForm
                        arbitrageOpportunity={arbitrageOpportunity}
                        walletBalance={walletBalance}
                        setWalletBalance={setWalletBalance}
                        setBtcBalance={setBtcBalance}
                        arbitrageAnalysis={arbitrageAnalysis}
                        simulateMode={simulateMode}
                      />
                    )}
                    <ChatBox aiResponse={aiResponse} />
                  </div>
                </section>
              </div>

              <div id="ai-analysis">
                <SentimentalAnalysis />
              </div>

              <div id="market-overview">
                <CryptoDashboard marketData={marketData} />
              </div>

              <div className="grid-container">
                <div id="market-trends">
                  <MarketTrends />
                </div>
                <div id="latest-news">
                  <NewsFeed />
                </div>
              </div>
            </motion.main>

            {showTransactions && (
              <Modal onClose={() => setShowTransactions(false)}>
                <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>🧾 Transactions</h3>
                <TransactionsTable />
              </Modal>
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
