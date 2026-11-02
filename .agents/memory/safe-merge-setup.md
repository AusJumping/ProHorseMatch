---
name: Safe merge setup
description: Boundary between automatic code reconciliation and explicitly authorized database setup.
---

Automatic post-merge setup should install locked dependencies, test and compile only. Do not migrate, seed, start the application server or connect to a database automatically. Keep application credentials out of install/test/build child processes.

**Why:** This workspace may inherit credentials for existing services, while redesign work must remain isolated from live users and data. Successful task merging is not authorization to initialize or alter those services.

**How to apply:** Keep database setup behind the existing guarded redesign launcher and a separately configured test database. A compilation-only setup may set the sandbox frontend flag without supplying any real database connection.
