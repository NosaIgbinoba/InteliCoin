from flask import Flask, request, jsonify, render_template, json
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import openai
import random
import requests
import json
from statistics import mean, stdev
from datetime import datetime, timedelta, timezone
import time
import logging
import praw
import re
from tabulate import tabulate
import getpass
import requests
import os
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
load_dotenv()





app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

# PostgreSQL DB URI
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")

# JWT secret key
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")

# Reddit API
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_SECRET = os.getenv("REDDIT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")

# OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")


app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

jwt = JWTManager(app)

bcrypt = Bcrypt(app)

# Get your macOS username dynamically
mac_user = getpass.getuser()

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=False)
    wallet_balance = db.Column(db.Float, default=0.0)

    btc_balance = db.Column(db.Float, default=0.0)
    eth_balance = db.Column(db.Float, default=0.0)
    ltc_balance = db.Column(db.Float, default=0.0)
    sol_balance = db.Column(db.Float, default=0.0)



    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)  # e.g. BTC
    amount = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total_value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 409

    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        token = create_access_token(identity=user.id)
        return jsonify(access_token=token, username=user.username), 200
    return jsonify({"message": "Invalid credentials"}), 401


# Setup Reddit API client with PRAW
reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_SECRET,
    user_agent=REDDIT_USER_AGENT
)

# Initialize a mock wallet (using a dictionary for simplicity)
wallet = {
    "balance": 1000.0,  # Starting balance
    "assets": {
        "BTC": 0.0,
        "ETH": 0.0
    }
}
EXCHANGE_FEES = {
    "Coinbase": 0.005,  # 0.5%
    "Crypto.com": 0.004,  # 0.4%
    "Binance": 0.001,  # 0.1%
    "Kraken": 0.0026  # 0.26%
}

# Network fees (gas fees) in USD
NETWORK_FEES = {
    "BTC": 5.0,
    "ETH": 3.0,
    "DOGE": 1.0,
    "SOL": 0.1,
    "ADA": 0.2
}

# Exchange latency in seconds (simulated)
EXCHANGE_LATENCY = {
    "Coinbase": 0.3,
    "Crypto.com": 0.4,
    "Binance": 0.2,
    "Kraken": 0.35
}

# Rate limits (requests per minute)
RATE_LIMITS = {
    "Coinbase": 100,
    "Crypto.com": 120,
    "Binance": 150,
    "Kraken": 80
}


# Set up basic logging to log transactions (could be expanded to log to a file or database)
logging.basicConfig(level=logging.INFO)

LOG_FILE = "snapshot_log.json"

SNAPSHOT_FILE = "sentiment_snapshots.json"

def compute_credibility(post, karma_cutoff=5000, score_cutoff=10):
    try:
        karma = int(post.get("author_karma", 0))
        score = int(post.get("score", 0))
        return (karma / 1000.0) + (score / 10.0)
    except:
        return 0

@app.route("/api/sentiment/snapshot", methods=["GET"])
def snapshot_sentiment():
    reddit_data = scrape_reddit_bitcoin()
    analysis = analyze_with_gpt(reddit_data)
    confidence = extract_confidence(analysis) or 0

    credible_threshold = 10
    num_credible = 0
    num_non_credible = 0
    credibility_scores = []

    for post in reddit_data:
        score = compute_credibility(post)
        credibility_scores.append(score)
        if score >= credible_threshold:
            num_credible += 1
        else:
            num_non_credible += 1

    snapshot = {
        "timestamp": datetime.utcnow().isoformat(),
        "posts_analyzed": len(reddit_data),
        "credible_posts": num_credible,
        "non_credible_posts": num_non_credible,
        "avg_credibility": round(mean(credibility_scores), 2),
        "std_credibility": round(stdev(credibility_scores) if len(credibility_scores) > 1 else 0, 2),
        "sentiment_confidence": confidence,
        "sentiment_summary": analysis.strip()
    }

    if not os.path.exists(SNAPSHOT_FILE):
        with open(SNAPSHOT_FILE, "w") as f:
            json.dump([snapshot], f, indent=2)
    else:
        with open(SNAPSHOT_FILE, "r+") as f:
            data = json.load(f)
            data.append(snapshot)
            f.seek(0)
            json.dump(data, f, indent=2)

    return jsonify({"message": "Snapshot saved", "snapshot": snapshot})

