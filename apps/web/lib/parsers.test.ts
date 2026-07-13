import { describe, it, expect } from 'vitest';
import { parseCode } from '@fluid/codegen';

describe('TypeScript parser', () => {
  it('parses exported functions with JSDoc', () => {
    const code = `
/**
 * Calculates the total price for an order.
 * @param items - Array of line items
 * @param taxRate - Tax rate as a decimal (e.g. 0.08 for 8%)
 * @returns Total price in cents
 */
export function calculateTotal(items: LineItem[], taxRate: number): number {
  return 0;
}`;
    const result = parseCode(code, 'typescript');
    expect(result.exports.length).toBeGreaterThanOrEqual(1);
    const fn = result.exports[0]!;
    expect(fn.kind).toBe('function');
    expect(fn.name).toBe('calculateTotal');
    if (fn.kind === 'function') {
      expect(fn.params.length).toBe(2);
      expect(fn.params[0]!.name).toBe('items');
      expect(fn.params[1]!.name).toBe('taxRate');
      expect(fn.description).toContain('total price');
    }
  });

  it('parses interfaces', () => {
    const code = `
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}`;
    const result = parseCode(code, 'typescript');
    const iface = result.exports.find((e) => e.kind === 'interface');
    expect(iface).toBeDefined();
    expect(iface!.name).toBe('User');
  });

  it('parses type aliases', () => {
    const code = `export type Status = 'active' | 'inactive' | 'archived';`;
    const result = parseCode(code, 'typescript');
    const type = result.exports.find((e) => e.kind === 'type');
    expect(type).toBeDefined();
    expect(type!.name).toBe('Status');
  });

  it('parses classes', () => {
    const code = `
export class AuthService {
  private secret: string;
  
  constructor(secret: string) {
    this.secret = secret;
  }
  
  /** Authenticate user */
  async authenticate(email: string, password: string): Promise<User> {
    return {} as User;
  }
}`;
    const result = parseCode(code, 'typescript');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('AuthService');
  });

  it('parses enums', () => {
    const code = `
export enum Role {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  Viewer = 'VIEWER',
}`;
    const result = parseCode(code, 'typescript');
    const en = result.exports.find((e) => e.kind === 'enum');
    expect(en).toBeDefined();
    expect(en!.name).toBe('Role');
  });

  it('returns empty for code with no functions or classes', () => {
    const code = `const x = 1;\nconst y = 2;`;
    const result = parseCode(code, 'typescript');
    expect(result.exports.length).toBe(0);
  });

  it('detects React components', () => {
    const code = `
/**
 * Renders a button.
 */
export function Button({ children, onClick }: Props) {
  return <button onClick={onClick}>{children}</button>;
}`;
    const result = parseCode(code, 'typescript');
    const fn = result.exports.find((e) => e.kind === 'function');
    expect(fn).toBeDefined();
    if (fn?.kind === 'function') {
      expect(fn.isComponent).toBe(true);
    }
  });

  it('detects React hooks', () => {
    const code = `
/**
 * Manages form state.
 */
export function useForm(initial: State) {
  const [state, setState] = useState(initial);
  return { state, setState };
}`;
    const result = parseCode(code, 'typescript');
    const fn = result.exports.find((e) => e.kind === 'function');
    expect(fn).toBeDefined();
    if (fn?.kind === 'function') {
      expect(fn.isHook).toBe(true);
    }
  });
});

describe('Python parser', () => {
  it('parses functions with docstrings', () => {
    const code = `
def authenticate(email: str, password: str) -> User:
    """Authenticate a user with email and password.
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        The authenticated User
    """
    pass`;
    const result = parseCode(code, 'python');
    expect(result.exports.length).toBeGreaterThanOrEqual(1);
    const fn = result.exports[0]!;
    expect(fn.kind).toBe('function');
    expect(fn.name).toBe('authenticate');
    if (fn.kind === 'function') {
      expect(fn.params.length).toBe(2);
      expect(fn.params[0]!.name).toBe('email');
      expect(fn.params[1]!.name).toBe('password');
    }
  });

  it('parses classes with methods', () => {
    const code = `
class User:
    """Represents a user in the system."""
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email
    
    def get_display_name(self) -> str:
        """Get the display name."""
        return self.name`;
    const result = parseCode(code, 'python');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('User');
  });
});

describe('Go parser', () => {
  it('parses functions with doc comments', () => {
    const code = `
// CalculateTotal calculates the total price for an order.
// It takes a list of items and a tax rate, returning the total in cents.
func CalculateTotal(items []LineItem, taxRate float64) int {
    return 0
}`;
    const result = parseCode(code, 'go');
    expect(result.exports.length).toBeGreaterThanOrEqual(1);
    const fn = result.exports[0]!;
    expect(fn.kind).toBe('function');
    expect(fn.name).toBe('CalculateTotal');
  });

  it('parses interfaces', () => {
    const code = `
// Repository defines data access operations.
type Repository interface {
    FindByID(id string) (*User, error)
    Save(user *User) error
}`;
    const result = parseCode(code, 'go');
    const iface = result.exports.find((e) => e.kind === 'interface');
    expect(iface).toBeDefined();
    expect(iface!.name).toBe('Repository');
  });

  it('parses structs', () => {
    const code = `
// User represents a user in the system.
type User struct {
    ID    string
    Name  string
    Email string
}`;
    const result = parseCode(code, 'go');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('User');
  });
});

