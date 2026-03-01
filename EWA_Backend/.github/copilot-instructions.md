# Copilot Instructions (Backend Convention)

> File location: `.github/copilot-instructions.md`  
> Applies to: all backend code (Spring Boot / Java 17 / Maven)

## 0) Goal
When generating or modifying code, **follow the existing TicketML conventions**:
- Keep the same **package layout**, **Response wrapper**, **exception model**, **DTO/converter pattern**, and **service interface + impl** structure.
- Prefer changes that are **additive** (new files, new enums) over refactors that rename/move large parts of the codebase.

---

## 1) Tech stack & libraries (default choices)
Use the same defaults as the existing project unless explicitly told otherwise:
- **Java 17**, **Spring Boot 3.x**, **Maven**
- Starters: `web`, `validation`, `security`, `data-jpa`
- `spring-boot-starter-webflux` (use `WebClient` for provider calls)
- `modelmapper` (STRICT)
- `jjwt` for JWT (same version family already used)
- `springdoc-openapi` for Swagger UI
---

## 2) Required folder / package structure
Create code under `src/main/java/com/<project>/...` following this structure:

- `common/`
    - `dto/<feature>/...` (request/response DTOs grouped by feature)
    - `entity/...` (JPA entities; use `@Table` and extend `Auditable` if available)
    - `enums/...` (status enums + `ErrorMessage`)
- `config/` (Security, WebClient, ModelMapper, etc.)
- `controller/` (REST controllers)
- `converter/` (`SuperConverter<D,E>` + feature converters using `ModelMapper`)
- `exception/` (custom exceptions extending `GenericException`)
- `exception/global/` (`GlobalExceptionHandler`)
- `repository/` (Spring Data JPA repositories)
- `response/` (`Response`, `PagedResult`)
- `services/` (interfaces)
- `services/impl/` (implementations; `@Service`)
- `util/` (helpers like `SecurityUtil`)
- (optional) `specification/` (if you need JPA Specification queries)

**Do not** create ad-hoc packages like `handler/`, `api/`, `domain/`, `usecase/` unless the team explicitly adopts them.

---

## 3) API conventions
### 3.1 Versioning & routing
- Every REST controller must be under: `@RequestMapping("api/v1/<resource>")`
- Use plural nouns: `/api/v1/withdrawals`, `/api/v1/employees`
- Use `/me` for current user context when applicable.

### 3.2 Controller return type
- Controllers return **`com.<project>.response.Response`** (not `ResponseEntity`) for happy-path.
- Always wrap service results: `return new Response(service.method(...));`
- For pagination: service may return `Page<?>` and controller returns `new Response(page)` (Response will fill `pagedResult`).

### 3.3 DTO usage
- Do not expose entities directly in API responses.
- Define DTOs in `common/dto/<feature>/...`.
- Use Lombok `@Data` for DTOs (consistent with the project).

Naming:
- Request DTOs: `XxxCreateDTO`, `XxxUpdateDTO`, `XxxRequestDto` (pick one style and stay consistent per feature)
- Response DTOs: `XxxResponseDto`

---

## 4) Error handling (MUST follow)
### 4.1 ErrorMessage enum
- Add new error codes to `common/enums/ErrorMessage`.
- Each entry must include: `(httpStatus, code, message)`
- Reuse existing errors if the meaning matches; otherwise add a new one.

### 4.2 Custom exceptions
- Throw only project exceptions (extending `GenericException`):
    - `BadRequestException(ErrorMessage ...)`
    - `NotFoundException(ErrorMessage ...)`
    - `ForbiddenException(ErrorMessage ...)`
    - `ConflictException(ErrorMessage ...)`
    - `InternalServerException(ErrorMessage ...)`
- Do not throw raw `RuntimeException` from business logic.
- Validate early in service layer and throw the correct exception.

