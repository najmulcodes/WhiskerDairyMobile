# 🐱 WhiskerDairy Mobile

React Native + Expo + TypeScript mobile app for iOS and Android.

**API Base:** `https://whisker-dairy.onrender.com/api/v1`

---

## 📦 1. PROJECT SETUP

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- EAS CLI (for builds)

### Step 1 — Install dependencies

```bash
# Clone / copy this folder, then:
cd WhiskerDairyMobile
npm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your real values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=https://whisker-dairy.onrender.com/api/v1
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

> **Where to find these:**
> - Supabase: Dashboard → Settings → API
> - Cloudinary: Dashboard → Settings → Upload → Upload Presets (set to "Unsigned")

### Step 3 — Start development server

```bash
npx expo start
```

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

---

## 🔧 2. CONFIG FILES

All config files are already created:
- `app.json` — Expo app config (bundle ID, permissions, icons)
- `eas.json` — EAS Build profiles (APK, AAB, IPA)
- `tsconfig.json` — TypeScript config
- `babel.config.js` — Babel config with Reanimated plugin
- `.env.example` — Environment variable template

---

## 📁 3. FOLDER STRUCTURE

```
WhiskerDairyMobile/
├── App.tsx                        ← Root entry point
├── app.json                       ← Expo config
├── eas.json                       ← EAS build config
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── .env.example
├── assets/
│   ├── icon.png                   ← 1024x1024 app icon
│   ├── splash.png                 ← 1284x2778 splash screen
│   ├── adaptive-icon.png          ← 1024x1024 Android adaptive icon
│   └── notification-icon.png      ← 96x96 notification icon
└── src/
    ├── theme/
    │   └── colors.ts              ← Design tokens
    ├── context/
    │   └── AuthContext.tsx        ← Supabase auth state
    ├── lib/
    │   ├── api.ts                 ← Axios instance + token handling
    │   ├── supabase.ts            ← Supabase client
    │   └── cloudinary.ts         ← Image upload utility
    ├── hooks/
    │   ├── usePets.ts
    │   ├── useExpenses.ts
    │   ├── useMedications.ts
    │   ├── useVaccinations.ts
    │   ├── useHealthSummary.ts
    │   └── useReminders.ts
    ├── navigation/
    │   ├── types.ts               ← Navigation type definitions
    │   ├── TabNavigator.tsx       ← Bottom tab navigator
    │   └── AppNavigator.tsx       ← Root stack navigator
    ├── components/
    │   ├── Avatar.tsx
    │   ├── Badge.tsx
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── EmptyState.tsx
    │   ├── Input.tsx
    │   └── Loader.tsx
    └── screens/
        ├── auth/
        │   └── AuthScreen.tsx     ← Login + Register
        ├── dashboard/
        │   └── DashboardScreen.tsx
        ├── pets/
        │   ├── PetsListScreen.tsx
        │   ├── PetDetailScreen.tsx ← Medications + Vaccinations
        │   └── PetFormScreen.tsx  ← Add / Edit pet
        ├── expenses/
        │   ├── ExpensesScreen.tsx
        │   └── AddExpenseScreen.tsx
        ├── health/
        │   └── HealthSummaryScreen.tsx
        ├── reminders/
        │   └── RemindersScreen.tsx
        └── settings/
            └── SettingsScreen.tsx
```

---

## 🌐 4. BACKEND INTEGRATION

**Base URL:** `https://whisker-dairy.onrender.com/api/v1`

### Auth
- Handled via Supabase directly (`supabase.auth.signInWithPassword`, `signUp`)
- JWT token is set on the Axios instance via `setAccessToken(token)`
- All API calls use `Authorization: Bearer <token>` header automatically

### Real Endpoints Used

| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/pets` | Fetch all pets |
| POST | `/pets` | Create pet |
| GET | `/pets/:id` | Fetch single pet |
| PATCH | `/pets/:id` | Update pet |
| DELETE | `/pets/:id` | Delete pet |
| GET | `/pets/:id/medications` | Fetch medications |
| POST | `/pets/:id/medications` | Add medication |
| PATCH | `/pets/:id/medications/:medId` | Toggle/update medication |
| DELETE | `/pets/:id/medications/:medId` | Delete medication |
| GET | `/pets/:id/vaccinations` | Fetch vaccinations |
| POST | `/pets/:id/vaccinations` | Add vaccination |
| PATCH | `/pets/:id/vaccinations/:vaccId` | Update vaccination |
| DELETE | `/pets/:id/vaccinations/:vaccId` | Delete vaccination |
| GET | `/expenses` | Fetch expenses (with ?month=YYYY-MM) |
| POST | `/expenses` | Create expense |
| DELETE | `/expenses/:id` | Delete expense |
| GET | `/health-summary` | Get health alerts dashboard |
| GET | `/reminders` | Get active reminders |
| GET | `/auth/me` | Get current user info |

---

## 📱 5. RUNNING ON DEVICE

### Android (via Expo Go)
1. Install **Expo Go** from Google Play
2. Run `npx expo start`
3. Scan the QR code

### iOS (via Expo Go)
1. Install **Expo Go** from App Store
2. Run `npx expo start`
3. Scan the QR code with the Camera app

---

## 🏗️ 6. BUILD SYSTEM — EAS

### Step 1 — Install EAS CLI and login

```bash
npm install -g eas-cli
eas login
```

### Step 2 — Initialize EAS project

```bash
eas init
```

This gives you a `projectId`. Paste it into `app.json → expo.extra.eas.projectId`.

### Step 3 — Prebuild (generates android/ and ios/ folders)

```bash
npx expo prebuild --clean
```

---

### 🤖 Android Builds

#### Development APK (internal testing, fastest)
```bash
eas build --platform android --profile development
```

#### Preview APK (shareable, no Play Store needed)
```bash
eas build --platform android --profile preview
```
→ Downloads a `.apk` you can directly install on any Android device.

#### Production AAB (for Google Play Store)
```bash
eas build --platform android --profile production
```
→ Produces `.aab` for Play Store upload.

#### Run locally on emulator
```bash
npx expo run:android
```

---

### 🍎 iOS Builds

#### Development build (simulator)
```bash
eas build --platform ios --profile development
```

#### Production IPA (for App Store / TestFlight)
```bash
eas build --platform ios --profile production
```

> **Note:** iOS builds require an Apple Developer account ($99/year).
> EAS handles signing automatically. You'll be prompted for Apple credentials.

#### Run locally on simulator
```bash
npx expo run:ios
```

---

## 🏪 7. APP STORE READINESS

### App configuration (in `app.json`)
- **Bundle ID (iOS):** `com.whiskerdairy.app`
- **Package name (Android):** `com.whiskerdairy.app`
- **App name:** `Whisker Dairy`
- **Version:** `1.0.0`

### Icons needed (place in `assets/`)
| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 px | App icon (iOS + Android) |
| `adaptive-icon.png` | 1024×1024 px | Android adaptive icon foreground |
| `splash.png` | 1284×2778 px | Splash screen |
| `notification-icon.png` | 96×96 px | Android notification icon |
| `favicon.png` | 32×32 px | Web favicon |

> You can create placeholder icons with any design tool. Use the primary color `#ff7a5c` as the background.

### Permissions configured
- **Camera** — for pet photo capture
- **Photo Library** — for pet photo selection
- **Push Notifications** — for reminders
- **Internet** — for API calls

---

## 🚀 8. SUBMIT TO STORES

### Google Play Store
```bash
# First: create keystore via EAS
eas credentials

# Then submit
eas submit --platform android --profile production
```

### Apple App Store
```bash
eas submit --platform ios --profile production
```

---

## ✅ 9. FINAL CHECKLIST — VERIFY WORKING

### Auth
- [ ] Sign up with email + password
- [ ] Email verification flow
- [ ] Sign in with existing account
- [ ] Sign out from Settings
- [ ] Forgot password sends email
- [ ] Token auto-refresh works (stay signed in after closing app)

### Dashboard
- [ ] Shows pet count, monthly spend, transaction count
- [ ] Health alert banner appears when alerts exist
- [ ] Recent expenses list loads
- [ ] Quick actions navigate correctly

### Pets
- [ ] Pets list loads with avatars and badges
- [ ] Add pet with photo (Cloudinary upload)
- [ ] Edit pet updates correctly
- [ ] Delete pet with confirmation
- [ ] Pet detail shows medications + vaccinations
- [ ] Add medication from modal
- [ ] Toggle medication active/inactive
- [ ] Delete medication
- [ ] Add vaccination record
- [ ] Delete vaccination record

### Expenses
- [ ] Month picker navigates forward/back
- [ ] Expense list loads for selected month
- [ ] Add expense with category
- [ ] Delete expense with confirmation
- [ ] Total updates correctly

### Health
- [ ] Overdue / Due today / Due soon sections render
- [ ] All-clear state shows when no alerts
- [ ] Pull to refresh works

### Reminders
- [ ] Upcoming reminders render
- [ ] Past reminders render
- [ ] Empty state shows when none

### Settings
- [ ] Profile name visible
- [ ] Edit name inline save works
- [ ] Change password sends email
- [ ] Sign out works

---

## 🐛 10. COMMON ERRORS AND FIXES

### `Cannot find module 'react-native-url-polyfill/auto'`
```bash
npm install react-native-url-polyfill
```

### `Supabase auth not persisting`
- Ensure `@react-native-async-storage/async-storage` is installed
- Check that `AsyncStorage` is passed to Supabase client config

### `Network request failed` (API calls)
- Verify `EXPO_PUBLIC_API_URL` in `.env` is correct
- Ensure the Render server is awake (free tier sleeps after inactivity — first request may take 30s)
- Check you are signed in (token is set)

### `Image upload fails`
- Set `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` and `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- The upload preset must be set to **Unsigned** in Cloudinary dashboard

### `Metro bundler crash with Reanimated`
- Ensure `react-native-reanimated/plugin` is in `babel.config.js` plugins
- Run `npx expo start --clear`

### `iOS build fails — no Apple credentials`
- Run `eas credentials` and follow prompts
- Or add credentials manually in expo.dev dashboard

### `Android build fails — no keystore`
- EAS auto-generates a keystore on first build
- Or run `eas credentials` to set up manually

### Expo Go QR not scanning
- Make sure your phone and computer are on the same Wi-Fi network
- Try `npx expo start --tunnel` to use ngrok tunnel

### TypeScript errors about navigation
- Ensure you have `src/navigation/types.ts` with proper type exports
- Check `declare global { namespace ReactNavigation {...} }` at the bottom

---

## 📞 Support

**API Docs:** `https://whisker-dairy.onrender.com/api/v1`
**Supabase Docs:** https://supabase.com/docs
**Expo Docs:** https://docs.expo.dev
**EAS Docs:** https://docs.expo.dev/eas