def log_transaction(transaction_type, amount, details):
    """
    Log the transaction to the console (or to a file/database).
    You can expand this function to save logs to a file or database.
    """
    logging.info(f"Transaction type: {transaction_type}, Amount: {amount}, Details: {details}")

def get_wallet_balance():
     return wallet_balance["balance"]  # This returns the current balance

def fetch_live_price(symbol):
    id_map = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "LTC": "litecoin",
        "SOL": "solana"
    }
    try:
        response = requests.get(
            f"https://api.coingecko.com/api/v3/simple/price?ids={id_map[symbol]}&vs_currencies=usd"
        )
        data = response.json()
        return float(data[id_map[symbol]]['usd'])
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        return None

@app.route("/wallet", methods=["GET", "OPTIONS"])
@jwt_required()
def get_wallet():
    if request.method == "OPTIONS":
        return '', 204

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    assets = {
        "BTC": user.btc_balance,
        "ETH": user.eth_balance,
        "LTC": user.ltc_balance,
        "SOL": user.sol_balance
    }

    prices = {
        "BTC": 52291,
        "ETH": 28291,
        "LTC": 8291,
        "SOL": 14291
    }

    changes = {
        "BTC": 0.25,
        "ETH": 0.25,
        "LTC": 0.25,
        "SOL": -0.25
    }

    return jsonify({
        "balance": round(user.wallet_balance, 2),
        "assets": assets,
        "prices": prices,
        "changes": changes
    })


@app.route("/deposit", methods=["POST"])
@jwt_required()
def deposit():
    user_id = get_jwt_identity()
    amount = request.json.get("amount", 0)

    if amount <= 0:
        return jsonify(success=False, message="Invalid amount"), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify(success=False, message="User not found"), 404

    user.wallet_balance += amount
    db.session.commit()

    return jsonify(success=True, new_balance=user.wallet_balance)



@app.route("/withdraw", methods=["POST"])
@jwt_required()
def withdraw():
    user_id = get_jwt_identity()
    amount = request.json.get("amount", 0)
    user = User.query.get(user_id)

    if not user:
        return jsonify(success=False, message="User not found"), 404
    if amount <= 0:
        return jsonify(success=False, message="Invalid amount"), 400
    if amount > user.wallet_balance:
        return jsonify(success=False, message="Insufficient funds"), 400

    user.wallet_balance -= amount
    db.session.commit()

    return jsonify(success=True, new_balance=user.wallet_balance)


def get_wallet_balance(user_id):
    user = User.query.get(user_id)
    return user.wallet_balance if user else 0.0

def update_wallet(user_id, delta):
    user = User.query.get(user_id)
    if user:
        user.wallet_balance = max(0, user.wallet_balance + delta)
        db.session.commit()
        return True
    return False

@app.route("/buy_crypto", methods=["POST"])
@jwt_required()
def buy_crypto():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    data = request.get_json()
    symbol = data.get("symbol", "").upper()
    amount = float(data.get("amount", 0))  # amount of crypto (e.g. 0.5 ETH)

    if symbol not in ["BTC", "ETH", "LTC", "SOL"]:
        return jsonify({"success": False, "message": "Invalid symbol"}), 400
    if amount <= 0:
        return jsonify({"success": False, "message": "Invalid amount"}), 400

    # ✅ Fetch live USD price
    price = fetch_live_price(symbol)
    if not price:
        return jsonify({"success": False, "message": "Failed to fetch live price"}), 500

    total_cost = amount * price

    if user.wallet_balance < total_cost:
        return jsonify({"success": False, "message": "Insufficient wallet balance"}), 400

    # ✅ Deduct fiat and add crypto
    user.wallet_balance -= total_cost
    if symbol == "BTC":
        user.btc_balance += amount
    elif symbol == "ETH":
        user.eth_balance += amount
    elif symbol == "LTC":
        user.ltc_balance += amount
    elif symbol == "SOL":
        user.sol_balance += amount

    # ✅ Log transaction
    tx = Transaction(
        user_id=user.id,
        symbol=symbol,
        amount=amount,
        price=price,
        total_value=total_cost
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Bought {amount:.6f} {symbol}",
        "new_balance": round(user.wallet_balance, 2),
        "holdings": {
            "BTC": user.btc_balance,
            "ETH": user.eth_balance,
            "LTC": user.ltc_balance,
            "SOL": user.sol_balance
        }
    })

