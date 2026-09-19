# THH-RN Architecture & Development Guidelines

This repository follows the **Model-View-ViewModel (MVVM)** architectural pattern tailored for React Native with TypeScript. All developers and AI assistants must follow these rules and conventions.

---

## 1. Architectural Layers (MVVM)

```
src/
├── models/         # [Model] Domain entities, interfaces, DTOs, type contracts
├── services/       # [Model] API clients, data access, network services, storage
├── viewmodels/     # [ViewModel] Custom hooks containing UI state, business logic, actions
├── views/          # [View] UI presentation layer
│   ├── screens/    # Full-screen components (route targets)
│   └── components/ # Reusable presentation UI elements (stateless/pure where possible)
├── theme/          # Design tokens (colors, spacing, typography)
└── utils/          # Pure helper functions, formatting, validation
```

---

## 2. Layer Responsibilities & Boundaries

### A. Model Layer (`src/models/` & `src/services/`)

- **Domain Models (`src/models/`)**:
  - Define TypeScript interfaces and types for entities, API responses, and request payloads.
  - Zero dependencies on React, React Native, or UI elements.
  - Examples: `user.model.ts`, `health.model.ts`, `common.model.ts`.
- **Services (`src/services/`)**:
  - Handle communication with external APIs, databases, AsyncStorage, or device APIs.
  - Encapsulate data fetching, parsing, caching, and error normalization.
  - Return typed models or throw domain-specific errors.
  - Never call React hooks or update UI components directly.

### B. ViewModel Layer (`src/viewmodels/`)

- Implemented as custom React hooks (convention: `use[Feature]ViewModel`).
- **Responsibilities**:
  - Hold and manage screen/feature state (`useState`, `useReducer`).
  - Coordinate with services to fetch and persist data.
  - Execute business logic, validation, and data formatting for the View.
  - Expose a clean, cohesive interface consisting of:
    - **State**: readonly data, loading status (`isLoading`), error states (`error`).
    - **Actions/Handlers**: functions that the View can trigger (`onRefresh`, `onSubmit`, `onSelectItem`).
- **Strict Rules**:
  - **No JSX**: ViewModels must never import or return JSX, `View`, `Text`, or React Native elements.
  - **No Style References**: ViewModels must not know about styles, dimensions, or pixel values.
  - Keep ViewModels testable in isolation.

### C. View Layer (`src/views/`)

- Pure presentation layer divided into `screens/` and `components/`.
- **Screens (`src/views/screens/`)**:
  - Instantiate and consume the corresponding ViewModel:
    ```tsx
    export const HomeScreen = () => {
      const vm = useHomeViewModel();
      return (
        <View style={styles.container}>
          {vm.isLoading ? <ActivityIndicator /> : <DataList data={vm.items} />}
          <Button onPress={vm.handleRefresh} title="Refresh" />
        </View>
      );
    };
    ```
  - Bind user inputs and gestures directly to ViewModel handlers.
  - No direct network or API calls (e.g., no `fetch()` or `axios` inside Views).
  - No direct complex business logic or data transformation calculations.
- **Components (`src/views/components/`)**:
  - Small, reusable UI building blocks (e.g., `Header`, `ActionButton`, `StatusCard`).
  - Receive data and callbacks via explicit TypeScript `props`.
  - Maintain only transient presentation state if needed (e.g., modal visibility, local animations).

---

## 3. Naming Conventions

- **Models**: `*.model.ts` (e.g., `user.model.ts`)
- **Services**: `*Service.ts` or `*Client.ts` (e.g., `healthService.ts`, `apiClient.ts`)
- **ViewModels**: `use*ViewModel.ts` (e.g., `useHomeViewModel.ts`)
- **Screens**: `*Screen.tsx` (e.g., `HomeScreen.tsx`, `ProfileScreen.tsx`)
- **Components**: `PascalCase.tsx` (e.g., `StatusCard.tsx`, `Header.tsx`)
- **Theme**: `colors.ts`, `spacing.ts`, `typography.ts`

---

## 4. Code Quality & Linting Rules

1. **Pre-Push Validation**:

   - Every `git push` runs the pre-push hook which verifies:
     - `npm run typecheck` (`tsc --noEmit`)
     - `npm run lint` (`eslint .`)
     - `npm run format:check` (`prettier --check`)
   - Any failure will abort the push. Always ensure `npm run validate` passes locally before pushing.

2. **TypeScript Strictness**:

   - Do not use `any`. Use explicit interfaces, types, or `unknown` with type narrowing.
   - All props for screens and components must be typed.

3. **No GitHub Actions Workflows**:
   - CI/CD checks are kept local and lightweight; do not commit GitHub Actions workflow YAML files unless instructed.
