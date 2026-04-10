---
sidebar_position: 9
title: API endpoints
description: Register REST-style API handlers in server mode using the api array, with full ctx context reference and CRUD examples.
---

# API Endpoints

Server mode registers REST-style endpoints as **engine-server routes** with a **`handler`** function. When Express middleware is configured, Clovie uses the Express adapter; otherwise it uses the faster native HTTP stack.

## API route shape

```javascript
{
  path: '/api/users/:id',       // URL pattern (leading segments often include /api/…)
  method: 'GET',               // HTTP verb
  handler: async (ctx) => {    // Returns a response descriptor via ctx.respond.*
    return ctx.respond.json({ id: ctx.params.id });
  }
}
```

## Handler context (`ctx`)

Typical fields (see also `lib/types/kernel.js`):

- **`ctx.req`** — method, url, headers
- **`ctx.params`**, **`ctx.query`**, **`ctx.body`** — parsed request pieces
- **`ctx.state`** — reactive state (`get` / `set` where provided by the engine)
- **`ctx.respond.json(data, status)`**, **`.html()`**, **`.text()`**, **`.file()`** — structured responses

## Complete API examples (handlers + state)

```javascript
export default {
  type: 'server',

  api: [
    {
      path: '/api/users',
      method: 'GET',
      handler: async (ctx) => {
        let users = ctx.state.get('users') || [];

        if (ctx.query.search) {
          const q = String(ctx.query.search).toLowerCase();
          users = users.filter((u) => u.name.toLowerCase().includes(q));
        }

        const page = parseInt(ctx.query.page, 10) || 1;
        const limit = parseInt(ctx.query.limit, 10) || 10;
        const start = (page - 1) * limit;
        const slice = users.slice(start, start + limit);

        return ctx.respond.json({
          users: slice,
          pagination: {
            page,
            limit,
            total: users.length,
            totalPages: Math.ceil(users.length / limit),
          },
        });
      },
    },

    {
      path: '/api/users',
      method: 'POST',
      handler: async (ctx) => {
        const { name, email, age } = ctx.body || {};
        const errors = [];
        if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
        if (!email || !email.includes('@')) errors.push('Valid email required');
        if (age != null && (age < 13 || age > 120)) errors.push('Age must be between 13 and 120');

        if (errors.length) {
          return ctx.respond.json({ error: 'Validation failed', errors }, 400);
        }

        const users = ctx.state.get('users') || [];
        if (users.find((u) => u.email === email)) {
          return ctx.respond.json({ error: 'Email already exists' }, 409);
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          age: age ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        users.push(newUser);
        ctx.state.set('users', users);

        return ctx.respond.json({ success: true, user: newUser }, 201);
      },
    },

    {
      path: '/api/users/:id',
      method: 'PUT',
      handler: async (ctx) => {
        const userId = parseInt(ctx.params.id, 10);
        const users = ctx.state.get('users') || [];
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return ctx.respond.json({ error: 'User not found' }, 404);
        }
        const updatedUser = {
          ...users[userIndex],
          ...(ctx.body || {}),
          updatedAt: new Date().toISOString(),
        };
        users[userIndex] = updatedUser;
        ctx.state.set('users', users);
        return ctx.respond.json({ success: true, user: updatedUser });
      },
    },

    {
      path: '/api/users/:id',
      method: 'DELETE',
      handler: async (ctx) => {
        const userId = parseInt(ctx.params.id, 10);
        const users = ctx.state.get('users') || [];
        const userIndex = users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return ctx.respond.json({ error: 'User not found' }, 404);
        }
        const [deletedUser] = users.splice(userIndex, 1);
        ctx.state.set('users', users);
        return ctx.respond.json({ success: true, user: deletedUser });
      },
    },

    {
      path: '/api/upload',
      method: 'POST',
      handler: async (ctx) => {
        const file = ctx.body?.file;
        if (!file) {
          return ctx.respond.json({ error: 'No file uploaded' }, 400);
        }
        const fileRecord = {
          id: Date.now(),
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
        };
        const files = ctx.state.get('files') || [];
        files.push(fileRecord);
        ctx.state.set('files', fileRecord);
        return ctx.respond.json({ success: true, file: fileRecord });
      },
    },
  ],
};
```

For composing API definitions across multiple files, see [Factories](./factories).
