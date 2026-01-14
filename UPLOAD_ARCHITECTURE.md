# Upload Architecture - Direct-to-Blob Upload

## Problem Solved

This implementation fixes the `FUNCTION_PAYLOAD_TOO_LARGE` / `Request Entity Too Large` error on Vercel by implementing a direct-to-storage upload architecture.

### Why This Was Needed

Vercel Serverless Functions have a hard limit of ~4.5MB for request body size. When uploading images through `/api/upload`, large files would fail with `413 Request Entity Too Large` errors.

## Architecture

### Hybrid Approach

The system uses a **hybrid approach** for optimal performance:

1. **Small Files (≤ 3.5MB)**: Upload through `/api/upload` endpoint

   - Faster for small files
   - Simpler flow
   - No token exchange needed

2. **Large Files (> 3.5MB)**: Direct-to-Blob upload
   - Bypasses Vercel function payload limits
   - Uploads directly from client to Vercel Blob Storage
   - Uses client-side SDK (`@vercel/blob/client`)

### Flow for Large Files

```
Client → /api/upload/token → Get token
      → @vercel/blob/client → Upload directly to Blob
      → /api/upload/complete → Notify completion
```

## New Endpoints

### `/api/upload/token` (POST)

- Returns a token for client-side direct upload
- Validates Blob storage is configured
- Returns `{ token, requestId }`

### `/api/upload/complete` (POST)

- Receives upload completion notification
- Accepts: `{ url, pathname, size, contentType, originalName, requestId }`
- Returns: `{ ok: true, file: {...}, requestId }`
- Currently just validates; can be extended to save to DB

### `/api/upload` (POST) - Updated

- **Guarded**: Rejects files > 3.5MB immediately with 413 error
- **Logging**: Comprehensive structured JSON logs
- **Fallback**: Still works for small files in development/production
- **Error Messages**: Clear guidance to use direct upload for large files

## Logging

All endpoints use structured JSON logging via `lib/logger.ts`:

- **Request tracking**: Each request has a unique `requestId`
- **Structured logs**: JSON format for easy searching in Vercel logs
- **Error tracking**: Full stack traces and error details
- **Performance**: Elapsed time tracking

### Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info|error|warn",
  "env": "production|preview|development",
  "event": "upload_token_request_start",
  "requestId": "uuid",
  "route": "/api/upload/token",
  "elapsedMs": 123,
  ...
}
```

## Environment Variables

Required:

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob Storage token (automatically set when Blob store is created)

Optional:

- `NEXT_PUBLIC_APP_URL`: App URL for callbacks (defaults to request origin)

## Security Considerations

⚠️ **Note**: The current implementation returns the `BLOB_READ_WRITE_TOKEN` to the client for direct uploads.

**Recommendations for production**:

1. Implement time-limited upload tokens
2. Add IP restrictions
3. Consider using signed URLs instead
4. Rate limit the `/api/upload/token` endpoint

## Testing Checklist

### Local Development

- [ ] Small file upload (< 3.5MB) works through `/api/upload`
- [ ] Large file upload (> 3.5MB) uses direct-to-Blob flow
- [ ] Logs appear in console with requestId
- [ ] Error messages are clear and helpful

### Production (Vercel)

- [ ] Small file upload works
- [ ] Large file upload works (no 413 errors)
- [ ] Logs appear in Vercel function logs with requestId
- [ ] Files are accessible via returned URLs
- [ ] No `FUNCTION_PAYLOAD_TOO_LARGE` errors

### Edge Cases

- [ ] File > 5MB shows validation error before upload
- [ ] Missing token shows helpful error message
- [ ] Network errors are handled gracefully
- [ ] Completion notification failure doesn't break upload

## Migration Notes

- Old upload code continues to work for small files
- Large files automatically use new flow
- No breaking changes to existing functionality
- Backward compatible

## Files Changed

- `lib/logger.ts` - Structured logging utility
- `app/api/upload/route.ts` - Added guards and logging
- `app/api/upload/token/route.ts` - New token endpoint
- `app/api/upload/complete/route.ts` - New completion endpoint
- `app/admin/admin-page-client.tsx` - Updated to use hybrid upload
- `app/admin/about/page.tsx` - Updated to use hybrid upload
