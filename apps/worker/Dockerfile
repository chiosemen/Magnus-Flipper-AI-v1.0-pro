FROM node:20-alpine

WORKDIR /app

# The workspace is already built and Prisma client generated in CI.
# We only need the built artifacts and runtime deps copied in.
COPY . .

CMD ["node", "apps/worker/dist/index.js"]
