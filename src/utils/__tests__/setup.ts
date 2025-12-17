import "@testing-library/jest-dom";
import { afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Keep expect referenced explicitly for clarity and type loading
void expect;
