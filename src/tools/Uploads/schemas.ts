import { z } from "zod";

/**
 * Zod schemas for every uploads-related action.
 *
 * Key design decisions
 * ────────────────────
 * • All mandatory strings are checked with `.min(1)` to forbid empty values.
 * • Enumerations are used wherever the API admits a finite set of literals.
 * • `.describe()` is filled with human-readable help based on the official
 *   DatoCMS CMA documentation (Uploads, Upload Collections, Tags, Smart Tags).
 * • Helper factories keep the schemas DRY.
 */

const apiToken = () =>
  z.string().min(1).describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate.");

const uploadId = z
  .string()
  .min(1)
  .describe("Unique Upload ID (Base-64 URL-safe string).");

const collectionId = z
  .string()
  .min(1)
  .describe("Upload Collection ID.");

const page = z
  .object({
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Zero-based index of the first result (default 0)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Maximum number of results to return (default 30, max 500)."),
  })
  .describe("Pagination parameters.");

export const uploadsSchemas = {
  /* ─────────────────────────────── READ ──────────────────────────────── */
  get: z
    .object({
      apiToken: apiToken(),
      uploadId: uploadId,
      environment: z
        .string()
        .optional()
        .describe("Environment ID (omit for primary)."),
    })
    .strict(),

  query: z
    .object({
      apiToken: apiToken(),
      ids: z
        .union([
          z
            .string()
            .describe(
              'Comma-separated Upload IDs, e.g. "abc123,def456".',
            ),
          z.array(uploadId).nonempty(),
        ])
        .optional(),
      query: z
        .string()
        .min(1)
        .optional()
        .describe(
          "Free-text search within filename/metadata (case-insensitive).",
        ),
      fields: z
        .record(z.record(z.unknown()))
        .optional()
        .describe(
          "Advanced field filters (same structure as GraphQL filters).",
        ),
      locale: z
        .string()
        .length(2)
        .optional()
        .describe(
          "Locale code used for `query`/`fields` (defaults to primary).",
        ),
      order_by: z
        .string()
        .regex(/^[a-z0-9_]+_(ASC|DESC)$/i, {
          message: "Use `<field>_ASC` or `<field>_DESC`.",
        })
        .optional()
        .describe("Sorting clause."),
      page: page.optional(),
      returnOnlyIds: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "If true, return only an array of IDs instead of full objects.",
        ),
      environment: z.string().optional(),
    })
    .strict(),

  references: z
    .object({
      apiToken: apiToken(),
      uploadId: uploadId,
      nested: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "When true, includes nested records for Modular/Structured Text links.",
        ),
      version: z
        .enum(["current", "published", "published-or-current"])
        .optional()
        .default("current")
        .describe(
          "Record version visibility to inspect: current, published, or both.",
        ),
      returnOnlyIds: z
        .boolean()
        .optional()
        .default(false)
        .describe("Return only IDs instead of full records."),
      environment: z.string().optional(),
    })
    .strict(),

  /* ─────────────────────────────── CREATE ─────────────────────────────── */
  create: z
    .object({
      apiToken: apiToken(),
      url: z
        .string()
        .url()
        .optional()
        .describe("Remote URL of the file to import."),
      path: z
        .string()
        .optional()
        .describe("Local file path to upload."),
      id: z.string().optional().describe("Override ID for the new upload."),
      filename: z
        .string()
        .optional()
        .describe("Override filename inferred from `url`/`path`."),
      skipCreationIfAlreadyExists: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "If true, resolves with an existing identical upload instead of duplicating it.",
        ),
      author: z.string().nullable().optional().describe("Author metadata."),
      copyright: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      tags: z
        .array(z.string())
        .optional()
        .describe("Manual tags to attach on creation."),
      default_field_metadata: z
        .record(
          z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
          z.record(z.unknown()),
        )
        .optional()
        .describe(
          "Default field metadata keyed by locale (title, alt, custom_data...).",
        ),
      upload_collection: z
        .object({
          type: z.literal("upload_collection"),
          id: collectionId,
        })
        .nullable()
        .optional()
        .describe("Assign the upload to a collection."),
      environment: z.string().optional(),
    })
    .strict()
    .refine((v) => v.url || v.path, {
      message: "Either `url` or `path` must be provided.",
    }),

  /* ─────────────────────────────── UPDATE ─────────────────────────────── */
  update: z
    .object({
      apiToken: apiToken(),
      uploadId: uploadId,
      path: z
        .string()
        .optional()
        .describe("Local path to a replacement file."),
      basename: z
        .string()
        .optional()
        .describe("Rename basename (filename without extension)."),
      copyright: z.string().nullable().optional(),
      author: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      tags: z.array(z.string()).optional().describe("Replace manual tags."),
      default_field_metadata: z
        .record(z.unknown())
        .optional()
        .describe("Replace default field metadata object."),
      upload_collection: z
        .object({
          type: z.literal("upload_collection"),
          id: collectionId,
        })
        .nullable()
        .optional(),
      environment: z.string().optional(),
    })
    .strict(),

  /* ─────────────────────────────── DELETE ─────────────────────────────── */
  destroy: z
    .object({
      apiToken: apiToken(),
      uploadId: uploadId,
      confirmation: z
        .literal(true)
        .describe("Must be literally true to confirm deletion."),
      returnOnlyConfirmation: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "If true, returns only a confirmation string, not the deleted object.",
        ),
      environment: z.string().optional(),
    })
    .strict(),

  bulk_destroy: z
    .object({
      apiToken: apiToken(),
      uploadIds: z
        .array(uploadId)
        .min(1)
        .max(200)
        .describe("IDs to delete (max 200)."),
      confirmation: z.literal(true).describe("Must be true."),
      environment: z.string().optional(),
    })
    .strict(),

  /* ─────────────────────────────── BULK OPS ───────────────────────────── */
  bulk_tag: z
    .object({
      apiToken: apiToken(),
      uploadIds: z.array(uploadId).min(1),
      tags: z.array(z.string()).min(1).describe("Tag names to add."),
      environment: z.string().optional(),
    })
    .strict(),

  bulk_set_collection: z
    .object({
      apiToken: apiToken(),
      uploadIds: z.array(uploadId).min(1),
      collectionId: collectionId
        .nullable()
        .describe("Destination collection ID, or null to remove from any."),
      environment: z.string().optional(),
    })
    .strict(),

  /* ─────────────────────────────── TAGS ───────────────────────────────── */
  list_tags: z
    .object({
      apiToken: apiToken(),
      filter: z
        .string()
        .optional()
        .describe("Substring to match tag names (case-insensitive)."),
      environment: z.string().optional(),
    })
    .strict(),

  create_tag: z
    .object({
      apiToken: apiToken(),
      name: z.string().min(1).describe("New manual tag name."),
      environment: z.string().optional(),
    })
    .strict(),

  list_smart_tags: z
    .object({
      apiToken: apiToken(),
      filter: z.object({ query: z.string().optional() }).optional(),
      page: page.optional(),
      environment: z.string().optional(),
    })
    .strict(),

  /* ─────────────────────── UPLOAD COLLECTIONS ─────────────────────────── */
  get_collection: z
    .object({
      apiToken: apiToken(),
      uploadCollectionId: collectionId,
      environment: z.string().optional(),
    })
    .strict(),

  query_collections: z
    .object({
      apiToken: apiToken(),
      ids: z.union([collectionId, z.array(collectionId).nonempty()]).optional(),
      environment: z.string().optional(),
    })
    .strict(),

  create_collection: z
    .object({
      apiToken: apiToken(),
      label: z.string().min(1).describe("Collection label."),
      id: collectionId.optional(),
      position: z.number().int().min(0).optional(),
      parent: z
        .object({
          type: z.literal("upload_collection"),
          id: collectionId,
        })
        .optional()
        .describe("Parent collection reference."),
      environment: z.string().optional(),
    })
    .strict(),

  update_collection: z
    .object({
      apiToken: apiToken(),
      uploadCollectionId: collectionId,
      label: z.string().optional(),
      position: z.number().int().min(0).optional(),
      parent: z
        .union([
          z.object({ type: z.literal("upload_collection"), id: collectionId }),
          z.null(),
        ])
        .optional()
        .describe("Move collection or set null for top-level."),
      children: z
        .array(
          z.object({ type: z.literal("upload_collection"), id: collectionId }),
        )
        .optional()
        .describe("Re-order child collections."),
      environment: z.string().optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 2, {
      message: "At least one updatable field must be provided.",
    }),

  delete_collection: z
    .object({
      apiToken: apiToken(),
      uploadCollectionId: collectionId,
      environment: z.string().optional(),
    })
    .strict(),
} as const;

/** Union of all action names for uploads router convenience */
export const uploadsActionsList = Object.keys(
  uploadsSchemas,
) as Array<keyof typeof uploadsSchemas>;