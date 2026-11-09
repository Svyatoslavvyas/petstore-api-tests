const client = require("../helpers/client");

const petId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
const edgeId = petId + 1;
const tag = "svyatoslav-test-" + petId;
const pet = {
  id: petId,
  name: "Doggo",
  status: "available",
  photoUrls: ["https://example.com/test-dog.jpg"],
  tags: [{ id: 1, name: tag }]
};

afterAll(async () => {
  await client.delete("/pet/" + petId);
  await client.delete("/pet/" + edgeId);
});

describe("Petstore API", () => {
  test("create, read, update and delete an owned pet", async () => {
    let response = await client.post("/pet", pet);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.data).toMatchObject(pet);

    response = await client.get("/pet/" + petId);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(pet);

    response = await client.get("/pet/findByTags", { params: { tags: tag } });
    expect(response.status).toBe(200);
    expect(response.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: petId })]));

    const updated = { ...pet, name: "Doggo Updated", status: "sold" };
    response = await client.put("/pet", updated);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(updated);

    response = await client.get("/pet/" + petId);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(updated);

    response = await client.delete("/pet/" + petId);
    expect(response.status).toBe(200);
    response = await client.get("/pet/" + petId);
    expect(response.status).toBe(404);
    expect(response.data.message).toMatch(/not found/i);
  });

  test("status query only returns available pets", async () => {
    const response = await client.get("/pet/findByStatus", { params: { status: "available" } });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    for (const item of response.data) expect(item.status).toBe("available");
  });

  test("inventory contains non-negative integer quantities", async () => {
    const response = await client.get("/store/inventory");
    expect(response.status).toBe(200);
    expect(response.data).toEqual(expect.any(Object));
    expect(Array.isArray(response.data)).toBe(false);
    for (const quantity of Object.values(response.data)) {
      expect(Number.isInteger(quantity)).toBe(true);
      expect(quantity).toBeGreaterThanOrEqual(0);
    }
  });

  test("an unknown pet ID returns 404", async () => {
    const response = await client.get("/pet/" + (petId + 2));
    expect(response.status).toBe(404);
    expect(response.data.message).toMatch(/not found/i);
  });

  test("an unknown username returns 404", async () => {
    const response = await client.get("/user/" + tag);
    expect(response.status).toBe(404);
    expect(response.data.message).toMatch(/not found/i);
  });

  test("malformed JSON is rejected", async () => {
    const response = await client.post("/pet", '{"id":');
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  test("a long Unicode name and empty photo list are preserved", async () => {
    const edgePet = { id: edgeId, name: "Õun 🐾 ".repeat(40), photoUrls: [], status: "pending" };
    let response = await client.post("/pet", edgePet);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(edgePet);
    response = await client.get("/pet/" + edgeId);
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject(edgePet);
  });
});
