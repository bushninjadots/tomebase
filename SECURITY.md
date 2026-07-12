# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in TomeBase, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@tomebase.dev** (placeholder — replace with real address)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 1 week
- **Fix or mitigation**: depends on severity, typically within 2 weeks

## Scope

The following are in scope:
- Authentication and authorization bypasses
- SQL injection or other injection attacks
- Cross-site scripting (XSS)
- Server-side request forgery (SSRF)
- Remote code execution
- Privilege escalation
- Data exposure

The following are out of scope:
- Denial of service (rate limiting is in place)
- Social engineering
- Issues in third-party dependencies (report upstream)

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| < Latest | No       |

## Security Measures

TomeBase includes the following security measures:
- Rate limiting on auth and API endpoints
- Input validation on all API routes
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- CSRF protection via SameSite cookies
- bcrypt password hashing (12 rounds)
- Stripe webhook signature verification
- Authorization checks on all protected routes
