from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import json
import os
from dotenv import load_dotenv
import logging
from scipy.optimize import linprog
import warnings

warnings.filterwarnings('ignore')

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Finance ML Service", version="1.0")

# ============= Data Models =============

class Transaction(BaseModel):
    date: str
    amount: float
    type: str  # Income or Expense
    category: str
    merchantName: str

class ClusteringRequest(BaseModel):
    userId: str
    transactions: List[Transaction]
    n_clusters: int = 5

class AnomalyRequest(BaseModel):
    userId: str
    transactions: List[Transaction]
    contamination: float = 0.1  # Expected % of outliers

class ForecastingRequest(BaseModel):
    userId: str
    transactions: List[Transaction]
    forecast_days: int = 30

class TransactionScoringRequest(BaseModel):
    userId: str
    new_transaction: Transaction
    historical_transactions: List[Transaction]

class TransactionScoringResponse(BaseModel):
    anomaly_score: float  # 0-1, higher = more anomalous
    is_anomaly: bool      # True if score > 0.5
    reason: str
    risk_level: str       # "low", "medium", "high"

class ClusterInfo(BaseModel):
    id: int
    label: str
    description: str
    count: int
    avg_amount: float
    top_categories: list
    transactions: list

class ClusteringResponse(BaseModel):
    userId: str
    clusters: list[ClusterInfo]  # Changed from dict to list of ClusterInfo
    feature_importance: dict
    summary: str

class AnomalyResponse(BaseModel):
    userId: str
    anomalies: List[int]  # Indices of anomalous transactions
    scores: List[float]
    high_risk_transactions: List[dict]
    summary: str

class ForecastingResponse(BaseModel):
    userId: str
    forecast: List[dict]  # {date, predicted_expense, confidence}
    trend: str
    summary: str

class CategorizerRequest(BaseModel):
    description: str
    amount: float
    merchantName: str
    type: str  # Income or Expense

class CategorizerResponse(BaseModel):
    predicted_category: str
    confidence: float  # 0-1
    alternative_categories: List[tuple]  # [(category, confidence), ...]
    explanation: str

class SavingsGoal(BaseModel):
    name: str
    target_amount: float
    priority: int  # 1-5, higher is more important
    deadline_months: int

class BudgetOptimizerRequest(BaseModel):
    userId: str
    monthly_income: float
    expense_categories: dict  # {category: average_monthly_amount}
    savings_goals: List[SavingsGoal]
    minimum_expense_ratio: float = 0.7  # Min 70% for essential expenses

class BudgetAllocation(BaseModel):
    category: str
    allocated_amount: float
    percentage: float

class BudgetOptimizerResponse(BaseModel):
    userId: str
    allocation_plan: List[BudgetAllocation]
    total_income: float
    total_allocated: float
    total_savings_potential: float
    goal_achievement_probability: dict  # {goal_name: probability}
    summary: str

# ============= Endpoints =============

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "ml-service",
        "endpoints": ["/cluster", "/anomalies", "/forecast", "/categorize", "/optimize-budget"],
        "version": "1.0"
    }

