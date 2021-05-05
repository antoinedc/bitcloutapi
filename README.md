# bitcloutapi

## Project setup
```
yarn install
```
To run locally
```
firebase init
```
Create a .env.development with the following:
```
VUE_APP_FIREBASE_API_KEY=123
VUE_APP_FIREBASE_PROJECT_ID=bitcloutapi
VUE_APP_FUNCTIONS_HOST=http://localhost:5001
VUE_APP_FIRESTORE_HOST=localhost:8080
VUE_APP_DATABASE_HOST=localhost:9000
VUE_APP_NODE_ENV=development
VUE_APP_HOSTING=http://localhost:5000
```
Run the emulator to have a local backend
```
firebase emulators:start
```
```
yarn serve
```
### Deploy
```
firebase deploy
```

### Support
Open an issue