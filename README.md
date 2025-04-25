# 🚀 InteliCoin

<p align="center">
  <img src="./assets/hero-screenshot.png" alt="InteliCoin UI" width="800"/>
</p>

Next-generation cryptocurrency analytics and trading platform powered by AI. 
Includes live price tracking, arbitrage simulation, sentiment analysis, secure wallet operations, and GPT-driven trading insights.

---

## 🧱 Project Structure
```
InteliCoin/
├── frontend/      # React + Styled Components UI
└── backend/       # Flask API with PostgreSQL + OpenAI integration
```

---

## ⚙️ Setup Instructions

### 🔧 Backend (Flask)

#### 1. Navigate to backend:
```bash
cd backend
```

#### 2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install dependencies:
```bash
pip install -r requirements.txt
```

#### 4. Create a `.env` file:
```env
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://user:password@localhost:5432/intelicoindb
SECRET_KEY=your_flask_secret
```

#### 5. Run backend server:
```bash
flask run
```

---

### ⚛️ Frontend (React)

#### 1. Navigate to frontend:
```bash
cd frontend
```

#### 2. Install dependencies:
```bash
npm install
```

#### 3. Start the frontend:
```bash
npm start
```

---

## 🔐 Environment Variables
See `.env.example` for the required backend environment variables.
Never commit your actual `.env` file.

---

## 🔍 Features
- 🔒 JWT Auth with login/register
- 📊 Wallet balance, live prices, transaction history
- 💱 Trade simulator (with arbitrage break-even calc)
- 🧠 GPT-driven crypto sentiment analysis
- 📈 Market trends + coin movement tracking

---

## 📦 Technologies Used
- **Frontend:** React, Styled Components, Framer Motion
- **Backend:** Flask, SQLAlchemy, JWT, OpenAI API
- **Database:** PostgreSQL
- **APIs:** CoinGecko, GPT-4

---

## 🤝 Contributors
- [@NosaIgbinoba](https://github.com/NosaIgbinoba) (UI development, system integration)

---

## 📄 License
MIT License
