# ZKsync SSO Integration Setup

## Installation

To complete the ZKsync SSO integration, you need to install the required dependency:

```bash
npm install zksync-sso
```

## Current Implementation

The current implementation includes:

1. **ZKSyncAuth Component** (`src/components/ZKSyncAuth.tsx`)
   - Biometric authentication UI
   - Session management
   - Mock authentication flow (to be replaced with real ZKsync SSO)

2. **Updated App Component** (`src/App.tsx`)
   - Authentication state management
   - Conditional rendering based on auth status
   - User address display in header

3. **Authentication Flow**
   - Users must authenticate before accessing the game
   - Session is persisted in localStorage
   - Biometric authentication using WebAuthn API

## Next Steps

1. Install the ZKsync SSO package:
   ```bash
   npm install @zksync-dev/zksync-sso
   ```

2. Replace the mock authentication in `ZKSyncAuth.tsx` with real ZKsync SSO implementation:

```typescript
import { ZkSyncSSO } from '@zksync-dev/zksync-sso';

// Replace the mock authentication with:
const sso = new ZkSyncSSO({
  // Configuration options
});

const handleLogin = async () => {
  try {
    const result = await sso.connect();
    // Handle successful authentication
    onAuthSuccess(result.address, result.sessionKey);
  } catch (error) {
    // Handle authentication error
    onAuthError(error.message);
  }
};
```

3. Update the transaction signing in the game to use the session key for gasless transactions.

4. Configure the paymaster to work with ZKsync SSO sessions.

## Features Implemented

- ✅ Biometric authentication UI
- ✅ Session management and persistence
- ✅ Authentication state in app
- ✅ User address display
- ✅ Responsive design
- ⏳ Real ZKsync SSO integration (requires package installation)
- ⏳ Session-based transaction signing
- ⏳ Paymaster integration with sessions

## Testing

The current implementation uses WebAuthn for biometric authentication simulation. On supported devices (with Face ID, Touch ID, or Windows Hello), users can test the biometric flow.

## Configuration

Make sure your `.env` file includes any required ZKsync SSO configuration variables once you install the package.
