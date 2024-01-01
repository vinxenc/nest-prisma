FROM node:20.10.0-slim As build

# Create app directory
WORKDIR /usr/src/app

COPY . .

RUN yarn install
RUN yarn run build

# Set NODE_ENV environment variable
ENV NODE_ENV production

RUN yarn install --production
RUN sh ./prune.sh

FROM node:20.10.0-slim As production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
# COPY --from=build /usr/src/app/prune.sh ./prune.sh
# COPY --from=build /usr/src/app/.env ./.env
COPY --from=build /usr/src/app/dist ./dist

RUN apt-get update -y && \
  apt-get install -y openssl && \
  apt-get install -y wget gnupg && \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends && \
  rm -rf /var/lib/apt/lists/* && \
  apt-get clean --dry-run

RUN npm cache clean --force && \
  yarn cache clean

RUN node node_modules/puppeteer/install.mjs

EXPOSE 3000

CMD [ "node", "--max-old-space-size=150", "dist/main.js" ]
