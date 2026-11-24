"""User login: local passwords, OIDC, SAML and server-side sessions (ADR-0006)."""

from .accounts import AccountError, Accounts
from .routes import AUTH, IDENTITY, add_routes
from .service import AuthService, AuthSetupError, Identity, create_auth

__all__ = [
    "AUTH",
    "IDENTITY",
    "AccountError",
    "Accounts",
    "AuthService",
    "AuthSetupError",
    "Identity",
    "add_routes",
    "create_auth",
]
