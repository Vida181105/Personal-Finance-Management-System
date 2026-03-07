"""
Model Management & Versioning System
Handles loading, caching, and versioning of trained ML models
"""

import os
import json
import joblib
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages model versioning and persistence"""
    
    def __init__(self, models_dir: str = "./models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        self._loaded_models: Dict[str, Any] = {}
        self._model_metadata: Dict[str, Dict] = {}
        
    def save_model(self, model: Any, model_name: str, metadata: Optional[Dict] = None) -> str:
        """
        Save a trained model with version metadata
        Returns the version ID
        """
        try:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")
            version_id = f"{model_name}_{version}"
            
            model_path = self.models_dir / f"{version_id}.joblib"
            joblib.dump(model, model_path)
            
            # Save metadata
            meta_path = self.models_dir / f"{version_id}_meta.json"
            meta_dict = metadata if metadata else {}
            meta = {
                "model_name": model_name,
                "version_id": version_id,
                "saved_at": datetime.now().isoformat(),
                "path": str(model_path),
                **meta_dict
            }
            
            with open(meta_path, 'w') as f:
                json.dump(meta, f, indent=2)
            
            # Update latest symlink (track current version)
            latest_path = self.models_dir / f"{model_name}_latest.json"
            with open(latest_path, 'w') as f:
                json.dump({"latest_version": version_id}, f)
            
            logger.info(f"✅ Saved {model_name} v{version}: {model_path}")
            return version_id
            
        except Exception as e:
            logger.error(f"❌ Failed to save model {model_name}: {str(e)}")
            raise
    
    def load_model(self, model_name: str, version_id: Optional[str] = None) -> Any:
        """
        Load a trained model by name and optional version
        If version not specified, loads latest version
        """
        try:
            # Check if already loaded
            cache_key = f"{model_name}_{version_id or 'latest'}"
            if cache_key in self._loaded_models:
                logger.info(f"🔄 Loaded {model_name} from cache")
                return self._loaded_models[cache_key]
            
            # Determine which version to load
            if not version_id:
                latest_path = self.models_dir / f"{model_name}_latest.json"
                if latest_path.exists():
                    with open(latest_path, 'r') as f:
                        version_id = json.load(f)["latest_version"]
                else:
                    raise FileNotFoundError(f"No saved versions for {model_name}")
            
            # Load the model
            model_path = self.models_dir / f"{version_id}.joblib"
            if not model_path.exists():
                raise FileNotFoundError(f"Model not found: {model_path}")
            
            model = joblib.load(model_path)
            self._loaded_models[cache_key] = model
            
            logger.info(f"✅ Loaded {model_name} ({version_id})")
            return model
            
        except Exception as e:
            logger.error(f"❌ Failed to load model {model_name}: {str(e)}")
            raise
    
    def get_model_metadata(self, model_name: str, version_id: Optional[str] = None) -> Dict:
        """Get metadata about a model"""
        try:
            if not version_id:
                latest_path = self.models_dir / f"{model_name}_latest.json"
                if latest_path.exists():
                    with open(latest_path, 'r') as f:
                        version_id = json.load(f)["latest_version"]
            
            meta_path = self.models_dir / f"{version_id}_meta.json"
            if meta_path.exists():
                with open(meta_path, 'r') as f:
                    return json.load(f)
            
            return {}
        except Exception as e:
            logger.error(f"❌ Failed to get metadata: {str(e)}")
            return {}
    
    def list_versions(self, model_name: str) -> list:
        """List all saved versions of a model"""
        try:
            versions = []
            for file in self.models_dir.glob(f"{model_name}_*.json"):
                if not file.name.endswith("_latest.json"):
                    versions.append(file.stem)
            return sorted(versions, reverse=True)
        except Exception as e:
            logger.error(f"❌ Failed to list versions: {str(e)}")
            return []
    
    def get_model_performance(self, model_name: str) -> Dict[str, Any]:
        """Get performance metrics for latest model version"""
        try:
            latest_path = self.models_dir / f"{model_name}_latest.json"
            if latest_path.exists():
                with open(latest_path, 'r') as f:
                    version_id = json.load(f)["latest_version"]
                    
            meta = self.get_model_metadata(model_name, version_id)
            return {
                "model": model_name,
                "version": meta.get("version_id", "unknown"),
                "accuracy": meta.get("accuracy", None),
                "precision": meta.get("precision", None),
                "recall": meta.get("recall", None),
                "f1_score": meta.get("f1_score", None),
                "saved_at": meta.get("saved_at", None),
                "training_samples": meta.get("training_samples", None),
            }
        except Exception as e:
            logger.error(f"❌ Failed to get performance: {str(e)}")
            return {}

# Global instance
model_manager = ModelManager()
