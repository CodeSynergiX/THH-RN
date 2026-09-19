# MVVM Architecture Rules for React Native

## Core Architectural Boundaries

1. **Model**:

   - Location: `src/models/*.model.ts` and `src/services/*Service.ts`.
   - Pure TypeScript, domain entities, DTOs, API clients.
   - NO React hooks, NO React Native UI components.

2. **ViewModel**:

   - Location: `src/viewmodels/use*ViewModel.ts`.
   - Custom React hooks managing state and business logic.
   - Calls services, handles errors, transforms data.
   - Exposes clean state and action callbacks to Views.
   - NO JSX or React Native UI elements allowed in ViewModels.

3. **View**:
   - Location: `src/views/screens/*Screen.tsx` and `src/views/components/*Component.tsx`.
   - Consumes ViewModel hooks (`use*ViewModel`).
   - Presentation only. Binds UI inputs to ViewModel action handlers.
   - NO direct network requests or API client usage.
