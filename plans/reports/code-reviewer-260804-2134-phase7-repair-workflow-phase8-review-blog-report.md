# Code Review: Phase 7 (Repair Request Workflow) + Phase 8 (Review Helpful / Blog-Product Link)

## Scope
- Backend: `WarrantyController`, `FileController`, `ReviewController`, `BlogController`, `ServiceRequestRepository`, `UserRepository`, new DTOs (`ServiceRequestRequest/Response/StatusUpdateRequest`, `BlogPostResponse`)
- Frontend: `serviceRequestService.ts`, `ServiceRequestsPage.tsx`, `MyWarrantyPage.tsx`, `App.tsx`, `AdminLayout.tsx`, `types/index.ts`, `ProductDetailPage.tsx`, `BlogDetailPage.tsx`, `admin/BlogPage.tsx`
- No git repo / diff available — reviewed by reading files directly per task instructions.

## Critical

### 1. Public, unauthenticated leak of bcrypt password hashes via `GET /blog` (list)
`DATN-BE-PC/src/main/java/com/kinhduanpc/controller/BlogController.java:37` (`getAll()`) still returns raw `List<BlogPost>` (unchanged this session). `BlogPost.author` (`DATN-BE-PC/.../entity/BlogPost.java:27`) is a `@ManyToOne` `User` with **no `@JsonIgnore`**, and `User.passwordHash` (`DATN-BE-PC/.../entity/User.java:43`) has **no `@JsonIgnore`** either. `GET /blog/**` is `permitAll` for GET in `SecurityConfig`, so any anonymous visitor calling `GET /blog?page=0&size=15` gets the full `User` entity for every post author (staff/admin), including `passwordHash`, `email`, `phone`, `loginAttempts`, `lockedUntil`, `taxCode`, `companyName`.

This session specifically created `BlogPostResponse` (with `AuthorSummary` — id + fullName only) to close exactly this leak for `GET /blog/{slug}`, but did not apply the same fix to the sibling `getAll()` list endpoint, which is used by both the public blog list page and the admin `BlogPage.tsx` table (`api.get('/blog?page=...')`). The fix is half-done — the leaves the more heavily-trafficked (paginated, public, unauthenticated, N posts per call) endpoint wide open.

Root cause is architectural: `User.passwordHash` lacks `@JsonIgnore` at the entity level, so it is also leaked by the pre-existing `GET /users/me` (`UserController.java:28`, self-leak to the account owner, lower severity but same defect class). This is a systemic issue, not scoped to Phase 8, but this session is the one that demonstrated awareness of it (by DTO-ing the detail endpoint) without closing the door for the list endpoint.

**Fix:** either (a) add `@JsonIgnore` to `User.passwordHash` (cheapest, fixes it everywhere at the source, including `/users/me`), or (b) create a `BlogPostSummaryResponse` DTO (id, title, slug, excerpt, thumbnail, viewCount, isPublished, publishedAt, `AuthorSummary`, blogCategory — no `mentionedProducts` needed) and use it in `getAll()`. Recommend (a) as the durable fix since (b) alone leaves every other current/future raw-entity endpoint exposed to the same class of bug.

## High

### 2. No server-side enforcement of the customer-approval gate before chargeable repair work proceeds
Requirement: "if `repair_cost > 0` and it's a chargeable repair, the customer must approve before work continues." `WarrantyController.updateServiceRequestStatus()` (`DATN-BE-PC/.../controller/WarrantyController.java:170-194`) sets `status`, `repairCost`, `diagnosis` unconditionally — there is no check anywhere that blocks a status transition to `repairing` (or beyond) when `repairCost > 0` and `customerApprovedRepair` is `null`/`false`. The frontend (`ServiceRequestsPage.tsx`) mirrors this: the status `<select>` lets staff pick "Đang sửa chữa" regardless of `selected.customerApprovedRepair`; the approval banner is purely informational.

Concrete failure: staff enters a repair cost and immediately sets status to `repairing` in the same request, before the customer ever sees or approves the quote. The entire approval workflow becomes advisory rather than enforced, defeating the stated FR-20 requirement (see migration comment `-- FR-20: Báo giá + khách duyệt trước khi sửa (ngoài bảo hành)`).

