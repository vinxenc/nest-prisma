FROM node:20-slim As build

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN yarn install
RUN yarn run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

RUN yarn install --production

FROM ubuntu:22.04 As production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/prune.sh ./prune.sh
# COPY --from=build /usr/src/app/.env ./.env
COPY --from=build /usr/src/app/dist ./dist

RUN apt-get update -y && \
  apt-get install -y openssl && \
  apt-get clean --dry-run

RUN npm cache clean --force && \
  yarn cache clean

RUN sh ./prune.sh

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
