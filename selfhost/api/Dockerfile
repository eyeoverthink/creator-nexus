# creator-nexus self-hosted API (Deno). Build context: repository root.
FROM denoland/deno:2.5.6
WORKDIR /app
COPY base44 /app/base44
COPY selfhost/api /app/selfhost/api
WORKDIR /app/selfhost/api
ENV BASE44_ROOT=/app/base44 FILES_DIR=/data/files DENO_DIR=/deno-dir
# Pre-fetch npm/jsr dependencies of the server, every function and the actor.
RUN deno cache main.ts /app/base44/functions/*/entry.ts /app/base44/actors/*/entry.ts \
 && mkdir -p /data/files && chown -R deno:deno /data /deno-dir
USER deno
EXPOSE 8787
CMD ["run", "-A", "--cached-only", "main.ts"]