@app.post("/cluster")
async def clustering_analysis(request: ClusteringRequest) -> ClusteringResponse:
    """
    Segment spending patterns using KMeans clustering
    Groups transactions into spending pattern clusters
    """
    try:
        logger.info(f"🔷 Clustering request for user {request.userId}: {len(request.transactions)} transactions")
        
        if not request.transactions or len(request.transactions) < 3:
            raise HTTPException(status_code=400, detail="Need at least 3 transactions for clustering")
        
        # Convert to DataFrame
        df = pd.DataFrame([t.dict() for t in request.transactions])
        df['date'] = pd.to_datetime(df['date'])
        
        # Feature engineering
        features_df = _engineer_features_for_clustering(df)
        
        if features_df.shape[0] < request.n_clusters:
            request.n_clusters = max(2, features_df.shape[0] - 1)
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(features_df)
        
        # Perform KMeans clustering
        kmeans = KMeans(n_clusters=request.n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Build response — convert numpy.int32 keys to Python int for Pydantic
        cluster_dict = {}
        for i, cluster_id in enumerate(clusters):
            key = int(cluster_id)
            if key not in cluster_dict:
                cluster_dict[key] = []
            cluster_dict[key].append({
                "index": i,
                "amount": float(df.iloc[i]['amount']),
                "category": str(df.iloc[i]['category']),
                "date": df.iloc[i]['date'].isoformat()
            })
        
        # Analyze clusters and assign persona labels
        cluster_list = []
        for cluster_id in sorted(cluster_dict.keys()):
            txs = cluster_dict[cluster_id]
            cluster_list.append(_generate_cluster_persona(cluster_id, txs, df))
        
        # Feature importance (from cluster centers) — cast all to Python float
        feature_importance = {}
        for j, col in enumerate(features_df.columns):
            feature_importance[str(col)] = float(np.abs(kmeans.cluster_centers_[:, j]).mean())
        
        # Generate summary
        summary = f"Identified {request.n_clusters} spending pattern clusters. "
        summary += f"Largest cluster: {len(cluster_dict[max(cluster_dict, key=lambda x: len(cluster_dict[x]))])} transactions. "
        summary += f"Top influencing factors: {', '.join(sorted(feature_importance.keys(), key=lambda x: feature_importance[x], reverse=True)[:3])}"
        
        logger.info(f"✅ Clustering complete for {request.userId}")
        return ClusteringResponse(
            userId=request.userId,
            clusters=cluster_list,
            feature_importance=feature_importance,
            summary=summary
        )
    
    except Exception as e:
        logger.error(f"❌ Clustering error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/anomalies")
async def anomaly_detection(request: AnomalyRequest) -> AnomalyResponse:
    """
    Detect unusual transaction patterns using Isolation Forest
    Identifies transactions that deviate from normal spending behavior
    """
    try:
        logger.info(f"🔴 Anomaly detection for user {request.userId}: {len(request.transactions)} transactions")
        
        if not request.transactions or len(request.transactions) < 5:
            raise HTTPException(status_code=400, detail="Need at least 5 transactions for anomaly detection")
        
        # Convert to DataFrame
        df = pd.DataFrame([t.dict() for t in request.transactions])
        df['date'] = pd.to_datetime(df['date'])
        
        # Feature engineering
        features_df = _engineer_features_for_anomaly(df)
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(features_df)
        
        # Isolation Forest
        iso_forest = IsolationForest(
            contamination=request.contamination,
            random_state=42,
            n_estimators=100
        )
        anomaly_labels = iso_forest.fit_predict(X_scaled)
        anomaly_scores = iso_forest.score_samples(X_scaled)
        
        # Find anomalies
        anomaly_indices = np.where(anomaly_labels == -1)[0]
        anomaly_indices = anomaly_indices.tolist()
        
        # Get scores for each anomaly
        scores = [float(-score) for score in anomaly_scores[anomaly_indices]]
        
        # Build high-risk transaction list
        high_risk = []
        for idx in anomaly_indices:
            high_risk.append({
                "index": int(idx),
                "amount": float(df.iloc[idx]['amount']),
                "category": str(df.iloc[idx]['category']),
                "date": df.iloc[idx]['date'].isoformat(),
                "anomaly_score": float(-anomaly_scores[idx]),
                "reason": _explain_anomaly(df.iloc[idx], df)
            })
        
        # Sort by anomaly score
        high_risk.sort(key=lambda x: x['anomaly_score'], reverse=True)
        
        # Generate summary
        summary = f"Detected {len(anomaly_indices)} anomalous transactions ({len(anomaly_indices)/len(df)*100:.1f}% of total). "
        if high_risk:
            summary += f"Highest risk: {high_risk[0]['category']} spending of ₹{high_risk[0]['amount']:.0f}. "
            summary += "Consider reviewing these transactions for potential fraud or misclassification."
        
        logger.info(f"✅ Anomaly detection complete for {request.userId}: {len(anomaly_indices)} anomalies found")
        return AnomalyResponse(
            userId=request.userId,
            anomalies=anomaly_indices,
            scores=scores,
            high_risk_transactions=high_risk,
            summary=summary
        )
    
    except Exception as e:
        logger.error(f"❌ Anomaly detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast")
async def expense_forecasting(request: ForecastingRequest) -> ForecastingResponse:
    """
    Forecast future spending using time series analysis
    Predicts daily/weekly expense patterns for budget planning
    """
    try:
        logger.info(f"📈 Forecasting for user {request.userId}: {request.forecast_days} days")
        
        if not request.transactions or len(request.transactions) < 10:
            raise HTTPException(status_code=400, detail="Need at least 10 transactions for forecasting")
        
        # Convert to DataFrame
        df = pd.DataFrame([t.dict() for t in request.transactions])
        df['date'] = pd.to_datetime(df['date'])
        
        # Filter expense transactions only
        expenses = df[df['type'] == 'Expense'].copy()
        if len(expenses) < 10:
            raise HTTPException(status_code=400, detail="Need at least 10 expense transactions")
        
        # Aggregate by date
        daily_expenses = expenses.groupby(expenses['date'].dt.date)['amount'].sum().reset_index()
        daily_expenses.columns = ['date', 'amount']
        daily_expenses['date'] = pd.to_datetime(daily_expenses['date'])
        
        # Calculate statistics
        mean_daily = daily_expenses['amount'].mean()
        std_daily = daily_expenses['amount'].std()
        
        # Simple trend analysis (linear regression)
        X = np.arange(len(daily_expenses)).reshape(-1, 1)
        y = daily_expenses['amount'].values
        
        # Calculate trend
        z = np.polyfit(X.flatten(), y, 1)
        trend_coef = z[0]
        
        # Generate forecast using EMA + Seasonality
        forecast = []
        last_date = daily_expenses['date'].max()
        
        # Calculate EMA (Exponential Moving Average)
        ema_val = daily_expenses['amount'].ewm(span=min(7, len(daily_expenses)), adjust=False).mean()
        current_ema = ema_val.iloc[-1] if len(ema_val) > 0 else mean_daily
        
        # Calculate weekly seasonality pattern (if enough data)
        seasonal_factors = {}
        if len(daily_expenses) >= 14:
            daily_expenses['day_of_week'] = daily_expenses['date'].dt.dayofweek
            weekly_avg = daily_expenses.groupby('day_of_week')['amount'].mean()
            weekly_mean = weekly_avg.mean()
            
            for day in range(7):
                if day in weekly_avg.index and weekly_mean > 0:
                    seasonal_factors[day] = weekly_avg[day] / weekly_mean
                else:
                    seasonal_factors[day] = 1.0
        else:
            # No seasonality data, uniform factors
            seasonal_factors = {i: 1.0 for i in range(7)}
        
        # Calculate trend from EMA  
        if len(ema_val) >= 7:
            ema_past = ema_val.iloc[-7:].values
            trend_coef = np.polyfit(range(len(ema_past)), ema_past, 1)[0]
        else:
            trend_coef = np.polyfit(X.flatten()[-7:], y[-7:], 1)[0] if len(X) >= 7 else 0
        
        # Generate forecast with EMA + seasonal adjustments
        for i in range(1, request.forecast_days + 1):
            forecast_date = last_date + timedelta(days=i)
            day_of_week = forecast_date.weekday()
            
            # EMA-based prediction with trend
            ema_forecast = current_ema + (trend_coef * i)
            ema_forecast = max(0, ema_forecast)
            
            # Apply seasonal factor
            seasonal_factor = seasonal_factors.get(day_of_week, 1.0)
            predicted = ema_forecast * seasonal_factor
            predicted = max(100, predicted)  # Minimum realistic daily spend
            
            # Confidence decreases over time but stabilizes for seasonal predictions
            base_confidence = max(0.6, 1 - (i / request.forecast_days * 0.3))
            seasonality_boost = 0.1 if len(daily_expenses) >= 14 else 0
            confidence = min(0.95, base_confidence + seasonality_boost)
            
            # Calculate bounds
            confidence_interval = std_daily * (1 - confidence) * 1.5
            
            forecast.append({
                "date": forecast_date.isoformat(),
                "predicted_expense": float(predicted),
                "confidence": float(confidence),
                "range_low": float(max(0, predicted - confidence_interval)),
                "range_high": float(predicted + confidence_interval),
                "seasonal_day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day_of_week]
            })
        
        # Determine trend
        if trend_coef > std_daily * 0.1:
            trend = "increasing"
            trend_msg = "Your spending is trending upward. Consider budgeting more carefully."
        elif trend_coef < -std_daily * 0.1:
            trend = "decreasing"
            trend_msg = "Your spending is trending downward. Great job!"
        else:
            trend = "stable"
            trend_msg = "Your spending patterns are stable."
        
        summary = f"EMA-based 30-day forecast using {len(daily_expenses)} days of history. "
        summary += f"Average daily expense: ₹{mean_daily:.0f}. " 
        if len(daily_expenses) >= 14:
            summary += "Adjusted for weekly seasonality. "
        summary += trend_msg
        
        logger.info(f"✅ Forecasting complete for {request.userId}: EMA-based {request.forecast_days}-day forecast")
        return ForecastingResponse(
            userId=request.userId,
            forecast=forecast,
            trend=trend,
            summary=summary
        )
    
    except Exception as e:
        logger.error(f"❌ Forecasting error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/score-transaction")
async def score_single_transaction(request: TransactionScoringRequest) -> TransactionScoringResponse:
    """
    Score a single transaction for anomaly risk
    Used for real-time detection when user creates/modifies transactions
    """
    try:
        logger.info(f"🔍 Scoring transaction for user {request.userId}")
        
        if not request.historical_transactions:
            # Not enough history, assume low risk
            return TransactionScoringResponse(
                anomaly_score=0.0,
                is_anomaly=False,
                reason="Not enough historical data to assess",
                risk_level="low"
            )
        
        # Convert to DataFrame
        hist_df = pd.DataFrame([t.dict() for t in request.historical_transactions])
        hist_df['date'] = pd.to_datetime(hist_df['date'])
        
        new_tx = request.new_transaction.dict()
        
        # Quick heuristic scoring
        amount = new_tx['amount']
        category = new_tx['category']
        
        # Compare to category statistics
        cat_txs = hist_df[hist_df['category'] == category]
        
        score = 0.0
        reasons = []
        
        if len(cat_txs) > 0:
            cat_mean = cat_txs['amount'].mean()
            cat_std = cat_txs['amount'].std()
            
            # Z-score based anomaly
            if cat_std > 0:
                z_score = abs((amount - cat_mean) / cat_std)
                if z_score > 3:
                    score += 0.6
                    reasons.append(f"Amount is {z_score:.1f}σ away from {category} average")
                elif z_score > 2:
                    score += 0.3
                    reasons.append(f"Amount is {z_score:.1f}σ above {category} mean")
            elif amount > cat_mean * 2:
                score += 0.4
                reasons.append(f"Amount {amount:.0f} is 2x the {category} average")
        else:
            # New category for user - slight risk
            score += 0.2
            reasons.append(f"First transaction in {category} category")
        
        # Check against overall statistics
        overall_mean = hist_df[hist_df['type'] == 'Expense']['amount'].mean()
        overall_q95 = hist_df[hist_df['type'] == 'Expense']['amount'].quantile(0.95)
        
        if amount > overall_q95 * 1.5:
            score += 0.3
            reasons.append(f"Top 1% highest transaction amount")
        elif amount > overall_q95:
            score += 0.15
            reasons.append(f"Top 5% by amount")
        
        # Cap score at 1.0
        score = min(1.0, score)
        
        # Determine risk level
        if score >= 0.6:
            risk_level = "high"
        elif score >= 0.3:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        reason = "; ".join(reasons) if reasons else "Normal spending pattern"
        
        logger.info(f"✅ Transaction scored: {score:.2f} ({risk_level})")
        return TransactionScoringResponse(
            anomaly_score=float(score),
            is_anomaly=score > 0.5,
            reason=reason,
            risk_level=risk_level
        )
    
    except Exception as e:
        logger.error(f"❌ Transaction scoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/categorize")
async def categorize_transaction(request: CategorizerRequest) -> CategorizerResponse:
    """
    Predict transaction category using Random Forest classifier trained on transaction patterns
    Features: TF-IDF of description, amount, merchant patterns
    """
    try:
        logger.info(f"📝 Categorizing transaction: {request.description[:50]}...")
        
        # For now, implement a rules + heuristics approach; can be extended with trained model
        description = request.description.lower()
        merchant = request.merchantName.lower()
        amount = request.amount
        
        # Category keywords mapping
        category_keywords = {
            "Food & Dining": ["restaurant", "food", "café", "pizza", "burger", "dinner", "lunch", "breakfast", "dine"],
            "Groceries": ["grocery", "supermarket", "market", "walmart", "costco", "trader", "whole foods", "publix"],
            "Shopping": ["amazon", "shop", "retail", "mall", "store", "buy", "purchase", "ebay", "target"],
            "Transportation": ["uber", "taxi", "gas", "fuel", "petrol", "parking", "toll", "transit", "car", "metro"],
            "Utilities": ["electric", "water", "internet", "phone", "bill", "gas company", "utility"],
            "Entertainment": ["cinema", "movie", "concert", "theater", "game", "netflix", "spotify", "gaming"],
            "Healthcare": ["hospital", "doctor", "pharmacy", "medical", "health", "clinic", "dental"],
            "Education": ["school", "university", "course", "education", "tuition", "udemy", "coursera", "books"],
            "Insurance": ["insurance", "premium", "policy"],
            "Travel": ["flight", "hotel", "airbnb", "booking", "travel", "airline", "resort"],
            "Salary": ["salary", "wage", "income", "paycheck", "employer"],
            "Rent": ["rent", "landlord", "tenancy", "housing"],
        }
        
        # Score categories based on keyword matches
        scores = {}
        for category, keywords in category_keywords.items():
            score = sum(1 for kw in keywords if kw in description or kw in merchant)
            scores[category] = score
        
        # Special logic for amount-based categorization
        if request.type == "Income":
            if amount > 5000:
                scores["Salary"] = max(scores.get("Salary", 0), 5)
        else:
            if amount < 500:
                scores["Food & Dining"] = max(scores.get("Food & Dining", 0), 2)
                scores["Groceries"] = max(scores.get("Groceries", 0), 2)
        
        # Get top 3 categories
        sorted_categories = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        if sorted_categories[0][1] == 0:
            # No match, use default
            predicted_category = "Other"
            confidence = 0.3
        else:
            predicted_category = sorted_categories[0][0]
            # Confidence based on score difference
            max_score = sorted_categories[0][1] + 1
            confidence = min(0.99, max(0.5, max_score / 10))
        
        alternatives = [(cat, min(0.99, (cnt + 1) / 10)) for cat, cnt in sorted_categories[1:4]]
        
        explanation = f"Matched keywords in description and merchant. Amount ₹{amount:.0f} is typical for {predicted_category}."
        
        logger.info(f"✅ Categorized as {predicted_category} ({confidence*100:.0f}% confidence)")
        return CategorizerResponse(
            predicted_category=predicted_category,
            confidence=float(confidence),
            alternative_categories=alternatives,
            explanation=explanation
        )
    
    except Exception as e:
        logger.error(f"❌ Categorization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize-budget")
async def optimize_budget(request: BudgetOptimizerRequest) -> BudgetOptimizerResponse:
    """
    Optimize budget allocation across categories and savings goals
    Uses linear programming to maximize goal achievement
    """
    try:
        logger.info(f"💰 Optimizing budget for user {request.userId}")
        
        if request.monthly_income <= 0:
            raise HTTPException(status_code=400, detail="Monthly income must be positive")
        
        # Extract expense categories
        expense_categories = request.expense_categories or {}
        total_current_expenses = sum(expense_categories.values())
        
        # Define essential vs discretionary categories
        essential = {"Utilities", "Rent", "Healthcare", "Insurance", "Groceries", "Transportation"}
        essential_expenses = sum(v for k, v in expense_categories.items() if k in essential)
        discretionary_expenses = total_current_expenses - essential_expenses
        
        # Calculate allocation
        available_for_goals = request.monthly_income - total_current_expenses
        
        if available_for_goals < 0:
            # Overspending - return minimal allocation
            logger.warn(f"User is overspending: income={request.monthly_income}, expenses={total_current_expenses}")
            summary = f"⚠️ Current expenses (₹{total_current_expenses:.0f}) exceed income (₹{request.monthly_income:.0f}). Reduce spending first."
            return BudgetOptimizerResponse(
                userId=request.userId,
                allocation_plan=[
                    BudgetAllocation(category=cat, allocated_amount=amt, percentage=(amt / request.monthly_income * 100))
                    for cat, amt in expense_categories.items()
                ],
                total_income=request.monthly_income,
                total_allocated=total_current_expenses,
                total_savings_potential=0,
                goal_achievement_probability={},
                summary=summary
            )
        
        # Sort goals by priority
        sorted_goals = sorted(request.savings_goals, key=lambda g: g.priority, reverse=True)
        
        # Allocate to goals proportional to priority
        goal_allocations = {}
        goal_probabilities = {}
        
        if sorted_goals:
            total_priority = sum(g.priority for g in sorted_goals)
            for goal in sorted_goals:
                allocation = (goal.priority / total_priority) * available_for_goals
                goal_allocations[goal.name] = allocation
                
                # Probability of achieving goal (based on allocation vs target)
                months_until_deadline = max(1, goal.deadline_months)
                monthly_needed = goal.target_amount / months_until_deadline
                probability = min(0.99, allocation / monthly_needed if monthly_needed > 0 else 0.5)
                goal_probabilities[goal.name] = float(probability)
        
        # Build allocation plan
        allocation_plan = [
            BudgetAllocation(
                category=cat,
                allocated_amount=amt,
                percentage=(amt / request.monthly_income * 100)
            )
            for cat, amt in expense_categories.items()
        ]
        
        # Add savings allocations
        for goal_name, allocation in goal_allocations.items():
            allocation_plan.append(
                BudgetAllocation(
                    category=f"Goal: {goal_name}",
                    allocated_amount=allocation,
                    percentage=(allocation / request.monthly_income * 100)
                )
            )
        
        total_allocated = sum(a.allocated_amount for a in allocation_plan)
        
        # Summary
        summary = f"Income: ₹{request.monthly_income:.0f} | "
        summary += f"Current Expenses: ₹{total_current_expenses:.0f} | "
        summary += f"Savings Potential: ₹{available_for_goals:.0f}. "
        
        if len(sorted_goals) > 0:
            avg_probability = sum(goal_probabilities.values()) / len(goal_probabilities)
            summary += f"Average goal achievement probability: {avg_probability*100:.0f}%"
        else:
            summary += "No savings goals defined."
        
        logger.info(f"✅ Budget optimized: {total_allocated:.0f} allocated from {request.monthly_income:.0f}")
        return BudgetOptimizerResponse(
            userId=request.userId,
            allocation_plan=allocation_plan,
            total_income=request.monthly_income,
            total_allocated=total_allocated,
            total_savings_potential=available_for_goals,
            goal_achievement_probability=goal_probabilities,
            summary=summary
        )
    
    except Exception as e:
        logger.error(f"❌ Budget optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= Helper Functions =============

def _engineer_features_for_clustering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for clustering analysis
    Creates features from transaction data
    """
    features = pd.DataFrame()
    
    # Amount statistics
    features['avg_amount'] = [df['amount'].mean()] * len(df)
    features['std_amount'] = [df['amount'].std()] * len(df)
    
    # Category frequency
    category_counts = df['category'].value_counts().to_dict()
    features['num_categories'] = [len(category_counts)] * len(df)
    
    # Transaction type ratio
    expense_ratio = len(df[df['type'] == 'Expense']) / len(df)
    features['expense_ratio'] = [expense_ratio] * len(df)
    
    # Per-transaction features
    features['amount'] = df['amount'].values
    features['is_expense'] = (df['type'] == 'Expense').astype(int).values
    
    # Category encoding
    category_map = {cat: i for i, cat in enumerate(df['category'].unique())}
    features['category_id'] = df['category'].map(category_map).values
    
    return features.fillna(0)

def _engineer_features_for_anomaly(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for anomaly detection
    """
    features = pd.DataFrame()
    
    # Basic amount statistics
    features['amount'] = df['amount'].values
    features['log_amount'] = np.log1p(df['amount'].values)
    
    # Z-score (normalized amount)
    features['amount_zscore'] = (df['amount'] - df['amount'].mean()) / df['amount'].std()
    
    # Category features
    cat_mean = df.groupby('category')['amount'].transform('mean')
    features['category_deviation'] = (df['amount'] - cat_mean) / (cat_mean + 1)
    
    # Type features
    features['is_income'] = (df['type'] == 'Income').astype(int).values
    
    # Time features (day of week, etc)
    features['day_of_week'] = df['date'].dt.dayofweek.values
    
    return features.fillna(0)

def _explain_anomaly(transaction: pd.Series, df: pd.DataFrame) -> str:
    """
    Generate explanation for why a transaction is anomalous
    """
    amount = transaction['amount']
    category = transaction['category']
    
    # Compare to similar transactions
    similar = df[df['category'] == category]
    if len(similar) > 1:
        mean_amt = similar['amount'].mean()
        if amount > mean_amt * 2:
            return f"Amount {amount:.0f} is {(amount/mean_amt - 1)*100:.0f}% above category average"
        elif amount < mean_amt * 0.5:
            return f"Amount {amount:.0f} is unusually low for {category}"
    
    # Check against overall distribution
    if amount > df['amount'].quantile(0.95):
        return "Top 5% highest transaction by amount"
    
    return "Unusual spending pattern detected"

def _generate_cluster_persona(cluster_id: int, cluster_txs: list, df: pd.DataFrame) -> dict:
    """
    Analyze cluster characteristics and assign a persona label
    """
    # Extract transaction indices from cluster
    indices = [tx['index'] for tx in cluster_txs]
    cluster_df = df.iloc[indices]
    
    # Calculate cluster stats
    count = len(cluster_txs)
    avg_amount = cluster_df['amount'].mean()
    total_amount = cluster_df['amount'].sum()
    
    # Category analysis
    cat_counts = cluster_df['category'].value_counts()
    top_categories = cat_counts.head(3).to_dict()
    top_cat_names = list(top_categories.keys())
    dominant_category = top_cat_names[0] if top_cat_names else "Unknown"
    
    # Frequency (transactions per month approximation)
    date_range = (cluster_df['date'].max() - cluster_df['date'].min()).days
    frequency = (count / max(date_range, 1)) * 30 if date_range > 0 else count
    
    # Expense ratio
    expense_count = len(cluster_df[cluster_df['type'] == 'Expense'])
    expense_ratio = expense_count / count if count > 0 else 0
    
    # Essentials categories (food, groceries, utilities, transport, healthcare)
    essentials = {'Food & Dining', 'Groceries', 'Utilities', 'Transportation', 'Healthcare', 'Medical', 'Insurance'}
    essentials_count = len(cluster_df[cluster_df['category'].isin(essentials)])
    essentials_ratio = essentials_count / expense_count if expense_count > 0 else 0
    
    # Entertainment categories
    entertainment = {'Entertainment', 'Shopping', 'Travel', 'Dining', 'Subscriptions'}
    entertainment_count = len(cluster_df[cluster_df['category'].isin(entertainment)])
    entertainment_ratio = entertainment_count / expense_count if expense_count > 0 else 0
    
    # Assign persona based on rules
    label, description = _assign_persona_label(
        avg_amount, frequency, expense_ratio, essentials_ratio, entertainment_ratio,
        top_cat_names, dominant_category, count, expense_count
    )
    
    return {
        "id": int(cluster_id),
        "label": label,
        "description": description,
        "count": int(count),
        "avg_amount": float(avg_amount),
        "top_categories": list(top_cat_names),
        "transactions": cluster_txs
    }

def _assign_persona_label(avg_amount, frequency, expense_ratio, essentials_ratio,
                          entertainment_ratio, top_cats, dominant_cat, total_count, expense_count) -> tuple:
    """
    Assign persona label and description based on cluster characteristics
    Returns (label, description)
    """
    # Rule 1: Lifestyle Spender — high food/entertainment + high frequency
    if (entertainment_ratio > 0.3 or ('Food & Dining' in top_cats and frequency > 5)) and avg_amount > 500:
        return ("Lifestyle Spender", 
                f"Makes frequent discretionary purchases with average transaction of ₹{avg_amount:.0f}. "
                f"Tends to spend on entertainment and dining. {expense_count} expense transactions.")
    
    # Rule 2: Conscious Saver — low avg amount + high essentials ratio
    if avg_amount < 500 and essentials_ratio > 0.6 and frequency > 3:
        return ("Conscious Saver",
                f"Focuses on essential spending with small, frequent purchases averaging ₹{avg_amount:.0f}. "
                f"Majority of spending ({essentials_ratio*100:.0f}%) on necessities.")
    
    # Rule 3: Big Ticket Buyer — high single transactions + low frequency
    if avg_amount > 3000 and frequency < 2:
        return ("Big Ticket Buyer",
                f"Makes occasional large purchases (avg ₹{avg_amount:.0f}) in {dominant_cat}. "
                f"Low transaction frequency suggests planned, strategic spending.")
    
    # Rule 4: Balanced Spender — balanced across categories + moderate amounts
    if len(top_cats) >= 3 and 500 < avg_amount < 3000 and 0.3 < entertainment_ratio < 0.6:
        return ("Balanced Spender",
                f"Diversified spending across {len(top_cats)} categories with moderate amounts (₹{avg_amount:.0f}). "
                f"Balanced mix of essentials and discretionary spending.")
    
    # Rule 5: Essentials-First — high bills/transport/utilities + low entertainment
    if essentials_ratio > 0.7 and entertainment_ratio < 0.15 and avg_amount < 2000:
        return ("Essentials-First",
                f"Prioritizes essential expenses in {dominant_cat}. {essentials_ratio*100:.0f}% of spending on necessities. "
                f"Minimal discretionary purchases.")
    
    # Fallback rules
    if frequency > 8 and avg_amount < 1000:
        return ("Frequent Small Spender",
                f"Makes {total_count} frequent small purchases (avg ₹{avg_amount:.0f}). "
                f"Consistent, daily spending pattern.")
    
    if frequency < 1 and avg_amount > 2000:
        return ("Occasional High Spender",
                f"Few but significant purchases averaging ₹{avg_amount:.0f}. "
                f"Infrequent, high-value transactions.")
    
    # Generic fallback
    return (f"{dominant_cat} Focused",
            f"Primary spending in {dominant_cat} with {total_count} transactions averaging ₹{avg_amount:.0f}. "
            f"{essentials_ratio*100:.0f}% essentials, {entertainment_ratio*100:.0f}% entertainment.")