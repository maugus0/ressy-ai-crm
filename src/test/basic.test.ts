import { describe, it, expect } from "vitest";

describe("Basic Test Suite", () => {
  it("should always pass - basic sanity check", () => {
    expect(true).toBe(true);
  });

  it("should perform basic math operations", () => {
    expect(1 + 1).toBe(2);
    expect(2 * 2).toBe(4);
    expect(10 - 5).toBe(5);
  });

  it("should handle string operations", () => {
    const greeting = "Hello, World!";
    expect(greeting).toBe("Hello, World!");
    expect(greeting.length).toBeGreaterThan(0);
  });

  it("should work with arrays", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it("should work with objects", () => {
    const obj = { name: "Test", value: 42 };
    expect(obj).toHaveProperty("name");
    expect(obj.value).toBe(42);
  });
});
