---
name: project-datn-fk-delete-risk
description: DATN-BE-PC nullable FK columns (REFERENCES ... with no ON DELETE clause) cause unhandled 500s when the referenced row is deleted while still in use
metadata:
  type: project
---

In `DATN-BE-PC`, several FK columns are declared as plain `REFERENCES table(id)` with no
`ON DELETE` clause (e.g. `orders.build_id REFERENCES pc_builds(id)` in
`db/changelog/migrations/06__cart_orders.sql`, also `orders.voucher_id`). Postgres default is
`NO ACTION`, so deleting the referenced row while any FK still points to it throws a DB
constraint violation. `GlobalExceptionHandler` has no specific handler for
`DataIntegrityViolationException`, so it falls through to the generic `Exception` handler and
returns an unhelpful "Lỗi hệ thống, vui lòng thử lại sau" 500 instead of a clear 409/400.

Confirmed concrete instance (260804 Phase 4 review): `PcBuildService.deleteBuild` lets a user
delete a saved `PcBuild` even after an `Order` was created from it (`order.build` FK) — the
delete throws at the DB layer once such an order exists, silently breaking "xóa cấu hình" for
any build that was ever ordered from.

**Why:** Found while reviewing Phase 4 (Build PC save/manage) — `orders.build_id` has no
`ON DELETE SET NULL`/`CASCADE`/`RESTRICT`-with-friendly-message, and the delete-owned-build
service method does not pre-check for referencing orders.

**How to apply:** When reviewing any new delete endpoint in this repo, check whether the
target entity is referenced by other tables' FKs and whether the migration's `REFERENCES`
clause has an `ON DELETE` policy. If not, verify the service layer pre-checks for referencing
rows (or catches `DataIntegrityViolationException`) before calling `repository.delete(...)`,
otherwise flag it — this is a recurring gap pattern in this codebase, not a one-off.
