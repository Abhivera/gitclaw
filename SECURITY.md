# Security Policy

## Supported versions

Security fixes are applied to the latest release on the `main` branch.

| Version | Supported |
| ------- | --------- |
| latest  | yes       |
| older   | no        |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report them privately by emailing **abhijitakadeveloper@gmail.com** with:

- A description of the issue and its potential impact
- Steps to reproduce (proof of concept if available)
- Affected versions or commits, if known

You should receive an acknowledgment within **72 hours**. We will work with you on a fix and coordinate disclosure timing.

## Scope

Reports are in scope when they affect:

- Authentication, session handling, or authorization bypass
- Webhook signature verification or provider token handling
- SQL injection, SSRF, or remote code execution in GitClaw itself
- Exposure of secrets or credentials through the application

Out of scope:

- Vulnerabilities in third-party services (GitHub, GitLab, Bitbucket, AI providers)
- Issues requiring compromised operator credentials or physical access
- Social engineering attacks

## Safe harbor

We appreciate responsible disclosure. We will not pursue legal action against researchers who follow this policy and act in good faith.
