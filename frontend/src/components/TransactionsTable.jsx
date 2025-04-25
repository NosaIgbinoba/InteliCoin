import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';

const TableWrapper = styled.div`
  margin-top: 2rem;
  background: rgba(15, 15, 35, 0.8);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.1);
`;

const TopControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const FilterSelect = styled.select`
  background: #111;
  border: 1px solid var(--primary);
  color: var(--light);
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
`;

const ExportBtn = styled.button`
  background: var(--accent);
  color: white;
  font-weight: bold;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: #00ffee;
    color: white;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-secondary);

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
  }

  th {
    background-color: rgba(0, 240, 255, 0.1);
    color: var(--accent);
    font-weight: bold;
    border-bottom: 1px solid var(--primary);
  }

  tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
  }

  td {
    color: var(--light);
  }
`;

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredSymbol, setFilteredSymbol] = useState("ALL");

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      try {
        const res = await axios.get('http://127.0.0.1:5000/transactions', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        const sorted = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setTransactions(sorted);
      } catch (err) {
        console.error("Failed to load transactions:", err);
        toast.error("Could not load transaction history.");
      }
    };

    fetchTransactions();
  }, []);

  const filtered = filteredSymbol === "ALL"
    ? transactions
    : transactions.filter(tx => tx.symbol === filteredSymbol);

  const exportToCSV = () => {
    const csv = [
      ["Symbol", "Amount", "Price", "Total", "Timestamp"],
      ...filtered.map(tx => [
        tx.symbol,
        tx.amount,
        tx.price,
        tx.total_value,
        tx.timestamp
      ])
    ];

    const blob = new Blob([csv.map(row => row.join(",")).join("\n")], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TableWrapper>
      <TopControls>
        <FilterSelect onChange={e => setFilteredSymbol(e.target.value)} value={filteredSymbol}>
          <option value="ALL">All Coins</option>
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="LTC">Litecoin (LTC)</option>
          <option value="SOL">Solana (SOL)</option>
        </FilterSelect>
        <ExportBtn onClick={exportToCSV}>📤 Export CSV</ExportBtn>
      </TopControls>

      <StyledTable>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Amount</th>
            <th>Price</th>
            <th>Total</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
                No matching transactions found.
              </td>
            </tr>
          ) : (
            filtered.map((tx, i) => (
              <tr key={i}>
                <td>{tx.symbol}</td>
                <td>{parseFloat(tx.amount).toFixed(6)}</td>
                <td>${parseFloat(tx.price).toLocaleString()}</td>
                <td>${parseFloat(tx.total_value).toLocaleString()}</td>
                <td>{tx.timestamp}</td>
              </tr>
            ))
          )}
        </tbody>
      </StyledTable>
    </TableWrapper>
  );
};

export default TransactionsTable;
