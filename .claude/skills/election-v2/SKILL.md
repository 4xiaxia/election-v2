```markdown
# election-v2 Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `election-v2` TypeScript codebase. You'll learn how to structure files, write imports/exports, follow commit message guidelines, and organize tests. These patterns ensure consistency and maintainability in a TypeScript project without a specific framework.

## Coding Conventions

### File Naming
- Use **kebab-case** for all filenames.
  - Example:  
    ```
    election-utils.ts
    vote-counter.test.ts
    ```

### Import Style
- Use **relative imports** for referencing other files.
  - Example:
    ```typescript
    import { calculateWinner } from './calculate-winner';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In tally-votes.ts
    export function tallyVotes(votes: Vote[]): Result { ... }
    ```

### Commit Messages
- Use **conventional commits** with the `chore` prefix.
- Keep commit messages concise (average ~76 characters).
  - Example:
    ```
    chore: update dependencies to latest minor versions
    ```

## Workflows

### Code Commit Workflow
**Trigger:** When you are ready to commit changes  
**Command:** `/commit-chore`

1. Stage your changes:
    ```
    git add .
    ```
2. Write a commit message using the `chore` prefix and a concise description:
    ```
    git commit -m "chore: describe your change here"
    ```
3. Push your changes:
    ```
    git push
    ```

### File Creation Workflow
**Trigger:** When adding a new module or test file  
**Command:** `/create-file`

1. Name your file using kebab-case.
    - Example: `vote-processor.ts`
2. If it's a test, append `.test` before the extension.
    - Example: `vote-processor.test.ts`
3. Use relative imports for dependencies within the project.
4. Use named exports for all exported functions or types.

## Testing Patterns

- Test files follow the pattern: `*.test.*` (e.g., `calculate-winner.test.ts`)
- The specific testing framework is not detected, but standard TypeScript test structure applies.
- Example test file:
    ```typescript
    import { calculateWinner } from './calculate-winner';

    describe('calculateWinner', () => {
      it('returns the correct winner', () => {
        // test logic here
      });
    });
    ```

## Commands
| Command         | Purpose                                      |
|-----------------|----------------------------------------------|
| /commit-chore   | Commit changes using the conventional `chore` prefix |
| /create-file    | Create a new file following naming conventions      |
```
