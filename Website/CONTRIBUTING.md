# 🤝 Contributing to Cognivo

Thank you for your interest in contributing to Cognivo! This guide will help you get started.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.9+
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork & Clone**
   ```bash
   git clone <your-fork-url>
   cd Website
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd python-api && pip install -r requirements.txt && cd ..
   ```

3. **Setup Environment**
   ```bash
   copy .env.example .env
   # Add your ANTHROPIC_API_KEY to .env
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## 💻 Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-new-chart-type` - New features
- `fix/canvas-save-bug` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/cleanup-api` - Code refactoring
- `test/add-unit-tests` - Adding tests

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(canvas): add radar chart support

Added support for radar charts with multi-axis visualization.
Includes styling and data transformation logic.

Closes #123
```

```
fix(auth): resolve token expiration bug

Fixed issue where tokens were expiring prematurely.
```

## 📝 Code Standards

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Prefer `const` over `let`

**Example:**
```typescript
// ✅ Good
const getUserCanvases = async (username: string): Promise<CanvasResponse> => {
  const canvases = await Canvas.find({ username }).sort({ updatedAt: -1 });
  return { success: true, canvases };
};

// ❌ Bad
function get(u) {
  return Canvas.find({ username: u });
}
```

### Python

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions
- Keep functions focused and small

**Example:**
```python
# ✅ Good
async def process_csv_file(
    file_bytes: bytes, 
    file_name: str, 
    username: str
) -> FileProcessingResponse:
    """
    Process CSV file using Claude AI to generate intelligent subsets.
    
    Args:
        file_bytes: Raw file content
        file_name: Original filename
        username: User for token tracking
        
    Returns:
        FileProcessingResponse with schema and subsets
    """
    df = pd.read_csv(io.BytesIO(file_bytes))
    return await generate_subsets_with_claude(df, file_name, "CSV", username)

# ❌ Bad
def process(b, f, u):
    return pd.read_csv(io.BytesIO(b))
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful prop names

**Example:**
```tsx
// ✅ Good
interface ChartNodeProps {
  data: ChartData;
  onUpdate: (data: ChartData) => void;
}

export function ChartNode({ data, onUpdate }: ChartNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  // ...
}

// ❌ Bad
export function CN(props) {
  // ...
}
```

## 📁 Project Structure

```
Website/
├── src/                      # Frontend React app
│   ├── components/          # React components
│   │   ├── board/          # Canvas-related components
│   │   ├── ui/             # Reusable UI components
│   │   └── *.tsx           # Page components
│   ├── db/                 # Database layer
│   ├── api/                # API clients
│   └── lib/                # Utilities
├── python-api/              # Python FastAPI backend
│   ├── main.py            # Main API server
│   └── test_*.py          # Test files
├── api-server.js           # Node.js Express API
└── mongodb-data/           # Local MongoDB storage
```

### Adding New Features

**Frontend Component:**
1. Create in appropriate directory (`src/components/`)
2. Use TypeScript interfaces
3. Follow existing component patterns
4. Add to parent component

**Backend API Endpoint (Node.js):**
1. Add route in `api-server.js`
2. Create function in appropriate `src/db/*.ts` file
3. Add error handling
4. Test with Postman/curl

**Python API Endpoint:**
1. Add route in `python-api/main.py`
2. Define Pydantic models for request/response
3. Add error handling
4. Write tests

## 🔐 Environment Variables

**NEVER commit `.env` files!**

When adding new environment variables:

1. **Add to `.env.example`:**
   ```env
   NEW_VARIABLE_NAME=example-value-here
   ```

2. **Document in README:**
   Update the environment variables section

3. **Use in code:**
   ```typescript
   // Node.js
   const value = process.env.NEW_VARIABLE_NAME || 'default';
   
   // Python
   value = os.getenv("NEW_VARIABLE_NAME", "default")
   ```

## 🧪 Testing

### Python API Tests

```bash
cd python-api

# Run all tests
python test_api.py
python test_integration.py

# Test specific endpoint
# (Add new tests to test_*.py files)
```

### Manual Testing Checklist

Before submitting PR, test:

- [ ] User registration and login
- [ ] File upload (CSV and Excel)
- [ ] Canvas creation and saving
- [ ] AI chat streaming
- [ ] Chart visualization
- [ ] File download
- [ ] Account deletion

## 📤 Pull Request Process

### Before Submitting

1. **Test your changes:**
   ```bash
   npm run dev
   # Manually test all affected features
   ```

2. **Check for errors:**
   - No TypeScript errors
   - No ESLint warnings
   - No Python syntax errors
   - No console errors in browser

3. **Update documentation:**
   - Update README if needed
   - Add comments to complex code
   - Update CHANGELOG (if exists)

4. **Clean up:**
   ```bash
   # Remove debug logs
   # Remove commented code
   # Format code properly
   ```

### Submitting PR

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on GitHub:**
   - Use descriptive title
   - Fill out PR template
   - Reference related issues
   - Add screenshots if UI changes

3. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring
   
   ## Testing
   - [ ] Manual testing completed
   - [ ] All existing features still work
   - [ ] No console errors
   
   ## Screenshots (if applicable)
   [Add screenshots here]
   
   ## Related Issues
   Closes #123
   ```

### Review Process

1. Maintainer will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited!

## 🎨 Design System

Follow the Cognivo design system:

**Colors:**
```typescript
// Primary palette
const colors = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
};
```

**Typography:**
- Font: Poppins
- Weights: 400, 500, 600, 700

**Spacing:**
- Use Tailwind spacing classes
- Maintain consistent padding/margins

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [Anthropic Claude API](https://docs.anthropic.com/)

## ❓ Questions?

- Check existing issues
- Read the documentation
- Ask in discussions

## 🙏 Thank You!

Your contributions make Cognivo better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
