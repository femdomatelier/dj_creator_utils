# Claude Agent Documentation

## Critical Rules ⚠️

### Git Commits
- Write commit messages as a human developer would
- No AI identifiers (avoid "AI-generated", "Claude", "assistant", etc.)

### Code Standards
- **Language**: All code and documentation in English (except user-facing data)
- **Testing**: Must pass all tests before completion
- **Comments**: Avoid unnecessary comments, code should be self-documenting
- **Cleanup**: Remove debug statements and temporary code
- **No Magic Numbers**: Use meaningful constants instead of hardcoded values
- **Error Handling**: Proper error handling, no silent failures

### General Principles
- Do exactly what was asked, nothing more or less
- Prefer editing existing files over creating new ones
- Never create documentation files unless explicitly requested