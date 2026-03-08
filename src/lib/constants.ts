// ─────────────────────────────────────────────────────────────────────────────
// lib/constants.ts
// App-wide constants: voice options, playback speeds, conversion step labels,
// and a demo text corpus used when no real document is uploaded.
// ─────────────────────────────────────────────────────────────────────────────

import type { VoiceOption } from "@/types";

// ─── Voice options ────────────────────────────────────────────────────────────
export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "neural",
    label: "Neural (Default)",
    emoji: "🎙",
    description: "Clear, natural-sounding AI voice",
  },
  {
    id: "male-deep",
    label: "Male — Deep",
    emoji: "👨",
    description: "Rich baritone, great for long-form content",
  },
  {
    id: "female-clear",
    label: "Female — Clear",
    emoji: "👩",
    description: "Crisp and articulate",
  },
  {
    id: "british-warm",
    label: "British — Warm",
    emoji: "🇬🇧",
    description: "Refined British accent",
  },
  {
    id: "slow-study",
    label: "Slow — Study Mode",
    emoji: "📖",
    description: "75% speed, ideal for taking notes",
  },
];

// ─── Playback speeds ──────────────────────────────────────────────────────────
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// ─── Conversion pipeline steps ───────────────────────────────────────────────
export const CONVERSION_STEPS = [
  { key: "extracting",   label: "Parsing document"  },
  { key: "cleaning",     label: "Cleaning text"     },
  { key: "synthesizing", label: "Generating audio"  },
  { key: "finalizing",   label: "Finalising"        },
] as const;

// Progress percentage reached at each pipeline step
export const STEP_PROGRESS: Record<string, number> = {
  extracting:   15,
  cleaning:     40,
  synthesizing: 75,
  finalizing:   95,
  done:        100,
};

// ─── Demo extracted text ──────────────────────────────────────────────────────
// Used as fallback content when a demo library item is loaded
// (since those items don't have a real uploaded file).
export const DEMO_EXTRACTED_TEXT = `Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. This lecture covers the fundamental concepts that form the bedrock of modern ML systems.

Supervised Learning
In supervised learning, the algorithm learns from labeled training data. For each training example, the desired output is known. The model learns to map input features to output labels by minimizing a loss function. Common algorithms include linear regression, logistic regression, support vector machines, and decision trees.

Feature Engineering
Raw data rarely translates directly into predictive power. Feature engineering is the process of transforming raw data into meaningful inputs that better represent the problem structure. Techniques include normalization, one-hot encoding, polynomial features, and domain-specific transformations. The quality of feature engineering often determines the ceiling of model performance.

Gradient Descent Optimization
Gradient descent is the core optimization algorithm used to train most ML models. Starting from random parameters, the algorithm iteratively adjusts weights in the direction that reduces the loss function. Variants include batch gradient descent, stochastic gradient descent, and mini-batch gradient descent — the latter being standard in deep learning due to its balance of stability and computational efficiency.

Overfitting and Regularization
A model that performs well on training data but poorly on unseen data is said to be overfitting. Regularization techniques like L1 (Lasso) and L2 (Ridge) penalties constrain weight magnitudes to prevent over-reliance on specific features. Dropout is the preferred technique in neural networks.

Model Evaluation
Accuracy alone is misleading for class-imbalanced datasets. The F1 score, precision-recall curves, and Area Under the ROC Curve (AUC-ROC) provide more robust evaluation frameworks. Cross-validation ensures the evaluation is not dependent on a specific data split.

Conclusion
Understanding these foundational concepts is essential before advancing to deep learning. The interplay between data quality, model architecture, and optimization strategy determines real-world performance.`;
