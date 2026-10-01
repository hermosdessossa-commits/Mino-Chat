// =============================================================================
// Mino-Chat Database Seed
// Run with: pnpm db:seed
// =============================================================================

import {
  PrismaClient,
  ConversationType,
  MessageType,
  ParticipantRole,
  UserRole,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (dev only)
  await prisma.reaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.device.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.magicLinkToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create users
  const passwordHash = await hash('password123', 12);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@mino.chat',
      username: 'alice',
      passwordHash,
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@mino.chat',
      username: 'bob',
      passwordHash,
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@mino.chat',
      username: 'charlie',
      passwordHash,
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mino.chat',
      username: 'admin',
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  console.log('👥 Created users:', {
    alice: alice.id,
    bob: bob.id,
    charlie: charlie.id,
    admin: admin.id,
  });

  // Create direct conversation: alice <-> bob
  const aliceBobConv = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      participants: {
        create: [
          { userId: alice.id, role: ParticipantRole.MEMBER },
          { userId: bob.id, role: ParticipantRole.MEMBER },
        ],
      },
    },
    include: { participants: true },
  });

  // Create direct conversation: alice <-> charlie
  const aliceCharlieConv = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      participants: {
        create: [
          { userId: alice.id, role: ParticipantRole.MEMBER },
          { userId: charlie.id, role: ParticipantRole.MEMBER },
        ],
      },
    },
    include: { participants: true },
  });

  // Create group conversation: alice, bob, charlie
  const groupConv = await prisma.conversation.create({
    data: {
      type: ConversationType.GROUP,
      name: 'Team Mino-Chat',
      participants: {
        create: [
          { userId: alice.id, role: ParticipantRole.ADMIN },
          { userId: bob.id, role: ParticipantRole.MEMBER },
          { userId: charlie.id, role: ParticipantRole.MEMBER },
        ],
      },
    },
    include: { participants: true },
  });

  console.log('💬 Created conversations:', {
    aliceBob: aliceBobConv.id,
    aliceCharlie: aliceCharlieConv.id,
    group: groupConv.id,
  });

  // Create messages for alice <-> bob
  const msg1 = await prisma.message.create({
    data: {
      conversationId: aliceBobConv.id,
      senderId: alice.id,
      content: 'Hey Bob! Comment ça va ?',
      type: MessageType.TEXT,
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      conversationId: aliceBobConv.id,
      senderId: bob.id,
      content: 'Salut Alice ! Ça va super bien, et toi ?',
      type: MessageType.TEXT,
    },
  });

  const msg3 = await prisma.message.create({
    data: {
      conversationId: aliceBobConv.id,
      senderId: alice.id,
      content: "Ça roule ! J'ai vu le nouveau design, il est top 🎨",
      type: MessageType.TEXT,
    },
  });

  // Create messages for alice <-> charlie
  await prisma.message.create({
    data: {
      conversationId: aliceCharlieConv.id,
      senderId: charlie.id,
      content: "Alice, t'as vu le PR #42 ?",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: aliceCharlieConv.id,
      senderId: alice.id,
      content: 'Pas encore, je regarde ce soir 👀',
      type: MessageType.TEXT,
    },
  });

  // Create messages for group
  await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: alice.id,
      content: "Bienvenue dans l'équipe ! 🎉",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: bob.id,
      content: "Content d'être là ! Prêt à coder 💪",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupConv.id,
      senderId: charlie.id,
      content: 'Hâte de bosser avec vous tous !',
      type: MessageType.TEXT,
    },
  });

  // Add reactions
  await prisma.reaction.createMany({
    data: [
      { messageId: msg1.id, userId: bob.id, emoji: '👋' },
      { messageId: msg2.id, userId: alice.id, emoji: '😊' },
      { messageId: msg3.id, userId: bob.id, emoji: '👍' },
    ],
  });

  // Add some attachments (placeholder URLs)
  await prisma.attachment.create({
    data: {
      messageId: msg1.id,
      userId: alice.id,
      filename: 'design-mockup.png',
      mimeType: 'image/png',
      size: 245760,
      url: 'https://picsum.photos/seed/design1/800/600',
      thumbnail: 'https://picsum.photos/seed/design1/200/150',
      width: 800,
      height: 600,
    },
  });

  // Create devices
  await prisma.device.createMany({
    data: [
      { userId: alice.id, name: 'Chrome on MacBook Pro', pushToken: null },
      { userId: alice.id, name: 'iPhone 15', pushToken: 'expo-push-token-alice-1' },
      { userId: bob.id, name: 'Firefox on Linux', pushToken: null },
      { userId: charlie.id, name: 'Safari on iPad', pushToken: 'expo-push-token-charlie-1' },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📧 Test accounts (password: password123):');
  console.log('   alice@mino.chat');
  console.log('   bob@mino.chat');
  console.log('   charlie@mino.chat');
  console.log('   admin@mino.chat');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
