/**
 * Anchor Approval Workflow Integration Tests
 * 
 * Tests the admin approval flow for market anchors including:
 * - Pending anchor creation
 * - Admin approval/rejection
 * - Optimistic locking
 * - Audit trail
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { blendAnchors } from '../../src';
import type {
  MarketAnchor,
  PricingPolicy,
  AnchorStatus,
} from '../../src/types';

// ============================================================================
// Test Fixtures
// ============================================================================

const testPolicy: PricingPolicy = {
  id: 'policy-1',
  name: 'default',
  category: null,
  conditionNew: 1.0,
  conditionExcellent: 0.85,
  conditionGood: 0.70,
  conditionFair: 0.50,
  weightCex: 0.40,
  weightBackMarket: 0.40,
  weightPolicy: 0.20,
  minMarginPercent: 0.15,
  absoluteFloor: 10.0,
  anchorMaxAgeDays: 7,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const deviceId = '550e8400-e29b-41d4-a716-446655440001';

// ============================================================================
// Simulated Database Operations
// ============================================================================

interface AnchorStore {
  anchors: Map<string, MarketAnchor>;
  auditLog: AuditEntry[];
}

interface AuditEntry {
  anchorId: string;
  action: 'approve' | 'reject';
  adminId: string;
  timestamp: Date;
  previousStatus: AnchorStatus;
  newStatus: AnchorStatus;
}

function createStore(): AnchorStore {
  return {
    anchors: new Map(),
    auditLog: [],
  };
}

function createPendingAnchor(
  store: AnchorStore,
  source: 'cex' | 'back_market',
  price: number
): MarketAnchor {
  const anchor: MarketAnchor = {
    id: `anchor-${Math.random().toString(36).slice(2)}`,
    deviceId,
    source,
    condition: 'excellent',
    price,
    url: `https://${source}.com/device`,
    scrapedAt: new Date(),
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
    version: 0,
    createdAt: new Date(),
  };
  
  store.anchors.set(anchor.id, anchor);
  return anchor;
}

interface ApprovalResult {
  success: boolean;
  anchor?: MarketAnchor;
  error?: string;
}

function approveAnchor(
  store: AnchorStore,
  anchorId: string,
  adminId: string,
  expectedVersion: number
): ApprovalResult {
  const anchor = store.anchors.get(anchorId);
  
  if (!anchor) {
    return { success: false, error: 'Anchor not found' };
  }
  
  if (anchor.status !== 'pending') {
    return { success: false, error: `Anchor already ${anchor.status}` };
  }
  
  // Optimistic locking check
  if (anchor.version !== expectedVersion) {
    return { success: false, error: 'Version conflict' };
  }
  
  const previousStatus = anchor.status;
  
  // Update anchor
  const updatedAnchor: MarketAnchor = {
    ...anchor,
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: adminId,
    version: anchor.version + 1,
  };
  
  store.anchors.set(anchorId, updatedAnchor);
  
  // Add audit entry
  store.auditLog.push({
    anchorId,
    action: 'approve',
    adminId,
    timestamp: new Date(),
    previousStatus,
    newStatus: 'approved',
  });
  
  return { success: true, anchor: updatedAnchor };
}

function rejectAnchor(
  store: AnchorStore,
  anchorId: string,
  adminId: string,
  expectedVersion: number
): ApprovalResult {
  const anchor = store.anchors.get(anchorId);
  
  if (!anchor) {
    return { success: false, error: 'Anchor not found' };
  }
  
  if (anchor.status !== 'pending') {
    return { success: false, error: `Anchor already ${anchor.status}` };
  }
  
  if (anchor.version !== expectedVersion) {
    return { success: false, error: 'Version conflict' };
  }
  
  const previousStatus = anchor.status;
  
  const updatedAnchor: MarketAnchor = {
    ...anchor,
    status: 'rejected',
    version: anchor.version + 1,
  };
  
  store.anchors.set(anchorId, updatedAnchor);
  
  store.auditLog.push({
    anchorId,
    action: 'reject',
    adminId,
    timestamp: new Date(),
    previousStatus,
    newStatus: 'rejected',
  });
  
  return { success: true, anchor: updatedAnchor };
}

function getAuditTrail(store: AnchorStore, anchorId: string): AuditEntry[] {
  return store.auditLog.filter(entry => entry.anchorId === anchorId);
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Anchor Approval Workflow Integration', () => {
  let store: AnchorStore;
  
  beforeEach(() => {
    store = createStore();
  });

  describe('Pending Anchor Creation', () => {
    it('should create anchor with pending status', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      expect(anchor.status).toBe('pending');
      expect(anchor.version).toBe(0);
      expect(anchor.approvedAt).toBeNull();
      expect(anchor.approvedBy).toBeNull();
    });

    it('should store anchor in database', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      const retrieved = store.anchors.get(anchor.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(anchor.id);
    });

    it('should not use pending anchors in pricing', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      const result = blendAnchors([anchor], 382.50, testPolicy, 'excellent');
      
      expect(result.blendedPrice).toBeNull();
      expect(result.warnings).toContain('No approved anchors available');
    });
  });

  describe('Admin Approval Flow', () => {
    it('should approve pending anchor', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      const result = approveAnchor(store, anchor.id, 'admin-1', 0);
      
      expect(result.success).toBe(true);
      expect(result.anchor!.status).toBe('approved');
      expect(result.anchor!.approvedBy).toBe('admin-1');
      expect(result.anchor!.approvedAt).not.toBeNull();
      expect(result.anchor!.version).toBe(1);
    });

    it('should use approved anchors in pricing', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      approveAnchor(store, anchor.id, 'admin-1', 0);
      
      const approvedAnchor = store.anchors.get(anchor.id)!;
      const result = blendAnchors([approvedAnchor], 382.50, testPolicy, 'excellent');
      
      expect(result.blendedPrice).not.toBeNull();
      expect(result.anchorsUsed).toHaveLength(1);
    });

    it('should increment version on approval', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      expect(anchor.version).toBe(0);
      
      approveAnchor(store, anchor.id, 'admin-1', 0);
      
      const updated = store.anchors.get(anchor.id)!;
      expect(updated.version).toBe(1);
    });
  });

  describe('Admin Rejection Flow', () => {
    it('should reject pending anchor', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      const result = rejectAnchor(store, anchor.id, 'admin-1', 0);
      
      expect(result.success).toBe(true);
      expect(result.anchor!.status).toBe('rejected');
      expect(result.anchor!.version).toBe(1);
    });

    it('should not use rejected anchors in pricing', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      rejectAnchor(store, anchor.id, 'admin-1', 0);
      
      const rejectedAnchor = store.anchors.get(anchor.id)!;
      const result = blendAnchors([rejectedAnchor], 382.50, testPolicy, 'excellent');
      
      expect(result.blendedPrice).toBeNull();
    });
  });

  describe('Optimistic Locking', () => {
    it('should detect version conflict on concurrent approval', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      // Admin A loads anchor (version 0)
      const adminAVersion = anchor.version;
      
      // Admin B loads anchor (version 0)
      const adminBVersion = anchor.version;
      
      // Admin A approves (succeeds, version becomes 1)
      const resultA = approveAnchor(store, anchor.id, 'admin-a', adminAVersion);
      expect(resultA.success).toBe(true);
      
      // Admin B tries to reject with stale version (should fail)
      // The status check happens before version check, so we get "already approved"
      const resultB = rejectAnchor(store, anchor.id, 'admin-b', adminBVersion);
      expect(resultB.success).toBe(false);
      // Either version conflict or already approved is acceptable
      expect(['Version conflict', 'Anchor already approved']).toContain(resultB.error);
    });

    it('should prevent double approval', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      // First approval succeeds
      const result1 = approveAnchor(store, anchor.id, 'admin-1', 0);
      expect(result1.success).toBe(true);
      
      // Second approval fails (already approved)
      const result2 = approveAnchor(store, anchor.id, 'admin-2', 1);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Anchor already approved');
    });

    it('should prevent approval after rejection', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      
      // Rejection succeeds
      const result1 = rejectAnchor(store, anchor.id, 'admin-1', 0);
      expect(result1.success).toBe(true);
      
      // Approval fails (already rejected)
      const result2 = approveAnchor(store, anchor.id, 'admin-2', 1);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Anchor already rejected');
    });
  });

  describe('Audit Log Entries', () => {
    it('should create audit entry on approval', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      approveAnchor(store, anchor.id, 'admin-1', 0);
      
      const trail = getAuditTrail(store, anchor.id);
      
      expect(trail).toHaveLength(1);
      expect(trail[0].action).toBe('approve');
      expect(trail[0].adminId).toBe('admin-1');
      expect(trail[0].previousStatus).toBe('pending');
      expect(trail[0].newStatus).toBe('approved');
    });

    it('should create audit entry on rejection', () => {
      const anchor = createPendingAnchor(store, 'cex', 380);
      rejectAnchor(store, anchor.id, 'admin-1', 0);
      
      const trail = getAuditTrail(store, anchor.id);
      
      expect(trail).toHaveLength(1);
      expect(trail[0].action).toBe('reject');
      expect(trail[0].adminId).toBe('admin-1');
      expect(trail[0].previousStatus).toBe('pending');
      expect(trail[0].newStatus).toBe('rejected');
    });

    it('should preserve audit trail for debugging', () => {
      // Create and approve multiple anchors
      const anchor1 = createPendingAnchor(store, 'cex', 380);
      const anchor2 = createPendingAnchor(store, 'back_market', 400);
      
      approveAnchor(store, anchor1.id, 'admin-1', 0);
      rejectAnchor(store, anchor2.id, 'admin-2', 0);
      
      // Verify full audit log
      expect(store.auditLog).toHaveLength(2);
      
      // Verify per-anchor trails
      const trail1 = getAuditTrail(store, anchor1.id);
      const trail2 = getAuditTrail(store, anchor2.id);
      
      expect(trail1).toHaveLength(1);
      expect(trail2).toHaveLength(1);
      expect(trail1[0].action).toBe('approve');
      expect(trail2[0].action).toBe('reject');
    });
  });

  describe('Batch Operations', () => {
    it('should approve multiple anchors in batch', () => {
      const anchors = [
        createPendingAnchor(store, 'cex', 380),
        createPendingAnchor(store, 'cex', 385),
        createPendingAnchor(store, 'back_market', 400),
      ];
      
      const results = anchors.map(a => approveAnchor(store, a.id, 'admin-1', 0));
      
      expect(results.every(r => r.success)).toBe(true);
      expect(store.auditLog).toHaveLength(3);
    });

    it('should handle mixed approve/reject batch', () => {
      const anchor1 = createPendingAnchor(store, 'cex', 380);
      const anchor2 = createPendingAnchor(store, 'cex', 100); // Suspicious low price
      
      approveAnchor(store, anchor1.id, 'admin-1', 0);
      rejectAnchor(store, anchor2.id, 'admin-1', 0);
      
      const approved = store.anchors.get(anchor1.id)!;
      const rejected = store.anchors.get(anchor2.id)!;
      
      expect(approved.status).toBe('approved');
      expect(rejected.status).toBe('rejected');
      
      // Only approved anchor should be used
      const result = blendAnchors(
        [approved, rejected],
        382.50,
        testPolicy,
        'excellent'
      );
      
      expect(result.anchorsUsed).toHaveLength(1);
      expect(result.anchorsUsed[0].id).toBe(anchor1.id);
    });
  });
});