**Fix:** in `updateServiceRequestStatus`, when `newStatus == repairing` (or any status after diagnosis) and `repairCost.compareTo(BigDecimal.ZERO) > 0`, require `sr.getCustomerApprovedRepair() == Boolean.TRUE` or throw `AppException.badRequest(...)`.

### 3. Technician role is locked out of the admin repair-ticket UI entirely
Backend explicitly grants `TECHNICIAN` access to `GET /warranties/service-requests/admin` and `PUT /warranties/service-requests/{id}/status` (`@PreAuthorize("hasAnyRole('ADMIN','STAFF','TECHNICIAN')")`). But `DATN-FE-PC/src/components/common/AdminRoute.tsx:7` only allows `role === 'admin' || role === 'staff'` — a `technician` user hitting `/admin/service-requests` is redirected to `/`. Since there is no other UI surface for technicians in this codebase, technician accounts have no way to actually perform the "staff/technician update status" part of the requirement through the product. This is a functional gap, not an authz hole (the backend is correctly permissive), but it means the feature is unusable for one of its three named actor roles.

**Fix:** add `'technician'` to the allowed roles in `AdminRoute.tsx`, or scope down the admin nav/pages a technician sees.

### 4. N+1 queries on `GET /warranties/service-requests/admin`
`WarrantyController.toResponse()` (line 219) is called once per row in a list. For each `ServiceRequest` it does: a `serviceMediaRepo.findByServiceRequestIdOrderBySortOrderAsc` query, an optional `userRepo.findById(technicianId)` query, and implicitly triggers lazy-load of `sr.getUser()` (LAZY `@ManyToOne`) when reading `.getId()/.getFullName()/.getPhone()`. For a list of N tickets this is up to `1 + 3N` queries. `getMyServiceRequests` has the same pattern but is bounded to one customer's own tickets, so it's much lower impact.

**Fix:** batch-fetch media (`findByServiceRequestIdIn`) and technician/user names in one or two queries per list call instead of per-row, or add `@EntityGraph`/fetch joins on the repository query used for the admin list.

## Medium

### 5. `FileController.uploadImage` relaxation: content-type + extension validation is weak, and the risk profile genuinely changed
This is the deliberate, required change described in the task (previously ADMIN/STAFF, now `anyRequest().authenticated()` via the removed `@PreAuthorize`, confirmed against `SecurityConfig` — `/upload/**` has no explicit matcher so it falls to `.anyRequest().authenticated()`). The relaxation itself is necessary for Phase 7 and is not being re-flagged as "opened up further" per the task's framing. However, the validation the relaxation now trusts is weaker than it needs to be for a much larger, less-trusted caller population:
- `contentType.startsWith("image/")` accepts `image/svg+xml`. SVG can embed `<script>`, and files are served back through `FileUploadConfig`'s static `ResourceHandlerRegistry` under the **same origin** as the API (`/files/**`, `permitAll`). A customer (now any authenticated account, not just trusted staff) can upload an SVG containing script and get a same-origin URL back — stored XSS if that URL is ever opened directly or embedded in a context that executes SVG script (e.g. `<object>`/direct navigation as seen in `ServiceRequestsPage.tsx`'s `<a href={url} target="_blank">` wrapper around `<img>`).
- The stored filename extension (`getExtension()`, line 62) is taken directly from the client-supplied `originalFilename` with no whitelist — combined with a spoofable `Content-Type` header (trivial to set via any HTTP client), an attacker can control the on-disk extension almost freely as long as they also spoof a `Content-Type: image/*` header. Files are served statically (not executed as PHP/JSP by Tomcat), so this is not RCE, but it does mean the upload endpoint can be used to host arbitrary attacker-chosen file types under a plausible-looking image URL.
- No per-user rate limit or quota: previously a small set of trusted staff accounts could abuse this for free file hosting / storage exhaustion; now the entire customer base can, with no throttling.

