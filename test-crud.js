const BASE_URL = "http://localhost:8796";

async function getAdminToken() {
  const tokenUrl = "https://musicgear.kinde.com/oauth2/token";
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");
  body.append("client_id", "e3315944b8d34ba4b8f94cca134a32e0");
  body.append("client_secret", "Ym2ZUrFpWLzxkSD46aVhPepi7rBLIJSPNDYjLMLdPfxQqpKxGkaO");
  body.append("audience", "https://musicgear.kinde.com/api");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  return data.access_token;
}

async function testCRUD() {
  const TOKEN = await getAdminToken();

  const randomId = Math.floor(Math.random() * 100000);
  console.log("1. Create Staff User");
  const createRes = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: `teststaff${randomId}@example.com`, firstName: "Test", lastName: "Staff", role: "staff", position: "Tester" })
  });
  const createData = await createRes.json();
  console.log(createData);
  const userId = createData.user?.userId;

  if (!userId) {
    console.error("Failed to create user");
    return;
  }

  console.log("\n2. Read User");
  const readRes = await fetch(`${BASE_URL}/users/${userId}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  console.log(await readRes.json());

  console.log("\n3. Update User");
  const updateRes = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ firstName: "Updated", lastName: "Name" })
  });
  console.log(await updateRes.json());

  console.log("\n4. Delete User");
  const deleteRes = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  console.log(await deleteRes.json());
}

testCRUD();