describe('Rust parser', () => {
  it('parses functions with doc comments', () => {
    const code = `
/// Calculate total price for an order.
/// 
/// # Arguments
/// * \`items\` - List of line items
/// * \`tax_rate\` - Tax rate as decimal
pub fn calculate_total(items: Vec<LineItem>, tax_rate: f64) -> i32 {
    0
}`;
    const result = parseCode(code, 'rust');
    expect(result.exports.length).toBeGreaterThanOrEqual(1);
    const fn = result.exports[0]!;
    expect(fn.kind).toBe('function');
    expect(fn.name).toBe('calculate_total');
  });

  it('parses enums with variants', () => {
    const code = `
/// Represents the status of an order.
pub enum Status {
    /// Order is pending
    Pending,
    /// Order is confirmed
    Confirmed,
    /// Order was cancelled
    Cancelled,
}`;
    const result = parseCode(code, 'rust');
    const en = result.exports.find((e) => e.kind === 'class' && e.name === 'Status');
    expect(en).toBeDefined();
    expect(en!.name).toBe('Status');
  });

  it('parses structs', () => {
    const code = `
/// A user in the system.
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}`;
    const result = parseCode(code, 'rust');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('User');
  });

  it('parses traits', () => {
    const code = `
/// Defines authentication behavior.
pub trait Authenticatable {
    fn authenticate(&self, email: &str, password: &str) -> Result<User, Error>;
}`;
    const result = parseCode(code, 'rust');
    const iface = result.exports.find((e) => e.kind === 'interface');
    expect(iface).toBeDefined();
    expect(iface!.name).toBe('Authenticatable');
  });
});

describe('C# parser', () => {
  it('parses classes with XML doc comments', () => {
    const code = `
/// <summary>
/// Authentication service for managing user sessions.
/// </summary>
public class AuthService {
    /// <summary>
    /// Authenticates a user.
    /// </summary>
    /// <param name="email">The user's email</param>
    /// <param name="password">The user's password</param>
    /// <returns>The authenticated user, or null</returns>
    public async Task<User?> AuthenticateAsync(string email, string password) {
        return null;
    }
}`;
    const result = parseCode(code, 'csharp');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('AuthService');
  });

  it('parses enums', () => {
    const code = `
/// <summary>
/// Represents user roles.
/// </summary>
public enum Role
{
    Admin,
    Member,
    Viewer
}`;
    const result = parseCode(code, 'csharp');
    const en = result.exports.find((e) => e.kind === 'enum');
    expect(en).toBeDefined();
    expect(en!.name).toBe('Role');
  });

  it('parses interfaces', () => {
    const code = `
/// <summary>
/// Defines data access operations.
/// </summary>
public interface IRepository {
    Task<User?> FindByIdAsync(string id);
    Task SaveAsync(User user);
}`;
    const result = parseCode(code, 'csharp');
    const iface = result.exports.find((e) => e.kind === 'interface');
    expect(iface).toBeDefined();
    expect(iface!.name).toBe('IRepository');
  });
});

describe('C++ parser', () => {
  it('parses classes with Doxygen comments', () => {
    const code = `
/**
 * @brief Authentication service for managing user sessions.
 */
class AuthService {
public:
    /**
     * @brief Authenticates a user.
     * @param email The user's email
     * @param password The user's password
     * @return true if authenticated
     */
    bool authenticate(const std::string& email, const std::string& password);
};`;
    const result = parseCode(code, 'cpp');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('AuthService');
  });

  it('parses structs', () => {
    const code = `
/**
 * @brief A user in the system.
 */
struct User {
    std::string id;
    std::string name;
    std::string email;
};`;
    const result = parseCode(code, 'cpp');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('User');
  });
});

describe('Kotlin parser', () => {
  it('parses classes with KDoc', () => {
    const code = `
/**
 * Authentication service for managing user sessions.
 */
class AuthService(private val secret: String) {
    /**
     * Authenticates a user with email and password.
     * @param email The user's email
     * @param password The user's password
     * @return The authenticated user or null
     */
    suspend fun authenticate(email: String, password: String): User? {
        return null
    }
}`;
    const result = parseCode(code, 'kotlin');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('AuthService');
  });

  it('parses data classes', () => {
    const code = `
/**
 * Represents a user in the system.
 */
data class User {
    val id: String
    val name: String
    val email: String
}`;
    const result = parseCode(code, 'kotlin');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('User');
  });

  it('parses enums', () => {
    const code = `
/**
 * User roles.
 */
enum class Role {
    ADMIN,
    MEMBER,
    VIEWER
}`;
    const result = parseCode(code, 'kotlin');
    const en = result.exports.find((e) => e.kind === 'enum');
    expect(en).toBeDefined();
    expect(en!.name).toBe('Role');
  });
});

describe('Ruby parser', () => {
  it('parses classes with YARD comments', () => {
    const code = `
# Authentication service for managing user sessions.
class AuthService
  # Create a new AuthService.
  # @param secret [String] the JWT signing secret
  def initialize(secret)
    @secret = secret
  end

  # Authenticate a user.
  # @param email [String] the user's email
  # @param password [String] the user's password
  # @return [User, nil] the authenticated user or nil
  def authenticate(email, password)
    nil
  end
end`;
    const result = parseCode(code, 'ruby');
    const cls = result.exports.find((e) => e.kind === 'class');
    expect(cls).toBeDefined();
    expect(cls!.name).toBe('AuthService');
  });

  it('parses standalone functions', () => {
    const code = `
# Generate a random token.
def generate_token
  "token"
end`;
    const result = parseCode(code, 'ruby');
    const fn = result.exports.find((e) => e.kind === 'function');
    expect(fn).toBeDefined();
    expect(fn!.name).toBe('generate_token');
  });
});
