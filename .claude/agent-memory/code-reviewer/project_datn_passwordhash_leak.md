---
name: datn-passwordhash-leak
description: DATN-BE-PC User entity has no @JsonIgnore on passwordHash — any endpoint that serializes a raw User (directly or via another entity's association, e.g. BlogPost.author) leaks the bcrypt hash to clients.
metadata:
  type: project
---

`DATN-BE-PC/src/main/java/com/kinhduanpc/entity/User.java` has no `@JsonIgnore` (or `@JsonProperty(access = WRITE_ONLY)`) on `passwordHash`, `loginAttempts`, or `lockedUntil`. `addresses` and `oauthAccounts` are `@JsonIgnore`'d but the credential field is not.

Confirmed concrete exposures as of 2026-08-04:
- `UserController.getMe()` (`GET /users/me`) returns the raw `User` entity — leaks the caller's own bcrypt hash to their own browser (self-leak, lower severity but still bad practice).
- `BlogController.getAll()` (`GET /blog`, list endpoint) returns raw `List<BlogPost>`, and `BlogPost.author` is a non-`@JsonIgnore`'d `User` association — this endpoint is **public/unauthenticated** (`GET /blog/**` is `permitAll` in `SecurityConfig`), so any anonymous visitor can dump the bcrypt password hash of every blog post author (staff/admin accounts). `GET /blog/{slug}` was fixed in the Phase 8 session (new `BlogPostResponse` DTO with `AuthorSummary` id+fullName only) but the sibling list endpoint (`getAll`) was not touched and still leaks.

**Why:** Root cause is architectural (missing `@JsonIgnore` on the entity) rather than per-endpoint, so any new controller that returns a `User` or an entity with a `User` association is at risk of the same leak unless it goes through a DTO or the entity is fixed once at the source.

**How to apply:** On every future review of this codebase, check any endpoint returning a raw entity (grep for `ApiResponse.success(...)` wrapping an entity/list-of-entity rather than a DTO) for a `User`-typed field/association in the payload. Recommend fixing at the source (`@JsonIgnore` on `User.passwordHash`) rather than patching endpoint-by-endpoint, since that is the pattern most likely to regress again as new controllers are added. Related: [[project_datn_fk_delete_risk]] — same codebase, same "raw entity leaks convention debt" root cause family (services return JPA entities directly instead of DTOs).
