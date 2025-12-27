import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorResponse } from '@magnus/deploy-guardian-contracts';

export function verifyGuardianKey(expectedKey: string) {
  return async function guard(request: FastifyRequest, reply: FastifyReply) {
    const header = request.headers['x-guardian-key'];
    const key = Array.isArray(header) ? header[0] : header;

    if (!key || key !== expectedKey) {
      const payload = ErrorResponse.parse({
        error: 'unauthorized',
        message: 'Invalid guardian key',
      });
      return reply.code(401).send(payload);
    }
  };
}