### 4.3 Global handler
- Keep using `exception/global/GlobalExceptionHandler` to map exceptions → `new Response(e)`.

---

## 5) Service + Repository + Converter pattern (MUST follow)
When you add a new feature or endpoint, implement the full vertical slice:

1) **DTOs** in `common/dto/<feature>/...`
2) **Entity** in `common/entity/...`
3) **Repository** in `repository/...` (extends `JpaRepository`)
4) **Service interface** in `services/...`
5) **ServiceImpl** in `services/impl/...` (`@Service`)
6) **Converter** in `converter/...` (extends `SuperConverter`)
7) **Controller** in `controller/...`

Rules:
- Use **constructor injection** only (no `@Autowired` field injection).
- All write operations must be in a **service** method annotated with `@Transactional` (jakarta transaction).
- Repository should not contain business logic; keep logic in service.

---

## 6) Mapping rules (ModelMapper + Converter)
- Use the existing `ModelMapperConfig` with `MatchingStrategies.STRICT`.
- Any entity-to-dto mapping must go through a feature converter:
    - `XxxConverter extends SuperConverter<XxxResponseDto, XxxEntity>`
- If a field needs manual mapping (e.g., enum name), do it in converter (see existing `UserConverter` style).

---

## 7) Security conventions
- Keep the app **stateless** (`SessionCreationPolicy.STATELESS`).
- Read current user identity using a `SecurityUtil` method (pattern already exists).
- Do not leak auth logic into controllers; controllers should call `SecurityUtil.get...()` and pass identifier to service.

For new public endpoints (e.g., auth, webhooks):
- Add them to `SecurityConfig` as `permitAll()` explicitly.
- Keep swagger endpoints permitted.

---

## 8) Database & money handling rules (EWA-specific)
### 8.1 Money
- **Never** use `float/double` for money.
- Use `long` in Java and `BIGINT` in DB (unit = **VND**).
- Use suffix naming: `amountVnd`, `feeVnd`, `totalDebitVnd`, etc.

### 8.2 Ledger-first approach
- Prefer a `ledger_entries` table and compute balances from ledger sums.
- Avoid storing `availableBalance` as a mutable column unless explicitly asked.

### 8.3 Idempotency
- For APIs that can be retried (withdraw/create payout), support idempotency:
    - Accept `Idempotency-Key` (header) and persist it.
    - Add unique constraint `(employee_id, idempotency_key)` (or equivalent).

### 8.4 Provider integration
- Use a provider-agnostic interface (e.g., `PaymentGateway`) under `services/`.
- Provider implementations must be under `services/impl/`.
- Use `WebClient` from `WebClientConfig`, do not instantiate new clients.

---

## 9) Testing conventions
- Use `spring-boot-starter-test`.
- Write **unit tests** for critical business logic (especially money, rounding, fees, limits).
- Do not rely only on controller tests; test service methods directly.
- For provider calls, mock `WebClient` or wrap calls behind `PaymentGateway` and mock that interface.

---

## 10) Logging & observability
- Log only meaningful events at service boundaries:
    - create withdrawal, confirm, provider response, webhook processed
- Do not log sensitive data (full bank account number, OTP, raw tokens).
- Prefer structured messages that include ids: `withdrawalId`, `employeeCode`, `externalTxnId`.

---

## 11) Code style rules (STRICT)
- Use **constructor injection** and `final` fields where possible.
- Keep methods small; extract helpers into private methods in service.
- No “magic numbers” for fees/limits; put them in config/constants or policy tables if requested.
- Avoid circular dependencies between services.
- Do not change existing file names, public method signatures, or package layout without explicit instruction.

---

## 12) Default “feature scaffold” template
When asked to add a new feature, generate:
- Controller + DTOs + Service interface + ServiceImpl + Repository + Converter + ErrorMessage additions
- Ensure endpoints return `Response`
- Ensure failures throw project exceptions
- Ensure code compiles and matches existing conventions.