@app.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    txs = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.timestamp.desc()).all()

    return jsonify([
        {
            "symbol": tx.symbol,
            "amount": tx.amount,
            "price": tx.price,
            "total_value": tx.total_value,
            "timestamp": tx.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }
        for tx in txs
    ])


def calculate_realistic_arbitrage(buy_exchange, sell_exchange, crypto_symbol, amount, price_data=None):
    prices = price_data or fetch_prices(crypto_symbol)
    if not prices or buy_exchange not in prices or sell_exchange not in prices:
        return None

    buy_price = prices[buy_exchange]
    sell_price = prices[sell_exchange]

    buy_fee = amount * EXCHANGE_FEES.get(buy_exchange, 0.005)
    sell_fee = amount * EXCHANGE_FEES.get(sell_exchange, 0.005)
    network_fee = NETWORK_FEES.get(crypto_symbol.upper(), 5.0)

    slippage_factor = min(0.01, max(0.001, amount / 100000))
    effective_buy_price = buy_price * (1 + slippage_factor)
    effective_sell_price = sell_price * (1 - slippage_factor)

    crypto_amount = (amount - buy_fee - network_fee) / effective_buy_price
    proceeds = (crypto_amount * effective_sell_price) - sell_fee - network_fee
    profit = proceeds - amount

    latency = EXCHANGE_LATENCY.get(buy_exchange, 0.3) + EXCHANGE_LATENCY.get(sell_exchange, 0.3)

    return {
        "gross_profit": sell_price - buy_price,
        "net_profit": profit,
        "fees": {
            "buy_fee": buy_fee,
            "sell_fee": sell_fee,
            "network_fee": network_fee * 2,
            "total_fees": buy_fee + sell_fee + (network_fee * 2)
        },
        "slippage": slippage_factor * 100,
        "latency": latency,
        "effective_buy_price": effective_buy_price,
        "effective_sell_price": effective_sell_price,
        "crypto_amount": crypto_amount
    }


@app.route('/execute_trade', methods=['POST'])
def execute_trade():
    try:
        data = request.get_json()
        print(f"🔹 Received Trade Data: {data}")

        # Validate required fields
        required_fields = ["buy_from", "sell_to", "tradeAmount", "crypto"]
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": "Missing required trade details"}), 400

        # Convert and validate amounts
        try:
            trade_amount = float(data["tradeAmount"])
            crypto = data["crypto"].upper()
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Invalid numeric values"}), 400

        # Check wallet balance
        if trade_amount > wallet["balance"]:
            return jsonify({"status": "error", "message": "Insufficient balance"}), 400

        # Calculate realistic trade execution
        realistic_trade = calculate_realistic_arbitrage(
            data["buy_from"],
            data["sell_to"],
            crypto,
            trade_amount
        )

        if not realistic_trade:
            return jsonify({"status": "error", "message": "Could not calculate trade parameters"}), 400

        # Simulate trade execution with success probability based on latency
        # Faster trades have higher success rates
        success_prob = 0.95 - (realistic_trade["latency"] * 0.1)
        success_prob = max(0.7, min(0.95, success_prob))  # Keep between 70-95%
        
        if random.random() < success_prob:  # Trade succeeds
            # Deduct trade amount and add profit
            wallet["balance"] -= trade_amount
            wallet["balance"] += trade_amount + realistic_trade["net_profit"]
            wallet["assets"][crypto] += realistic_trade["crypto_amount"]
            
            # Log successful trade
            log_transaction(
                "arbitrage_trade",
                trade_amount,
                {
                    "message": f"Bought {realistic_trade['crypto_amount']} {crypto} on {data['buy_from']}, sold on {data['sell_to']}",
                    "fees": realistic_trade["fees"],
                    "slippage": realistic_trade["slippage"],
                    "latency": realistic_trade["latency"]
                }
            )
            
            return jsonify({
                "status": "success",
                "profit": round(realistic_trade["net_profit"], 2),
                "new_balance": round(wallet["balance"], 2),
                "crypto_balance": round(wallet["assets"][crypto], 6),
                "fees": realistic_trade["fees"],
                "slippage": realistic_trade["slippage"],
                "latency": realistic_trade["latency"],
                "effective_prices": realistic_trade["effective_prices"]
            })
        else:
            # Simulate failed trade (only deduct trade amount and fees)
            wallet["balance"] -= trade_amount
            lost_amount = trade_amount * 0.02  # Lose 2% in failed trade
            wallet["balance"] -= lost_amount
            
            return jsonify({
                "status": "failed",
                "message": "Trade failed - price moved during execution",
                "new_balance": round(wallet["balance"], 2),
                "lost_amount": round(lost_amount, 2),
                "reason": "Price movement during execution window"
            })

    except Exception as e:
        print(f"❌ Trade Error: {str(e)}")
        return jsonify({"status": "error", "message": f"Trade execution failed: {str(e)}"}), 500

