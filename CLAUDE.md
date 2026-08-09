# Claude Guidelines

## Git

- Never commit changes unless explicitly asked by the user.

## OpenSpec Apply

When running opsx:apply, implement all pending tasks within the current section in one shot, then stop and report progress before moving to the next section. Never cross section boundaries in a single run.

Before implementing any tasks, read `docs/architecture/index.md` and follow any linked documents referenced there that are relevant to the requirements (e.g. API, events, auth architecture). Use this to inform all implementation decisions.
