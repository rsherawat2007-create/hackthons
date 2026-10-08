# Profile and brief data model

## Creator profile

Stored on `CreatorProfile` (1:1 with `User` where `role = CREATOR`).

- Identity: name (User), headline, bio, location, avatar, experience years
- AI production: `skills[]`, `specializations[]`, `tools[]`, `aiModels[]`, `contentTypes[]`
- Workflow: free-text production pipeline
- Licensing: `commercialUse` boolean + `commercialNotes`
- Trust: computed `trustScore` plus `Verification` flags (tools, portfolio, workflow, previous work, commercial-use info)

## Portfolio item

- Title, description, media/thumbnail URLs
- `contentType`, `aspectRatio`, `category`, `date`
- `toolsUsed[]`, `aiModelsUsed[]`, `skills[]`
- `commercialUse`, per-project `workflow`

## Brief

Owned by `BrandProfile`.

- Campaign: title, description, style, target audience, budget, deadline
- Format: content type, platform, aspect ratio, duration
- Production: required tools, required skills, deliverables, creative direction
- `commercialUse` requirement

Matching scores a creator against a search/brief using weighted overlap: skills 35%, specialization 20%, tools 15%, content type 15%, portfolio relevance 10%, trust 5%.