def calculate_minimum_trade_to_break_even(buy_price, sell_price, buy_fee_pct, sell_fee_pct, network_fee):
    spread = sell_price - buy_price
    if spread <= 0:
        return None

    # Assume $1 trade to find net profit per dollar
    test_amount = 1
    buy_fee = test_amount * buy_fee_pct
    sell_fee = test_amount * sell_fee_pct
    crypto_amount = (test_amount - buy_fee - network_fee) / buy_price
    proceeds = crypto_amount * sell_price
    net_profit = proceeds - test_amount - sell_fee - network_fee

    if net_profit <= 0:
        return "not profitable"

    # Estimate trade amount needed to offset fixed network fees
    required_trade = (2 * network_fee + buy_fee + sell_fee) / (net_profit / test_amount)
    return round(required_trade, 2)


@app.route('/arbitrage')
def arbitrage():
    crypto = request.args.get("crypto", "").lower()
    if not crypto:
        return jsonify({"response": "Please specify a cryptocurrency."})

    try:
        price_data = fetch_prices(crypto)
        if not price_data:
            return jsonify({"response": "Failed to fetch prices from exchanges"})

        stable_prices = {e: {"price": p, "stable": True} for e, p in price_data.items()}
        opportunities = find_arbitrage_opportunities(price_data)

        if not opportunities:
            exchanges = list(price_data.keys())

            # Find max price difference
            max_diff = 0
            for i in range(len(exchanges)):
                for j in range(len(exchanges)):
                    if i != j:
                        diff = abs(price_data[exchanges[i]] - price_data[exchanges[j]])
                        if diff > max_diff:
                            max_diff = diff

            # ✅ Correct break-even logic: always buy low, sell high
            def find_break_even_amount(prices, crypto):
                exchanges = list(prices.keys())
                for usd in range(10, 10001, 10):
                    for buy_exchange in exchanges:
                        for sell_exchange in exchanges:
                            if buy_exchange != sell_exchange:
                                test_result = calculate_realistic_arbitrage(
                                    buy_exchange=buy_exchange,
                                    sell_exchange=sell_exchange,
                                    crypto_symbol=crypto,
                                    amount=usd,
                                    price_data=prices
                                )
                                if test_result and test_result['net_profit'] > 0:
                                    return usd
                return None

            min_required_usd = find_break_even_amount(price_data, crypto)
            formatted_min = f"${min_required_usd:.2f}" if min_required_usd else "$0.00"

            # Calculate fee percentage
            sorted_exchanges = sorted(price_data.items(), key=lambda x: x[1])
            fee_pct = EXCHANGE_FEES[sorted_exchanges[0][0]] + EXCHANGE_FEES[sorted_exchanges[1][0]]

            reason = (
                f"Price gap (${max_diff:.2f}) is less than required to overcome "
                f"{fee_pct * 100:.1f}% fees"
            )

            return jsonify({
                "response": "No arbitrage opportunities available right now",
                "analysis": {
                    "max_price_difference": round(max_diff, 4),
                    "price_stability": "stable" if all(p["stable"] for p in stable_prices.values()) else "volatile",
                    "suggestion": "Try again during periods of higher market volatility",
                    "reason": reason
                },
                "prices": price_data
            })

        # ✅ Arbitrage opportunity found
        arbitrage_opportunity = opportunities[0]
        return jsonify({
            "response": "Arbitrage opportunities found!",
            "crypto_symbol": crypto.upper(),
            **{f"{exchange.lower()}_price": price for exchange, price in price_data.items()},
            "arbitrage_opportunity": arbitrage_opportunity
        })

    except Exception as e:
        return jsonify({"response": "Error checking arbitrage", "error": str(e)})




