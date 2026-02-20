# This is a simple dev dockerfile as a POC.
# Some work still needs to be done to get
# it to production-ready.
FROM node:lts-alpine3.23 AS deps
ARG NEXT_PUBLIC_CATEGORY_OPTIONS
ENV NEXT_PUBLIC_CATEGORY_OPTIONS=\$NEXT_PUBLIC_CATEGORY_OPTIONS
WORKDIR /app
COPY package*.json ./
RUN npm install
FROM node:lts-alpine3.23 AS builder
ARG NEXT_PUBLIC_CATEGORY_OPTIONS
ENV NEXT_PUBLIC_CATEGORY_OPTIONS=\$NEXT_PUBLIC_CATEGORY_OPTIONS
WORKDIR /app
RUN addgroup -S nodeuser && adduser -S nodeuser -G nodeuser
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R nodeuser:nodeuser /app
EXPOSE 3000
USER nodeuser
CMD ["npm", "run", "dev"]
