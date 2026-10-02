// =============================================================================
// S3/MinIO Plugin for Fastify
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { Client } from 'minio';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    s3: Client;
  }
}

const s3Plugin: FastifyPluginAsync = async (fastify) => {
  const s3Client = new Client({
    endPoint: new URL(env.S3_ENDPOINT).hostname,
    port:
      parseInt(new URL(env.S3_ENDPOINT).port) || (env.S3_ENDPOINT.startsWith('https') ? 443 : 80),
    useSSL: env.S3_ENDPOINT.startsWith('https'),
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    region: env.S3_REGION,
  });

  // Ensure bucket exists (non-fatal if S3 is unreachable in dev)
  try {
    const bucketExists = await s3Client.bucketExists(env.S3_BUCKET);
    if (!bucketExists) {
      await s3Client.makeBucket(env.S3_BUCKET, env.S3_REGION);
      fastify.log.info(`Created bucket: ${env.S3_BUCKET}`);
    }
  } catch (err) {
    fastify.log.warn({ err }, 'S3 bucket check failed — uploads may not work');
  }

  fastify.decorate('s3', s3Client);
};

export default s3Plugin;
