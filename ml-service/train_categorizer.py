"""
Transaction Categorizer Training Script
Trains a Random Forest classifier with TF-IDF features for transaction categorization
"""

import json
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, GroupShuffleSplit, GroupKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
from typing import Tuple, Dict, Any, Optional
from model_manager import model_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TransactionCategorizerTrainer:
    """Train Random Forest categorizer with TF-IDF features"""
    
    def __init__(self):
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.scaler: Optional[StandardScaler] = None
        self.rf_classifier: Optional[RandomForestClassifier] = None
        self.categories: list = []
        self.metrics: Dict[str, Any] = {}
        
    def prepare_training_data(self, transactions: list) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare features and labels from raw transactions
        Features: TF-IDF(description + merchant), amount (log), type
        """
        descriptions = []
        amounts = []
        types = []
        labels = []
        merchants = []
        
        for tx in transactions:
            if 'category' not in tx or not tx['category']:
                continue
                
            # Combine description and merchant for TF-IDF
            merchant_name = str(tx.get('merchantName', '')).strip()
            text = f"{merchant_name} {tx.get('description', '')}"
            descriptions.append(text.lower())
            
            # Amount feature (log scale to handle outliers)
            amounts.append(np.log1p(float(tx['amount'])))
            
            # Type feature (1 for Income, 0 for Expense)
            types.append(1.0 if tx['type'] == 'Income' else 0.0)
            
            labels.append(tx['category'])
            merchants.append(merchant_name.lower() if merchant_name else "unknown_merchant")
        
        if not descriptions:
            raise ValueError("No valid transactions found for training")
        
        # Extract TF-IDF features
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=200,      # Top 200 features
            min_df=2,              # Min 2 documents
            max_df=0.8,            # Max 80% documents
            ngram_range=(1, 2),    # Unigrams and bigrams
            strip_accents='unicode',
            token_pattern=r'\b\w+\b'
        )
        
        tfidf_features = self.tfidf_vectorizer.fit_transform(descriptions).toarray()
        logger.info(f"✅ TF-IDF extracted {tfidf_features.shape[1]} features")
        
        # Combine all features
        amounts_arr = np.array(amounts).reshape(-1, 1)
        types_arr = np.array(types).reshape(-1, 1)
        
        X = np.hstack([tfidf_features, amounts_arr, types_arr])
        y = np.array(labels)
        
        # Track categories
        self.categories = list(np.unique(y))
        
        groups = np.array(merchants)
        return X, y, groups
    
    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        groups: Optional[np.ndarray] = None,
        test_size: float = 0.2,
        use_grid_search: bool = True,
        realistic_eval: bool = True
    ) -> Dict[str, Any]:
        """Train Random Forest classifier with optional GridSearchCV and group-aware validation"""
        
        # Check class balance for stratification
        unique_counts = np.unique(y, return_counts=True)[1]
        min_samples_per_class = np.min(unique_counts)
        
        # Only stratify if all classes have at least 2 samples
        stratify = y if min_samples_per_class >= 2 else None
        
        # Adjust test_size if needed to ensure minimum samples per class
        if stratify is None and min_samples_per_class == 1:
            test_size = 0.1  # Smaller test set to preserve single-sample classes
        
        # Split data
        split_strategy = "stratified_random"
        if realistic_eval and groups is not None:
            unique_groups = np.unique(groups)
            if unique_groups.size >= 10:
                splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=42)
                train_idx, test_idx = next(splitter.split(X, y, groups=groups))
                X_train, X_test = X[train_idx], X[test_idx]
                y_train, y_test = y[train_idx], y[test_idx]
                groups_train = groups[train_idx]
                groups_test = groups[test_idx]
                split_strategy = "merchant_disjoint"
            else:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42, stratify=stratify
                )
                groups_train = None
                groups_test = None
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=stratify
            )
            groups_train = None
            groups_test = None
        
        logger.info(f"📊 Training set: {X_train.shape[0]}, Test set: {X_test.shape[0]}")
        
        # Hyperparameter tuning with GridSearchCV if dataset is large enough
        cv_for_tuning = 5
        if split_strategy == "merchant_disjoint" and groups_train is not None:
            unique_train_groups = np.unique(groups_train).size
            if unique_train_groups >= 5:
                cv_for_tuning = GroupKFold(n_splits=5)

        if use_grid_search and len(X_train) >= 250:
            logger.info("🔍 Running GridSearchCV for hyperparameter tuning...")
            param_grid = {
                'n_estimators': [150, 200, 250, 300],
                'max_depth': [15, 20, 25, 30],
                'min_samples_split': [3, 5, 7],
                'min_samples_leaf': [1, 2, 3]
            }
            
            base_rf = RandomForestClassifier(
                random_state=42,
                n_jobs=-1,
                class_weight='balanced'
            )
            
            grid_search = GridSearchCV(
                base_rf, param_grid, cv=cv_for_tuning, scoring='f1_weighted', n_jobs=-1, verbose=0
            )
            if isinstance(cv_for_tuning, GroupKFold) and groups_train is not None:
                grid_search.fit(X_train, y_train, groups=groups_train)
            else:
                grid_search.fit(X_train, y_train)
            
            logger.info(f"✅ Best parameters found: {grid_search.best_params_}")
            logger.info(f"✅ Best CV F1 score: {grid_search.best_score_:.3f}")
            
            self.rf_classifier = grid_search.best_estimator_
        else:
            # Train Random Forest with default hyperparameters
            self.rf_classifier = RandomForestClassifier(
                n_estimators=200,          # More trees for better accuracy
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
                class_weight='balanced'    # Handle class imbalance
            )
            self.rf_classifier.fit(X_train, y_train)
        
        logger.info("✅ Random Forest trained")
        
        # Evaluate
        y_pred = self.rf_classifier.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Cross-validation
        if split_strategy == "merchant_disjoint" and groups_train is not None and np.unique(groups_train).size >= 5:
            cv_scores = cross_val_score(
                self.rf_classifier,
                X_train,
                y_train,
                cv=GroupKFold(n_splits=5),
                groups=groups_train,
                scoring='f1_weighted'
            )
        else:
            cv_scores = cross_val_score(self.rf_classifier, X_train, y_train, cv=5, scoring='f1_weighted')
        
        self.metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "cv_mean": float(cv_scores.mean()),
            "cv_std": float(cv_scores.std()),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "num_categories": len(self.categories),
            "categories": self.categories,
            "split_strategy": split_strategy
        }

        if split_strategy == "merchant_disjoint" and groups_train is not None and groups_test is not None:
            self.metrics["train_unique_merchants"] = int(np.unique(groups_train).size)
            self.metrics["test_unique_merchants"] = int(np.unique(groups_test).size)
        
        # Feature importance
        feature_names = [
            *self.tfidf_vectorizer.get_feature_names_out(),
            'log_amount',
            'type'
        ]
        feature_importance = {
            name: float(importance)
            for name, importance in zip(
                feature_names,
                self.rf_classifier.feature_importances_
            )
        }
        # Top 10 features
        self.metrics["top_features"] = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        logger.info(f"📈 Accuracy: {accuracy:.3f}, Precision: {precision:.3f}, "
                   f"Recall: {recall:.3f}, F1: {f1:.3f}")
        logger.info(f"📊 Cross-validation (5-fold): {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        logger.info(f"\n{classification_report(y_test, y_pred)}")
        
        return self.metrics
    
    def save_model(self) -> str:
        """Save trained model and vectorizer"""
        if not self.rf_classifier:
            raise ValueError("No trained model to save")
        
        # Save both models together in a dict
        model_bundle = {
            'classifier': self.rf_classifier,
            'tfidf_vectorizer': self.tfidf_vectorizer,
            'categories': self.categories
        }
        
        version_id = model_manager.save_model(
            model_bundle,
            'transaction_categorizer',
            {
                **self.metrics,
                "model_type": "RandomForest + TF-IDF"
            }
        )
        
        return version_id
    
    @staticmethod
    def load_sample_data() -> list:
        """Load synthetic training data with strong category balance for local model training"""
        rng = np.random.default_rng(42)

        base_samples = [
            {"description": "Starbucks coffee", "merchantName": "Starbucks", "amount": 260, "type": "Expense", "category": "Food & Dining"},
            {"description": "Dinner at restaurant", "merchantName": "Olive Garden", "amount": 1800, "type": "Expense", "category": "Food & Dining"},
            {"description": "Weekly groceries", "merchantName": "Walmart", "amount": 2100, "type": "Expense", "category": "Groceries"},
            {"description": "Fresh vegetables", "merchantName": "Local Market", "amount": 780, "type": "Expense", "category": "Groceries"},
            {"description": "Online shopping order", "merchantName": "Amazon", "amount": 1400, "type": "Expense", "category": "Shopping"},
            {"description": "Electronics purchase", "merchantName": "Best Buy", "amount": 4800, "type": "Expense", "category": "Shopping"},
            {"description": "Uber ride", "merchantName": "Uber", "amount": 380, "type": "Expense", "category": "Transportation"},
            {"description": "Fuel refill", "merchantName": "Shell", "amount": 1700, "type": "Expense", "category": "Transportation"},
            {"description": "Electricity bill", "merchantName": "Power Company", "amount": 2600, "type": "Expense", "category": "Utilities"},
            {"description": "Internet bill", "merchantName": "Airtel Broadband", "amount": 1200, "type": "Expense", "category": "Utilities"},
            {"description": "Netflix subscription", "merchantName": "Netflix", "amount": 499, "type": "Expense", "category": "Entertainment"},
            {"description": "Movie tickets", "merchantName": "PVR Cinemas", "amount": 700, "type": "Expense", "category": "Entertainment"},
            {"description": "Doctor consultation", "merchantName": "City Hospital", "amount": 2400, "type": "Expense", "category": "Healthcare"},
            {"description": "Pharmacy medicine", "merchantName": "Apollo Pharmacy", "amount": 980, "type": "Expense", "category": "Healthcare"},
            {"description": "Online course purchase", "merchantName": "Udemy", "amount": 599, "type": "Expense", "category": "Education"},
            {"description": "Tuition payment", "merchantName": "University", "amount": 42000, "type": "Expense", "category": "Education"},
            {"description": "Health insurance premium", "merchantName": "Aetna", "amount": 14000, "type": "Expense", "category": "Insurance"},
            {"description": "Car insurance renewal", "merchantName": "Geico", "amount": 11000, "type": "Expense", "category": "Insurance"},
            {"description": "Flight ticket booking", "merchantName": "IndiGo", "amount": 9200, "type": "Expense", "category": "Travel"},
            {"description": "Hotel reservation", "merchantName": "Marriott", "amount": 6800, "type": "Expense", "category": "Travel"},
            {"description": "Monthly salary credit", "merchantName": "Employer Corp", "amount": 150000, "type": "Income", "category": "Salary"},
            {"description": "Freelance payout", "merchantName": "Upwork", "amount": 32000, "type": "Income", "category": "Salary"},
            {"description": "House rent payment", "merchantName": "Landlord", "amount": 28000, "type": "Expense", "category": "Rent"},
            {"description": "Apartment lease rent", "merchantName": "Property Management", "amount": 31000, "type": "Expense", "category": "Rent"}
        ]

        category_specs = {
            "Food & Dining": {
                "merchants": ["Starbucks", "Dominos", "KFC", "Subway", "Cafe Coffee Day", "Zomato", "Swiggy", "Burger King"],
                "phrases": ["coffee", "lunch", "dinner", "food delivery", "restaurant bill", "takeout", "brunch"],
                "amount": (120, 3200),
                "type": "Expense",
                "count": 140
            },
            "Groceries": {
                "merchants": ["Walmart", "Whole Foods", "Costco", "Dmart", "Big Bazaar", "Instacart", "Safeway"],
                "phrases": ["grocery shopping", "weekly groceries", "fresh produce", "pantry refill", "supermarket order"],
                "amount": (250, 5200),
                "type": "Expense",
                "count": 120
            },
            "Shopping": {
                "merchants": ["Amazon", "Flipkart", "Myntra", "Apple Store", "Best Buy", "Nike", "Zara"],
                "phrases": ["online order", "retail purchase", "electronics", "fashion shopping", "checkout"],
                "amount": (300, 45000),
                "type": "Expense",
                "count": 140
            },
            "Transportation": {
                "merchants": ["Uber", "Ola", "Shell", "Lyft", "Metro Transit", "BP", "Chevron"],
                "phrases": ["ride fare", "cab trip", "fuel refill", "metro pass", "parking fee", "toll payment"],
                "amount": (50, 3500),
                "type": "Expense",
                "count": 120
            },
            "Utilities": {
                "merchants": ["Power Company", "Water Department", "Airtel Broadband", "Jio Fiber", "AT&T", "PG&E"],
                "phrases": ["electricity bill", "water bill", "internet bill", "phone bill", "utility payment"],
                "amount": (200, 4200),
                "type": "Expense",
                "count": 110
            },
            "Entertainment": {
                "merchants": ["Netflix", "Spotify", "Disney+", "PVR Cinemas", "Steam", "BookMyShow", "Hulu"],
                "phrases": ["subscription", "movie ticket", "concert booking", "gaming purchase", "streaming plan"],
                "amount": (80, 6000),
                "type": "Expense",
                "count": 200
            },
            "Healthcare": {
                "merchants": ["City Hospital", "Apollo Pharmacy", "CVS", "Diagnostic Center", "Urgent Care", "Walgreens"],
                "phrases": ["doctor visit", "medicine", "lab test", "health checkup", "consultation", "therapy session"],
                "amount": (300, 9000),
                "type": "Expense",
                "count": 200
            },
            "Education": {
                "merchants": ["Udemy", "Coursera", "University", "Khan Academy", "Codecademy", "Pluralsight"],
                "phrases": ["course enrollment", "tuition fee", "exam prep", "book purchase", "learning subscription"],
                "amount": (150, 60000),
                "type": "Expense",
                "count": 200
            },
            "Insurance": {
                "merchants": ["Aetna", "Geico", "State Farm", "LIC", "Allstate", "ICICI Insurance"],
                "phrases": ["insurance premium", "policy renewal", "coverage payment", "annual premium"],
                "amount": (2500, 24000),
                "type": "Expense",
                "count": 90
            },
            "Travel": {
                "merchants": ["IndiGo", "SpiceJet", "Airbnb", "Marriott", "OYO", "Indian Railways", "Booking.com"],
                "phrases": ["flight booking", "hotel booking", "train ticket", "travel package", "resort stay"],
                "amount": (500, 18000),
                "type": "Expense",
                "count": 170
            },
            "Salary": {
                "merchants": ["Employer Corp", "Upwork", "Fiverr", "Toptal", "Client Payment", "Payroll"],
                "phrases": ["salary credit", "freelance payment", "bonus payout", "consulting income", "project payment"],
                "amount": (8000, 180000),
                "type": "Income",
                "count": 100
            },
            "Rent": {
                "merchants": ["Landlord", "Property Management", "Apartment Leasing", "Housing Co-op"],
                "phrases": ["monthly rent", "lease payment", "house rent", "apartment rent", "rental payment"],
                "amount": (12000, 45000),
                "type": "Expense",
                "count": 100
            }
        }

        shared_merchants = [
            "Amazon", "Google Pay", "Paytm", "PhonePe", "Visa", "Mastercard",
            "Bank Transfer", "UPI", "Merchant Portal"
        ]
        generic_actions = ["payment", "purchase", "order", "charge", "transaction", "invoice", "checkout"]
        generic_context = ["online", "mobile", "auto debit", "wallet", "card", "recurring", "instant"]
        templates = [
            "{action} for {phrase}",
            "{context} {action} {phrase}",
            "{phrase} {action}",
            "{action} {phrase} via app",
            "{context} bill for {phrase}",
        ]

        generated_samples = []
        for category, spec in category_specs.items():
            low, high = spec["amount"]
            for idx in range(spec["count"]):
                # Mix in shared merchants to reduce leakage from merchant-only cues.
                if rng.random() < 0.25:
                    merchant = shared_merchants[int(rng.integers(0, len(shared_merchants)))]
                else:
                    merchant = spec["merchants"][int(rng.integers(0, len(spec["merchants"]))) ]

                phrase = spec["phrases"][int(rng.integers(0, len(spec["phrases"]))) ]
                action = generic_actions[int(rng.integers(0, len(generic_actions)))]
                context = generic_context[int(rng.integers(0, len(generic_context)))]
                template = templates[int(rng.integers(0, len(templates)))]
                description = template.format(action=action, phrase=phrase, context=context)

                # Add light ambiguity/noise to better simulate real transaction text.
                if rng.random() < 0.20:
                    description = f"{description} ref"
                if rng.random() < 0.12:
                    description = f"{description} subscription"

                amount = int(rng.integers(low, high + 1))
                generated_samples.append({
                    "description": description,
                    "merchantName": merchant,
                    "amount": amount,
                    "type": spec["type"],
                    "category": category
                })

        return base_samples + generated_samples


def main():
    """Train and save categorizer model"""
    try:
        logger.info("🚀 Starting Transaction Categorizer Training...")
        
        trainer = TransactionCategorizerTrainer()
        
        # Load training data
        logger.info("📂 Loading training data...")
        transactions = trainer.load_sample_data()
        logger.info(f"✅ Loaded {len(transactions)} transactions")
        
        # Prepare data
        logger.info("🔧 Preparing features...")
        X, y, groups = trainer.prepare_training_data(transactions)
        logger.info(f"✅ Prepared {X.shape[0]} samples with {X.shape[1]} features")
        
        # Train model
        logger.info("🤖 Training Random Forest classifier...")
        metrics = trainer.train(X, y, groups=groups, realistic_eval=True)
        
        # Save model
        logger.info("💾 Saving model...")
        version_id = trainer.save_model()
        
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ Model training complete!")
        logger.info(f"Version: {version_id}")
        logger.info(f"Accuracy: {metrics['accuracy']:.1%}")
        logger.info(f"Precision: {metrics['precision']:.1%}")
        logger.info(f"Recall: {metrics['recall']:.1%}")
        logger.info(f"F1-Score: {metrics['f1_score']:.1%}")
        logger.info(f"{'='*60}\n")
        
    except Exception as e:
        logger.error(f"❌ Training failed: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