# @app.route("/wallet", methods=["GET"])
# def get_wallet():
#     """
#     Endpoint to get the current wallet balance.
#     """
#     return jsonify({"balance": wallet['balance']})

@app.route("/fees", methods=["GET"])
def get_fees():
    return jsonify({
        "exchange_fees": EXCHANGE_FEES,
        "network_fees": NETWORK_FEES
    })

@app.route("/update-settings", methods=["POST"])
def update_settings():
    """
    Endpoint to update bot settings from the frontend.
    """
    global bot_settings
    settings = request.json

    bot_settings["aggressionLevel"] = settings.get("aggressionLevel", bot_settings["aggressionLevel"])
    bot_settings["riskTolerance"] = settings.get("riskTolerance", bot_settings["riskTolerance"])
    bot_settings["buyLimit"] = settings.get("buyLimit", bot_settings["buyLimit"])
    bot_settings["sellLimit"] = settings.get("sellLimit", bot_settings["sellLimit"])
    bot_settings["maxLossLimit"] = settings.get("maxLossLimit", bot_settings["maxLossLimit"])

    return jsonify({"success": True, "message": "Settings updated successfully."})

def extract_crypto_name(query):
    """
    Extract a cryptocurrency name from a user query.
    """
    keywords = ["bitcoin", "ethereum", "dogecoin", "solana", "cardano"]
    for word in keywords:
        if word in query:
            return word
    return None


def fetch_prices(crypto_name):
    """
    Fetch live price data from Coinbase and Crypto.com.
    """
    coinbase_price = fetch_coinbase_price(crypto_name)
    print(f"Coinbase price for {crypto_name}: {coinbase_price}") 
    crypto_com_price = fetch_crypto_com_price(crypto_name)
    print(f"Crypto.com price for {crypto_name}: {crypto_com_price}")

    prices = {}
    if coinbase_price:
        prices["Coinbase"] = round(coinbase_price, 2)
    if crypto_com_price:
        prices["Crypto.com"] = round(crypto_com_price, 2)

    if not prices:
        print("Failed to fetch prices from both sources.")
        return None

    return prices

def fetch_coinbase_price(crypto_symbol):
    """
    Fetch the spot price of a cryptocurrency from Coinbase.
    Supports full names and symbols.
    """
    try:
        symbol_map = {
            "bitcoin": "BTC", "btc": "BTC",
            "ethereum": "ETH", "eth": "ETH",
            "dogecoin": "DOGE", "doge": "DOGE",
            "solana": "SOL", "sol": "SOL",
            "cardano": "ADA", "ada": "ADA"
        }

        crypto_symbol = symbol_map.get(crypto_symbol.lower())
        if not crypto_symbol:
            print(f"Unsupported crypto symbol: {crypto_symbol}")
            return None

        url = f"https://api.coinbase.com/v2/prices/{crypto_symbol}-USD/spot"
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            return float(data["data"]["amount"])
        else:
            print("Error fetching data from Coinbase:", data)
            return None
    except Exception as e:
        print("Error fetching price from Coinbase:", e)
        return None


def fetch_crypto_com_price(crypto_symbol):
    """
    Fetch the last traded price of a cryptocurrency from Crypto.com public API.
    """
    try:
        crypto_symbol = crypto_symbol.lower() 
        # Map cryptocurrency names to Crypto.com trading symbols
        symbol_map = {
            "bitcoin": "BTC", "btc": "BTC",
            "ethereum": "ETH", "eth": "ETH",
            "dogecoin": "DOGE", "doge": "DOGE",
            "solana": "SOL", "sol": "SOL",
            "cardano": "ADA", "ada": "ADA"
        }
        crypto_code = symbol_map.get(crypto_symbol.lower())
        if not crypto_code:
            raise ValueError(f"Unsupported cryptocurrency: {crypto_symbol}")    

        # Public API endpoint
        url = "https://api.crypto.com/v2/public/get-ticker"
        
        # Request parameters
        params = {
            "instrument_name": f"{crypto_code}_USDT"
        }

        # Send GET request
        response = requests.get(url, params=params)
        print(f"API Response Status Code: {response.status_code}")  # Debugging
        print(f"API Response Body: {response.text}")  # Debugging
        response.raise_for_status()
        
        data = response.json()

        # Debugging: Print the response to understand its structure
        print("API Response JSON:", data)

        # Extract and return the last traded price
        if data["code"] == 0 and "data" in data["result"]:
            tickers = data["result"]["data"]  # List of ticker entries
            for ticker in tickers:
                if ticker["i"] == f"{crypto_code}_USDT":
                    last_price = float(ticker["a"])  # 'a' is the last traded price
                    print(f"Last traded price for {crypto_symbol}: {last_price}")
                    return last_price
            raise ValueError("Instrument not found in API response.")
        else:
            raise ValueError(f"Unexpected API response structure: {data}")
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error fetching Crypto.com price: {e.response.text}")
        return None
    except Exception as e:
        print(f"Error fetching Crypto.com price: {e}")
        return None

