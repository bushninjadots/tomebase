export const languages = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
];

export const sampleCode: Record<string, string> = {
  typescript: `/**
 * Calculates the total price including tax and discounts.
 * @param basePrice - The base price before adjustments
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @param discount - Discount amount to subtract
 * @returns The final price after all adjustments
 * @example
 * calculateTotal(100, 0.08, 10) // returns 98
 */
export function calculateTotal(basePrice: number, taxRate: number, discount: number = 0): number {
  const tax = basePrice * taxRate;
  return basePrice + tax - discount;
}

/**
 * Represents a user in the system.
 */
export interface User {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** User role */
  role: 'admin' | 'user' | 'viewer';
  /** Account creation date */
  createdAt: Date;
}

/**
 * Creates a new user with the given details.
 * @param name - The user's display name
 * @param email - The user's email address
 * @param role - The user's role
 * @returns The newly created user object
 * @throws {Error} If the email is already taken
 */
export function createUser(name: string, email: string, role: 'admin' | 'user' = 'user'): User {
  return { id: crypto.randomUUID(), name, email, role, createdAt: new Date() };
}

/**
 * Authentication result status.
 */
export enum AuthResult {
  Success = 'SUCCESS',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  AccountLocked = 'ACCOUNT_LOCKED',
}

/**
 * Configuration options for the authentication service.
 */
export type AuthConfig = {
  secret: string;
  expiresIn: number;
  issuer: string;
};`,
  python: `"""Authentication module for the API."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    """Represents a user in the system."""
    id: str
    name: str
    email: str
    role: str
    created_at: datetime


def authenticate(email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password.

    Args:
        email: The user's email address
        password: The user's password

    Returns:
        The authenticated User, or None if authentication fails
    """
    user = find_user_by_email(email)
    if user and verify_password(password, user.id):
        return user
    return None


def create_user(name: str, email: str, role: str = "user") -> User:
    """Create a new user account.

    Args:
        name: The user's display name
        email: The user's email address
        role: The user's role (default: "user")

    Returns:
        The newly created User
    """
    import uuid
    return User(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
        role=role,
        created_at=datetime.now(),
    )`,
  go: `package auth

import (
\t"time"
)

// User represents a user in the system.
type User struct {
\tID        string
\tName      string
\tEmail     string
\tRole      string
\tCreatedAt time.Time
}

// Authenticator handles user authentication.
type Authenticator interface {
\t// Authenticate validates credentials and returns a user.
\tAuthenticate(email, password string) (*User, error)
\t// Token generates a session token for a user.
\tToken(user *User) (string, error)
}

// NewAuthenticator creates a new Authenticator instance.
func NewAuthenticator(secret string) *authenticator {
\treturn &authenticator{secret: secret}
}

// Authenticate validates the user's credentials.
func (a *authenticator) Authenticate(email, password string) (*User, error) {
\tuser, err := a.findUser(email)
\tif err != nil {
\t\treturn nil, err
\t}
\tif !a.verifyPassword(password, user.ID) {
\t\treturn nil, ErrInvalidCredentials
\t}
\treturn user, nil
}`,
  rust: `//! Authentication module for the API.

use serde::{Deserialize, Serialize};

/// Represents a user in the system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier
    pub id: String,
    /// Display name
    pub name: String,
    /// Email address
    pub email: String,
    /// User role
    pub role: String,
}

/// Authentication errors.
#[derive(Debug)]
pub enum AuthError {
    /// User not found
    NotFound,
    /// Invalid credentials
    InvalidCredentials,
    /// Token expired
    TokenExpired,
}

/// Authenticator for user login.
pub struct Authenticator {
    secret: String,
}

impl Authenticator {
    /// Create a new authenticator with the given secret.
    pub fn new(secret: &str) -> Self {
        Self {
            secret: secret.to_string(),
        }
    }

    /// Authenticate a user with email and password.
    pub fn authenticate(&self, email: &str, password: &str) -> Result<User, AuthError> {
        let user = self.find_user(email)?;
        if !self.verify_password(password, &user.id) {
            return Err(AuthError::InvalidCredentials);
        }
        Ok(user)
    }
}`,
  csharp: `/// <summary>
/// Authentication service for managing user sessions.
/// </summary>
public class AuthService
{
    private readonly string _secret;

    /// <summary>
    /// Creates a new AuthService instance.
    /// </summary>
    /// <param name="secret">The JWT signing secret</param>
    public AuthService(string secret)
    {
        _secret = secret;
    }

    /// <summary>
    /// Authenticates a user with email and password.
    /// </summary>
    public async Task<User?> AuthenticateAsync(string email, string password)
    {
        var user = await FindUserByEmail(email);
        if (user != null && VerifyPassword(password, user.Id))
            return user;
        return null;
    }
}

/// <summary>
/// Represents a user in the system.
/// </summary>
public class User
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
}

/// <summary>
/// Authentication result status.
/// </summary>
public enum AuthResult
{
    Success,
    InvalidCredentials,
    UserNotFound,
    AccountLocked
}`,
  cpp: `/**
 * @brief Authentication module for managing user sessions.
 */
class AuthService {
private:
    std::string secret_;

public:
    AuthService(const std::string& secret) : secret_(secret) {}

    std::pair<User, std::string> authenticate(
        const std::string& email,
        const std::string& password
    );
};

struct User {
    std::string id;
    std::string name;
    std::string email;
    std::string role;
};

enum class AuthResult {
    Success,
    InvalidCredentials,
    UserNotFound,
    AccountLocked
};`,
  kotlin: `/**
 * Authentication service for managing user sessions.
 */
class AuthService(private val secret: String) {
    suspend fun authenticate(email: String, password: String): User? {
        val user = findUserByEmail(email)
        return if (user != null && verifyPassword(password, user.id)) user else null
    }
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: Role = Role.MEMBER
)

enum class Role {
    ADMIN,
    MEMBER,
    VIEWER
}`,
  ruby: `# Authentication module for managing user sessions.
class AuthService
  def initialize(secret)
    @secret = secret
  end

  def authenticate(email, password)
    user = find_user_by_email(email)
    return user if user && verify_password(password, user.id)
    nil
  end
end

class User
  attr_accessor :id, :name, :email, :role

  def initialize(id:, name:, email:, role: :member)
    @id = id
    @name = name
    @email = email
    @role = role
  end
end

module AuthResult
  SUCCESS = :success
  INVALID_CREDENTIALS = :invalid_credentials
  USER_NOT_FOUND = :user_not_found
end`,
};