This was a real, if minor, latent weakness before (limited to trusted ADMIN/STAFF), and widening the caller population to "any authenticated customer" is a genuine increase in exposure, not merely opening the door further on a non-issue.

**Fix:** whitelist a small set of raster extensions/content-types (jpg/jpeg/png/webp/gif; explicitly exclude svg), verify magic bytes rather than trusting `Content-Type`, and consider a simple per-user upload rate limit given the caller base just grew from "a handful of staff" to "every customer."

### 6. Review-helpful toggle is not atomic — concurrent double-submit can surface a raw 500
`ReviewController.toggleHelpful()` (`DATN-BE-PC/.../controller/ReviewController.java:81-105`) does `existsByUserIdAndReviewId` → `deleteById`/`save` → `countByReviewId` → `review.setHelpfulCount` → `save`, with no `@Transactional` wrapping the sequence. If two requests from the same user race (double-click before the FE's `disabled={toggleHelpful.isPending}` guard kicks in, a retried request, or a second tab), both can read "not yet marked," and the second `reviewHelpfulRepo.save(...)` will violate the composite PK on `(user_id, review_id)`, throwing `DataIntegrityViolationException`. This isn't caught anywhere, so `GlobalExceptionHandler`'s generic `Exception` handler returns a sanitized `500 INTERNAL_ERROR` (no stack trace/PII leak — that part is fine), but the user-facing behavior for a legitimate double-click is an error instead of an idempotent toggle, which contradicts "toggling again should unmark, not error." The `helpful_count` recompute-from-`countByReviewId()` design itself is correct and avoids classic lost-update races for the *count* — the race is specifically in the insert/delete step.

**Fix:** wrap the method in `@Transactional`, and/or catch `DataIntegrityViolationException` around the insert and treat it as "already helpful" (idempotent no-op) rather than propagating.

## Low

### 7. Service code generation collision risk is consistent with the existing accepted pattern — not a new issue
`WarrantyController.generateServiceCode()` uses a `static AtomicInteger sequence = new AtomicInteger(1)` per-controller-instance counter, mirroring `OrderService.generateOrderCode()` exactly (same pattern, same in-process, non-persisted, resets-on-restart counter, verified at `DATN-BE-PC/.../service/OrderService.java:41`). This has the same latent risk as the existing order-code generator (restart resets the counter to 1, which could theoretically collide with a code already used before restart) — but since it's an established, already-accepted pattern in this codebase rather than something newly introduced, I'm not flagging it as a new defect. If the team wants to fix this, it should be fixed for both generators together (e.g. a DB sequence), not just the new one.

### 8. `updateServiceRequestStatus` lets any TECHNICIAN update any ticket, not just their assigned one
No check that the caller (if role TECHNICIAN) is the `technicianId` assigned to the ticket. This may be intentional (any available tech can pick up any ticket, matching the `hasAnyRole('ADMIN','STAFF','TECHNICIAN')` design), but worth confirming intent — as written, one technician can silently overwrite another technician's diagnosis/status/cost on a ticket they aren't assigned to.

### 9. `getAdminServiceRequests`'s `storeId` filter runs in application memory after the full result set is fetched
`WarrantyController.java:154-156` filters by `storeId` via a Java `.stream().filter(...)` after loading all matching-status rows from the DB. Low volume today, but it means the `storeId` param doesn't reduce DB work or benefit from the existing `idx_service_requests_store` index; will scale poorly if ticket volume grows.

### 10. `toggleHelpful` mutation on the frontend disables all review "helpful" buttons at once
`ProductDetailPage.tsx` uses a single shared `useMutation()` instance for all reviews on the page (`disabled={toggleHelpful.isPending}` at line 443 applies to every review's button, not just the one clicked). Minor UX nit: clicking helpful on review A visibly disables the button on review B until A's request resolves.

## Confirmed as accepted trade-offs (per task framing — not re-flagged as new findings)
- **FE has no way to know if the current user already marked a review helpful on page load** (`ProductDetailPage.tsx`, `helpfulState` starts empty). Confirmed: `GET /reviews/product/{id}` returns raw `Review` entities with no per-user `isHelpful` flag, and `ReviewHelpfulRepository` has no `findByUserIdAndReviewIdIn` bulk-check method to support one. This is a real UX gap (a user's "helpful" mark appears un-set after a page refresh even though the DB row exists) but is explicitly called out as known/deferred — agreed it's reasonable to defer, since fixing it needs either a bulk membership check added to the list response or a separate `/reviews/my-helpful?ids=...` endpoint, which is more than a one-line fix.
- **`admin/BlogPage.tsx` has no create/edit post form**, only the new product-linking modal. Confirmed pre-existing gap, correctly out of scope for this session.

## Verified as correct / no issue found
- `approve-repair` ownership check (`WarrantyController.java:204-206`) correctly verifies `sr.getUser().getId().equals(userId)` before allowing approval — cannot be used to approve/reject another customer's ticket.
- All admin-only endpoints (`/service-requests/admin`, `/service-requests/technicians`, `/service-requests/{id}/status`, blog `/products` GET+PUT, blog create/update) carry `@PreAuthorize`, and `@EnableMethodSecurity` is present in `SecurityConfig`, so these are enforced independently of the URL-level `permitAll` rules (verified `/blog/**` GET being `permitAll` at the filter-chain level does not bypass the method-level `@PreAuthorize` on `/blog/{id}/products`).
- `GET /blog` (list) and `GET /blog/{slug}` both correctly keep `BlogPost.mentionedProducts` off the list response (`@JsonIgnore` on the entity field, only reintroduced via the new `BlogPostResponse.mentionedProducts` on the single-post DTO) — no N+1 introduced on the public listing from `mentionedProducts` specifically (the passwordHash leak in Critical #1 is a separate, pre-existing issue on the same endpoint).
- `BlogController.update()`'s fix to also persist `blogCategory` is correct and doesn't regress `title`/`content`/`excerpt`/`thumbnailUrl`/`isPublished` handling.
- Raw-`Product`-entity serialization in `BlogPostResponse.mentionedProducts` is consistent with this codebase's existing convention of returning JPA entities directly from other product endpoints (`ProductController`) — not a new regression, and `Product` itself has no sensitive/cost fields to leak.
- `ServiceRequestRequest`/`ServiceRequestStatusUpdateRequest` validation (`@NotBlank` on `issueDesc`/`status`) and the `mediaUrls.size() > 5` server-side cap are both present and correctly enforced independent of the frontend's own 5-file cap.
- `ServiceRequestRepository`/`UserRepository` additions (`findAllByOrderByCreatedAtDesc`, `findByStatusOrderByCreatedAtDesc`, `findByRole`) are simple derived queries, no correctness issues.

## Recommended Actions (priority order)
1. Fix `User.passwordHash` (and ideally `loginAttempts`/`lockedUntil`) to `@JsonIgnore`, or at minimum DTO `BlogController.getAll()` the same way `getBySlug()` was fixed — Critical, public unauthenticated credential-hash leak.
2. Add server-side enforcement that chargeable-repair status transitions require `customerApprovedRepair == true` — High, defeats a named FR-20 requirement otherwise.
3. Add `'technician'` to `AdminRoute.tsx` allowed roles (or otherwise give technicians a working UI) — High, feature unusable for one of three intended actor roles.
4. Batch the media/technician/user lookups in `WarrantyController.toResponse()` for list endpoints — High, N+1 on admin listing.
5. Tighten `FileController` extension/content-type whitelist and consider rate-limiting given the caller base widened from staff-only to all customers — Medium.
6. Wrap `ReviewController.toggleHelpful` in `@Transactional` and handle the duplicate-key race idempotently — Medium.

## Unresolved Questions
- Is a technician expected to only ever touch tickets assigned to them, or is "any available technician can pick up any ticket" intentional? Affects whether finding #8 needs a fix or is by design.
- Should `admin/BlogPage.tsx`'s missing create/edit-post form be tracked as a follow-up item, or is it deliberately staying manual/DB-only for now?