@app.route('/simulate_trade', methods=['POST'])
def simulate_trade():
    try:
        data = request.get_json()
        print(f"🧪 Simulate Trade Data: {data}")

        # Validate required fields
        required_fields = ["buy_from", "sell_to", "tradeAmount", "crypto"]
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": "Missing required trade details"}), 400

        # Parse values
        try:
            trade_amount = float(data["tradeAmount"])
            crypto = data["crypto"].upper()
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Invalid numeric values"}), 400

        # Run the same arbitrage logic (but don’t touch the wallet)
        simulated = calculate_realistic_arbitrage(
            data["buy_from"],
            data["sell_to"],
            crypto,
            trade_amount
        )

        if not simulated:
            return jsonify({"status": "error", "message": "Simulation failed. Check input or prices."}), 400

        return jsonify({
            "status": "success",
            "simulated": True,
            "net_profit": round(simulated["net_profit"], 2),
            "gross_profit": round(simulated["gross_profit"], 2),
            "crypto_received": round(simulated["crypto_amount"], 6),
            "effective_prices": {
                "buy": simulated["effective_buy_price"],
                "sell": simulated["effective_sell_price"]
            },
            "fees": simulated["fees"],
            "slippage": simulated["slippage"],
            "latency": simulated["latency"]
        })

    except Exception as e:
        print(f"❌ Simulation Error: {str(e)}")
        return jsonify({"status": "error", "message": f"Simulation error: {str(e)}"}), 500

def find_arbitrage_opportunities(price_data):
    opportunities = []
    exchanges = list(price_data.keys())

    for i in range(len(exchanges)):
        for j in range(len(exchanges)):
            if i == j:
                continue

            buy_exchange = exchanges[i]
            sell_exchange = exchanges[j]
            buy_price = price_data[buy_exchange]
            sell_price = price_data[sell_exchange]

            if sell_price > buy_price:
                realistic = calculate_realistic_arbitrage(
                    buy_exchange, sell_exchange, "BTC", 1000, price_data
                )

                if realistic and realistic["net_profit"] > 0:
                    percentage_diff = (realistic["net_profit"] / 1000) * 100
                    opportunities.append({
                        "buy_from": buy_exchange,
                        "sell_to": sell_exchange,
                        "lowest_price": buy_price,
                        "highest_price": sell_price,
                        "gross_profit": sell_price - buy_price,
                        "net_profit": realistic["net_profit"],
                        "percentage_diff": round(percentage_diff, 4),
                        "fees": realistic["fees"],
                        "slippage": realistic["slippage"],
                        "latency": realistic["latency"],
                        "effective_prices": {
                            "buy": realistic["effective_buy_price"],
                            "sell": realistic["effective_sell_price"]
                        }
                    })

    opportunities.sort(key=lambda x: x["net_profit"], reverse=True)
    return opportunities


def generate_gpt_response(prompt):
    """
    Generate a response from GPT model.
    """
    try:
        response = openai.Completion.create(
            model="text-davinci-003",  # Change as necessary
            prompt=prompt,
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].text.strip()
    except Exception as e:
        print("Error with GPT response:", e)
        return "Sorry, I couldn't process your request."
    
