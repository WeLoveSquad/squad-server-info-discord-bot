## build runner
FROM node:lts-alpine as builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --chown=node:node package*.json .
RUN npm config set unsafe-perm true
RUN npm install

COPY --chown=node:node . .
RUN npm run build


## prod stage
FROM node:lts-alpine as prod
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

COPY --chown=node:node package*.json .
RUN npm clean-install && npm cache clean --force
COPY --from=builder /home/node/app/build ./build
COPY --chown=node:node ./config ./config
RUN mkdir ./storage

CMD [ "node", "build/main.js" ]
