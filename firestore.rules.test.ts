import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

test('Firestore Rules enforce global default-deny catch-all and rules_version 2', () => {
  assert.equal(rulesContent.includes("rules_version = '2';"), true);
  assert.equal(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'), true);
});

test('Firestore Rules enforce Dirty Dozen guards (verified email, strict keys, affectedKeys, terminal state, list resource.data)', () => {
  // Pillar 2 & 4: Strict keys & action-based affectedKeys
  assert.equal(rulesContent.includes("data.keys().hasAll(["), true);
  assert.equal(rulesContent.includes("data.keys().hasOnly(["), true);
  assert.equal(rulesContent.includes("incoming().diff(existing()).affectedKeys().hasOnly("), true);

  // Pillar 3: Path variable ID poisoning guard
  assert.equal(rulesContent.includes("isValidId(userId)"), true);
  assert.equal(rulesContent.includes("isValidId(auditId)"), true);
  assert.equal(rulesContent.includes("isValidId(orderId)"), true);

  // Pillar 6 & 8: Email verification & Query Enforcer on list
  assert.equal(rulesContent.includes("request.auth.token.email_verified == true"), true);
  assert.equal(rulesContent.includes("allow list: if isSignedIn() && resource.data.ownerId == request.auth.uid;"), true);

  // Terminal state locking & temporal integrity
  assert.equal(rulesContent.includes("existing().status != 'archived'"), true);
  assert.equal(rulesContent.includes("existing().status != 'completed'"), true);
  assert.equal(rulesContent.includes("incoming().createdAt == request.time"), true);
  assert.equal(rulesContent.includes("incoming().updatedAt == request.time"), true);
});