@app.route('/get_trade_feedback', methods=['GET', 'POST'])
def get_trade_feedback():
    try:
        data = request.get_json()
        # Extract relevant data from the request
        trade_amount = data.get('tradeAmount')
        buy_price = data.get('buyPrice')
        sell_price = data.get('sellPrice')
        exchange_buy = data.get('exchangeBuy')
        exchange_sell = data.get('exchangeSell')
        potential_profit = data.get('potentialProfit')
        aggression = data.get('aggression')

        # Format a prompt for the chat model
        prompt = f"""
        I am considering an arbitrage trade with the following details:
        Trade amount: ${trade_amount}
        Buy price: ${buy_price}
        Sell price: ${sell_price}
        Buy on exchange: {exchange_buy}
        Sell on exchange: {exchange_sell}
        Potential profit: ${potential_profit}

        "Looking at the trade, I can see... Based on the details provided, here’s a quick breakdown of the trade:

        Trade Amount: The amount is the initial USD investment before converting to cryptocurrency units (e.g., Bitcoin).
        Key Points to Consider: Highlight any significant factors affecting the trade, such as arbitrage opportunities, price discrepancies, potential profits, and risks.
        Conclusion: Is this trade worth executing, considering the current market conditions and fees?
        Please provide a brief but insightful assessment, focusing on the most important aspects."
        """

        # Send the request to the OpenAI chat completions endpoint
        response = openai.ChatCompletion.create(
            model="gpt-4",  # Use the latest chat model
            messages=[
                {"role": "system", "content": "You are a financial advisor."},
                {"role": "user", "content": prompt}
            ]
        )

        # Get the chat model's response
        feedback = response['choices'][0]['message']['content']
        
        return jsonify({"feedback": feedback})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/ask', methods=['POST'])
