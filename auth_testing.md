# Auth Testing Playbook (Emergent Google OAuth)

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Backend API tests
```bash
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer $TOKEN"
```

## Step 3: Browser cookie injection
```js
await page.context.add_cookies([{
  name: "session_token", value: TOKEN, domain: HOST, path: "/",
  httpOnly: true, secure: true, sameSite: "None"
}]);
```

## Checklist
- user_id custom UUID
- session.user_id matches user.user_id
- All queries use `{"_id": 0}` projection
- /api/auth/me returns user (200)
- Dashboard loads without redirect
