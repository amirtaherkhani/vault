# Serialization

For serialization boilerplate use [class-transformer](https://www.npmjs.com/package/class-transformer) and global interceptor `ClassSerializerInterceptor`.

---

## Table of Contents <!-- omit in toc -->

- [Serialization](#serialization)
  - [Hide private property](#hide-private-property)
  - [Show private property for admins](#show-private-property-for-admins)
  - [Role-based DTO serialization overview](#role-based-dto-serialization-overview)
  - [Pattern 1: Controller-driven groups (HTTP)](#pattern-1-controller-driven-groups-http)
  - [Pattern 2: Service-driven groups (manual)](#pattern-2-service-driven-groups-manual)
  - [DTO group syntaxes](#dto-group-syntaxes)
    - [1) Literal group strings](#1-literal-group-strings)
    - [2) RoleEnum-based helper](#2-roleenum-based-helper)
  - [Layer checklist](#layer-checklist)
  - [Adding new roles (viewer/writer/etc.)](#adding-new-roles-viewerwriteretc)

---

## Hide private property

If you need to hide a property in **serialized responses**, use
`@Exclude({ toPlainOnly: true })` on the field.

```ts
// src/users/domain/user.ts (or the DTO/entity you return in responses)
import { Exclude } from 'class-transformer';

export class User {
  @Exclude({ toPlainOnly: true })
  password: string;
}
```

Notes:

- `toPlainOnly: true` excludes the field **only when converting class -> plain**
  (API response / `instanceToPlain`).
- It **does not** affect repository queries, relations, or database loading
  (`many-to-one`, `one-to-many`, etc.). If you want to avoid loading a field,
  you must do that in the query/select layer.

## Show private property for admins

This is **class-transformer group filtering** wired through Nest's
`ClassSerializerInterceptor` (not an access-control feature). You still need
`@Roles(...)` + `RolesGuard` for authorization.

1. Create a controller that returns data only for admin and add `@SerializeOptions({ groups: ['admin'] })` to method:

   ```ts
   // /src/users/users.controller.ts

   // Some code here...

   @ApiBearerAuth()
   @Roles(RoleEnum.admin)
   @UseGuards(AuthGuard('jwt'), RolesGuard)
   @Controller({
     path: 'users',
     version: '1',
   })
   export class UsersController {
     constructor(private readonly usersService: UsersService) {}

     // Some code here...

     @SerializeOptions({
       groups: ['admin'],
     })
     @Get(':id')
     @HttpCode(HttpStatus.OK)
     findOne(@Param('id') id: string) {
       return this.usersService.findOne({ id: +id });
     }

     // Some code here...
   }
   ```

1. On the **response class you actually return** (DTO/domain/entity), add
   `@Expose({ groups: ['admin'] })` to the fields that should be exposed for
   admins.

   ```ts
   // src/users/domain/user.ts (or the DTO/entity you return in responses)
   import { Expose } from 'class-transformer';

   export class User {
     @Expose({ groups: ['admin'] })
     email: string | null;
   }
   ```

---

## Role-based DTO serialization overview

Quick answers for this codebase:

- Ways to apply role-based response filtering: **2**
  1. **Controller-driven groups** using `@SerializeOptions(...)` with the global `ClassSerializerInterceptor`.
  2. **Service-driven groups** using `GroupPlainToInstance(...)` / `GroupPlainToInstances(...)`.
- Group annotation syntaxes on DTO fields: **2**
  1. `@Expose({ groups: ['admin', 'user'] })` (string groups)
  2. `@Expose(RoleGroups([RoleEnum.admin]))` (RoleEnum-based helper)

Current group names in the codebase:

- Roles in `src/roles/roles.enum.ts`: `admin`, `user`
- Non-role group used for self responses: `me` (explicit group name, not a role;
  see `src/auth/*.controller.ts` + `src/users/domain/user.ts`)

Global serialization is enabled in `src/main.ts` via:

```ts
app.useGlobalInterceptors(
  new ResolvePromisesInterceptor(),
  new ClassSerializerInterceptor(app.get(Reflector)),
  new StandardResponseInterceptor(),
);
```

---

## Pattern 1: Controller-driven groups (HTTP)

Use this when the response is returned from an HTTP controller and you want the
global `ClassSerializerInterceptor` to pick the right group.

Where to apply:

- **Controller method (or controller class)**: `@SerializeOptions({ groups: ['admin'] })`
- **DTO/Entity fields**: `@Expose({ groups: [...] })`
- **Access control**: `@Roles(...)` + `RolesGuard` if the endpoint is restricted

Example (admin-only response):

```ts
// src/users/users.controller.ts
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@SerializeOptions({ groups: ['admin'] })
@Get(':id')
findOne(@Param('id') id: User['id']) {
  return this.usersService.findById(id);
}
```

```ts
// src/users/domain/user.ts
@Expose({ groups: ['me', 'admin'] })
email: string | null;
```

Notes:

- `@SerializeOptions` only affects **controllers/handlers** (HTTP layer).
- `ApiOperationRoles(...)` is Swagger-only. It does not enforce access.
- Group filtering only applies to **class instances**. If you return plain
  objects, `@Expose` groups are ignored — return DTO/domain instances or use
  `plainToInstance(...)`.

---

## Pattern 2: Service-driven groups (manual)

Use this when the response is created in a service/provider (or not going
through a controller), or when you want explicit role shaping inside the
service layer.

Where to apply:

- **Service method**: `GroupPlainToInstance(...)` or `GroupPlainToInstances(...)`
- **DTO fields**: `@Exclude()` at class level + `@Expose({ groups: [...] })`

Example (notifications):

```ts
// src/notifications/notifications.service.ts
return GroupPlainToInstance(NotificationResponseDto, created, [RoleEnum.admin]);
```

```ts
// src/notifications/dto/notification-response.dto.ts
@Exclude() 
export class NotificationResponseDto {
  @Expose({ groups: ['admin', 'user'] })
  title: string;
}
```

The helper maps `RoleEnum` values to groups using `RoleGroupsDict`:

```ts
// src/utils/transformers/class.transformer.ts
const groups = roles.map((role) => RoleGroupsDict[role]);
return plainToInstance(cls, data, { groups });
```

---

## DTO group syntaxes

### 1) Literal group strings

```ts
@Expose({ groups: ['admin', 'user'] })
isActive: boolean;
```

### 2) RoleEnum-based helper

```ts
import { RoleGroups } from '../../utils/transformers/enum.transformer';

@Expose(RoleGroups([RoleEnum.admin]))
ip?: string | null;
```

This syntax is used in socket DTOs like
`src/communication/socketio/dto/user-socketio.dto.ts`.

---

## Layer checklist

- DTOs:
  - `@Exclude()` at class level for explicit opt-in.
  - `@Expose()` for public fields.
  - `@Expose({ groups: [...] })` or `@Expose(RoleGroups([...]))` for role-only fields.
- Controllers (HTTP):
  - Guard access with `@Roles(...)` + `RolesGuard` where needed.
  - Set groups with `@SerializeOptions({ groups: [...] })`.
- Services:
  - For explicit shaping, return DTOs using
    `GroupPlainToInstance(...)` / `GroupPlainToInstances(...)`.
  - Pass roles from the caller (e.g., admin vs user).
- Repository/ORM layers are **not affected** by `@Exclude`/`@Expose`.

Avoid mixing mismatched groups across layers. If a controller sets
`groups: ['admin']` and the service returns a DTO shaped for `user`, you can
lose fields.

---

## Adding new roles (viewer/writer/etc.)

If you need new roles such as `viewer` or `writer`:

1. Add them to `src/roles/roles.enum.ts`.
2. `RoleGroupsDict` will automatically map them to lowercase group names.
3. Update DTOs with new groups in `@Expose(...)`.
4. Use the new roles in controllers (`@Roles(...)` + `@SerializeOptions(...)`)
   and/or in services (`GroupPlainToInstance(..., [RoleEnum.viewer])`).

---

Previous: [Auth](auth.md)

Next: [File uploading](file-uploading.md)
