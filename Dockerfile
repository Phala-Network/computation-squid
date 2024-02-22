FROM imbios/bun-node:1-20-alpine as base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
COPY patches /temp/dev/patches
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
COPY patches /temp/prod/patches
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/db db
COPY --from=prerelease /usr/src/app/lib lib
COPY --from=prerelease /usr/src/app/initial_state initial_state
COPY --from=prerelease /usr/src/app/schema.graphql .
COPY --from=prerelease /usr/src/app/package.json .

# run the app
USER bun
CMD ["sh", "-c", "bunx squid-typeorm-migration apply && bun lib/main.js"]
