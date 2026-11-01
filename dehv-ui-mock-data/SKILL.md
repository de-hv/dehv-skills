---
name: dehv-ui-mock-data
description: >-
  Create and organize reusable test fixtures, builders, ObjectMothers, and
  service doubles in any JavaScript or TypeScript project, following the repo's
  existing fixture convention. Use when adding or changing fixtures, builders,
  or test data for services, API responses, domain models, or component props.
---

# Mocked Data

Guidelines for creating reusable test fixtures. Test structure, scenarios, and mock resets belong to [dehv-ui-unit-tests](../dehv-ui-unit-tests/SKILL.md).

## Detect the repo's convention first

Before creating anything, look for how the repo already builds test data:

| What to find | Where to look |
|--------------|---------------|
| Fixture files | `**/__mocks__/**`, `**/*.mock.*`, `**/__fixtures__/**`, `**/fixtures/**` |
| Factories | `create*` / `make*` / `build*` helpers, `**/factories/**`, `fishery`, `@faker-js/faker` |
| Nearby tests | what tests in the same feature area import |

**If a convention exists, follow it** — its location, naming, and shape. Reuse or extend what is there, and do not migrate it to classes unless the user asks.

Everything below is the default when the repo has no convention: **classes** in `__mocks__`, rather than plain objects, arrays, or inline literals.

## Mock file location

Place mocks in a co-located `__mocks__` folder next to the module they support. Create the folder if it does not exist, or add to an existing one.

| Mock kind | Typical location |
|-----------|------------------|
| Domain / DTO / API payloads | `{module}/__mocks__/{entity}.mock.{js,ts}` |
| Service / repository doubles | `{module}/__mocks__/{name}.mock.{js,ts}` |
| Component / view props | `{component}/__mocks__/{name}.mock.{js,ts}` |
| Shared fixtures used across modules | `__mocks__/{entity}.mock.{js,ts}` at the nearest common ancestor |

**Naming:** `{entity}.mock.{js,ts}` — use `.ts` only in TypeScript projects, `.js` in JavaScript-only projects.

**Do not** put reusable fixtures inline in test files — extract them to `__mocks__`.

Follow the project's existing import style (relative paths, path aliases, etc.) when importing from `__mocks__`.

### Jest and `__mocks__`

Jest gives `__mocks__` a special meaning, so check these when the repo uses Jest:

- **Manual mocks:** a file named after a module replaces that module under `jest.mock()`, and one named after a package in a `__mocks__` folder next to `node_modules` replaces that package automatically. Keep the `.mock` suffix so fixtures never match a real module name.
- **Duplicate names:** Jest warns `duplicate manual mock found` when two `__mocks__` folders hold the same relative path, such as `user.mock.ts` in two modules. Before adding a file, search for that name and make it unique: `billing-user.mock.ts`, or `__mocks__/billing/user.mock.ts`.

## Builder vs ObjectMother

### Builder — dynamic / overridable data

Use when tests need to tweak specific fields while keeping sensible defaults.

**TypeScript:**

```
export class UserBuilder {
  private data: User = { id: '1', name: 'Ada', active: true }

  with(attributes: Partial<User>) {
    this.data = { ...this.data, ...attributes }
    return this
  }

  build(): User {
    return { ...this.data }
  }
}
```

**JavaScript:** same structure, without type annotations.

**When to use:** per-test variations, partial overrides, composing nested objects.

**Naming:** `{Entity}Builder` (e.g. `UserBuilder`, `OrderBuilder`).

**`with()` is required** and is the standard way to override fields. It merges top-level fields only, so pass a nested object whole. If an existing builder lacks it, add it rather than duplicating the fixture.

**Optional:** named setters for frequently overridden fields (e.g. `withStatus(value)`) that call `with()`.

### ObjectMother — fixed / shared data

Use when the same payload is reused unchanged across tests. Expose it through a **static getter that returns a fresh literal**, so a test that mutates its copy cannot affect another test:

```
export class UsersMother {
  static get list(): User[] {
    return [
      { id: '1', name: 'Ada', active: true },
      { id: '2', name: 'Lin', active: false },
    ]
  }
}
```

In JavaScript, omit the return type.

Do not use a `static data = { ... }` field: every test would share the same object. Each access returns a new object, so compare with `toEqual`, not `toBe`.

**When to use:** static lists, canonical API responses, shared constants.

**Naming:** `{Entity}Mother` (e.g. `UsersMother`, `ErrorResponsesMother`).

### Dependency / interface doubles

For mocks that stand in for a service, repository, or module dependency, use `{Name}Mock` with a fluent `with()` that assigns overrides:

**TypeScript:**

```
export class UserServiceMock implements IUserService {
  findById = vi.fn() // or jest.fn(), sinon.stub(), etc.

  with(attributes: Partial<IUserService>) {
    Object.assign(this, attributes)
    return this
  }
}
```

**JavaScript:** same pattern without `implements` or type annotations.

Use `{Entity}Mock` when the double represents a domain instance with behavior (methods, getters).

## TypeScript

- **TypeScript projects:** import types from the source module; type `with()` as `Partial<T>`, private fields as `T`, and use `implements` on dependency doubles when an interface exists.
- **JavaScript projects:** omit type annotations and `implements`; keep the same class structure and method names.

Detect TypeScript by the presence of `.ts`/`.tsx` source or test files and a `tsconfig`. Do not add types in JS-only projects.

## Usage in tests

```
import { UserBuilder } from '../__mocks__/user.mock'
import { UsersMother } from '../__mocks__/users.mock'

const user = new UserBuilder().with({ id: '2', active: false }).build()
const users = UsersMother.list
```

Compose builders when one fixture depends on another:

```
private data: UserAddress = {
  ...new AddressBuilder().build(),
  userId: '1',
}
```

## Checklist

- [ ] Repo's fixture convention searched for and followed when one exists
- [ ] Otherwise, mock lives in `__mocks__/{entity}.mock.{js,ts}`, not inline in the test
- [ ] Otherwise, uses a class (Builder, ObjectMother, or Mock) — not a bare object/array export
- [ ] Builder chosen for overrides and defines `with()`; ObjectMother for fixed shared data
- [ ] ObjectMother getters return fresh data, so tests cannot share mutations
- [ ] In Jest repos, the file name does not duplicate another `__mocks__` file
- [ ] Types added only in TypeScript projects
- [ ] File extension matches the project language (`.js` vs `.ts`)
- [ ] Defaults are realistic enough for the unit under test

## Anti-patterns

- Plain exported objects such as `export const mockUser = { ... }`, unless that is the repo's convention
- Mutable `static` fields shared between tests
- Large inline fixtures inside `it()` / `test()` blocks
- Copy-pasting the same object across multiple test files
- Placing test mocks alongside production source, outside the repo's fixture location
- Introducing classes into a repo that already has another fixture convention
