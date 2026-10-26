import { describe, expect, test } from "vitest";
import { queryUnitDb } from "./test-db";

describe("databasen", () => {
  test("TECH-001-R3 byggs från schema, seed och migreringar med schema_migrations", async () => {
    const tables = await queryUnitDb<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
    );
    expect(tables).toHaveLength(1);
  });
});
