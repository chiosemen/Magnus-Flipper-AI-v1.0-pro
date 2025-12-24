/**
 * Intent Classifier
 * Classifies user questions into operator actions
 */

import { IntentType } from '../types';

export function classifyIntent(question: string): IntentType {
  const lower = question.toLowerCase();
  
  if (/why|what happened|explain|cause|reason|diagnose/i.test(lower)) {
    return 'EXPLAIN';
  }
  
  if (/status|health|overview|summary|how is|current state/i.test(lower)) {
    return 'SUMMARIZE';
  }
  
  if (/should|recommend|suggest|what to do|what should|next steps/i.test(lower)) {
    return 'RECOMMEND';
  }
  
  if (/disable|enable|change|adjust|toggle|modify|update config/i.test(lower)) {
    return 'PROPOSE_CHANGE';
  }
  
  // Default to EXPLAIN for unknown intents
  return 'EXPLAIN';
}

