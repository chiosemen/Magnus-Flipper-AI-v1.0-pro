/**
 * @magnus-flipper-ai/deal-engine
 * AI-powered deal classification and scoring engine
 */

// Configuration
export { loadConfig, validateConfig, defaultConfig } from "./config.js";
export type { DealEngineConfig } from "./config.js";

// Types
export type { Listing } from "./types/Listing.js";
export type { DealScore } from "./types/DealScore.js";

// Scoring
export { calculateBaselineScore } from "./scoring/baseScore.js";
export { classifyWithDeepSeek } from "./scoring/deepseekClassifier.js";
export { classifyWithOpenAI } from "./scoring/openaiClassifier.js";

// Calibration
export { calibrate, calibrateBatch } from "./calibrator/calibrate.js";
export type { CalibrationInputs, CalibratedScore, HistoricalStats } from "./calibrator/calibrate.js";
export { calculateBayesianPosterior, quickBayesianUpdate, bayesianEnsemble } from "./calibrator/bayesian.js";
export type { BayesianInputs, BayesianResult } from "./calibrator/bayesian.js";
export { calculateConsensus, analyzeConsensus, checkRiskConsensus, confidenceWeightedScore } from "./calibrator/llmConsensus.js";
export type { ConsensusResult, MultiModelScores } from "./calibrator/llmConsensus.js";
