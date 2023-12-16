FROM node:20-slim As build

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN yarn install
RUN yarn run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

RUN yarn install --production

FROM node:20-slim As production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/prune.sh ./prune.sh
COPY --from=build /usr/src/app/.env ./.env
COPY --from=build /usr/src/app/dist ./dist

RUN apt-get update -y && \
  apt-get install -y openssl && \
  apt-get clean --dry-run

RUN npm cache clean --force && \
  yarn cache clean

RUN sh ./prune.sh

EXPOSE 3000
# Start the server using the production build
CMD [ "node", "dist/main.js" ]

# # Create app directory
# WORKDIR /usr/src/app

# COPY . .

# RUN apt-get update -y && \
#   apt-get install -y openssl

# RUN yarn install && \
#   yarn run build

# # EXPOSE 3000

# CMD [ "node", "dist/main.js" ]

# docker run  -p 3000:3000 --rm --name nest \
# -e DATABASE_URL='postgres://wings.vinxenc:r2LGjt4sHAVF@ep-red-frog-43771219-pooler.ap-southeast-1.aws.neon.tech/dev-nest-prisma?sslmode=require&pgbouncer=true&connect_timeout=3000' \
# -e DIRECT_URL='postgres://wings.vinxenc:r2LGjt4sHAVF@ep-red-frog-43771219.ap-southeast-1.aws.neon.tech/dev-nest-prisma?sslmode=require&connect_timeout=3000&pool_timeout=3000' \
# -e PORT=3000 \
# -e JWT_SECRET_KEY='dev-jwt-secret-key' \
# -e NODE_ENV='production' nest_prisma:latest