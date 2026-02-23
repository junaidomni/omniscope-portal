import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { channels, users, channelMembers, messages } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Comprehensive Communications Platform Test Suite
 * Tests all channel types, messaging features, and access controls
 */

describe("Communications Platform - Full Integration Tests", () => {
  let testUserId1: number;
  let testUserId2: number;
  let testUserId3: number;
  let orgId: number = 1;

  beforeAll(async () => {
    // Create test users
    const user1 = await db.createUser({
      openId: `test-dm-user-1-${Date.now()}`,
      name: "Alice Test",
      email: `alice-${Date.now()}@test.com`,
      avatar: null,
      role: "user",
    });
    testUserId1 = user1.id;

    const user2 = await db.createUser({
      openId: `test-dm-user-2-${Date.now()}`,
      name: "Bob Test",
      email: `bob-${Date.now()}@test.com`,
      avatar: null,
      role: "user",
    });
    testUserId2 = user2.id;

    const user3 = await db.createUser({
      openId: `test-dm-user-3-${Date.now()}`,
      name: "Charlie Test",
      email: `charlie-${Date.now()}@test.com`,
      avatar: null,
      role: "user",
    });
    testUserId3 = user3.id;
  });

  describe("Channel Creation", () => {
    it("should create DM with auto-generated name", async () => {
      const channelId = await db.createChannel({
        orgId: null,
        type: "dm",
        name: "Alice Test & Bob Test",
        description: null,
        createdBy: testUserId1,
      });

      expect(channelId).toBeGreaterThan(0);

      const channel = await db.getChannelById(channelId);
      expect(channel).toBeDefined();
      expect(channel?.name).toBe("Alice Test & Bob Test");
      expect(channel?.type).toBe("dm");
    });

    it("should create group chat with custom name", async () => {
      const channelId = await db.createChannel({
        orgId,
        type: "group",
        name: "Test Group Chat",
        description: "A test group",
        createdBy: testUserId1,
      });

      expect(channelId).toBeGreaterThan(0);

      const channel = await db.getChannelById(channelId);
      expect(channel).toBeDefined();
      expect(channel?.name).toBe("Test Group Chat");
      expect(channel?.type).toBe("group");
    });

    it("should create deal room with sub-channels", async () => {
      const dealRoomId = await db.createChannel({
        orgId,
        type: "deal_room",
        name: "Test Deal Room",
        description: "A test deal room",
        createdBy: testUserId1,
      });

      expect(dealRoomId).toBeGreaterThan(0);

      // Create sub-channel
      const subChannelId = await db.createSubChannel({
        parentChannelId: dealRoomId,
        name: "general",
        description: "General discussion",
        createdBy: testUserId1,
      });

      expect(subChannelId).toBeGreaterThan(0);

      const subChannel = await db.getChannelById(subChannelId);
      expect(subChannel?.parentChannelId).toBe(dealRoomId);
    });
  });

  describe("Message Features", () => {
    let testChannelId: number;
    let testMessageId: number;

    beforeAll(async () => {
      // Create test channel
      testChannelId = await db.createChannel({
        orgId,
        type: "group",
        name: "Test Messages Channel",
        description: null,
        createdBy: testUserId1,
      });

      // Add members
      await db.addChannelMember({
        channelId: testChannelId,
        userId: testUserId1,
        role: "owner",
        isGuest: false,
      });

      await db.addChannelMember({
        channelId: testChannelId,
        userId: testUserId2,
        role: "member",
        isGuest: false,
      });
    });

    it("should send message", async () => {
      testMessageId = await db.createMessage({
        channelId: testChannelId,
        userId: testUserId1,
        content: "Test message",
        attachments: null,
      });

      expect(testMessageId).toBeGreaterThan(0);

      const message = await db.getMessageById(testMessageId);
      expect(message).toBeDefined();
      expect(message?.content).toBe("Test message");
    });

    it("should edit message within 15 minutes", async () => {
      await db.editMessage(testMessageId, testUserId1, "Edited message");

      const message = await db.getMessageById(testMessageId);
      expect(message?.content).toBe("Edited message");
      expect(message?.isEdited).toBe(true);
    });

    it("should add reaction to message", async () => {
      await db.addReaction({
        messageId: testMessageId,
        userId: testUserId2,
        emoji: "👍",
      });

      const reactions = await db.getReactions(testMessageId);
      expect(reactions.length).toBeGreaterThan(0);
      expect(reactions[0].emoji).toBe("👍");
    });

    it("should pin message (owner only)", async () => {
      await db.pinMessage(testMessageId, testUserId1);

      const message = await db.getMessageById(testMessageId);
      expect(message?.isPinned).toBe(true);
    });

    it("should delete message", async () => {
      await db.deleteMessage(testMessageId, testUserId1);

      const message = await db.getMessageById(testMessageId);
      expect(message?.isDeleted).toBe(true);
    });
  });

  describe("Access Control", () => {
    let privateChannelId: number;

    beforeAll(async () => {
      privateChannelId = await db.createChannel({
        orgId,
        type: "group",
        name: "Private Channel",
        description: null,
        createdBy: testUserId1,
      });

      await db.addChannelMember({
        channelId: privateChannelId,
        userId: testUserId1,
        role: "owner",
        isGuest: false,
      });
    });

    it("should only show channels user is member of", async () => {
      const user1Channels = await db.getChannelsForUser(testUserId1);
      const user3Channels = await db.getChannelsForUser(testUserId3);

      const user1HasPrivate = user1Channels.some(
        (c) => c.channel.id === privateChannelId
      );
      const user3HasPrivate = user3Channels.some(
        (c) => c.channel.id === privateChannelId
      );

      expect(user1HasPrivate).toBe(true);
      expect(user3HasPrivate).toBe(false);
    });

    it("should prevent non-members from accessing channel", async () => {
      const isMember = await db.isChannelMember(privateChannelId, testUserId3);
      expect(isMember).toBe(false);
    });
  });

  describe("Member Management", () => {
    let testChannelId: number;

    beforeAll(async () => {
      testChannelId = await db.createChannel({
        orgId,
        type: "group",
        name: "Member Management Test",
        description: null,
        createdBy: testUserId1,
      });

      await db.addChannelMember({
        channelId: testChannelId,
        userId: testUserId1,
        role: "owner",
        isGuest: false,
      });

      await db.addChannelMember({
        channelId: testChannelId,
        userId: testUserId2,
        role: "member",
        isGuest: false,
      });
    });

    it("should change member role", async () => {
      await db.changeChannelMemberRole(testChannelId, testUserId2, "admin");

      const membership = await db.getChannelMembership(
        testChannelId,
        testUserId2
      );
      expect(membership?.role).toBe("admin");
    });

    it("should remove member from channel", async () => {
      await db.removeChannelMember(testChannelId, testUserId2);

      const isMember = await db.isChannelMember(testChannelId, testUserId2);
      expect(isMember).toBe(false);
    });
  });
});