def ask():
    try:
        # Get the user's query from the request
        data = request.get_json()
        user_query = data.get('query')

        if not user_query:
            return jsonify({"error": "Query is required"}), 400

        # Call OpenAI's GPT-3.5-turbo model to get a response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Use GPT-3.5-turbo model
            messages=[
                {"role": "system", "content": "You are a knowledgeable financial advisor."},
                {"role": "user", "content": user_query}
            ]
        )

        # Get the response message from GPT
        gpt_response = response['choices'][0]['message']['content']

        # Return the response as JSON
        return jsonify({"response": gpt_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500



def scrape_reddit_bitcoin():
    logging.info("Starting Reddit Scraping...")
    subreddit = reddit.subreddit("Bitcoin")
    posts = subreddit.new(limit=25)  # Fetch latest 25 posts
    filtered_data = []

    current_time = time.time()
    last_24hrs = current_time - (24 * 60 * 60)  # Time threshold (24 hrs ago)

    for post in posts:
        post_time = datetime.fromtimestamp(post.created_utc, timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

        if post.created_utc < last_24hrs:
            continue  # Ignore posts older than 24 hours

        if post.score < 5:
            continue  # Ignore low-engagement posts

        # Extract top 5 comments
        post.comments.replace_more(limit=0)
        top_comments = [comment.body for comment in post.comments.list()[:5]]

        # Get author's Reddit karma
        # Get author's Reddit karma
        author_karma = "Unknown"
        if post.author:
            try:
                author_karma = post.author.link_karma
            except AttributeError:
                author_karma = "Unknown"
            except Exception as e:
                logging.warning(f"Error retrieving karma: {e}")


        filtered_data.append({
            "title": post.title,
            "score": post.score,
            "url": post.url,
            "created": post_time,
            "num_comments": post.num_comments,
            "comments": top_comments,
            "author": post.author.name if post.author else "Deleted",
            "author_karma": author_karma
        })

    logging.info(f"Scraped {len(filtered_data)} high-quality Reddit posts.")
    return filtered_data


def analyze_with_gpt(data):
    messages = [
        {
            "role": "system",
            "content": """
You are an AI analyst summarizing Reddit discussions about Bitcoin.

Respond strictly in this format (case-sensitive and punctuation-sensitive):

SENTIMENT: [Positive/Neutral/Negative]  
MARKET TREND: [Bullish/Bearish/Neutral]  
RECOMMENDATION: [BUY/SELL/HOLD] with [X]% confidence  

KEY FACTORS:
- 🔹 [Reason 1]
- 🔹 [Reason 2]
- 🔹 [Reason 3]

ANALYSIS: [2-3 sentence summary]

⚠️ Make sure to always include the confidence exactly as shown: 'with 75% confidence', using a number and the '%' symbol.
"""
        }
    ]

    for post in data:
        messages.append({
            "role": "user",
            "content": f"""
Title: {post['title']}
Score: {post['score']}
Comments: {', '.join(post['comments']) if post['comments'] else 'No comments provided.'}
Author: {post['author']}
Author Karma: {post['author_karma']}
Date: {post['created']}
"""
        })

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages
    )

    return response['choices'][0]['message']['content']



# Function to extract confidence percentage from GPT output
def extract_confidence(analysis):
    # Try multiple patterns for robustness
    patterns = [
        r'with\s+(\d{1,3})%\s+confidence',  # original
        r'confidence[:\s]+(\d{1,3})%',       # alternative phrasing
        r'(\d{1,3})%\s+confidence',          # confidence after number
    ]
    for pattern in patterns:
        match = re.search(pattern, analysis, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None  # fallback if no match found


# Function to test GPT result consistency
def test_consistency(data, num_trials=10):
    logging.info("Testing GPT result consistency...")
    results = []
    for _ in range(num_trials):
        analysis = analyze_with_gpt(data)
        results.append(analysis)

    consistent = all(res == results[0] for res in results)
    if consistent:
        logging.info("The results are consistent.")
    else:
        logging.info("The results vary.")
        for i, result in enumerate(results):
            logging.info(f"Result {i + 1}: {result}")

    return results

# Function to analyze buy/sell/hold trends
def analyze_action_suggestions(data, num_trials=10):
    logging.info("Analyzing action suggestions...")
    buy_count, sell_count, hold_count = 0, 0, 0

    for _ in range(num_trials):
        analysis = analyze_with_gpt(data)
        if "BUY" in analysis:
            buy_count += 1
        elif "SELL" in analysis:
            sell_count += 1
        elif "HOLD" in analysis:
            hold_count += 1

    total = buy_count + sell_count + hold_count
    buy_pct = round((buy_count / total) * 100, 2) if total else 0
    sell_pct = round((sell_count / total) * 100, 2) if total else 0
    hold_pct = round((hold_count / total) * 100, 2) if total else 0

    logging.info(f"BUY: {buy_pct}% | SELL: {sell_pct}% | HOLD: {hold_pct}%")
    return {"BUY": buy_pct, "SELL": sell_pct, "HOLD": hold_pct}

@app.route("/api/sentiment", methods=["GET"])
def get_sentiment():
    reddit_data = scrape_reddit_bitcoin()
    analysis = analyze_with_gpt(reddit_data)
    
    # Parse the GPT response
    sentiment_match = re.search(r"SENTIMENT:\s*(Positive|Neutral|Negative)", analysis, re.IGNORECASE)
    trend_match = re.search(r"MARKET TREND:\s*(Bullish|Bearish|Neutral)", analysis, re.IGNORECASE)
    recommendation_match = re.search(r"RECOMMENDATION:\s*(BUY|SELL|HOLD)\s*with\s*(\d+)%", analysis, re.IGNORECASE)
    
    # Extract key factors (handle both bullet formats)
    factors_section = re.search(r"KEY FACTORS:(.*?)ANALYSIS:", analysis, re.DOTALL | re.IGNORECASE)
    key_factors = []
    if factors_section:
        key_factors = [
            factor.strip() 
            for factor in re.findall(r"🔹\s*(.+?)\s*-", factors_section.group(1)) or 
                        re.findall(r"-\s*🔹\s*(.+?)\s*(?=\n|$)", factors_section.group(1))
            if factor.strip()
        ]
    
    # Extract analysis summary
    analysis_summary = re.search(r"ANALYSIS:\s*(.+)", analysis, re.DOTALL | re.IGNORECASE)
    
    response = {
        "posts_analyzed": len(reddit_data),
        "sentiment": sentiment_match.group(1) if sentiment_match else "Neutral",
        "market_trend": trend_match.group(1) if trend_match else "Neutral",
        "confidence": int(recommendation_match.group(2)) if recommendation_match else None,
        "recommendation": recommendation_match.group(1) if recommendation_match else "No recommendation",
        "analysis": analysis_summary.group(1).strip() if analysis_summary else analysis,
        "key_factors": key_factors,
        "posts": [{
            "title": post['title'],
            "score": post['score'],
            "num_comments": post['num_comments'],
            "author": post['author'],
            "author_karma": post['author_karma']
        } for post in reddit_data]
    }
    
    return jsonify(response)


__all__ = ['db']
globals()["Transaction"] = Transaction

# Main execution flow
if __name__ == "__main__":
    # Step 5: Start Flask API Server
    logging.info("Starting Flask API Server...")
    app.run(debug=True, use_reloader=True)
    