export const sampleSpec = `openapi: "3.0.3"
info:
  title: Pet Store API
  description: A sample API for managing pets and orders
  version: "1.0.0"
servers:
  - url: https://api.petstore.example.com/v1
paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      tags:
        - Pets
      parameters:
        - name: limit
          in: query
          required: false
          schema:
            type: integer
          description: Maximum number of pets to return
        - name: status
          in: query
          required: false
          schema:
            type: string
            enum: [available, pending, sold]
          description: Filter by status
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      summary: Create a pet
      operationId: createPet
      tags:
        - Pets
      requestBody:
        required: true
        description: Pet object to add
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      operationId: getPetById
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
          description: The ID of the pet
      responses:
        "200":
          description: A single pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
    delete:
      summary: Delete a pet
      operationId: deletePet
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "204":
          description: Deleted successfully
  /orders:
    get:
      summary: List all orders
      operationId: listOrders
      tags:
        - Orders
      responses:
        "200":
          description: A list of orders
    post:
      summary: Place an order
      operationId: placeOrder
      tags:
        - Orders
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                petId:
                  type: integer
                quantity:
                  type: integer
      responses:
        "201":
          description: Order created
components:
  schemas:
    Pet:
      type: object
      required:
        - name
      properties:
        id:
          type: integer
          example: 42
        name:
          type: string
          example: Buddy
        status:
          type: string
          enum: [available, pending, sold]
          example: available`;
