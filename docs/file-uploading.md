# File storage and uploading

---

## Table of Contents <!-- omit in toc -->

- [Purpose](#purpose)
- [Quick answer: disable local storage and use cloud](#quick-answer-disable-local-storage-and-use-cloud)
- [Storage drivers](#storage-drivers)
- [Environment variables](#environment-variables)
- [Driver flows](#driver-flows)
  - [Local driver (`FILE_DRIVER=local`)](#local-driver-file_driverlocal)
  - [S3 driver (`FILE_DRIVER=s3`)](#s3-driver-file_drivers3)
  - [S3 Presigned driver (`FILE_DRIVER=s3-presigned`)](#s3-presigned-driver-file_drivers3-presigned)
- [Kubernetes and stateful architecture](#kubernetes-and-stateful-architecture)
  - [Recommended for Kubernetes: stateless app + cloud object storage](#recommended-for-kubernetes-stateless-app--cloud-object-storage)
  - [When local storage is required: stateful app pattern](#when-local-storage-is-required-stateful-app-pattern)
- [Migration notes (local -> cloud)](#migration-notes-local---cloud)
- [Verification checklist](#verification-checklist)
- [How to delete files](#how-to-delete-files)

---

## Purpose

This document explains how file storage works in this app, how to run with local disk or cloud storage, and how to deploy correctly on Kubernetes depending on stateless vs stateful requirements.

---

## Quick answer: disable local storage and use cloud

Yes, local file upload storage is disabled when you set:

```dotenv
FILE_DRIVER=s3
```

or:

```dotenv
FILE_DRIVER=s3-presigned
```

In these modes:

- new uploads do not use `./files` local disk storage.
- uploads are stored in S3-compatible object storage.
- local download route for disk files is not the active upload path.

Important:

- there is no `FILE_DRIVER=none`; you must choose one driver.
- existing records created with `local` may require migration before full cloud-only operation.

---

## Storage drivers

Supported values for `FILE_DRIVER`:

- `local`
- `s3`
- `s3-presigned`

Operational behavior:

1. `local`

- Upload binary to backend.
- Backend writes file to `./files`.
- Backend serves file via API path.
- Suitable for local development or single-node setups.

2. `s3`

- Upload binary to backend.
- Backend streams upload to S3 bucket.
- File reference is stored in DB as S3 key.
- Backend returns signed GET URL when serializing `File`.

3. `s3-presigned`

- Client sends metadata (`fileName`, `fileSize`) to backend.
- Backend creates DB file record + presigned PUT URL.
- Client uploads directly to S3.
- Best production fit for high traffic and Kubernetes.

---

## Environment variables

Base file storage section in `.env`:

```dotenv
########################################
# File storage
########################################
FILE_DRIVER=local
ACCESS_KEY_ID=
SECRET_ACCESS_KEY=
AWS_S3_REGION=
AWS_DEFAULT_S3_BUCKET=
```

Cloud (S3 or S3 Presigned) requires:

- `FILE_DRIVER=s3` or `FILE_DRIVER=s3-presigned`
- non-empty `ACCESS_KEY_ID`
- non-empty `SECRET_ACCESS_KEY`
- non-empty `AWS_S3_REGION`
- non-empty `AWS_DEFAULT_S3_BUCKET`

Example for cloud mode:

```dotenv
FILE_DRIVER=s3-presigned
ACCESS_KEY_ID=AKIA...
SECRET_ACCESS_KEY=...
AWS_S3_REGION=us-east-1
AWS_DEFAULT_S3_BUCKET=my-vault-files
```

---

## Driver flows

### Local driver (`FILE_DRIVER=local`)

1. Client `POST /api/v1/files/upload` with multipart file.
2. Backend writes to `./files`.
3. DB stores local API path.
4. Client uses file entity in later requests (example: user avatar).

### S3 driver (`FILE_DRIVER=s3`)

1. Client `POST /api/v1/files/upload` with multipart file.
2. Backend uploads object to S3.
3. DB stores object key.
4. Responses expose a signed GET URL for downloads.

### S3 Presigned driver (`FILE_DRIVER=s3-presigned`)

1. Client `POST /api/v1/files/upload` with metadata only.
2. Backend returns:

- `file` DB entity
- `uploadSignedUrl` (temporary PUT URL)

3. Client uploads binary directly to S3 using `uploadSignedUrl`.
4. Client attaches returned `file` entity to domain object (profile, etc.).

---

## Kubernetes and stateful architecture

### Recommended for Kubernetes: stateless app + cloud object storage

Use this for production:

- Set `FILE_DRIVER=s3` or `FILE_DRIVER=s3-presigned`.
- Deploy app as a `Deployment` with multiple replicas.
- Keep no persistent volume for `./files` (not needed for uploads).
- Store AWS credentials in `Secret` (or use IAM role/workload identity).

Why this is better:

- horizontal scaling is straightforward.
- no pod-local file coupling.
- no shared filesystem requirement between replicas.

Minimal Kubernetes env pattern:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vault-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vault-api
  template:
    metadata:
      labels:
        app: vault-api
    spec:
      containers:
        - name: api
          image: your-image:tag
          env:
            - name: FILE_DRIVER
              value: 's3-presigned'
            - name: AWS_S3_REGION
              valueFrom:
                secretKeyRef:
                  name: vault-file-storage
                  key: AWS_S3_REGION
            - name: AWS_DEFAULT_S3_BUCKET
              valueFrom:
                secretKeyRef:
                  name: vault-file-storage
                  key: AWS_DEFAULT_S3_BUCKET
            - name: ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: vault-file-storage
                  key: ACCESS_KEY_ID
            - name: SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: vault-file-storage
                  key: SECRET_ACCESS_KEY
```

### When local storage is required: stateful app pattern

If you intentionally keep `FILE_DRIVER=local` in Kubernetes:

- treat app pods as stateful.
- use `StatefulSet` + persistent volume claim(s).
- avoid multi-replica without shared RWX volume strategy.

Risks with local driver on multiple replicas:

- each pod may have different local files.
- request routing can hit a pod that does not have the file.
- file availability and restore become operationally complex.

Single-replica stateful example:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: vault-api
spec:
  serviceName: vault-api
  replicas: 1
  selector:
    matchLabels:
      app: vault-api
  template:
    metadata:
      labels:
        app: vault-api
    spec:
      containers:
        - name: api
          image: your-image:tag
          env:
            - name: FILE_DRIVER
              value: 'local'
          volumeMounts:
            - name: app-files
              mountPath: /app/files
  volumeClaimTemplates:
    - metadata:
        name: app-files
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 10Gi
```

---

## Migration notes (local -> cloud)

When moving from `local` to `s3`/`s3-presigned`:

1. existing DB file paths created as local URLs are not automatically migrated.
2. new uploads go to cloud, old local files still require old storage/access path.
3. recommended migration:

- copy old local files to S3.
- rewrite DB file `path` values to S3 object keys.
- verify URL generation from API responses.

Plan migration before switching production traffic.

---

## Verification checklist

After enabling cloud storage:

1. Start app with `FILE_DRIVER=s3` or `s3-presigned`.
2. Upload a test image through `/api/v1/files/upload`.
3. Confirm object exists in S3 bucket.
4. Confirm API returns file path as signed URL behavior.
5. Restart pod and re-check file accessibility.
6. Scale replicas and re-check file accessibility from different pods.

Expected outcome in cloud mode:

- upload/download behavior remains correct after restart and scale-out.

---

## How to delete files

This project generally avoids hard-deleting file objects by default, similar to the soft-delete approach in database entities. If business rules require deletion, implement an explicit deletion flow or scheduled cleanup job.

---

Previous: [Serialization](serialization.md)

Next: [Tests](tests.md)
